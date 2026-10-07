namespace SecRandom.Control.Configuration;




public sealed class ControlOptions
{
    public const string SectionName = "Control";

    
    public const string ProtocolVersion = "control-v1";

    



    public string DataRoot { get; set; } = "/var/lib/secrandom-control";

    
    public string ListenUrl { get; set; } = "http://127.0.0.1:8791";

    
















    public bool NodeAutoRegister { get; set; } = true;

    
    public string SigningKeyPath { get; set; } = string.Empty;

    
    public string DataProtectionKeysDirectory { get; set; } = "keys/data-protection";

    







    public TimeSpan InviteLifetime { get; set; } = TimeSpan.FromHours(72);

    














    public int MaxOwnedGroupsPerUser { get; set; } = 100;

    


























    public int AuditRetentionDays { get; set; } = DefaultAuditRetentionDays;

    
    public const int DefaultAuditRetentionDays = 30;

    
    internal const int MaxAuditRetentionDays = 36500;

    public TimeSpan OwnerTransferLifetime { get; set; } = TimeSpan.FromHours(48);

    
    public TimeSpan ActionCommandLifetime { get; set; } = TimeSpan.FromMinutes(2);

    
    public const int DefaultHeartbeatSeconds = 25;

    






    public int HeartbeatSeconds { get; set; } = DefaultHeartbeatSeconds;

    














    public const int OfflineAfterHeartbeatMultiple = 3;

    























    public TimeSpan NodeOfflineAfter { get; set; } =
        TimeSpan.FromSeconds(DefaultHeartbeatSeconds * OfflineAfterHeartbeatMultiple);

    public bool NodeEnrollmentEnabled { get; set; } = true;

    public const int DefaultEnrollmentCodeLifetimeMinutes = 15;

    internal const int MinEnrollmentCodeLifetimeMinutes = 1;

    internal const int MaxEnrollmentCodeLifetimeMinutes = 120;

    public TimeSpan EnrollmentCodeLifetime { get; set; } =
        TimeSpan.FromMinutes(DefaultEnrollmentCodeLifetimeMinutes);

    public const int DefaultNodeTokenLifetimeDays = 180;

    internal const int MinNodeTokenLifetimeDays = 1;

    internal const int MaxNodeTokenLifetimeDays = 3650;

    public TimeSpan NodeTokenLifetime { get; set; } = TimeSpan.FromDays(DefaultNodeTokenLifetimeDays);

    public bool HideGroupNameOnEnroll { get; set; }

    public string DataProtectionKeysPath =>
        Path.IsPathRooted(DataProtectionKeysDirectory)
            ? DataProtectionKeysDirectory
            : Path.Combine(DataRoot, DataProtectionKeysDirectory);

    public static ControlOptions FromConfiguration(IConfiguration configuration)
    {
        var options = new ControlOptions();
        configuration.GetSection(SectionName).Bind(options);

        
        options.DataRoot = FirstNonBlank(
            Environment.GetEnvironmentVariable("CTRL_DATA_ROOT"), options.DataRoot)!;
        options.ListenUrl = FirstNonBlank(
            Environment.GetEnvironmentVariable("CTRL_LISTEN_URL"), options.ListenUrl)!;

        
        if (bool.TryParse(Environment.GetEnvironmentVariable("CTRL_NODE_AUTO_REGISTER"), out var autoRegister))
            options.NodeAutoRegister = autoRegister;
        if (bool.TryParse(Environment.GetEnvironmentVariable("CTRL_NODE_ENROLLMENT_ENABLED"), out var enrollmentEnabled))
            options.NodeEnrollmentEnabled = enrollmentEnabled;
        if (bool.TryParse(Environment.GetEnvironmentVariable("CTRL_NODE_ENROLL_HIDE_GROUP_NAME"), out var hideGroupName))
            options.HideGroupNameOnEnroll = hideGroupName;
        options.EnrollmentCodeLifetime = TimeSpan.FromMinutes(ClampEnrollmentCodeLifetimeMinutes(
            Environment.GetEnvironmentVariable("CTRL_ENROLLMENT_CODE_LIFETIME_MINUTES"),
            (int)options.EnrollmentCodeLifetime.TotalMinutes));
        options.NodeTokenLifetime = TimeSpan.FromDays(ClampNodeTokenLifetimeDays(
            Environment.GetEnvironmentVariable("CTRL_NODE_TOKEN_LIFETIME_DAYS"),
            (int)options.NodeTokenLifetime.TotalDays));
        options.SigningKeyPath = FirstNonBlank(
            Environment.GetEnvironmentVariable("CTRL_SIGNING_KEY_PATH"), options.SigningKeyPath)!;
        options.MaxOwnedGroupsPerUser = ParseIntOr(
            Environment.GetEnvironmentVariable("CTRL_MAX_OWNED_GROUPS_PER_USER"),
            options.MaxOwnedGroupsPerUser);
        
        
        options.AuditRetentionDays = ClampAuditRetentionDays(
            Environment.GetEnvironmentVariable("CTRL_AUDIT_RETENTION_DAYS"),
            options.AuditRetentionDays);
        
        options.NodeOfflineAfter = ResolveOfflineAfter(configuration, options);

        options.DataRoot = Path.GetFullPath(options.DataRoot);

        if (string.IsNullOrWhiteSpace(options.SigningKeyPath))
            options.SigningKeyPath = Path.Combine(options.DataRoot, "keys", "policy-signing.pem");

        return options;
    }

    private static string? FirstNonBlank(params string?[] values) =>
        values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();

    













    private static TimeSpan ResolveOfflineAfter(IConfiguration configuration, ControlOptions options)
    {
        var fromEnvironment = ParseIntOr(
            Environment.GetEnvironmentVariable("CTRL_NODE_OFFLINE_AFTER_SECONDS"), 0);
        if (fromEnvironment > 0)
            return TimeSpan.FromSeconds(fromEnvironment);

        if (options.NodeOfflineAfter > TimeSpan.Zero
            && configuration.GetSection($"{SectionName}:{nameof(NodeOfflineAfter)}").Exists())
            return options.NodeOfflineAfter;

        var heartbeat = options.HeartbeatSeconds > 0 ? options.HeartbeatSeconds : DefaultHeartbeatSeconds;
        return TimeSpan.FromSeconds(heartbeat * OfflineAfterHeartbeatMultiple);
    }

    



    private static int ParseIntOr(string? raw, int fallback) =>
        int.TryParse(raw, out var parsed) ? parsed : fallback;

    











    internal static int ClampAuditRetentionDays(string? raw, int fallback) =>
        Math.Clamp(ParseIntOr(raw, fallback), 0, MaxAuditRetentionDays);

    internal static int ClampEnrollmentCodeLifetimeMinutes(string? raw, int fallback) =>
        Math.Clamp(ParseIntOr(raw, fallback), MinEnrollmentCodeLifetimeMinutes, MaxEnrollmentCodeLifetimeMinutes);

    internal static int ClampNodeTokenLifetimeDays(string? raw, int fallback) =>
        Math.Clamp(ParseIntOr(raw, fallback), MinNodeTokenLifetimeDays, MaxNodeTokenLifetimeDays);
}
