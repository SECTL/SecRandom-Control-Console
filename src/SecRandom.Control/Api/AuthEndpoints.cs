using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using SecRandom.Control.Authentication;
using SecRandom.Control.Configuration;
using SecRandom.Control.Domain;
using SecRandom.Control.Storage;

namespace SecRandom.Control.Api;

















public static class AuthEndpoints
{
    
    private static readonly TimeSpan CodeVerifierLifetime = TimeSpan.FromMinutes(10);

    public static void MapAuthEndpoints(this WebApplication app)
    {
        
        app.MapGet("/api/auth/login", (
            HttpContext context,
            AuthSessionStore store,
            IOptions<AuthOptions> authOptionsAccessor,
            IServiceProvider services) =>
        {
            
            
            if (services.GetService<IAuthProvider>() is not { } provider
                || services.GetService<IOptions<OAuthProviderOptions>>() is not { } oauthOptionsAccessor)
                return IdentitySourceMissing();

            var options = authOptionsAccessor.Value;
            var oauthOptions = oauthOptionsAccessor.Value;
            var returnTo = ResolveReturnTo(context.Request.Query["return_to"]);

            
            
            
            var verifier = NewCodeVerifier();
            var state = store.CreateState(returnTo, verifier, options.StateLifetime);
            var challenge = ComputeChallenge(verifier);

            var url = provider.BuildAuthorizeUrl(state, challenge, oauthOptions);
            return Results.Redirect(url);
        });

        
        app.MapGet("/api/auth/callback", async (
            HttpContext context,
            AuthSessionStore store,
            IOptions<AuthOptions> authOptionsAccessor,
            IServiceProvider services,
            TimeProvider timeProvider,
            ILoggerFactory loggerFactory,
            CancellationToken cancellationToken) =>
        {
            var logger = loggerFactory.CreateLogger("SecRandom.Control.Api.AuthEndpoints");

            
            if (services.GetService<IAuthProvider>() is not { } provider
                || services.GetService<ISessionCredentialVault>() is not { } tokenVault
                || services.GetService<IOptions<OAuthProviderOptions>>() is not { } oauthOptionsAccessor)
                return IdentitySourceMissing();

            var options = authOptionsAccessor.Value;
            var oauthOptions = oauthOptionsAccessor.Value;

            var error = context.Request.Query["error"].ToString();
            if (!string.IsNullOrWhiteSpace(error))
                return Results.Redirect("/login?error=authorization_denied");

            
            
            var state = store.ConsumeState(context.Request.Query["state"]);
            if (state is null)
                return Results.Redirect("/login?error=invalid_state");

            var code = context.Request.Query["code"].ToString();
            if (string.IsNullOrWhiteSpace(code))
                return Results.Redirect("/login?error=missing_code");

            var result = await provider.CompleteLoginAsync(
                code, state.CodeVerifier, oauthOptions, cancellationToken).ConfigureAwait(false);

            if (result is null)
                return Results.Redirect("/login?error=login_failed");

            
            
            if (result.AccessToken is null || result.RefreshToken is null)
            {
                logger.LogError(
                    "身份源未返回完整的 access/refresh token，拒绝建立无法校验的会话（user_id={UserId}）。",
                    result.UserId);
                return Results.Redirect("/login?error=login_failed");
            }

            var now = timeProvider.GetUtcNow();
            var credentials = new SessionCredential(
                result.AccessToken,
                result.RefreshToken,
                
                
                result.AccessTokenExpiresAt ?? now,
                now);

            var session = store.CreateSession(
                result.UserId, result.DisplayName, result.AvatarUrl, result.Email,
                tokenVault.Protect(credentials), options.SessionLifetime);
            SessionCookie.Append(context.Response, options, session.SessionId, session.ExpiresAt);

            return Results.Redirect(state.ReturnTo);
        });

        
        app.MapGet("/api/auth/session", async (
            ClaimsPrincipal principal,
            AuthSessionStore store,
            IGroupStore groupStore,
            IGroupOrderStore orderStore,
            IOptions<AuthOptions> authOptionsAccessor,
            IOptions<ControlOptions> controlOptions,
            CancellationToken cancellationToken) =>
        {
            var userId = principal.FindFirstValue(AuthConstants.UserIdClaim);
            if (string.IsNullOrWhiteSpace(userId))
                return ApiResults.Unauthorized();

            
            
            var sessionId = principal.FindFirstValue(AuthConstants.SessionIdClaim);
            var session = string.IsNullOrWhiteSpace(sessionId) ? null : store.GetSession(sessionId);

            var groups = await groupStore.ListGroupsForMemberAsync(userId, cancellationToken)
                .ConfigureAwait(false);

            
            var summaries = new List<GroupSummaryDto>(groups.Count);
            foreach (var group in groups)
            {
                var members = await groupStore.ListMembersAsync(group.GroupId, cancellationToken)
                    .ConfigureAwait(false);

                var member = members.FirstOrDefault(candidate =>
                    string.Equals(candidate.UserId, userId, StringComparison.Ordinal));

                if (member is null)
                    continue;

                
                
                var ownerDisplayName = members.FirstOrDefault(candidate =>
                    string.Equals(candidate.UserId, group.OwnerUserId, StringComparison.Ordinal))?.DisplayName;

                summaries.Add(new GroupSummaryDto(
                    group.GroupId, group.Name, group.OwnerUserId, ownerDisplayName, group.CreatedAt, member.Role));
            }

            return Results.Json(new SessionDto(
                userId,
                session?.DisplayName ?? principal.FindFirstValue(AuthConstants.DisplayNameClaim),
                session?.AvatarUrl,
                session?.Email,
                
                
                controlOptions.Value.MaxOwnedGroupsPerUser,
                
                
                GroupOrdering.Apply(
                    summaries,
                    GroupOrdering.Ranks(await orderStore.GetOrderAsync(userId, cancellationToken)
                        .ConfigureAwait(false)),
                    item => item.GroupId,
                    item => item.CreatedAt)));
        }).RequireAuthorization();

        
        app.MapPost("/api/auth/logout", async (
            HttpContext context,
            AuthSessionStore store,
            IServiceProvider services,
            IOptions<AuthOptions> o,
            CancellationToken cancellationToken) =>
        {
            var options = o.Value;

            var session = context.Request.Cookies.TryGetValue(SessionCookie.Name(options), out var sessionId)
                ? store.GetSession(sessionId)
                : null;

            
            if (session is not null)
                store.Revoke(session.SessionId);

            SessionCookie.Delete(context.Response, options);

            
            
            
            var credentials = services.GetService<ISessionCredentialVault>()
                ?.Unprotect(session?.ProtectedCredentials);
            if (credentials is not null
                && services.GetService<IAuthProvider>() is { } provider
                && services.GetService<IOptions<OAuthProviderOptions>>() is { } oauthOptionsAccessor)
            {
                await provider.RevokeAccessTokenAsync(
                    credentials.AccessToken, oauthOptionsAccessor.Value, cancellationToken).ConfigureAwait(false);
            }

            return Results.Json(new { ok = true });
        });
    }

    






    private static IResult IdentitySourceMissing() =>
        ApiResults.Error(ErrorCodes.AuthNotConfigured, StatusCodes.Status503ServiceUnavailable);

    



    private static string ResolveReturnTo(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "/console";

        
        if (!value.StartsWith('/') || value.StartsWith("//") || value.StartsWith("/\\"))
            return "/console";

        
        if (value.Contains('\\', StringComparison.Ordinal))
            return "/console";

        return value.Length > 512 ? "/console" : value;
    }

    private static string NewCodeVerifier() =>
        Base64Url(RandomNumberGenerator.GetBytes(32));

    private static string ComputeChallenge(string verifier) =>
        Base64Url(SHA256.HashData(Encoding.ASCII.GetBytes(verifier)));

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}





public sealed record GroupSummaryDto(
    string GroupId,
    string Name,
    string OwnerUserId,
    string? OwnerDisplayName,
    DateTimeOffset CreatedAt,
    GroupRole Role);








public sealed record SessionDto(
    string UserId,
    string? DisplayName,
    string? AvatarUrl,
    string? Email,
    int MaxOwnedGroups,
    IReadOnlyList<GroupSummaryDto> Groups);
