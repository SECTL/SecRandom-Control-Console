using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using SecRandom.Control.Authentication;

namespace SecRandom.Control.Api;

public sealed class NodeTokenScopeGate(RequestDelegate next)
{
    private const string NodeChannelPrefix = "/v1/node/";

    public async Task InvokeAsync(HttpContext context)
    {
        if (!RequiresScoping(context))
        {
            await next(context).ConfigureAwait(false);
            return;
        }

        var tokenGroupId = await ResolveScopeAsync(context).ConfigureAwait(false);

        if (tokenGroupId is null || IsAllowed(context.Request, tokenGroupId))
        {
            await next(context).ConfigureAwait(false);
            return;
        }

        await ApiResults.Error(ErrorCodes.Forbidden, StatusCodes.Status403Forbidden)
            .ExecuteAsync(context)
            .ConfigureAwait(false);
    }

    private static bool RequiresScoping(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        if (endpoint is null)
            return false;

        if (endpoint.Metadata.GetMetadata<IAllowAnonymous>() is not null)
            return false;

        return endpoint.Metadata.GetMetadata<IAuthorizeData>() is not null;
    }

    public static string? ResolveTokenGroupId(ClaimsPrincipal? principal)
    {
        if (principal?.Identity?.IsAuthenticated != true)
            return null;

        if (!string.Equals(
                principal.Identity.AuthenticationType,
                AuthConstants.NodeDeviceTokenSchemeName,
                StringComparison.Ordinal))
            return null;

        return principal.FindFirst(AuthConstants.GroupIdClaim)?.Value;
    }

    private static async Task<string?> ResolveScopeAsync(HttpContext context)
    {
        var scoped = ResolveTokenGroupId(context.User);
        if (scoped is not null)
            return scoped;

        if (context.User?.Identity?.IsAuthenticated == true)
            return null;

        var result = await context.AuthenticateAsync(AuthConstants.NodeDeviceTokenSchemeName)
            .ConfigureAwait(false);

        if (!result.Succeeded || result.Principal is null)
            return null;

        return result.Principal.FindFirst(AuthConstants.GroupIdClaim)?.Value;
    }

    private static bool IsAllowed(HttpRequest request, string tokenGroupId)
    {
        if (string.IsNullOrEmpty(tokenGroupId))
            return false;

        var path = request.Path.Value ?? string.Empty;
        if (path.StartsWith(NodeChannelPrefix, StringComparison.Ordinal))
            return true;

        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length < 2)
            return false;

        if (!string.Equals(segments[0], "v1", StringComparison.Ordinal))
            return false;

        if (!string.Equals(segments[1], "groups", StringComparison.Ordinal))
            return false;

        if (segments.Length == 2)
            return HttpMethods.IsGet(request.Method);

        if (!string.Equals(segments[2], tokenGroupId, StringComparison.Ordinal))
            return false;

        if (HttpMethods.IsGet(request.Method))
        {
            if (segments.Length == 4)
                return segments[3] is "nodes" or "members" or "events";

            if (segments.Length == 5)
                return string.Equals(segments[3], "nodes", StringComparison.Ordinal)
                    || string.Equals(segments[3], "commands", StringComparison.Ordinal);

            return false;
        }

        if (HttpMethods.IsPost(request.Method))
        {
            return segments.Length == 6
                && string.Equals(segments[3], "nodes", StringComparison.Ordinal)
                && string.Equals(segments[5], "commands", StringComparison.Ordinal);
        }

        return false;
    }
}
