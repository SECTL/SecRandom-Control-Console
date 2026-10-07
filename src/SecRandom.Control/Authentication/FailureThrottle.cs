namespace SecRandom.Control.Authentication;


public sealed class FailureThrottle
{
    public const int DefaultLimit = 10;

    public const int MaxTrackedKeys = 4096;

    public static readonly TimeSpan DefaultWindow = TimeSpan.FromMinutes(10);

    private readonly object _gate = new();
    private readonly Dictionary<string, Queue<DateTimeOffset>> _failures = new(StringComparer.Ordinal);
    private readonly int _limit;
    private readonly TimeSpan _window;
    private readonly TimeProvider _timeProvider;

    public FailureThrottle(TimeProvider timeProvider)
        : this(DefaultLimit, DefaultWindow, timeProvider)
    {
    }

    public FailureThrottle(int limit, TimeSpan window, TimeProvider timeProvider)
    {
        _limit = limit;
        _window = window;
        _timeProvider = timeProvider;
    }

    public bool IsBlocked(string key)
    {
        lock (_gate)
        {
            return Count(key) >= _limit;
        }
    }

    public void Record(string key)
    {
        lock (_gate)
        {
            if (_failures.Count >= MaxTrackedKeys)
                PruneAll();

            if (!_failures.TryGetValue(key, out var queue))
            {
                queue = new Queue<DateTimeOffset>();
                _failures[key] = queue;
            }

            var threshold = _timeProvider.GetUtcNow() - _window;
            while (queue.Count > 0 && queue.Peek() < threshold)
                queue.Dequeue();

            queue.Enqueue(_timeProvider.GetUtcNow());
        }
    }

    public void Clear(string key)
    {
        lock (_gate)
        {
            _failures.Remove(key);
        }
    }

    private int Count(string key)
    {
        if (!_failures.TryGetValue(key, out var queue))
            return 0;

        var threshold = _timeProvider.GetUtcNow() - _window;
        while (queue.Count > 0 && queue.Peek() < threshold)
            queue.Dequeue();

        if (queue.Count == 0)
            _failures.Remove(key);

        return queue.Count;
    }

    private void PruneAll()
    {
        foreach (var key in _failures.Keys.ToList())
            Count(key);
    }
}
