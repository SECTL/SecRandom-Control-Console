using SecRandom.Control.Api;

namespace SecRandom.Control.Setup;


public sealed class InstanceSetupGate
{
    private readonly RequestDelegate _next;
    private readonly InstanceSetupState _state;

    public InstanceSetupGate(RequestDelegate next, InstanceSetupState state)
    {
        _next = next;
        _state = state;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (_state.PendingInitialization && IsGuarded(context.Request.Path))
        {
            await ApiResults.Error(ErrorCodes.NotConfigured, StatusCodes.Status409Conflict)
                .ExecuteAsync(context);
            return;
        }

        await _next(context);
    }

    private static bool IsGuarded(PathString path)
    {
        if (path.StartsWithSegments("/v1"))
            return true;

        if (!path.StartsWithSegments("/api"))
            return false;

        return !path.StartsWithSegments("/api/setup") && !path.StartsWithSegments("/api/auth");
    }
}
