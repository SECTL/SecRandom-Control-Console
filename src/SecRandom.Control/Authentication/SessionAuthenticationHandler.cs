using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using SecRandom.Control.Configuration;

namespace SecRandom.Control.Authentication;


























public sealed class SessionAuthenticationHandler(
    IOptionsMonitor<SessionAuthenticationOptions> options,
    ILoggerFactory loggerFactory,
    UrlEncoder encoder,
    AuthSessionStore sessionStore,
    IOptions<AuthOptions> authOptions,
    IConsoleSessionVerifier? verifier = null)
    : AuthenticationHandler<SessionAuthenticationOptions>(options, loggerFactory, encoder)
{
    private readonly AuthOptions _authOptions = authOptions.Value;

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var cookieName = SessionCookie.Name(_authOptions);

        if (!Request.Cookies.TryGetValue(cookieName, out var sessionId))
            return AuthenticateResult.NoResult();

        var session = sessionStore.GetSession(sessionId);
        if (session is null)
            return AuthenticateResult.Fail("session_expired");

        if (verifier is null)
        {
            
            
            SessionCookie.Delete(Response, _authOptions);
            Logger.LogWarning(
                "当前部署没有配置身份源模块，控制台会话无法复核，拒绝该请求：{SessionId}", session.SessionId);
            return AuthenticateResult.Fail("identity_provider_not_configured");
        }

        var verification = await verifier.VerifyAsync(session).ConfigureAwait(false);
        if (verification != SessionVerification.Valid)
        {
            
            
            SessionCookie.Delete(Response, _authOptions);
            Logger.LogInformation(
                "控制台会话已失效，拒绝该请求：{SessionId}", session.SessionId);
            return AuthenticateResult.Fail("session_revoked");
        }

        var claims = new List<Claim>
        {
            new(AuthConstants.UserIdClaim, session.UserId),
            new(AuthConstants.SessionIdClaim, session.SessionId)
        };

        if (session.DisplayName is { Length: > 0 } displayName)
            claims.Add(new Claim(AuthConstants.DisplayNameClaim, displayName));

        
        
        if (session.AvatarUrl is { Length: > 0 } avatarUrl)
            claims.Add(new Claim(AuthConstants.AvatarUrlClaim, avatarUrl));

        var identity = new ClaimsIdentity(claims, AuthConstants.SessionSchemeName);
        return AuthenticateResult.Success(
            new AuthenticationTicket(new ClaimsPrincipal(identity), AuthConstants.SessionSchemeName));
    }
}

public sealed class SessionAuthenticationOptions : AuthenticationSchemeOptions;
