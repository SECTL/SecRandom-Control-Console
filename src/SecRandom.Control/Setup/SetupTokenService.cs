using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace SecRandom.Control.Setup;


public sealed class SetupTokenService
{
    public const string ConfigurationKey = "CTRL_SETUP_TOKEN";

    public const int MinimumConfiguredLength = 8;

    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int TokenLength = 12;
    private const int GroupLength = 4;

    private readonly byte[] _expected;

    public SetupTokenService(IConfiguration configuration)
    {
        var configured = configuration[ConfigurationKey]?.Trim();

        if (!string.IsNullOrEmpty(configured))
        {
            if (configured.Length < MinimumConfiguredLength)
                throw new InvalidOperationException(
                    $"{ConfigurationKey} 至少需要 {MinimumConfiguredLength} 个字符，当前只有 " +
                    $"{configured.Length.ToString(CultureInfo.InvariantCulture)} 个。");

            UsesConfiguredToken = true;
            Token = null;
            _expected = Encoding.UTF8.GetBytes(Normalize(configured));
            return;
        }

        UsesConfiguredToken = false;
        Token = Generate();
        _expected = Encoding.UTF8.GetBytes(Normalize(Token));
    }

    public bool UsesConfiguredToken { get; }

    public string? Token { get; }

    public bool Matches(string? candidate)
    {
        if (string.IsNullOrWhiteSpace(candidate))
            return false;

        var provided = Encoding.UTF8.GetBytes(Normalize(candidate));
        return CryptographicOperations.FixedTimeEquals(provided, _expected);
    }

    private static string Normalize(string value)
    {
        var builder = new StringBuilder(value.Length);
        foreach (var character in value)
        {
            if (char.IsLetterOrDigit(character))
                builder.Append(char.ToUpperInvariant(character));
        }

        return builder.ToString();
    }

    private static string Generate()
    {
        var builder = new StringBuilder(TokenLength + (TokenLength / GroupLength) - 1);
        for (var index = 0; index < TokenLength; index++)
        {
            if (index > 0 && index % GroupLength == 0)
                builder.Append('-');

            builder.Append(Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)]);
        }

        return builder.ToString();
    }
}
