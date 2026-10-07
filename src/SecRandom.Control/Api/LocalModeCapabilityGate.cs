using SecRandom.Control.Setup;

namespace SecRandom.Control.Api;


public sealed class LocalModeCapabilityGate
{
    private readonly RequestDelegate _next;
    private readonly InstanceSetupState _state;

    public LocalModeCapabilityGate(RequestDelegate next, InstanceSetupState state)
    {
        _next = next;
        _state = state;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (IsLocalMode() && IsMembershipOperation(context.Request))
        {
            await ApiResults.Error(ErrorCodes.UnsupportedInLocalMode, StatusCodes.Status409Conflict)
                .ExecuteAsync(context);
            return;
        }

        await _next(context);
    }

    private bool IsLocalMode() =>
        string.Equals(_state.Store.Current?.Mode, "local", StringComparison.OrdinalIgnoreCase);

    private static bool IsMembershipOperation(HttpRequest request)
    {
        if (request.Path.StartsWithSegments("/v1/invites"))
            return true;

        var segments = request.Path.Value?.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments is null || segments.Length < 4)
            return false;

        if (!string.Equals(segments[0], "v1", StringComparison.Ordinal) ||
            !string.Equals(segments[1], "groups", StringComparison.Ordinal))
        {
            return false;
        }

        if (string.Equals(segments[3], "invites", StringComparison.Ordinal) ||
            string.Equals(segments[3], "transfers", StringComparison.Ordinal))
        {
            return true;
        }

        return segments.Length >= 5 &&
               string.Equals(segments[3], "members", StringComparison.Ordinal) &&
               (HttpMethods.IsPatch(request.Method) || HttpMethods.IsDelete(request.Method));
    }
}
