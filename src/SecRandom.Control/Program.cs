using System.Reflection;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;
using SecRandom.Control;
using SecRandom.Control.Api;
using SecRandom.Control.Authentication;
using SecRandom.Control.Authorization;
using SecRandom.Control.Configuration;
using SecRandom.Control.Setup;
using SecRandom.Control.Storage;
using SecRandom.Control.Transport;















var appWebRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
var contentRoot = Environment.GetEnvironmentVariable("ASPNETCORE_CONTENTROOT");
if (string.IsNullOrWhiteSpace(contentRoot))
{
    contentRoot = Directory.GetCurrentDirectory();
}

var hostWebRootConfigured = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ASPNETCORE_WEBROOT"));
foreach (var argument in args)
{
    if (argument.StartsWith("--webroot", StringComparison.OrdinalIgnoreCase) || argument.StartsWith("--contentRoot", StringComparison.OrdinalIgnoreCase))
    {
        hostWebRootConfigured = true;
    }
}

var builder = !hostWebRootConfigured && !Directory.Exists(Path.Combine(contentRoot, "wwwroot")) && Directory.Exists(appWebRoot)
    ? WebApplication.CreateBuilder(new WebApplicationOptions { Args = args, WebRootPath = appWebRoot })
    : WebApplication.CreateBuilder(args);

var control = ControlOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(Options.Create(control));
builder.Services.AddSingleton(TimeProvider.System);



builder.WebHost.UseUrls(control.ListenUrl);


builder.Services.AddSingleton(control);












Directory.CreateDirectory(control.DataProtectionKeysPath);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(control.DataProtectionKeysPath))
    .SetApplicationName("SecRandom.Control");












var auth = AuthOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(Options.Create(auth));



builder.Services.AddSingleton<AuthSessionStore>();
builder.Services.AddSingleton<DeviceUuidProvider>();





















var identityProvider = IdentityProviderLoader.Select(builder.Configuration);
if (identityProvider.Refusal is { } refusal)
    throw new InvalidOperationException(refusal);

if (identityProvider.Module is { } identityModule)
{
    
    builder.Services.AddSingleton(identityModule);
    identityModule.Register(builder.Services, builder.Configuration);
}

var setupModes = BuildSetupModes(identityProvider.Installed, identityProvider.Module);
var legacyConfigured = !string.IsNullOrWhiteSpace(auth.Provider)
    || IsModuleConfigured(identityProvider.Module, builder.Configuration);
var failureThrottle = new FailureThrottle(TimeProvider.System);
var setupTokens = new SetupTokenService(builder.Configuration);

builder.Services.AddSingleton(failureThrottle);
builder.Services.AddSingleton(setupTokens);
builder.Services.AddSingleton<InstanceStateStore>();
builder.Services.AddSingleton(sp => new InstanceSetupState(
    setupModes,
    legacyConfigured,
    sp.GetRequiredService<InstanceStateStore>()));


ValidateAuthConfiguration(auth);




builder.Services.AddSingleton(sp => new IntrospectionCache(sp.GetRequiredService<TimeProvider>()));












builder.Services
    .AddAuthentication(AuthConstants.SessionSchemeName)
    .AddScheme<SessionAuthenticationOptions, SessionAuthenticationHandler>(
        AuthConstants.SessionSchemeName, _ => { })
    .AddScheme<AuthenticationSchemeOptions, NodeTokenAuthenticationHandler>(
        AuthConstants.NodeDeviceTokenSchemeName, _ => { });

builder.Services.Configure<AuthenticationOptions>(options =>
{
    foreach (var schemeName in new[] { AuthConstants.NodeBearerSchemeName, AuthConstants.AppBearerSchemeName })
    {
        if (options.Schemes.Any(scheme => string.Equals(scheme.Name, schemeName, StringComparison.Ordinal)))
            continue;

        options.AddScheme(schemeName, builder => builder.HandlerType = typeof(NotConfiguredAuthenticationHandler));
    }
});














builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .AddAuthenticationSchemes(
            AuthConstants.SessionSchemeName,
            AuthConstants.AppBearerSchemeName,
            AuthConstants.NodeDeviceTokenSchemeName)
        .Build();
});











