using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SecRandom.Control.Configuration;

namespace SecRandom.Control.Authentication;









public sealed record LoginState(string ReturnTo, string CodeVerifier, DateTimeOffset ExpiresAt);









































public sealed record AuthSession(
    string SessionId,
    string UserId,
    string? DisplayName,
    string? AvatarUrl,
    string? Email,
    DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt,
    [property: JsonPropertyName("protected_credentials")] string? ProtectedCredentials = null,
    [property: JsonPropertyName("credentials_checked_at")] DateTimeOffset? CredentialsCheckedAt = null,
    [property: JsonPropertyName("credentials_verified_at")] DateTimeOffset? CredentialsVerifiedAt = null);





































public sealed class AuthSessionStore
{
    private readonly ConcurrentDictionary<string, LoginState> _states = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, AuthSession> _sessions = new(StringComparer.Ordinal);
    private readonly TimeProvider _timeProvider;
    private readonly ILogger<AuthSessionStore> _logger;
    private readonly string _sessionsRoot;
    private readonly string _statesRoot;

    public AuthSessionStore(
        IOptions<ControlOptions> options,
        TimeProvider timeProvider,
        ILogger<AuthSessionStore> logger)
    {
        _timeProvider = timeProvider;
        _logger = logger;

        var root = Path.Combine(options.Value.DataRoot, "auth");
        _sessionsRoot = Path.Combine(root, "sessions");
        _statesRoot = Path.Combine(root, "login-states");
        Directory.CreateDirectory(_sessionsRoot);
        Directory.CreateDirectory(_statesRoot);

        
        SweepTemporaryFiles(_sessionsRoot);
        SweepTemporaryFiles(_statesRoot);
        LoadSessions();
        LoadStates();
    }

    

    public string CreateState(string returnTo, string codeVerifier, TimeSpan lifetime)
    {
        var state = NewToken();
        var entry = new LoginState(returnTo, codeVerifier, _timeProvider.GetUtcNow().Add(lifetime));
        _states[state] = entry;
        Persist(_statesRoot, state, entry);
        PruneStates();
        return state;
    }

    



    public LoginState? ConsumeState(string? state)
    {
        if (!IsSafeToken(state))
            return null;

        if (!_states.TryRemove(state!, out var entry))
            return null;

        DeleteIfExists(_statesRoot, state!);

        return entry.ExpiresAt <= _timeProvider.GetUtcNow() ? null : entry;
    }

    

    public AuthSession CreateSession(
        string userId, string? displayName, string? avatarUrl, string? email,
        string? protectedCredentials, TimeSpan lifetime)
    {
        var now = _timeProvider.GetUtcNow();
        var session = new AuthSession(
            NewToken(), userId, displayName, avatarUrl, email, now, now.Add(lifetime),
            protectedCredentials,
            
            now,
            now);
        _sessions[session.SessionId] = session;
        Persist(_sessionsRoot, session.SessionId, session);
        PruneSessions();
        return session;
    }

    








    public bool TryReplace(AuthSession expected, AuthSession updated)
    {
        if (!string.Equals(expected.SessionId, updated.SessionId, StringComparison.Ordinal))
            throw new ArgumentException("替换前后的会话 ID 必须一致。", nameof(updated));

        if (!_sessions.TryUpdate(updated.SessionId, updated, expected))
            return false;

        Persist(_sessionsRoot, updated.SessionId, updated);
        return true;
    }

    


    public AuthSession? GetSession(string? sessionId)
    {
        if (!IsSafeToken(sessionId))
            return null;

        
        
        AuthSession? found = null;
        foreach (var (key, session) in _sessions)
        {
            if (FixedTimeEquals(key, sessionId!))
            {
                found = session;
                break;
            }
        }

        if (found is null)
            return null;

        if (found.ExpiresAt <= _timeProvider.GetUtcNow())
        {
            _sessions.TryRemove(found.SessionId, out _);
            DeleteIfExists(_sessionsRoot, found.SessionId);
            return null;
        }

        return found;
    }

