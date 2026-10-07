using System.Globalization;

namespace SecRandom.Control.Configuration;












public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    













    public string Provider { get; set; } = string.Empty;

    
    public string SessionCookieName { get; set; } = "srctrl_session";

    










    public TimeSpan SessionLifetime { get; set; } = TimeSpan.FromDays(7);

    
    public TimeSpan StateLifetime { get; set; } = TimeSpan.FromMinutes(10);

    







    public TimeSpan SessionRevalidationInterval { get; set; } = TimeSpan.FromMinutes(5);

    












    public TimeSpan SessionVerificationGrace { get; set; } = TimeSpan.FromHours(1);

    
    public bool CookieSecure { get; set; }

    public static AuthOptions FromConfiguration(IConfiguration configuration)
    {
        var options = new AuthOptions();
        configuration.GetSection(SectionName).Bind(options);

        options.Provider = FirstNonBlank(
            Environment.GetEnvironmentVariable("CTRL_AUTH_PROVIDER"), options.Provider)!;

        var secureOverride = Environment.GetEnvironmentVariable("CTRL_AUTH_COOKIE_SECURE");
        if (bool.TryParse(secureOverride, out var secure))
            options.CookieSecure = secure;

        
        
        var lifetimeOverride = Environment.GetEnvironmentVariable("CTRL_AUTH_SESSION_LIFETIME");
        if (!string.IsNullOrWhiteSpace(lifetimeOverride))
        {
            if (!TimeSpan.TryParse(lifetimeOverride.Trim(), CultureInfo.InvariantCulture, out var lifetime) ||
                lifetime <= TimeSpan.Zero)
            {
                throw new InvalidOperationException(
                    "CTRL_AUTH_SESSION_LIFETIME 无法解析：" +
                    $"\"{lifetimeOverride}\"。请用 TimeSpan 格式，例如 30.00:00:00（30 天）。");
            }

            options.SessionLifetime = lifetime;
        }

        
        
        options.SessionRevalidationInterval = ReadTimeSpan(
            "CTRL_AUTH_SESSION_REVALIDATION_INTERVAL",
            options.SessionRevalidationInterval,
            "00:05:00",
            allowNegativeOrZero: false);
        options.SessionVerificationGrace = ReadTimeSpan(
            "CTRL_AUTH_SESSION_VERIFICATION_GRACE",
            options.SessionVerificationGrace,
            "01:00:00",
            
            allowNegativeOrZero: true);

        return options;
    }

    














    public static string ReadOAuthSetting(IConfiguration configuration, string settingName) =>
        FirstNonBlank(
            Environment.GetEnvironmentVariable($"CTRL_AUTH_{settingName}"),
            configuration[$"{SectionName}:{settingName}"]) ?? string.Empty;

    private static TimeSpan ReadTimeSpan(
        string variableName, TimeSpan fallback, string example, bool allowNegativeOrZero)
    {
        var raw = Environment.GetEnvironmentVariable(variableName);
        if (string.IsNullOrWhiteSpace(raw))
            return fallback;

        if (!TimeSpan.TryParse(raw.Trim(), CultureInfo.InvariantCulture, out var value) ||
            (!allowNegativeOrZero && value <= TimeSpan.Zero) ||
            (allowNegativeOrZero && value < TimeSpan.Zero))
        {
            throw new InvalidOperationException(
                $"{variableName} 无法解析：\"{raw}\"。请用 TimeSpan 格式，例如 {example}。");
        }

        return value;
    }

    private static string? FirstNonBlank(params string?[] values) =>
        values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();
}
