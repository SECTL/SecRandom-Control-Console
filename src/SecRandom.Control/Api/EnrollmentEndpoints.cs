using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using SecRandom.Control.Authentication;
using SecRandom.Control.Configuration;
using SecRandom.Control.Domain;
using SecRandom.Control.Setup;
using SecRandom.Control.Storage;

namespace SecRandom.Control.Api;

public static class EnrollmentEndpoints
{
    private const string Alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

    private const int CodeLength = 8;

    private const int MaxPendingCodesPerGroup = 50;

    private const int MaxNodeIdLength = 128;

    private const int MaxPlatformLength = 32;

    private const int MaxVersionLength = 64;

    private const int MaxDisplayNameLength = 64;

    private const int MaxCapabilities = 32;

    private const int MaxCapabilityLength = 48;

    public static void MapEnrollmentEndpoints(this WebApplication app)
    {
        var anonymous = app.MapGroup("/v1");

        anonymous.MapPost("/node/enroll", EnrollAsync);

        var group = app.MapGroup("/v1").RequireAuthorization();

        group.MapPost("/groups/{groupId}/enrollment-codes", CreateEnrollmentCodeAsync);
        group.MapGet("/groups/{groupId}/enrollment-codes", ListEnrollmentCodesAsync);
        group.MapDelete("/groups/{groupId}/enrollment-codes/{code}", RevokeEnrollmentCodeAsync);

        group.MapPost("/groups/{groupId}/nodes/{nodeId}/token", IssueNodeTokenAsync);
        group.MapDelete("/groups/{groupId}/nodes/{nodeId}/token", RevokeNodeTokenAsync);
    }