    public void Revoke(string? sessionId)
    {
        if (!IsSafeToken(sessionId))
            return;

        _sessions.TryRemove(sessionId!, out _);
        DeleteIfExists(_sessionsRoot, sessionId!);
    }

    

    private void LoadSessions()
    {
        var now = _timeProvider.GetUtcNow();
        foreach (var path in Directory.EnumerateFiles(_sessionsRoot, "*.json"))
        {
            var session = Read<AuthSession>(path);
            if (session is null)
            {
                
                DeleteFile(path);
                continue;
            }

            if (!IsSafeToken(session.SessionId) || session.ExpiresAt <= now)
            {
                DeleteFile(path);
                continue;
            }

            
            
            
            
            if (string.IsNullOrWhiteSpace(session.ProtectedCredentials))
            {
                _logger.LogInformation(
                    "丢弃不含身份源凭据的旧会话（无法校验登录状态，属主需重新登录一次）：{SessionId}",
                    session.SessionId);
                DeleteFile(path);
                continue;
            }

            _sessions[session.SessionId] = session;
        }
    }

    private void LoadStates()
    {
        var now = _timeProvider.GetUtcNow();
        foreach (var path in Directory.EnumerateFiles(_statesRoot, "*.json"))
        {
            var state = Read<LoginState>(path);
            var id = Path.GetFileNameWithoutExtension(path);

            if (state is null || !IsSafeToken(id) || state.ExpiresAt <= now)
            {
                DeleteFile(path);
                continue;
            }

            _states[id] = state;
        }
    }

    

    private static string NewToken() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

    private static bool FixedTimeEquals(string left, string right) =>
        CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(left),
            System.Text.Encoding.UTF8.GetBytes(right));

    private void PruneStates()
    {
        var now = _timeProvider.GetUtcNow();
        foreach (var (key, value) in _states)
        {
            if (value.ExpiresAt <= now && _states.TryRemove(key, out _))
                DeleteIfExists(_statesRoot, key);
        }
    }

    private void PruneSessions()
    {
        var now = _timeProvider.GetUtcNow();
        foreach (var (key, value) in _sessions)
        {
            if (value.ExpiresAt <= now && _sessions.TryRemove(key, out _))
                DeleteIfExists(_sessionsRoot, key);
        }
    }

    




    private void Persist<T>(string root, string id, T value)
    {
        var path = Path.Combine(root, id + ".json");
        var temporary = path + ".tmp";

        try
        {
            File.WriteAllText(
                temporary, JsonSerializer.Serialize(value, JsonSerialization.ProtocolJsonOptions));
            File.Move(temporary, path, overwrite: true);
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            _logger.LogError(
                exception, "会话落盘失败，该会话活不过下次重启（用户会被要求重新登录）：{Path}", path);
        }
    }

    private T? Read<T>(string path)
        where T : class
    {
        try
        {
            return JsonSerializer.Deserialize<T>(
                File.ReadAllText(path), JsonSerialization.ProtocolJsonOptions);
        }
        catch (Exception exception) when (exception is JsonException or IOException or UnauthorizedAccessException)
        {
            _logger.LogError(exception, "会话数据文件不可读，已丢弃（其属主需要重新登录）：{Path}", path);
            return null;
        }
    }

    private void DeleteIfExists(string root, string id)
    {
        try
        {
            var path = Path.Combine(root, id + ".json");
            if (File.Exists(path))
                File.Delete(path);
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            _logger.LogWarning(exception, "会话文件删除失败，将在下次启动装载时按过期清理：{Root}/{Id}.json", root, id);
        }
    }

    private void DeleteFile(string path)
    {
        try
        {
            File.Delete(path);
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            _logger.LogWarning(exception, "会话文件删除失败：{Path}", path);
        }
    }

    



    private void SweepTemporaryFiles(string root)
    {
        foreach (var path in Directory.EnumerateFiles(root, "*.json.tmp"))
            DeleteFile(path);
    }

    




    private static bool IsSafeToken(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 128)
            return false;

        foreach (var character in value)
        {
            if (!char.IsAsciiLetterOrDigit(character) && character is not ('_' or '-'))
                return false;
        }

        return true;
    }
}
