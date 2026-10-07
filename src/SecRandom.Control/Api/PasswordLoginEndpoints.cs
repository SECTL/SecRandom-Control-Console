using Microsoft.Extensions.Options;
using SecRandom.Control.Authentication;
using SecRandom.Control.Configuration;

namespace SecRandom.Control.Api;


public sealed record PasswordLoginRequest(string? Username, string? Password);


public static class PasswordLoginEndpoints
{
    public static void MapPasswordLoginEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/password-login", async (
            HttpContext context,
            AuthSessionStore sessionStore,
            IOptions<AuthOptions> authOptions,
            FailureThrottle throttle,
            TimeProvider timeProvider) =>
        {
            var authenticator = context.RequestServices.GetService<IPasswordAuthenticator>();
            var vault = context.RequestServices.GetService<ISessionCredentialVault>();

            if (authenticator is null || vault is null)
                return ApiResults.Error(ErrorCodes.AuthNotConfigured, StatusCodes.Status503ServiceUnavailable);

            var request = await RequestJson.ReadAsync<PasswordLoginRequest>(context.Request, context.RequestAborted);
            if (request is null)
                return ApiResults.BadRequest(ErrorCodes.InvalidRequest);

            var userName = request.Username?.Trim();
            if (string.IsNullOrEmpty(userName) || string.IsNullOrEmpty(request.Password))
                return ApiResults.BadRequest(ErrorCodes.InvalidRequest);

            var throttleKey = $"login|{context.Connection.RemoteIpAddress}|{userName.ToLowerInvariant()}";
            if (throttle.IsBlocked(throttleKey))
                return ApiResults.Error(ErrorCodes.TooManyAttempts, StatusCodes.Status429TooManyRequests);

            var identity = await authenticator.AuthenticateWithPasswordAsync(
                userName, request.Password, context.RequestAborted);

            if (identity is null)
            {
                throttle.Record(throttleKey);
                return ApiResults.Unauthorized();
            }

            throttle.Clear(throttleKey);

            var options = authOptions.Value;
            var now = timeProvider.GetUtcNow();
            var credentials = new SessionCredential(
                identity.AccessToken ?? string.Empty,
                identity.RefreshToken ?? string.Empty,
                identity.AccessTokenExpiresAt ?? now.Add(options.SessionLifetime),
                now);

            var session = sessionStore.CreateSession(
                identity.UserId,
                identity.DisplayName,
                identity.AvatarUrl,
                identity.Email,
                vault.Protect(credentials),
                options.SessionLifetime);

            SessionCookie.Append(context.Response, options, session.SessionId, session.ExpiresAt);

            return Results.Json(new { ok = true });
        });
    }
}