    private static async Task<IResult> EnrollAsync(
        HttpContext context,
        IEnrollmentCodeStore codes,
        IGroupStore groups,
        INodeTokenStore tokens,
        NodeTokenService tokenService,
        InstanceSetupState setupState,
        FailureThrottle throttle,
        IAuditStore audit,
        IOptions<ControlOptions> options,
        TimeProvider timeProvider,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        var settings = options.Value;
        var logger = loggerFactory.CreateLogger("SecRandom.Control.Api.EnrollmentEndpoints");

        if (!settings.NodeEnrollmentEnabled || !IsLocalMode(setupState))
            return ApiResults.Error(ErrorCodes.EnrollmentDisabled, StatusCodes.Status503ServiceUnavailable);

        var clientKey = "enroll|" + (context.Connection.RemoteIpAddress?.ToString() ?? "unknown");
        if (throttle.IsBlocked(clientKey))
            return ApiResults.Error(ErrorCodes.TooManyAttempts, StatusCodes.Status429TooManyRequests);

        var request = await RequestJson.ReadAsync<EnrollRequest>(context.Request, cancellationToken);
        if (request is null)
        {
            throttle.Record(clientKey);
            return ApiResults.BadRequest();
        }

        var code = NormalizeCode(request.Code);
        if (code.Length != CodeLength)
        {
            throttle.Record(clientKey);
            return ApiResults.Unauthorized(ErrorCodes.EnrollmentCodeInvalid);
        }

        var platform = request.Platform?.Trim();
        if (string.IsNullOrWhiteSpace(platform) || platform.Length > MaxPlatformLength)
        {
            throttle.Record(clientKey);
            return ApiResults.BadRequest();
        }

        var version = request.Version?.Trim();
        if (string.IsNullOrWhiteSpace(version) || version.Length > MaxVersionLength)
        {
            throttle.Record(clientKey);
            return ApiResults.BadRequest();
        }

        var requestedNodeId = request.NodeId?.Trim();
        if (requestedNodeId is { Length: > MaxNodeIdLength })
        {
            throttle.Record(clientKey);
            return ApiResults.BadRequest();
        }

        var displayName = request.DisplayName;
        if (displayName is { Length: > MaxDisplayNameLength })
        {
            throttle.Record(clientKey);
            return ApiResults.BadRequest();
        }

        if (!TryNormalizeCapabilities(request.Capabilities, out var capabilities))
        {
            throttle.Record(clientKey);
            return ApiResults.BadRequest();
        }

        var now = timeProvider.GetUtcNow();
        var stored = await codes.GetAsync(code, cancellationToken);
        if (stored is null)
        {
            throttle.Record(clientKey);
            return ApiResults.Unauthorized(ErrorCodes.EnrollmentCodeInvalid);
        }

        switch (stored.Status(now))
        {
            case EnrollmentCodeStatus.Revoked:
                throttle.Record(clientKey);
                return ApiResults.Gone(ErrorCodes.EnrollmentCodeRevoked);
            case EnrollmentCodeStatus.Used:
                throttle.Record(clientKey);
                return ApiResults.Gone(ErrorCodes.EnrollmentCodeUsed);
            case EnrollmentCodeStatus.Expired:
                throttle.Record(clientKey);
                return ApiResults.Gone(ErrorCodes.EnrollmentCodeExpired);
        }

        var nodeId = stored.NodeId is { Length: > 0 } bound
            ? bound
            : requestedNodeId is { Length: > 0 } ? requestedNodeId : NewNodeId();

        if (stored.NodeId is { Length: > 0 } && requestedNodeId is { Length: > 0 }
            && !string.Equals(stored.NodeId, requestedNodeId, StringComparison.Ordinal))
        {
            throttle.Record(clientKey);
            return ApiResults.Conflict(ErrorCodes.NodeMismatch);
        }

        if (!await codes.TryRedeemAsync(code, nodeId, now, cancellationToken))
        {
            throttle.Record(clientKey);
            return ApiResults.Gone(ErrorCodes.EnrollmentCodeUsed);
        }

        var current = await groups.GetNodeAsync(stored.GroupId, nodeId, cancellationToken);
        var node = new Node
        {
            NodeId = nodeId,
            GroupId = stored.GroupId,
            Platform = platform,
            Version = version,
            Capabilities = capabilities,
            LocalRemoteAllowed = current?.LocalRemoteAllowed ?? false,
            DisplayName = displayName is null
                ? current?.DisplayName
                : NodeFrame.SanitizeDisplayName(displayName),
            LastHeartbeatAt = now,
            RegisteredAt = current?.RegisteredAt ?? now,
            EnrolledByUserId = stored.CreatedByUserId
        };

        if (current is not null)
            await groups.SetNodeEnrolledByAsync(stored.GroupId, nodeId, stored.CreatedByUserId, cancellationToken);

        await groups.SaveNodeAsync(node, cancellationToken);

        var issued = await tokenService.IssueAsync(
            stored.GroupId, nodeId, stored.CreatedByUserId, now, settings.NodeTokenLifetime, cancellationToken);

        await AuditAsync(audit, logger, new AuditEvent
        {
            EventId = AuditDenials.NewEventId(),
            At = now,
            ActorUserId = stored.CreatedByUserId,
            ActorDeviceId = "enroll:" + (context.Connection.RemoteIpAddress?.ToString() ?? "unknown"),
            Action = AuditActions.NodeEnrolled,
            Outcome = AuditOutcomes.Success,
            GroupId = stored.GroupId,
            TargetId = nodeId,
            Detail = "code:" + stored.Code
        }, cancellationToken);

        var group = await groups.GetGroupAsync(stored.GroupId, cancellationToken);

        throttle.Clear(clientKey);

        return Results.Json(
            new EnrollResultDto(
                nodeId,
                stored.GroupId,
                settings.HideGroupNameOnEnroll ? null : group?.Name,
                issued.PlainTextToken,
                issued.Token.ExpiresAt),
            statusCode: StatusCodes.Status201Created);
    }

