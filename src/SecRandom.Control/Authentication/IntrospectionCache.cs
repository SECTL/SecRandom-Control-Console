using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

namespace SecRandom.Control.Authentication;






































public sealed class IntrospectionCache(TimeProvider timeProvider)
{
    
    private const int MaxEntries = 4096;

    
    private const int MaxBackoffWindows = 8;

    
    private long _hits;
    private long _misses;
    private long _unavailableSuppressed;

    






    public static IntrospectionCache Disabled { get; } = new(TimeProvider.System);

    
    private readonly record struct Key(string TokenHash, IntrospectionAudience Audience, string PlatformId);

    private readonly ConcurrentDictionary<Key, Entry> _entries = new();

    


















    private readonly ConcurrentDictionary<IntrospectionAudience, long> _unavailableUntilTicks = new();

    private sealed record Entry(IntrospectionResult Result, DateTimeOffset ExpiresAt);

    
    public long Hits => Interlocked.Read(ref _hits);

    
    public long Misses => Interlocked.Read(ref _misses);

    
    public long UnavailableSuppressed => Interlocked.Read(ref _unavailableSuppressed);

    
    public IntrospectionResult? TryGet(string accessToken, IntrospectionAudience audience, string platformId)
    {
        var key = new Key(HashToken(accessToken), audience, platformId);

        if (!_entries.TryGetValue(key, out var entry))
        {
            Interlocked.Increment(ref _misses);
            return null;
        }

        
        if (entry.ExpiresAt <= timeProvider.GetUtcNow())
        {
            _entries.TryRemove(key, out _);
            Interlocked.Increment(ref _misses);
            return null;
        }

        Interlocked.Increment(ref _hits);
        return entry.Result;
    }

    













    public bool Store(
        string accessToken,
        IntrospectionAudience audience,
        string platformId,
        IntrospectionResult result,
        int ttlSeconds)
    {
        if (ttlSeconds <= 0 || result.Status != IntrospectionStatus.Active)
            return false;

        if (_entries.Count >= MaxEntries)
            Prune();

        var jitterMilliseconds = Random.Shared.Next(0, ttlSeconds * 250 + 1); 
        var expiresAt = timeProvider.GetUtcNow()
            .AddSeconds(ttlSeconds)
            .AddMilliseconds(-jitterMilliseconds);
        _entries[new Key(HashToken(accessToken), audience, platformId)] = new Entry(result, expiresAt);
        return true;
    }

    



    public bool ShouldSkipUnavailable(IntrospectionAudience audience)
    {
        if (!_unavailableUntilTicks.TryGetValue(audience, out var until) ||
            until <= timeProvider.GetUtcNow().UtcDateTime.Ticks)
        {
            return false;
        }

        Interlocked.Increment(ref _unavailableSuppressed);
        return true;
    }

    
    public void MarkUnavailable(IntrospectionAudience audience, int backoffSeconds)
    {
        if (backoffSeconds <= 0)
            return;

        
        
        if (_unavailableUntilTicks.Count >= MaxBackoffWindows)
            PruneBackoffWindows();

        _unavailableUntilTicks.AddOrUpdate(
            audience,
            _ => timeProvider.GetUtcNow().AddSeconds(backoffSeconds).UtcDateTime.Ticks,
            (_, current) => Math.Max(
                current, timeProvider.GetUtcNow().AddSeconds(backoffSeconds).UtcDateTime.Ticks));
    }

    
    public void MarkReachable(IntrospectionAudience audience) => _unavailableUntilTicks.TryRemove(audience, out _);

    



    private void Prune()
    {
        var now = timeProvider.GetUtcNow();
        foreach (var (key, entry) in _entries)
        {
            if (entry.ExpiresAt <= now)
                _entries.TryRemove(key, out _);
        }

        if (_entries.Count >= MaxEntries)
            _entries.Clear();
    }

    
    private void PruneBackoffWindows()
    {
        var now = timeProvider.GetUtcNow().UtcDateTime.Ticks;
        foreach (var (audience, until) in _unavailableUntilTicks)
        {
            if (until <= now)
                _unavailableUntilTicks.TryRemove(audience, out _);
        }
    }

    



    private static string HashToken(string accessToken) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(accessToken)));
}
