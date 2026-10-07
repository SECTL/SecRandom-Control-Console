using System.Security.Claims;
using System.Text.Json;
using System.Threading.Channels;
using Microsoft.Extensions.Options;
using SecRandom.Control.Configuration;
using SecRandom.Control.Domain;
using SecRandom.Control.Storage;
using SecRandom.Control.Transport;

namespace SecRandom.Control.Api;















public static class NodeEndpoints
{
    







    private static readonly TimeSpan PresenceKeepAlive = TimeSpan.FromSeconds(15);

    public static void MapNodeEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/v1").RequireAuthorization();

        

        group.MapGet("/groups/{groupId}/nodes", async (
            string groupId,
            ClaimsPrincipal principal,
            IGroupStore store,
            INodeTokenStore tokens,
            IOptions<ControlOptions> options,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var member = await Membership.ResolveAsync(store, caller, groupId, cancellationToken)
                .ConfigureAwait(false);
            
            if (member is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            var nodes = await store.ListNodesAsync(groupId, cancellationToken).ConfigureAwait(false);
            var now = timeProvider.GetUtcNow();

            
            
            
            

            
            var drawLocks = await LoadDrawLocksAsync(store, nodes, cancellationToken).ConfigureAwait(false);

            var tokenViews = await LoadTokenStatesAsync(tokens, groupId, now, cancellationToken).ConfigureAwait(false);

            
            return Results.Json(nodes
                .Select(node => ToDto(
                    node,
                    now,
                    options.Value.NodeOfflineAfter,
                    drawLocks.GetValueOrDefault(node.NodeId),
                    tokenViews.GetValueOrDefault(node.NodeId, NodeTokenView.None)))
                .ToList());
        });

        

        group.MapGet("/groups/{groupId}/nodes/{nodeId}", async (
            string groupId,
            string nodeId,
            ClaimsPrincipal principal,
            IGroupStore store,
            INodeTokenStore tokens,
            IOptions<ControlOptions> options,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var member = await Membership.ResolveAsync(store, caller, groupId, cancellationToken)
                .ConfigureAwait(false);
            if (member is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            var node = await store.GetNodeAsync(groupId, nodeId, cancellationToken).ConfigureAwait(false);

            
            
            if (node is null)
                return ApiResults.NotFound(ErrorCodes.NodeNotFound);

            var state = await store.GetDesiredStateAsync(groupId, nodeId, cancellationToken).ConfigureAwait(false);
            var now = timeProvider.GetUtcNow();
            var tokenView = await LoadTokenStateAsync(tokens, groupId, nodeId, now, cancellationToken)
                .ConfigureAwait(false);

            return Results.Json(ToDto(node, now, options.Value.NodeOfflineAfter, state?.DrawLocked ?? false, tokenView));
        });

        

        




















        group.MapGet("/groups/{groupId}/events", async (
            string groupId,
            ClaimsPrincipal principal,
            IGroupStore store,
            INodePresenceNotifier notifier,
            HttpContext context,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var member = await Membership.ResolveAsync(store, caller, groupId, cancellationToken)
                .ConfigureAwait(false);
            if (member is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            var response = context.Response;
            response.Headers.CacheControl = "no-store";
            
            
            
            response.Headers["X-Accel-Buffering"] = "no";
            response.ContentType = "text/event-stream";

            
            
            
            
            
            
            
            
            using var subscription = notifier.Subscribe(groupId);

            
            
            await response.WriteAsync("retry: 5000\n\n", cancellationToken).ConfigureAwait(false);
            
            
            await response.WriteAsync(": connected\n\n", cancellationToken).ConfigureAwait(false);
            await response.Body.FlushAsync(cancellationToken).ConfigureAwait(false);

            try
            {
                while (!cancellationToken.IsCancellationRequested)
                {
                    NodePresenceChange change;
                    try
                    {
                        
                        using var idle = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                        idle.CancelAfter(PresenceKeepAlive);
                        change = await subscription.Reader.ReadAsync(idle.Token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
                    {
                        await response.WriteAsync(": ping\n\n", cancellationToken).ConfigureAwait(false);
                        await response.Body.FlushAsync(cancellationToken).ConfigureAwait(false);
                        continue;
                    }
                    catch (ChannelClosedException)
                    {
                        break;
                    }

                    var payload = JsonSerializer.Serialize(change, JsonSerialization.ProtocolJsonOptions);
                    await response.WriteAsync($"event: nodes\ndata: {payload}\n\n", cancellationToken)
                        .ConfigureAwait(false);
                    await response.Body.FlushAsync(cancellationToken).ConfigureAwait(false);
                }
            }
            catch (OperationCanceledException)
            {
                
            }

            return Results.Empty;
        });

        

        














        group.MapPost("/groups/{groupId}/nodes/register", async (
            string groupId,
            ClaimsPrincipal principal,
            RegisterNodeRequest request,
            IGroupStore store,
            INodeTokenStore tokens,
            IAuditStore audit,
            IOptions<ControlOptions> options,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var member = await Membership.ResolveAsync(store, caller, groupId, cancellationToken)
                .ConfigureAwait(false);
            if (member is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            
            
            if (!Membership.HasAtLeast(member, GroupRole.Admin))
                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);

            var nodeId = request.NodeId?.Trim();
            if (string.IsNullOrWhiteSpace(nodeId) || nodeId.Length > 128)
                return ApiResults.BadRequest(ErrorCodes.InvalidRequest);

            var platform = request.Platform?.Trim();
            if (string.IsNullOrWhiteSpace(platform) || platform.Length > 32)
                return ApiResults.BadRequest(ErrorCodes.InvalidRequest);

            var now = timeProvider.GetUtcNow();
            var existing = await store.GetNodeAsync(groupId, nodeId, cancellationToken).ConfigureAwait(false);

            var node = new Node
            {
                NodeId = nodeId,
                GroupId = groupId,
                Platform = platform,
                Version = request.Version?.Trim() ?? "unknown",
                
                Capabilities = request.Capabilities?.ToArray() ?? [],
                
                
                
                
                
                
                
                
                LocalRemoteAllowed = existing?.LocalRemoteAllowed ?? false,
                
                
                
                
                
                DisplayName = request.DisplayName is null
                    ? existing?.DisplayName
                    : NodeFrame.SanitizeDisplayName(request.DisplayName),
                LastHeartbeatAt = now,
                RegisteredAt = existing?.RegisteredAt ?? now,
                EnrolledByUserId = existing?.EnrolledByUserId
            };

            await store.SaveNodeAsync(node, cancellationToken).ConfigureAwait(false);

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
                Detail = existing is null ? "new" : "update"
            }, cancellationToken).ConfigureAwait(false);

            var tokenView = await LoadTokenStateAsync(tokens, groupId, nodeId, now, cancellationToken)
                .ConfigureAwait(false);

            return Results.Json(
                ToDto(
                    node,
                    now,
                    options.Value.NodeOfflineAfter,
                    existing is not null
                        && (await store.GetDesiredStateAsync(groupId, nodeId, cancellationToken).ConfigureAwait(false))
                            ?.DrawLocked == true,
                    tokenView,
                    tokenView.Fallback),
                statusCode: existing is null ? StatusCodes.Status201Created : StatusCodes.Status200OK);
        });

        
        
        
        
        
        group.MapDelete("/groups/{groupId}/nodes/{nodeId}", async (
            string groupId,
            string nodeId,
            ClaimsPrincipal principal,
            IGroupStore store,
            IAuditStore audit,
            INodePresenceNotifier notifier,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var member = await Membership.ResolveAsync(store, caller, groupId, cancellationToken)
                .ConfigureAwait(false);
            if (member is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            
            if (!Membership.HasAtLeast(member, GroupRole.Admin))
                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);

            var node = await store.GetNodeAsync(groupId, nodeId, cancellationToken).ConfigureAwait(false);
            if (node is null)
                return ApiResults.NotFound(ErrorCodes.NodeNotFound);

            await store.DeleteNodeAsync(groupId, nodeId, cancellationToken).ConfigureAwait(false);

            var removedAt = timeProvider.GetUtcNow();

            await audit.WriteAsync(new AuditEvent
            {
                EventId = "evt_" + Guid.NewGuid().ToString("n")[..16],
                At = removedAt,
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.NodeRegistered,
                Outcome = AuditOutcomes.Success,
                GroupId = groupId,
                TargetId = nodeId,
                Detail = "unregister"
            }, cancellationToken).ConfigureAwait(false);

            
            
            
            notifier.Publish(new NodePresenceChange(groupId, nodeId, Online: false, removedAt));

            return Results.NoContent();
        });
    }

    









    private static NodeDto ToDto(
        Node node,
        DateTimeOffset now,
        TimeSpan offlineAfter,
        bool drawLocked,
        NodeTokenView tokenView,
        NodeToken? tokenFallback = null)
    {
        
        
        var online = node.LastHeartbeatAt is { } heartbeat && now - heartbeat < offlineAfter;
        var token = tokenView.Active ?? tokenFallback;

        return new NodeDto(
            node.NodeId,
            node.GroupId,
            node.Platform,
            node.Version,
            node.Capabilities,
            node.LocalRemoteAllowed,
            node.DisplayName,
            node.LastHeartbeatAt,
            node.RegisteredAt,
            online,
            drawLocked,
            string.Equals(tokenView.State, "active", StringComparison.Ordinal),
            tokenView.State,
            token?.ExpiresAt);
    }

    private static async Task<Dictionary<string, NodeTokenView>> LoadTokenStatesAsync(
        INodeTokenStore tokens,
        string groupId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var history = await tokens.ListByGroupAsync(groupId, cancellationToken).ConfigureAwait(false);
        var active = await tokens.GetActiveByGroupAsync(groupId, now, cancellationToken).ConfigureAwait(false);

        var result = new Dictionary<string, NodeTokenView>(StringComparer.Ordinal);

        foreach (var token in history)
        {
            var isActive = active.TryGetValue(token.NodeId, out var current)
                && string.Equals(current.TokenId, token.TokenId, StringComparison.Ordinal);

            if (result.TryGetValue(token.NodeId, out var existing))
            {
                if (string.Equals(existing.State, "active", StringComparison.Ordinal) || !isActive)
                    continue;
            }

            result[token.NodeId] = new NodeTokenView(
                isActive ? "active" : token.IsRevoked ? "revoked" : "expired",
                isActive ? token : null);
        }

        return result;
    }

    private static async Task<NodeTokenView> LoadTokenStateAsync(
        INodeTokenStore tokens,
        string groupId,
        string nodeId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var active = await tokens.GetActiveByNodeAsync(groupId, nodeId, now, cancellationToken).ConfigureAwait(false);
        if (active is not null)
            return new NodeTokenView("active", active);

        var history = await tokens.ListByNodeAsync(groupId, nodeId, cancellationToken).ConfigureAwait(false);
        if (history.Count == 0)
            return NodeTokenView.None;

        foreach (var token in history)
        {
            if (!token.IsRevoked)
                continue;

            return new NodeTokenView("revoked", token);
        }

        return new NodeTokenView("expired", history[0]);
    }

    








    private static async Task<Dictionary<string, bool>> LoadDrawLocksAsync(
        IGroupStore store,
        IEnumerable<Node> nodes,
        CancellationToken cancellationToken)
    {
        var result = new Dictionary<string, bool>(StringComparer.Ordinal);

        foreach (var node in nodes)
        {
            var state = await store.GetDesiredStateAsync(node.GroupId, node.NodeId, cancellationToken)
                .ConfigureAwait(false);
            result[node.NodeId] = state?.DrawLocked ?? false;
        }

        return result;
    }
}














public sealed record RegisterNodeRequest(
    string? NodeId,
    string? Platform,
    string? Version,
    IReadOnlyList<string>? Capabilities,
    string? DisplayName = null);



























public sealed record NodeDto(
    string NodeId,
    string GroupId,
    string Platform,
    string Version,
    IReadOnlyList<string> Capabilities,
    bool LocalRemoteAllowed,
    string? DisplayName,
    DateTimeOffset? LastHeartbeatAt,
    DateTimeOffset RegisteredAt,
    bool Online,
    bool DrawLocked,
    bool Enrolled,
    string TokenState,
    DateTimeOffset? TokenExpiresAt);

public sealed record NodeTokenView(string State, NodeToken? Active, NodeToken? Token)
{
    public static NodeTokenView None { get; } = new("none", null, null);

    public static NodeTokenView FromToken(string state, NodeToken token, bool active) =>
        new(state, active ? token : null, token);
}