    private static async Task<IResult> CreateEnrollmentCodeAsync(
        HttpContext context,
        string groupId,
        IGroupStore groups,
        IEnrollmentCodeStore codes,
        IAuditStore audit,
        IOptions<ControlOptions> options,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var caller = Caller.From(context.User);
        if (caller is null)
            return ApiResults.Unauthorized();

        var member = await Membership.ResolveAsync(groups, caller, groupId, cancellationToken);
        if (member is null)
            return ApiResults.NotFound(ErrorCodes.GroupNotFound);

        if (!Membership.HasAtLeast(member, GroupRole.Admin))
        {
            await AuditDenials.WriteDeniedAsync(
                audit, timeProvider, caller, AuditActions.EnrollmentCodeCreated, groupId, null,
                ErrorCodes.InsufficientRole, cancellationToken);
            return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
        }

        var request = await RequestJson.ReadAsync<CreateEnrollmentCodeRequest>(context.Request, cancellationToken);
        if (request is null)
            return ApiResults.BadRequest();

        var nodeId = request.NodeId?.Trim();
        if (nodeId is { Length: > MaxNodeIdLength })
            return ApiResults.BadRequest();

        var pending = (await codes.ListByGroupAsync(groupId, cancellationToken))
            .Count(code => code.Status(timeProvider.GetUtcNow()) == EnrollmentCodeStatus.Pending);
        if (pending >= MaxPendingCodesPerGroup)
            return ApiResults.Conflict(ErrorCodes.GroupLimitReached);

        var now = timeProvider.GetUtcNow();
        var record = new EnrollmentCode
        {
            Code = await GenerateUniqueCodeAsync(codes, cancellationToken),
            GroupId = groupId,
            NodeId = nodeId is { Length: > 0 } ? nodeId : null,
            CreatedByUserId = caller.UserId,
            CreatedAt = now,
            ExpiresAt = now + options.Value.EnrollmentCodeLifetime
        };

        await codes.SaveAsync(record, cancellationToken);

        await AuditAsync(audit, null, new AuditEvent
        {
            EventId = AuditDenials.NewEventId(),
            At = now,
            ActorUserId = caller.UserId,
            ActorDeviceId = caller.AuditDeviceId,
            Action = AuditActions.EnrollmentCodeCreated,
            Outcome = AuditOutcomes.Success,
            GroupId = groupId,
            TargetId = record.Code,
            Detail = record.NodeId
        }, cancellationToken);

        return Results.Json(ToDto(record, now), statusCode: StatusCodes.Status201Created);
    }

    private static async Task<IResult> ListEnrollmentCodesAsync(
        HttpContext context,
        string groupId,
        IGroupStore groups,
        IEnrollmentCodeStore codes,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var caller = Caller.From(context.User);
        if (caller is null)
            return ApiResults.Unauthorized();

        var member = await Membership.ResolveAsync(groups, caller, groupId, cancellationToken);
        if (member is null)
            return ApiResults.NotFound(ErrorCodes.GroupNotFound);

        if (!Membership.HasAtLeast(member, GroupRole.Admin))
            return ApiResults.Forbidden(ErrorCodes.InsufficientRole);

        var now = timeProvider.GetUtcNow();
        var records = await codes.ListByGroupAsync(groupId, cancellationToken);

        return Results.Json(records.Select(code => ToDto(code, now)).ToList());
    }

    private static async Task<IResult> RevokeEnrollmentCodeAsync(
        HttpContext context,
        string groupId,
        string code,
        IGroupStore groups,
        IEnrollmentCodeStore codes,
        IAuditStore audit,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var caller = Caller.From(context.User);
        if (caller is null)
            return ApiResults.Unauthorized();

        var member = await Membership.ResolveAsync(groups, caller, groupId, cancellationToken);
        if (member is null)
            return ApiResults.NotFound(ErrorCodes.GroupNotFound);

        if (!Membership.HasAtLeast(member, GroupRole.Admin))
        {
            await AuditDenials.WriteDeniedAsync(
                audit, timeProvider, caller, AuditActions.EnrollmentCodeRevoked, groupId, code,
                ErrorCodes.InsufficientRole, cancellationToken);
            return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
        }

        var normalized = NormalizeCode(code);
        if (normalized.Length != CodeLength)
            return ApiResults.NotFound(ErrorCodes.NotFound);

        var stored = await codes.GetAsync(normalized, cancellationToken);
        if (stored is null || !string.Equals(stored.GroupId, groupId, StringComparison.Ordinal))
            return ApiResults.NotFound(ErrorCodes.NotFound);

        var now = timeProvider.GetUtcNow();
        switch (stored.Status(now))
        {
            case EnrollmentCodeStatus.Revoked:
                return ApiResults.Gone(ErrorCodes.EnrollmentCodeRevoked);
            case EnrollmentCodeStatus.Used:
                return ApiResults.Gone(ErrorCodes.EnrollmentCodeUsed);
        }

        if (!await codes.TryRevokeAsync(normalized, now, cancellationToken))
            return ApiResults.Conflict(ErrorCodes.ConcurrentModification);

        await AuditAsync(audit, null, new AuditEvent
        {
            EventId = AuditDenials.NewEventId(),
            At = now,
            ActorUserId = caller.UserId,
            ActorDeviceId = caller.AuditDeviceId,
            Action = AuditActions.EnrollmentCodeRevoked,
            Outcome = AuditOutcomes.Success,
            GroupId = groupId,
            TargetId = normalized,
            Detail = stored.NodeId
        }, cancellationToken);

        return Results.NoContent();
    }

