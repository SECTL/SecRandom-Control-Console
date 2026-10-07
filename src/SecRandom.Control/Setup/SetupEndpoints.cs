using SecRandom.Control.Api;
using SecRandom.Control.Authentication;

namespace SecRandom.Control.Setup;


public sealed record SetupRequest(
    string? SetupToken,
    string? Token,
    string? Mode,
    string? DisplayName,
    string? AdminUsername,
    string? AdminPassword);


public static class SetupEndpoints
{
    private const int MaxDisplayNameLength = 64;

    public static void MapSetupEndpoints(this WebApplication app)
    {
        app.MapGet("/api/setup/status", (InstanceSetupState state) =>
        {
            var mode = state.Store.Current?.Mode;
            return Results.Json(new
            {
                initialized = state.Store.IsInitialized,
                mode,
                display_name = state.Store.Current?.DisplayName,
                membership_enabled = mode is not null
                    && !string.Equals(mode, "local", StringComparison.OrdinalIgnoreCase),
                modes = state.Modes,
            });
        });

        app.MapPost("/api/setup", async (
            HttpContext context,
            InstanceSetupState state,
            SetupTokenService tokens,
            FailureThrottle throttle,
            IEnumerable<IInstanceProvisioner> provisioners,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger(typeof(SetupEndpoints));
            var clientKey = "setup|" + (context.Connection.RemoteIpAddress?.ToString() ?? "unknown");

            var request = await RequestJson.ReadAsync<SetupRequest>(context.Request, context.RequestAborted);
            if (request is null)
                return ApiResults.BadRequest(ErrorCodes.InvalidRequest);

            await state.SetupLock.WaitAsync(context.RequestAborted);
            try
            {
                if (state.Store.IsInitialized)
                    return ApiResults.Conflict(ErrorCodes.AlreadyInitialized);

                if (!state.PendingInitialization)
                    return ApiResults.NotFound();

                if (throttle.IsBlocked(clientKey))
                    return ApiResults.Error(ErrorCodes.TooManyAttempts, StatusCodes.Status429TooManyRequests);

                if (!tokens.Matches(request.SetupToken ?? request.Token))
                {
                    throttle.Record(clientKey);
                    return ApiResults.Unauthorized();
                }

                var requested = request.Mode?.Trim();
                var mode = string.IsNullOrEmpty(requested)
                    ? null
                    : state.Modes.FirstOrDefault(candidate =>
                        candidate.Available &&
                        string.Equals(candidate.Id, requested, StringComparison.OrdinalIgnoreCase));

                if (mode is null)
                    return ApiResults.BadRequest(ErrorCodes.ModeNotAvailable);

                var displayName = request.DisplayName?.Trim();
                if (displayName is { Length: > MaxDisplayNameLength })
                    return ApiResults.BadRequest(ErrorCodes.InvalidRequest);

                if (displayName is { Length: 0 })
                    displayName = null;

                var provisioner = provisioners.FirstOrDefault(candidate =>
                    string.Equals(candidate.Mode, mode.Id, StringComparison.OrdinalIgnoreCase));

                if (provisioner is null)
                    return ApiResults.BadRequest(ErrorCodes.ModeNotAvailable);

                if (provisioner.RequiresCredentials &&
                    (string.IsNullOrWhiteSpace(request.AdminUsername) || string.IsNullOrEmpty(request.AdminPassword)))
                {
                    return ApiResults.BadRequest(ErrorCodes.InvalidRequest);
                }

                var provision = await provisioner.ProvisionAsync(
                    new InstanceProvisionRequest(mode.Id, displayName, request.AdminUsername, request.AdminPassword),
                    context.RequestAborted);

                if (!provision.Success)
                    return ApiResults.BadRequest(provision.Code ?? ErrorCodes.InvalidRequest);

                InstanceState instance;
                try
                {
                    if (!state.Store.TryInitialize(mode.Id, displayName, out instance))
                        return ApiResults.Conflict(ErrorCodes.AlreadyInitialized);
                }
                catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
                {
                    logger.LogError(exception, "写入实例状态失败：{Path}", state.Store.FilePath);
                    return ApiResults.Error(ErrorCodes.ServiceUnavailable, StatusCodes.Status503ServiceUnavailable);
                }

                return Results.Json(new
                {
                    ok = true,
                    mode = instance.Mode,
                    display_name = instance.DisplayName,
                });
            }
            finally
            {
                state.SetupLock.Release();
            }
        });
    }
}
