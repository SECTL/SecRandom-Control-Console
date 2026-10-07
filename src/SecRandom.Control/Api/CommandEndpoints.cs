using System.Security.Claims;
using System.Text.Json;
using Microsoft.Extensions.Options;
using SecRandom.Control.Authorization;
using SecRandom.Control.Configuration;
using SecRandom.Control.Domain;
using SecRandom.Control.Storage;
using SecRandom.Control.Transport;

namespace SecRandom.Control.Api;















public static class CommandEndpoints
{
    


    private const long DesiredStateBaseRevision = 1;

    public static void MapCommandEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/v1").RequireAuthorization();

        group.MapPost("/groups/{groupId}/nodes/{nodeId}/commands", async (
            string groupId,
            string nodeId,
            ClaimsPrincipal principal,
            SubmitCommandRequest request,
            IAuthorizationGate gate,
            IGroupStore store,
            INodeConnectionRegistry registry,
            IAuditStore audit,
            IOptions<ControlOptions> options,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var capability = request.Capability?.Trim();
            if (string.IsNullOrWhiteSpace(capability))
                return ApiResults.BadRequest(ErrorCodes.InvalidRequest);

            
            
            var decision = await gate.AuthorizeCommandAsync(
                groupId, caller.UserId, nodeId, capability, cancellationToken).ConfigureAwait(false);

            if (!decision.Allowed)
            {
                await audit.WriteAsync(new AuditEvent
                {
                    EventId = NewEventId(),
                    At = timeProvider.GetUtcNow(),
                    ActorUserId = caller.UserId,
                    ActorDeviceId = caller.AuditDeviceId,
                    Action = AuditActions.NodePolicyChanged,
                    Outcome = AuditOutcomes.Denied,
                    GroupId = groupId,
                    TargetId = nodeId,
                    Detail = $"{capability}:{decision.Reason}"
                }, cancellationToken).ConfigureAwait(false);

                return decision.Reason switch
                {
                    CommandDenialReason.NotAGroupMember => ApiResults.NotFound(ErrorCodes.GroupNotFound),
                    CommandDenialReason.NodeNotInGroup => ApiResults.NotFound(ErrorCodes.NodeNotFound),
                    CommandDenialReason.UnknownCapability => ApiResults.BadRequest(ErrorCodes.InvalidRequest),
                    _ => ApiResults.Forbidden(ErrorCodes.InsufficientRole)
                };
            }

            var now = timeProvider.GetUtcNow();

            
            
            
            var isQuery = string.Equals(request.Kind, CommandKinds.Query, StringComparison.Ordinal);
            if (string.Equals(request.Kind, CommandKinds.Action, StringComparison.Ordinal) || isQuery)
            {
                var maxLifetimeSeconds = isQuery ? 60 : 3600;
                var lifetime = request.ExpiresInSeconds is > 0 and <= 3600
                    ? TimeSpan.FromSeconds(Math.Min(request.ExpiresInSeconds.Value, maxLifetimeSeconds))
                    : isQuery
                        ? TimeSpan.FromSeconds(30)
                        : options.Value.ActionCommandLifetime;

                var command = new NodeCommand
                {
                    CommandId = "cmd_" + Guid.NewGuid().ToString("n")[..20],
                    GroupId = groupId,
                    TargetNodeId = nodeId,
                    IssuerMemberId = caller.UserId,
                    IssuerDeviceId = caller.AuditDeviceId,
                    Capability = capability,
                    Kind = isQuery ? CommandKinds.Query : CommandKinds.Action,
                    Payload = request.Payload,
                    IssuedAt = now,
                    ExpiresAt = now.Add(lifetime)
                };

                
                
                
                
                
                
                
                var frameBytes = NodeFrameBudget.MeasureCommandFrameBytes(command);
                if (frameBytes > NodeFrameBudget.MaxFrameBytes)
                {
                    await audit.WriteAsync(new AuditEvent
                    {
                        EventId = NewEventId(),
                        At = now,
                        ActorUserId = caller.UserId,
                        ActorDeviceId = caller.AuditDeviceId,
                        Action = AuditActions.NodePolicyChanged,
                        Outcome = AuditOutcomes.Failed,
                        GroupId = groupId,
                        TargetId = nodeId,
                        
                        Detail = $"{capability}:{ErrorCodes.PayloadTooLarge}:{frameBytes}>{NodeFrameBudget.MaxFrameBytes}"
                    }, cancellationToken).ConfigureAwait(false);

                    return ApiResults.BadRequest(ErrorCodes.PayloadTooLarge);
                }

                await store.SaveCommandAsync(command, cancellationToken).ConfigureAwait(false);

                await audit.WriteAsync(new AuditEvent
                {
                    EventId = NewEventId(),
                    At = now,
                    ActorUserId = caller.UserId,
                    ActorDeviceId = caller.AuditDeviceId,
                    Action = AuditActions.NodePolicyChanged,
                    Outcome = AuditOutcomes.Success,
                    GroupId = groupId,
                    TargetId = nodeId,
                    Detail = $"{capability}:{(isQuery ? CommandKinds.Query : CommandKinds.Action)}"
                }, cancellationToken).ConfigureAwait(false);

                
                
                var connection = registry.Get(groupId, nodeId);
                if (connection is not null)
                {
                    await connection.SendAsync(new ServerFrame
                    {
                        Type = ServerFrame.TypeCommand,
                        CommandId = command.CommandId,
                        Capability = command.Capability,
                        Kind = command.Kind,
                        Payload = command.Payload,
                        ExpiresAt = command.ExpiresAt
                    }, cancellationToken).ConfigureAwait(false);

                    await store.SaveCommandAsync(command with
                    {
                        Status = CommandStatus.Delivered,
                        DeliveredAt = now
                    }, cancellationToken).ConfigureAwait(false);
                }

                return Results.Json(
                    ToDto(command with { Status = connection is null ? CommandStatus.Queued : CommandStatus.Delivered }),
                    statusCode: StatusCodes.Status202Accepted);
            }

            
            if (string.Equals(request.Kind, CommandKinds.SetDesiredState, StringComparison.Ordinal))
            {
                
                
                return await SetDesiredStateAsync(
                    groupId, nodeId, caller, request, store, registry, audit, timeProvider, cancellationToken)
                    .ConfigureAwait(false);
            }

            return ApiResults.BadRequest(ErrorCodes.InvalidRequest);
        });

        
        group.MapGet("/groups/{groupId}/commands/{commandId}", async (
            string groupId,
            string commandId,
            ClaimsPrincipal principal,
            IGroupStore store,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var member = await Membership.ResolveAsync(store, caller, groupId, cancellationToken)
                .ConfigureAwait(false);
            if (member is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            var command = await store.GetCommandAsync(commandId, cancellationToken).ConfigureAwait(false);
            if (command is null || !string.Equals(command.GroupId, groupId, StringComparison.Ordinal))
                return ApiResults.NotFound(ErrorCodes.NotFound);

            return Results.Json(ToDto(command));
        });

        
        
        
        
        
        
        
        
        group.MapDelete("/groups/{groupId}/commands/{commandId}", async (
            string groupId,
            string commandId,
            ClaimsPrincipal principal,
            IGroupStore store,
            IAuthorizationGate gate,
            INodeConnectionRegistry registry,
            IAuditStore audit,
            TimeProvider timeProvider,
            ILoggerFactory loggerFactory,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            
            
            
            var member = await Membership.ResolveAsync(store, caller, groupId, cancellationToken)
                .ConfigureAwait(false);
            if (member is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            var command = await store.GetCommandAsync(commandId, cancellationToken).ConfigureAwait(false);

            
            
            if (command is null || !string.Equals(command.GroupId, groupId, StringComparison.Ordinal))
                return ApiResults.NotFound(ErrorCodes.NotFound);

            
            
            var decision = await gate.AuthorizeCommandRevokeAsync(
                groupId, caller.UserId, command.Capability, cancellationToken).ConfigureAwait(false);

            if (!decision.Allowed)
            {
                return decision.Reason switch
                {
                    
                    CommandDenialReason.NotAGroupMember => ApiResults.NotFound(ErrorCodes.GroupNotFound),
                    
                    
                    _ => ApiResults.Forbidden(ErrorCodes.InsufficientRole)
                };
            }

            
            
            if (command.Status != CommandStatus.Queued)
                return ApiResults.Conflict(ErrorCodes.NotRevocable);

            var now = timeProvider.GetUtcNow();

            
            
            if (command.IsExpired(now))
                return ApiResults.Conflict(ErrorCodes.CommandExpired);

            
            
            var revoked = await store.TryRevokeCommandAsync(groupId, commandId, now, cancellationToken)
                .ConfigureAwait(false);
            if (!revoked)
                return ApiResults.Conflict(ErrorCodes.NotRevocable);

            await audit.WriteAsync(new AuditEvent
            {
                EventId = NewEventId(),
                At = now,
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.NodeCommandRevoked,
                Outcome = AuditOutcomes.Success,
                GroupId = groupId,
                TargetId = command.TargetNodeId,
                
                Detail = $"{command.Capability}:revoke:{commandId}"
            }, cancellationToken).ConfigureAwait(false);

            
            
            
            
            
            var connection = registry.Get(groupId, command.TargetNodeId);
            if (connection is not null)
            {
                try
                {
                    await connection.SendAsync(new ServerFrame
                    {
                        Type = ServerFrame.TypeCommandRevoke,
                        CommandId = command.CommandId
                    }, cancellationToken).ConfigureAwait(false);
                }
                catch (Exception exception)
                {
                    loggerFactory.CreateLogger("CommandRevoke").LogWarning(
                        exception, "向节点 {NodeId} 推送撤销帧失败：{CommandId}",
                        command.TargetNodeId, commandId);
                }
            }

            return Results.Json(ToDto(command with
            {
                Status = CommandStatus.Revoked,
                ResolvedAt = now,
                ResultDetail = NodeCommand.RevokedResultDetail
            }));
        });
    }

    







    private static async Task<IResult> SetDesiredStateAsync(
        string groupId,
        string nodeId,
        Caller caller,
        SubmitCommandRequest request,
        IGroupStore store,
        INodeConnectionRegistry registry,
        IAuditStore audit,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var node = await store.GetNodeAsync(groupId, nodeId, cancellationToken).ConfigureAwait(false);
        if (node is null)
            return ApiResults.NotFound(ErrorCodes.NodeNotFound);

        var now = timeProvider.GetUtcNow();

        
        
        var drawLocked = request.Payload is { } payload &&
                         payload.ValueKind == JsonValueKind.Object &&
                         payload.TryGetProperty("draw_locked", out var flag) &&
                         flag.ValueKind is JsonValueKind.True or JsonValueKind.False
            ? flag.GetBoolean()
            : (bool?)null;

        if (drawLocked is null)
            return ApiResults.BadRequest(ErrorCodes.InvalidRequest);

        
        
        
        var existing = await store.GetDesiredStateAsync(groupId, nodeId, cancellationToken)
            .ConfigureAwait(false);

        var revision = Math.Max(existing?.Revision + 1 ?? DesiredStateBaseRevision,
            now.ToUnixTimeMilliseconds());

        var desiredState = new DesiredState
        {
            GroupId = groupId,
            NodeId = nodeId,
            Revision = revision,
            DrawLocked = drawLocked.Value,
            UpdatedAt = now
        };

        
        await store.SaveDesiredStateAsync(desiredState, cancellationToken).ConfigureAwait(false);

        var connection = registry.Get(groupId, nodeId);

        if (connection is not null)
        {
            await connection.SendAsync(new ServerFrame
            {
                Type = ServerFrame.TypeDesiredState,
                DesiredStateRevision = desiredState.Revision,
                Payload = JsonSerializer.SerializeToElement(
                    new { draw_locked = desiredState.DrawLocked },
                    JsonSerialization.ProtocolJsonOptions)
            }, cancellationToken).ConfigureAwait(false);
        }

        await audit.WriteAsync(new AuditEvent
        {
            EventId = NewEventId(),
            At = now,
            ActorUserId = caller.UserId,
            ActorDeviceId = caller.AuditDeviceId,
            Action = AuditActions.NodePolicyChanged,
            Outcome = AuditOutcomes.Success,
            GroupId = groupId,
            TargetId = nodeId,
            Detail = $"draw_locked={desiredState.DrawLocked}"
        }, cancellationToken).ConfigureAwait(false);

        return Results.Json(new
        {
            node_id = nodeId,
            revision = desiredState.Revision,
            draw_locked = desiredState.DrawLocked,
            delivered = connection is not null
        });
    }

    private static string NewEventId() => "evt_" + Guid.NewGuid().ToString("n")[..16];

    private static NodeCommandDto ToDto(NodeCommand command) => new(
        command.CommandId,
        command.TargetNodeId,
        command.Capability,
        command.Kind,
        command.Status.ToString().ToLowerInvariant(),
        command.IssuedAt,
        command.ExpiresAt,
        command.DeliveredAt,
        command.ResolvedAt,
        command.ResultDetail,
        command.ResultContext,
        command.ResultPayload);
}

public sealed record SubmitCommandRequest(
    string? Capability,
    string? Kind,
    JsonElement? Payload,
    int? ExpiresInSeconds);

public sealed record NodeCommandDto(
    string CommandId,
    string TargetNodeId,
    string Capability,
    string Kind,
    string Status,
    DateTimeOffset IssuedAt,
    DateTimeOffset ExpiresAt,
    DateTimeOffset? DeliveredAt,
    DateTimeOffset? ResolvedAt,
    string? ResultDetail,
    JsonElement? ResultContext,
    JsonElement? ResultPayload);
