using SecRandom.Control.Authentication;

namespace SecRandom.Control.Api;

public sealed class NodeTokenScopeGate(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (IsScopedToken(context, out var tokenGroupId) && !IsAllowed(context.Request, tokenGroupId))
        {
            await ApiResults.Error(ErrorCodes.Forbidden, StatusCodes.Status403Forbidden)
                .ExecuteAsync(context)
                .ConfigureAwait(false);
            return;
        }

        await next(context).ConfigureAwait(false);
    }

    private static bool IsScopedToken(HttpContext context, out string tokenGroupId)
    {
        tokenGroupId = string.Empty;

        var principal = context.User;
        if (principal?.Identity?.IsAuthenticated != true)
            return false;

        if (!string.Equals(
                principal.Identity.AuthenticationType,
                AuthConstants.NodeDeviceTokenSchemeName,
                StringComparison.Ordinal))
        {
            return false;
        }

        tokenGroupId = principal.FindFirst(AuthConstants.GroupIdClaim)?.Value ?? string.Empty;
        return true;
    }

    private static bool IsAllowed(HttpRequest request, string tokenGroupId)
    {
        if (string.IsNullOrEmpty(tokenGroupId))
            return false;

        var segments = request.Path.Value?.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments is null || segments.Length < 3)
            return false;

        if (!string.Equals(segments[0], "v1", StringComparison.Ordinal))
            return false;

        if (!string.Equals(segments[1], "groups", StringComparison.Ordinal))
            return false;

        return string.Equals(segments[2], tokenGroupId, StringComparison.Ordinal);
    }
}
