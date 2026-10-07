using System.Net.WebSockets;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using SecRandom.Control.Authentication;
using SecRandom.Control.Configuration;
using SecRandom.Control.Domain;
using SecRandom.Control.Storage;
using SecRandom.Control.Transport;

namespace SecRandom.Control.Api;


















public static class NodeChannelEndpoints
{
    
    private static readonly TimeSpan HelloTimeout = TimeSpan.FromSeconds(15);

    






    private static readonly TimeSpan OfflinePublishGrace = TimeSpan.FromSeconds(3);

    




    private const int MaxFrameBytes = NodeFrameBudget.MaxFrameBytes;

    public static void MapNodeChannelEndpoints(this WebApplication app)
    {
        
        
        
        
        
        
        app.Map("/v1/node/connect", async (
            HttpContext context,
            INodeConnectionRegistry registry,
            INodePresenceNotifier presence,
            IGroupStore store,
            IAuditStore audit,
            IOptions<ControlOptions> options,
            TimeProvider timeProvider,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("NodeChannel");

            if (!context.WebSockets.IsWebSocketRequest)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new ErrorEnvelope(ErrorCodes.InvalidRequest))
                    .ConfigureAwait(false);
                return;
            }

            
            
            var authenticated = await AuthenticateNodeAsync(context, logger).ConfigureAwait(false);
            using var socket = await context.WebSockets.AcceptWebSocketAsync().ConfigureAwait(false);

            if (authenticated is null)
            {
                await RejectAsync(socket, ErrorCodes.Unauthorized).ConfigureAwait(false);
                return;
            }

            var caller = authenticated.Caller;
            var settings = options.Value;

            
            var hello = await ReadFrameAsync(socket, HelloTimeout, context.RequestAborted)
                .ConfigureAwait(false);

            if (hello is null || !string.Equals(hello.Type, NodeFrame.TypeHello, StringComparison.Ordinal))
            {
                await RejectAsync(socket, ErrorCodes.InvalidRequest).ConfigureAwait(false);
                return;
            }

            var nodeId = hello.NodeId?.Trim();
            var groupId = hello.GroupId?.Trim();

            if (string.IsNullOrWhiteSpace(nodeId) || string.IsNullOrWhiteSpace(groupId))
            {
                await RejectAsync(socket, ErrorCodes.InvalidRequest).ConfigureAwait(false);
                return;
            }

            if (authenticated.TokenGroupId is { Length: > 0 } tokenGroupId
                && (!string.Equals(tokenGroupId, groupId, StringComparison.Ordinal)
                    || !string.Equals(authenticated.TokenNodeId, nodeId, StringComparison.Ordinal)))
            {
                await RejectAsync(socket, ErrorCodes.NodeMismatch).ConfigureAwait(false);
                return;
            }

            
            var member = await store.GetMemberAsync(groupId, caller.UserId, context.RequestAborted)
                .ConfigureAwait(false);
            if (member is null)
            {
                await RejectAsync(socket, ErrorCodes.GroupNotFound).ConfigureAwait(false);
                return;
            }

            var existing = await store.GetNodeAsync(groupId, nodeId, context.RequestAborted)
                .ConfigureAwait(false);

            
            
            
            
            
            
            
            
            var now = timeProvider.GetUtcNow();

            if (existing is null && !settings.NodeAutoRegister)
            {
                await RejectAsync(socket, ErrorCodes.NodeNotFound).ConfigureAwait(false);
                return;
            }

            if (existing is null)
            {
                existing = new Node
                {
                    NodeId = nodeId,
                    GroupId = groupId,
                    Platform = string.IsNullOrWhiteSpace(hello.Platform) ? "unknown" : hello.Platform.Trim(),
                    Version = string.IsNullOrWhiteSpace(hello.Version) ? "unknown" : hello.Version.Trim(),
                    Capabilities = hello.Capabilities ?? [],
                    LocalRemoteAllowed = hello.LocalRemoteAllowed ?? false,
                    
                    DisplayName = NodeFrame.SanitizeDisplayName(hello.DisplayName),
                    LastHeartbeatAt = now,
                    RegisteredAt = now
                };

                await store.SaveNodeAsync(existing, context.RequestAborted).ConfigureAwait(false);

                
                
                await audit.WriteAsync(new AuditEvent
                {
                    EventId = "evt_" + Guid.NewGuid().ToString("n")[..16],
                    At = now,
                    ActorUserId = caller.UserId,
                    ActorDeviceId = caller.AuditDeviceId,
                    Action = AuditActions.NodeRegistered,
                    Outcome = AuditOutcomes.Success,
                    GroupId = groupId,
                    TargetId = nodeId,
                    Detail = "auto"
                }, context.RequestAborted).ConfigureAwait(false);

                logger.LogInformation(
                    "节点已自动登记：{NodeId}（组 {GroupId}，账号 {UserId}）", nodeId, groupId, caller.UserId);
            }

            
            var node = existing with
            {
                Platform = string.IsNullOrWhiteSpace(hello.Platform) ? existing.Platform : hello.Platform.Trim(),
                Version = string.IsNullOrWhiteSpace(hello.Version) ? existing.Version : hello.Version.Trim(),
                
                Capabilities = hello.Capabilities ?? existing.Capabilities,
                LocalRemoteAllowed = hello.LocalRemoteAllowed ?? existing.LocalRemoteAllowed,
                
                DisplayName = hello.DisplayName is null
                    ? existing.DisplayName
                    : NodeFrame.SanitizeDisplayName(hello.DisplayName),
                LastHeartbeatAt = now
            };

            await store.SaveNodeAsync(node, context.RequestAborted).ConfigureAwait(false);

            var connection = new NodeConnection(socket, nodeId, groupId);
            var replaced = await registry.AddAsync(connection, context.RequestAborted).ConfigureAwait(false);

            logger.LogInformation(
                "节点已连接：{NodeId}（组 {GroupId}，平台 {Platform}，版本 {Version}，替换旧连接={Replaced}）",
                nodeId, groupId, node.Platform, node.Version, replaced);

            
            
            
            
            presence.Publish(new NodePresenceChange(groupId, nodeId, Online: true, now));

            
            
            
            
            
            var desiredState = await store
                .GetDesiredStateAsync(groupId, nodeId, context.RequestAborted)
                .ConfigureAwait(false);

            await connection.SendAsync(new ServerFrame
            {
                Type = ServerFrame.TypeHelloAck,
                HeartbeatSeconds = settings.HeartbeatSeconds,
                OfflineAfterSeconds = (int)settings.NodeOfflineAfter.TotalSeconds,
                DesiredStateRevision = desiredState?.Revision ?? 0
            }, context.RequestAborted).ConfigureAwait(false);

            
            
            
            
            if (desiredState is not null)
            {
                await connection.SendAsync(new ServerFrame
                {
                    Type = ServerFrame.TypeDesiredState,
                    DesiredStateRevision = desiredState.Revision,
                    Payload = JsonSerializer.SerializeToElement(
                        new { draw_locked = desiredState.DrawLocked },
                        JsonSerialization.ProtocolJsonOptions)
                }, context.RequestAborted).ConfigureAwait(false);
            }

            
            await DeliverPendingAsync(connection, store, timeProvider, logger, context.RequestAborted)
                .ConfigureAwait(false);

            
            try
            {
                while (socket.State == WebSocketState.Open && !context.RequestAborted.IsCancellationRequested)
                {
                    var frame = await ReadFrameAsync(
                        socket, TimeSpan.FromSeconds(settings.HeartbeatSeconds * 3), context.RequestAborted)
                        .ConfigureAwait(false);

                    
                    if (frame is null)
                        break;

                    
                    if (!await HandleFrameAsync(frame, node, connection, caller, store, registry, audit, presence,
                            timeProvider, logger, context.RequestAborted).ConfigureAwait(false))
                        break;
                }
            }
            catch (OperationCanceledException)
            {
                
            }
            catch (WebSocketException exception)
            {
                logger.LogDebug(exception, "节点连接异常断开：{NodeId}", nodeId);
            }
            finally
            {
                
                
                
                
                
                try
                {
                    
                    
                    
                    
                    await registry.RemoveAsync(connection, cancellationToken: CancellationToken.None)
                        .ConfigureAwait(false);
                }
                catch (Exception exception)
                {
                    logger.LogDebug(exception, "断开节点连接登记失败：{NodeId}", nodeId);
                }

                logger.LogInformation("节点已断开：{NodeId}", nodeId);

                
                
                
                _ = NotifyOfflineAsync(registry, presence, timeProvider, logger, groupId, nodeId);
            }
        });
    }

    

    















    private static async Task NotifyOfflineAsync(
        INodeConnectionRegistry registry,
        INodePresenceNotifier presence,
        TimeProvider timeProvider,
        ILogger logger,
        string groupId,
        string nodeId)
    {
        try
        {
            await Task.Delay(OfflinePublishGrace, CancellationToken.None).ConfigureAwait(false);

            
            if (registry.Get(groupId, nodeId) is not null)
                return;

            presence.Publish(new NodePresenceChange(
                groupId, nodeId, Online: false, timeProvider.GetUtcNow()));
        }
        catch (Exception exception)
        {
            logger.LogDebug(exception, "延迟播报节点离线失败：{NodeId}", nodeId);
        }
    }

    













    private static async Task<AuthenticatedNode?> AuthenticateNodeAsync(HttpContext context, ILogger logger)
    {
        var device = await TryAuthenticateAsync(context, AuthConstants.NodeDeviceTokenSchemeName).ConfigureAwait(false);
        if (device is not null)
            return device;

        var bearer = await TryAuthenticateAsync(context, AuthConstants.NodeBearerSchemeName).ConfigureAwait(false);
        if (bearer is not null)
            return bearer;

        logger.LogWarning(
            "节点通道缺少有效凭据，已拒绝该连接（已尝试 {DeviceScheme} 与 {BearerScheme}）。",
            AuthConstants.NodeDeviceTokenSchemeName,
            AuthConstants.NodeBearerSchemeName);

        return null;
    }

    private static async Task<AuthenticatedNode?> TryAuthenticateAsync(HttpContext context, string scheme)
    {
        try
        {
            var result = await context.AuthenticateAsync(scheme).ConfigureAwait(false);
            if (!result.Succeeded || result.Principal is null)
                return null;

            var caller = Caller.From(result.Principal);
            if (caller is null)
                return null;

            if (!string.Equals(scheme, AuthConstants.NodeDeviceTokenSchemeName, StringComparison.Ordinal))
                return new AuthenticatedNode(caller, null, null);

            return new AuthenticatedNode(
                caller,
                result.Principal.FindFirst(AuthConstants.GroupIdClaim)?.Value,
                result.Principal.FindFirst(AuthConstants.NodeIdClaim)?.Value);
        }
        catch (InvalidOperationException)
        {
            return null;
        }
    }

    








    private static async Task<bool> HandleFrameAsync(
        NodeFrame frame,
        Node node,
        NodeConnection connection,
        Caller caller,
        IGroupStore store,
        INodeConnectionRegistry registry,
        IAuditStore audit,
        INodePresenceNotifier presence,
        TimeProvider timeProvider,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        switch (frame.Type)
        {
            case NodeFrame.TypeHeartbeat:
            {
                var now = timeProvider.GetUtcNow();

                
                
                
                
                var current = await store.GetNodeAsync(node.GroupId, node.NodeId, cancellationToken)
                    .ConfigureAwait(false);

                
                
                
                
                
                
                if (current is null)
                {
                    logger.LogInformation(
                        "节点登记已不存在，断开连接：{NodeId}（组 {GroupId}）", node.NodeId, node.GroupId);

                    
                    await registry.RemoveAsync(connection, "registration_missing", CancellationToken.None)
                        .ConfigureAwait(false);

                    return false;
                }

                
                
                await store.SaveNodeAsync(current with
                {
                    Capabilities = frame.Capabilities ?? current.Capabilities,
                    LocalRemoteAllowed = frame.LocalRemoteAllowed ?? current.LocalRemoteAllowed,
                    
                    DisplayName = frame.DisplayName is null
                        ? current.DisplayName
                        : NodeFrame.SanitizeDisplayName(frame.DisplayName),
                    LastHeartbeatAt = now
                }, cancellationToken).ConfigureAwait(false);
                break;
            }

            case NodeFrame.TypeAck:
            case NodeFrame.TypeResult:
            {
                if (string.IsNullOrWhiteSpace(frame.CommandId))
                    break;

                var command = await store.GetCommandAsync(frame.CommandId, cancellationToken)
                    .ConfigureAwait(false);
                if (command is null)
                    break;

                
                
                
                if (!string.Equals(command.TargetNodeId, node.NodeId, StringComparison.Ordinal) ||
                    !string.Equals(command.GroupId, node.GroupId, StringComparison.Ordinal))
                {
                    logger.LogWarning(
                        "节点 {NodeId}（组 {GroupId}）试图回执不属于它的命令 {CommandId}",
                        node.NodeId, node.GroupId, frame.CommandId);
                    break;
                }

                var now = timeProvider.GetUtcNow();

                
                
                var updated = frame.Type == NodeFrame.TypeAck
                    ? command with
                    {
                        Status = frame.Accepted == true ? CommandStatus.Accepted : CommandStatus.Rejected,
                        ResultDetail = frame.Reason,
                        ResultContext = frame.Detail,
                        ResolvedAt = frame.Accepted == true ? null : now
                    }
                    : command with
                    {
                        Status = frame.Ok == true ? CommandStatus.Completed : CommandStatus.Rejected,
                        ResultDetail = frame.Reason,
                        ResultContext = frame.Detail,
                        ResultPayload = frame.Payload,
                        ResolvedAt = now
                    };

                await store.SaveCommandAsync(updated, cancellationToken).ConfigureAwait(false);
                break;
            }

            case NodeFrame.TypeDeregister:
            {
                var targetGroupId = frame.GroupId?.Trim();

                
                
                if (string.IsNullOrWhiteSpace(targetGroupId))
                {
                    await SendErrorAsync(connection, ErrorCodes.InvalidRequest, logger, cancellationToken)
                        .ConfigureAwait(false);
                    break;
                }

                var isOwnGroup = string.Equals(targetGroupId, node.GroupId, StringComparison.Ordinal);

                
                
                
                
                
                
                
                
                if (!isOwnGroup)
                {
                    var targetMember = await store.GetMemberAsync(targetGroupId, caller.UserId, cancellationToken)
                        .ConfigureAwait(false);

                    if (targetMember is null)
                    {
                        await SendErrorAsync(connection, ErrorCodes.GroupNotFound, logger, cancellationToken)
                            .ConfigureAwait(false);
                        break;
                    }
                }

                var existed = await store.GetNodeAsync(targetGroupId, node.NodeId, cancellationToken)
                    .ConfigureAwait(false);

                
                
                
                await store.DeleteNodeAsync(targetGroupId, node.NodeId, cancellationToken).ConfigureAwait(false);

                var deregisteredAt = timeProvider.GetUtcNow();

                
                
                await audit.WriteAsync(new AuditEvent
                {
                    EventId = "evt_" + Guid.NewGuid().ToString("n")[..16],
                    At = deregisteredAt,
                    ActorUserId = caller.UserId,
                    ActorDeviceId = caller.AuditDeviceId,
                    Action = AuditActions.NodeRegistered,
                    Outcome = AuditOutcomes.Success,
                    GroupId = targetGroupId,
                    TargetId = node.NodeId,
                    Detail = existed is null ? "self_deregister:absent" : "self_deregister"
                }, cancellationToken).ConfigureAwait(false);

                
                presence.Publish(new NodePresenceChange(targetGroupId, node.NodeId, Online: false, deregisteredAt));

                
                
                await connection.SendAsync(new ServerFrame
                {
                    Type = ServerFrame.TypeDeregisterAck,
                    Deregistered = existed is not null
                }, cancellationToken).ConfigureAwait(false);

                logger.LogInformation(
                    "节点已自我注销：{NodeId}（组 {GroupId}，账号 {UserId}，确实删到登记={Existed}）",
                    node.NodeId, targetGroupId, caller.UserId, existed is not null);

                
                
                
                if (isOwnGroup)
                {
                    await registry.RemoveAsync(connection, "deregistered", CancellationToken.None)
                        .ConfigureAwait(false);
                    return false;
                }

                break;
            }

            default:
                logger.LogDebug("忽略未知帧类型：{Type}", frame.Type);
                break;
        }

        return true;
    }

    







    private static async Task SendErrorAsync(
        NodeConnection connection, string code, ILogger logger, CancellationToken cancellationToken)
    {
        try
        {
            await connection.SendAsync(new ServerFrame { Type = "error", Code = code }, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception exception) when (exception is WebSocketException or ObjectDisposedException or IOException)
        {
            
            logger.LogDebug(exception, "发送节点错误帧失败：{Code}", code);
        }
    }

    
    private static async Task DeliverPendingAsync(
        NodeConnection connection,
        IGroupStore store,
        TimeProvider timeProvider,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();

        
        
        
        
        
        var pending = await store.GetDeliverableCommandsAsync(
            connection.GroupId, connection.NodeId, now, limit: 50, cancellationToken).ConfigureAwait(false);

        foreach (var command in pending)
        {
            
            
            
            
            var frameBytes = NodeFrameBudget.MeasureCommandFrameBytes(command);
            if (frameBytes > NodeFrameBudget.MaxFrameBytes)
            {
                logger.LogWarning(
                    "跳过超限的排队命令 {CommandId}（{Bytes} > {Limit} 字节），已标记为拒绝。",
                    command.CommandId, frameBytes, NodeFrameBudget.MaxFrameBytes);

                await store.SaveCommandAsync(command with
                {
                    Status = CommandStatus.Rejected,
                    ResultDetail = $"{ErrorCodes.PayloadTooLarge}:{frameBytes}:{NodeFrameBudget.MaxFrameBytes}",
                    ResolvedAt = now
                }, cancellationToken).ConfigureAwait(false);

                continue;
            }

            await connection.SendAsync(new ServerFrame
            {
                Type = ServerFrame.TypeCommand,
                CommandId = command.CommandId,
                Capability = command.Capability,
                Kind = command.Kind,
                Payload = command.Payload,
                ExpiresAt = command.ExpiresAt
            }, cancellationToken).ConfigureAwait(false);

            
            
            
            
            
            
            var advanced = await store.MarkCommandDeliveredAsync(command.CommandId, now, cancellationToken)
                .ConfigureAwait(false);

            if (!advanced)
            {
                
                
                
                var current = await store.GetCommandAsync(command.CommandId, cancellationToken)
                    .ConfigureAwait(false);

                if (current?.Status == CommandStatus.Revoked)
                {
                    logger.LogWarning(
                        "命令 {CommandId} 在投递落地前已被撤销，保持 revoked 不回退。", command.CommandId);
                }
                else
                {
                    logger.LogDebug(
                        "命令 {CommandId} 在投递落地前已不是排队状态（{Status}），保持原状态。",
                        command.CommandId, current?.Status);
                }
            }
        }

        if (pending.Count > 0)
            logger.LogInformation("已向节点 {NodeId} 补投 {Count} 条命令", connection.NodeId, pending.Count);
    }

    

    
























    private static async Task<NodeFrame?> ReadFrameAsync(
        WebSocket socket, TimeSpan timeout, CancellationToken cancellationToken)
    {
        using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutSource.CancelAfter(timeout);

        var buffer = new byte[4096];
        using var accumulated = new MemoryStream();

        try
        {
            while (true)
            {
                var result = await socket.ReceiveAsync(
                    new ArraySegment<byte>(buffer), timeoutSource.Token).ConfigureAwait(false);

                if (result.MessageType == WebSocketMessageType.Close)
                    return null;

                if (accumulated.Length + result.Count > MaxFrameBytes)
                    return null;

                accumulated.Write(buffer, 0, result.Count);

                if (result.EndOfMessage)
                    break;
            }
        }
        catch (OperationCanceledException)
        {
            return null;
        }
        catch (WebSocketException)
        {
            return null;
        }
        catch (IOException)
        {
            
            
            
            
            
            
            
            return null;
        }

        if (accumulated.Length == 0)
            return null;

        try
        {
            return JsonSerializer.Deserialize<NodeFrame>(
                accumulated.ToArray(), JsonSerialization.ProtocolJsonOptions);
        }
        catch (JsonException)
        {
            
            return null;
        }
    }

    
    private static async Task RejectAsync(WebSocket socket, string code)
    {
        try
        {
            if (socket.State == WebSocketState.Open)
            {
                var json = JsonSerializer.Serialize(
                    new ServerFrame { Type = "error", Code = code },
                    JsonSerialization.ProtocolJsonOptions);
                var bytes = Encoding.UTF8.GetBytes(json);
                await socket.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None)
                    .ConfigureAwait(false);

                await socket.CloseAsync(
                    WebSocketCloseStatus.PolicyViolation, code, CancellationToken.None).ConfigureAwait(false);
            }
        }
        catch (Exception exception) when (
            exception is WebSocketException or ObjectDisposedException or IOException)
        {
            
            
            
        }
    }
}

public sealed record AuthenticatedNode(Caller Caller, string? TokenGroupId, string? TokenNodeId);