builder.Services.AddSingleton<SqliteDatabase>();
builder.Services.AddSingleton<IGroupStore, SqliteGroupStore>();
builder.Services.AddSingleton<IGroupOrderStore, SqliteGroupOrderStore>();
builder.Services.AddSingleton<IAuditStore, SqliteAuditStore>();
builder.Services.AddSingleton<IEnrollmentCodeStore, SqliteEnrollmentCodeStore>();
builder.Services.AddSingleton<INodeTokenStore, SqliteNodeTokenStore>();
builder.Services.AddSingleton<NodeTokenService>();



builder.Services.AddHostedService<AuditRetentionService>();
builder.Services.AddHostedService<NodeCredentialRetentionService>();
builder.Services.AddSingleton<JsonToSqliteImporter>();
builder.Services.AddSingleton<IAuthorizationGate, AuthorizationGate>();
builder.Services.AddSingleton<INodeConnectionRegistry, NodeConnectionRegistry>();




builder.Services.AddSingleton<INodePresenceNotifier, NodePresenceNotifier>();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonSerialization.ProtocolJsonOptions.PropertyNamingPolicy;
    options.SerializerOptions.DictionaryKeyPolicy = JsonSerialization.ProtocolJsonOptions.DictionaryKeyPolicy;
    options.SerializerOptions.DefaultIgnoreCondition = JsonSerialization.ProtocolJsonOptions.DefaultIgnoreCondition;
    foreach (var converter in JsonSerialization.ProtocolJsonOptions.Converters)
        options.SerializerOptions.Converters.Add(converter);
});

var app = builder.Build();








var webRoot = app.Environment.WebRootPath;
if (!string.IsNullOrEmpty(webRoot) && Directory.Exists(webRoot))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}


app.UseWebSockets();

app.UseAuthentication();
app.UseMiddleware<NodeTokenScopeGate>();
app.UseAuthorization();

app.UseMiddleware<InstanceSetupGate>();
app.UseMiddleware<LocalModeCapabilityGate>();

app.MapGet("/healthz", () => Results.Json(new { status = "ok" }));

app.MapGet("/v1/meta", (IOptions<ControlOptions> options, InstanceSetupState setupState) => Results.Json(new
{
    service = "secrandom-control",
    protocol = ControlOptions.ProtocolVersion,
    server_version = ResolveVersion(),
    auth_mode = setupState.Store.Current?.Mode ?? string.Empty,
    node_enrollment = options.Value.NodeEnrollmentEnabled
        && string.Equals(setupState.Store.Current?.Mode, "local", StringComparison.OrdinalIgnoreCase),
    server_time = DateTimeOffset.UtcNow.ToString("O"),
    
    
    status = "ready"
}));

app.MapAuthEndpoints();
app.MapGroupEndpoints();
app.MapGroupOrderEndpoints();
app.MapInviteEndpoints();
app.MapTransferEndpoints();
app.MapNodeEndpoints();
app.MapNodeChannelEndpoints();
app.MapCommandEndpoints();
app.MapSetupEndpoints();
app.MapPasswordLoginEndpoints();
app.MapEnrollmentEndpoints();



app.MapMethods("/v1/{**rest}", ["GET", "POST", "PUT", "PATCH", "DELETE"],
    (string? rest) => Results.Json(
        ApiError.From(ApiErrorCodes.NotImplemented),
        statusCode: StatusCodes.Status501NotImplemented));