    private static async Task<IResult> IssueNodeTokenAsync(
        HttpContext context,
        string groupId,
        string nodeId,
        IGroupStore groups,
        INodeTokenStore tokens,
        NodeTokenService tokenService,
        IAuditStore audit,
        IOptions<ControlOptions> options,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var caller = Caller.From(context.User);
        if (caller is null)
            return ApiResults.Unauthorized();

        var member = await Membership.ResolveAsync(groups, caller, groupId, cancellationToken);
        if (member is null)
            return ApiResults.NotFound(ErrorCodes.GroupNotFound);

        if (!Membership.HasAtLeast(member, GroupRole.Admin))
        {
            await AuditDenials.WriteDeniedAsync(
                audit, timeProvider, caller, AuditActions.NodeTokenIssued, groupId, nodeId,
                ErrorCodes.InsufficientRole, cancellationToken);
            return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
        }

        var trimmed = nodeId.Trim();
        var node = await groups.GetNodeAsync(groupId, trimmed, cancellationToken);
        if (node is null)
            return ApiResults.NotFound(ErrorCodes.NodeNotFound);

        var now = timeProvider.GetUtcNow();
        await tokens.RevokeActiveByNodeAsync(groupId, trimmed, now, caller.UserId, cancellationToken);
        await groups.SetNodeEnrolledByAsync(groupId, trimmed, node.EnrolledByUserId ?? caller.UserId, cancellationToken);

        var issued = await tokenService.IssueAsync(
            groupId, trimmed, node.EnrolledByUserId ?? caller.UserId, now, options.Value.NodeTokenLifetime,
            cancellationToken);

        await AuditAsync(audit, null, new AuditEvent
        {
            EventId = AuditDenials.NewEventId(),
            At = now,
            ActorUserId = caller.UserId,
            ActorDeviceId = caller.AuditDeviceId,
            Action = AuditActions.NodeTokenIssued,
            Outcome = AuditOutcomes.Success,
            GroupId = groupId,
            TargetId = trimmed,
            Detail = issued.Token.TokenId
        }, cancellationToken);

        return Results.Json(
            new NodeTokenDto(trimmed, groupId, issued.PlainTextToken, issued.Token.ExpiresAt),
            statusCode: StatusCodes.Status201Created);
    }

    private static async Task<IResult> RevokeNodeTokenAsync(
        HttpContext context,
        string groupId,
        string nodeId,
        IGroupStore groups,
        INodeTokenStore tokens,
        INodeConnectionRegistry registry,
        IAuditStore audit,
        TimeProvider timeProvider,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        var caller = Caller.From(context.User);
        if (caller is null)
            return ApiResults.Unauthorized();

        var member = await Membership.ResolveAsync(groups, caller, groupId, cancellationToken);
        if (member is null)
            return ApiResults.NotFound(ErrorCodes.GroupNotFound);

        if (!Membership.HasAtLeast(member, GroupRole.Admin))
        {
            await AuditDenials.WriteDeniedAsync(
                audit, timeProvider, caller, AuditActions.NodeTokenRevoked, groupId, nodeId,
                ErrorCodes.InsufficientRole, cancellationToken);
            return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
        }

        var trimmed = nodeId.Trim();
        var now = timeProvider.GetUtcNow();
        var revoked = await tokens.RevokeActiveByNodeAsync(groupId, trimmed, now, caller.UserId, cancellationToken);

        var connection = registry.Get(groupId, trimmed);
        if (connection is not null)
        {
            await registry.RemoveAsync(connection, "token_revoked", cancellationToken);
            loggerFactory.CreateLogger("SecRandom.Control.Api.EnrollmentEndpoints")
                .LogInformation("节点令牌被撤销，已断开 {GroupId}/{NodeId} 的节点连接。", groupId, trimmed);
        }

        await AuditAsync(audit, null, new AuditEvent
        {
            EventId = AuditDenials.NewEventId(),
            At = now,
            ActorUserId = caller.UserId,
            ActorDeviceId = caller.AuditDeviceId,
            Action = AuditActions.NodeTokenRevoked,
            Outcome = AuditOutcomes.Success,
            GroupId = groupId,
            TargetId = trimmed,
            Detail = revoked.ToString()
        }, cancellationToken);

        return Results.NoContent();
    }

