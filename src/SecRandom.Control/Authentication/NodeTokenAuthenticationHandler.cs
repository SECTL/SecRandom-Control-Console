using System.Globalization;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace SecRandom.Control.Authentication;

public sealed class NodeTokenAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory loggerFactory,
    UrlEncoder encoder,
    NodeTokenService tokens,
    TimeProvider timeProvider) : AuthenticationHandler<AuthenticationSchemeOptions>(options, loggerFactory, encoder)
{
    public const string MalformedFailureReason = "node_token_malformed";

    public const string UnknownFailureReason = "node_token_unknown";

    public const string ExpiredFailureReason = "node_token_expired";

    public const string RevokedFailureReason = "node_token_revoked";

    private const string BearerScheme = "Bearer";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var raw = ResolveBearerToken();
        if (string.IsNullOrWhiteSpace(raw))
            return AuthenticateResult.NoResult();

        if (!NodeTokenService.HasTokenPrefix(raw))
            return AuthenticateResult.NoResult();

        var result = await tokens.AuthenticateAsync(raw, timeProvider.GetUtcNow()).ConfigureAwait(false);
        if (!result.Succeeded)
        {
            var reason = Describe(result.Failure);
            Logger.LogWarning("节点令牌校验失败：{Reason}", reason);
            return AuthenticateResult.Fail(reason);
        }

        var token = result.Token!;
        var claims = new List<Claim>
        {
            new(AuthConstants.UserIdClaim, token.EnrolledByUserId ?? string.Empty),
            new(AuthConstants.NodeIdClaim, token.NodeId),
            new(AuthConstants.GroupIdClaim, token.GroupId),
            new(AuthConstants.DeviceIdClaim, "node:" + token.NodeId),
            new(AuthConstants.ExpiresAtClaim, token.ExpiresAt.ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture)),
            new(AuthConstants.ScopeClaim, "node")
        };

        var identity = new ClaimsIdentity(claims, AuthConstants.NodeDeviceTokenSchemeName);
        var principal = new ClaimsPrincipal(identity);

        return AuthenticateResult.Success(
            new AuthenticationTicket(principal, AuthConstants.NodeDeviceTokenSchemeName));
    }

    private static string Describe(NodeTokenFailure failure) => failure switch
    {
        NodeTokenFailure.Malformed => MalformedFailureReason,
        NodeTokenFailure.Expired => ExpiredFailureReason,
        NodeTokenFailure.Revoked => RevokedFailureReason,
        _ => UnknownFailureReason
    };

    private string? ResolveBearerToken()
    {
        var header = Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(header))
            return null;

        var separator = header.IndexOf(' ');
        if (separator <= 0)
            return null;

        if (!string.Equals(header[..separator], BearerScheme, StringComparison.OrdinalIgnoreCase))
            return null;

        var token = header[(separator + 1)..].Trim();
        return token.Length == 0 ? null : token;
    }
}