var spaIndex = string.IsNullOrEmpty(webRoot) ? null : Path.Combine(webRoot, "index.html");
if (spaIndex is not null && File.Exists(spaIndex))
{
    app.MapFallback(async (HttpContext context) =>
    {
        
        if (context.Request.Path.StartsWithSegments("/v1") ||
            context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        context.Response.ContentType = "text/html; charset=utf-8";
        
        context.Response.Headers.CacheControl = "no-cache, max-age=0, must-revalidate";
        await context.Response.SendFileAsync(spaIndex);
    });
}









await using (var startupScope = app.Services.CreateAsyncScope())
{
    var startupLogger = startupScope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    
    if (identityProvider.Module is { } selectedModule)
    {
        startupLogger.LogInformation(
            "身份源模块：{Provider}（{Assembly}）。",
            selectedModule.Name,
            selectedModule.GetType().Assembly.GetName().Name);
    }
    else
    {
        startupLogger.LogWarning(
            "未配置身份源：登录入口返回 503（auth_not_configured），程序化调用的 " +
            "Bearer 通道一律 401。装上身份源模块并配好它，或用 CTRL_AUTH_PROVIDER 点名一个模块。");
    }

    
    
    foreach (var diagnostic in identityProvider.Diagnostics)
        startupLogger.LogWarning("身份源发现：{Diagnostic}", diagnostic);

    var instanceSetup = startupScope.ServiceProvider.GetRequiredService<InstanceSetupState>();
    if (instanceSetup.PendingInitialization)
    {
        var setupUrl = control.ListenUrl.TrimEnd('/') + "/setup";
        if (setupTokens.Token is { } generatedToken)
        {
            startupLogger.LogWarning(
                "集控尚未初始化：安装页 {Url}，安装口令 {Token}（本次启动随机生成）。",
                setupUrl,
                generatedToken);
        }
        else
        {
            startupLogger.LogWarning(
                "集控尚未初始化：安装页 {Url}，安装口令取自 {Variable}。",
                setupUrl,
                SetupTokenService.ConfigurationKey);
        }
    }

    
    
    if (control.AuditRetentionDays > 0)
        startupLogger.LogInformation(
            "审计保留：{Days} 天，更早的记录会被自动清理（CTRL_AUDIT_RETENTION_DAYS）。",
            control.AuditRetentionDays);
    else
        startupLogger.LogWarning(
            "审计保留已关闭（AuditRetentionDays={Days}）：审计记录将永久保留，磁盘占用没有上界。",
            control.AuditRetentionDays);

    try
    {
        var sqlite = startupScope.ServiceProvider.GetRequiredService<SqliteDatabase>();
        await sqlite.InitializeAsync();

        var importer = startupScope.ServiceProvider.GetRequiredService<JsonToSqliteImporter>();
        await importer.ImportAsync();
    }
    catch (Exception exception)
    {
        startupLogger.LogError(exception, "存储初始化失败，服务将以不可用状态继续启动。");
    }
}

app.Run();

static string ResolveVersion() =>
    typeof(Program).Assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
    ?? "0.0.0";

static IReadOnlyList<SetupMode> BuildSetupModes(
    IReadOnlyList<IIdentityProviderModule> installed,
    IIdentityProviderModule? selected)
{
    var modes = new List<SetupMode>(installed.Count);
    foreach (var module in installed)
    {
        var provisioner = module as IInstanceProvisioner;
        var active = provisioner is not null && ReferenceEquals(module, selected);

        modes.Add(new SetupMode(
            module.Name,
            provisioner?.DisplayName ?? module.Name,
            active,
            provisioner?.RequiresCredentials ?? true));
    }

    return modes;
}

static bool IsModuleConfigured(IIdentityProviderModule? module, IConfiguration configuration)
{
    if (module is null)
        return false;

    try
    {
        return module.IsConfigured(configuration);
    }
    catch (Exception exception) when (exception is not OperationCanceledException)
    {
        return false;
    }
}









static void ValidateAuthConfiguration(AuthOptions auth)
{
    var problems = new List<string>();

    
    if (auth.SessionLifetime <= TimeSpan.Zero || auth.SessionLifetime > TimeSpan.FromDays(400))
        problems.Add(
            $"Auth:SessionLifetime / CTRL_AUTH_SESSION_LIFETIME 超出合理范围：{auth.SessionLifetime}；" +
            "应在 0 到 400 天之间。");

    
    if (auth.SessionRevalidationInterval <= TimeSpan.Zero ||
        auth.SessionRevalidationInterval > auth.SessionLifetime)
        problems.Add(
            $"Auth:SessionRevalidationInterval / CTRL_AUTH_SESSION_REVALIDATION_INTERVAL 超出合理范围：" +
            $"{auth.SessionRevalidationInterval}；应在 0 到会话期（{auth.SessionLifetime}）之间。");

    
    if (auth.SessionVerificationGrace < TimeSpan.Zero ||
        auth.SessionVerificationGrace > TimeSpan.FromDays(7))
        problems.Add(
            $"Auth:SessionVerificationGrace / CTRL_AUTH_SESSION_VERIFICATION_GRACE 超出合理范围：" +
            $"{auth.SessionVerificationGrace}；应在 0 到 7 天之间。");

    if (problems.Count > 0)
    {
        throw new InvalidOperationException(
            "认证配置不完整，已拒绝启动：\n  - " + string.Join("\n  - ", problems));
    }
}





public sealed record ApiError(string Code)
{
    public static ApiError From(string code) => new(code);
}

public static class ApiErrorCodes
{
    public const string NotImplemented = "not_implemented";
}


public partial class Program;