    private static bool IsLocalMode(InstanceSetupState state) =>
        string.Equals(state.Store.Current?.Mode, "local", StringComparison.OrdinalIgnoreCase);

    private static bool TryNormalizeCapabilities(IReadOnlyList<string>? raw, out IReadOnlyList<string> capabilities)
    {
        capabilities = [];

        if (raw is null)
            return true;

        if (raw.Count > MaxCapabilities)
            return false;

        var normalized = new List<string>(raw.Count);
        foreach (var capability in raw)
        {
            var value = capability?.Trim();
            if (string.IsNullOrEmpty(value) || value.Length > MaxCapabilityLength)
                return false;

            normalized.Add(value);
        }

        capabilities = normalized;
        return true;
    }

    private static string NewNodeId() => Guid.NewGuid().ToString("n");

    private static async Task<string> GenerateUniqueCodeAsync(
        IEnrollmentCodeStore codes, CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var candidate = GenerateCode();
            if (await codes.GetAsync(candidate, cancellationToken) is null)
                return candidate;
        }

        return GenerateCode();
    }

    private static string GenerateCode()
    {
        Span<char> buffer = stackalloc char[CodeLength];
        for (var index = 0; index < CodeLength; index++)
            buffer[index] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];

        return new string(buffer);
    }

    private static string NormalizeCode(string? raw) =>
        string.IsNullOrWhiteSpace(raw)
            ? string.Empty
            : new string(raw.Where(char.IsLetterOrDigit).Select(char.ToUpperInvariant).ToArray());

    private static string FormatForDisplay(string code) =>
        code.Length == CodeLength ? code[..4] + "-" + code[4..] : code;

    private static EnrollmentCodeDto ToDto(EnrollmentCode code, DateTimeOffset now) =>
        new(
            FormatForDisplay(code.Code),
            code.GroupId,
            code.NodeId,
            code.CreatedByUserId,
            code.CreatedAt,
            code.ExpiresAt,
            DescribeStatus(code.Status(now)),
            code.UsedByNodeId,
            code.UsedAt,
            code.RevokedAt);

    private static string DescribeStatus(EnrollmentCodeStatus status) => status switch
    {
        EnrollmentCodeStatus.Pending => "pending",
        EnrollmentCodeStatus.Used => "used",
        EnrollmentCodeStatus.Expired => "expired",
        _ => "revoked"
    };

    private static async Task AuditAsync(
        IAuditStore audit, ILogger? logger, AuditEvent auditEvent, CancellationToken cancellationToken)
    {
        try
        {
            await audit.WriteAsync(auditEvent, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger?.LogWarning(exception, "写入审计事件 {Action} 失败。", auditEvent.Action);
        }
    }
}

public sealed record EnrollRequest(
    string? Code,
    string? NodeId,
    string? Platform,
    string? Version,
    IReadOnlyList<string>? Capabilities,
    string? DisplayName);

public sealed record EnrollResultDto(
    string NodeId,
    string GroupId,
    string? GroupName,
    string NodeToken,
    DateTimeOffset ExpiresAt);

public sealed record CreateEnrollmentCodeRequest(string? NodeId);

public sealed record EnrollmentCodeDto(
    string DisplayCode,
    string GroupId,
    string? NodeId,
    string? CreatedByUserId,
    DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt,
    string Status,
    string? UsedByNodeId,
    DateTimeOffset? UsedAt,
    DateTimeOffset? RevokedAt);

public sealed record NodeTokenDto(
    string NodeId,
    string GroupId,
    string NodeToken,
    DateTimeOffset ExpiresAt);
