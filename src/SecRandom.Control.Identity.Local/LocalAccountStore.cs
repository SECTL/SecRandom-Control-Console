using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;
using SecRandom.Control.Api;
using SecRandom.Control.Configuration;

namespace SecRandom.Control.Identity.Local;


public sealed record LocalAccount
{
    public int Version { get; init; } = 1;

    public string UserId { get; init; } = string.Empty;

    public string UserName { get; init; } = string.Empty;

    public string? DisplayName { get; init; }

    public string PasswordHash { get; init; } = string.Empty;

    public DateTimeOffset CreatedAt { get; init; }

    public bool Disabled { get; init; }
}


internal sealed record LocalAccountFile
{
    public int Version { get; init; } = 1;

    public List<LocalAccount> Accounts { get; init; } = [];
}


public sealed class LocalAccountStore
{
    public const string FileName = "auth-local.json";

    public const int PasswordIterations = 210_000;

    public const int MinUserNameLength = 3;

    public const int MaxUserNameLength = 32;

    public const int MinPasswordLength = 8;

    public const int MaxPasswordLength = 256;

    private const string Algorithm = "pbkdf2-sha256";
    private const int SaltLength = 16;
    private const int KeyLength = 32;

    private readonly string _filePath;

    public LocalAccountStore(ControlOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        _filePath = Path.Combine(options.DataRoot, FileName);
    }

    public string FilePath => _filePath;

    public static string? ValidateUserName(string? userName)
    {
        var trimmed = userName?.Trim();
        if (string.IsNullOrEmpty(trimmed) ||
            trimmed.Length < MinUserNameLength ||
            trimmed.Length > MaxUserNameLength)
        {
            return ErrorCodes.AdminUsernameInvalid;
        }

        foreach (var character in trimmed)
        {
            if (character is (>= 'A' and <= 'Z') or (>= 'a' and <= 'z') or (>= '0' and <= '9') or '.' or '_' or '-')
                continue;

            return ErrorCodes.AdminUsernameInvalid;
        }

        return null;
    }

    public static string? ValidatePassword(string? password)
    {
        if (password is null || password.Length < MinPasswordLength || password.Length > MaxPasswordLength)
            return ErrorCodes.AdminPasswordTooShort;

        return null;
    }

    public static void VerifyDummy(string password) =>
        _ = Rfc2898DeriveBytes.Pbkdf2(
            password, new byte[SaltLength], PasswordIterations, HashAlgorithmName.SHA256, KeyLength);

    public bool HasAnyAccount() => Read()?.Accounts.Count > 0;

    public LocalAccount? Find(string userName)
    {
        var file = Read();
        if (file is null)
            return null;

        foreach (var account in file.Accounts)
        {
            if (!account.Disabled && string.Equals(account.UserName, userName, StringComparison.OrdinalIgnoreCase))
                return account;
        }

        return null;
    }

    public LocalAccount Create(string userName, string password, string? displayName)
    {
        ArgumentNullException.ThrowIfNull(userName);
        ArgumentNullException.ThrowIfNull(password);

        var normalized = userName.Trim();
        var existing = Read() ?? new LocalAccountFile();

        var accounts = existing.Accounts
            .Where(account => !string.Equals(account.UserName, normalized, StringComparison.OrdinalIgnoreCase))
            .ToList();

        var created = new LocalAccount
        {
            Version = 1,
            UserId = "local:" + normalized.ToLowerInvariant(),
            UserName = normalized,
            DisplayName = string.IsNullOrWhiteSpace(displayName) ? normalized : displayName.Trim(),
            PasswordHash = Hash(password),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        accounts.Add(created);
        Write(existing with { Accounts = accounts });
        return created;
    }

    public bool Verify(LocalAccount account, string password)
    {
        ArgumentNullException.ThrowIfNull(account);
        ArgumentNullException.ThrowIfNull(password);

        var parts = account.PasswordHash.Split('$');
        if (parts.Length != 4 || !string.Equals(parts[0], Algorithm, StringComparison.Ordinal))
            return false;

        if (!int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var iterations) ||
            iterations < 1000 ||
            iterations > 10_000_000)
        {
            return false;
        }

        byte[] salt;
        byte[] expected;
        try
        {
            salt = Convert.FromBase64String(parts[2]);
            expected = Convert.FromBase64String(parts[3]);
        }
        catch (FormatException)
        {
            return false;
        }

        if (salt.Length == 0 || expected.Length == 0)
            return false;

        var actual = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);

        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    private static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltLength);
        var key = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, PasswordIterations, HashAlgorithmName.SHA256, KeyLength);

        return string.Join(
            '$',
            Algorithm,
            PasswordIterations.ToString(CultureInfo.InvariantCulture),
            Convert.ToBase64String(salt),
            Convert.ToBase64String(key));
    }

    private LocalAccountFile? Read()
    {
        try
        {
            if (!File.Exists(_filePath))
                return null;

            return JsonSerializer.Deserialize<LocalAccountFile>(
                File.ReadAllText(_filePath), JsonSerialization.ProtocolJsonOptions);
        }
        catch (Exception exception) when (
            exception is IOException or UnauthorizedAccessException or JsonException or NotSupportedException)
        {
            return null;
        }
    }

    private void Write(LocalAccountFile file)
    {
        var directory = Path.GetDirectoryName(_filePath);
        if (!string.IsNullOrEmpty(directory))
            Directory.CreateDirectory(directory);

        var temporary = _filePath + ".tmp";
        File.WriteAllText(temporary, JsonSerializer.Serialize(file, JsonSerialization.ProtocolJsonOptions));

        if (!OperatingSystem.IsWindows())
            File.SetUnixFileMode(temporary, UnixFileMode.UserRead | UnixFileMode.UserWrite);

        File.Move(temporary, _filePath, overwrite: true);
    }
}
