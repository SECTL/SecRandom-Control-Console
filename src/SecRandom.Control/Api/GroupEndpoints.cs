using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SecRandom.Control.Authorization;
using SecRandom.Control.Configuration;
using SecRandom.Control.Domain;
using SecRandom.Control.Storage;
using SecRandom.Control.Transport;

namespace SecRandom.Control.Api;















public static class GroupEndpoints
{
    public static void MapGroupEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/v1").RequireAuthorization();

        

        group.MapGet("/groups", async (
            ClaimsPrincipal principal,
            IGroupStore store,
            IGroupOrderStore orderStore,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var groups = await store.ListGroupsForMemberAsync(caller.UserId, cancellationToken)
                .ConfigureAwait(false);

            var result = new List<GroupDto>(groups.Count);
            foreach (var item in groups)
            {
                
                
                var members = await store.ListMembersAsync(item.GroupId, cancellationToken)
                    .ConfigureAwait(false);

                var member = members.FirstOrDefault(candidate =>
                    string.Equals(candidate.UserId, caller.UserId, StringComparison.Ordinal));
                if (member is null)
                    continue;

                result.Add(ToDto(item, member.Role, OwnerDisplayName(item, members)));
            }

            
            var ranks = GroupOrdering.Ranks(
                await orderStore.GetOrderAsync(caller.UserId, cancellationToken).ConfigureAwait(false));

            return Results.Json(GroupOrdering.Apply(result, ranks, item => item.GroupId, item => item.CreatedAt));
        });

        group.MapPost("/groups", async (
            ClaimsPrincipal principal,
            CreateGroupRequest request,
            IGroupStore store,
            IAuditStore audit,
            IOptions<ControlOptions> options,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var name = request.Name?.Trim();
            if (string.IsNullOrWhiteSpace(name) || name.Length > MaxGroupNameLength)
                return ApiResults.BadRequest(ErrorCodes.InvalidGroupName);

            
            
            
            
            
            
            var limit = options.Value.MaxOwnedGroupsPerUser;
            if (limit > 0 &&
                await OwnedGroupCountAsync(store, caller.UserId, cancellationToken).ConfigureAwait(false) >= limit)
            {
                return ApiResults.Conflict(ErrorCodes.GroupLimitReached);
            }

            var created = await store.CreateGroupAsync(
                name, caller.UserId, caller.DisplayName, caller.AvatarUrl, cancellationToken)
                .ConfigureAwait(false);

            await audit.WriteAsync(new AuditEvent
            {
                EventId = NewEventId(),
                At = timeProvider.GetUtcNow(),
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.GroupCreated,
                Outcome = AuditOutcomes.Success,
                GroupId = created.GroupId,
                Detail = name
            }, cancellationToken).ConfigureAwait(false);

            
            return Results.Json(
                ToDto(created, GroupRole.Owner, caller.DisplayName), statusCode: StatusCodes.Status201Created);
        });

        group.MapGet("/groups/{groupId}", async (
            string groupId,
            ClaimsPrincipal principal,
            IGroupStore store,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var group = await store.GetGroupAsync(groupId, cancellationToken).ConfigureAwait(false);
            if (group is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            var members = await store.ListMembersAsync(groupId, cancellationToken).ConfigureAwait(false);
            var member = members.FirstOrDefault(candidate =>
                string.Equals(candidate.UserId, caller.UserId, StringComparison.Ordinal));

            
            if (member is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            return Results.Json(ToDto(group, member.Role, OwnerDisplayName(group, members)));
        });

        group.MapPatch("/groups/{groupId}", async (
            string groupId,
            ClaimsPrincipal principal,
            RenameGroupRequest request,
            IGroupStore store,
            IAuditStore audit,
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
            {
                
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.GroupRenamed,
                        groupId, targetId: null, ErrorCodes.InsufficientRole, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
            }

            var name = request.Name?.Trim();
            if (string.IsNullOrWhiteSpace(name) || name.Length > MaxGroupNameLength)
                return ApiResults.BadRequest(ErrorCodes.InvalidGroupName);

            var updated = await store.TryRenameGroupAsync(groupId, name, cancellationToken)
                .ConfigureAwait(false);

            if (updated is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            await audit.WriteAsync(new AuditEvent
            {
                EventId = NewEventId(),
                At = timeProvider.GetUtcNow(),
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.GroupRenamed,
                Outcome = AuditOutcomes.Success,
                GroupId = groupId,
                Detail = name
            }, cancellationToken).ConfigureAwait(false);

            var renamedMembers = await store.ListMembersAsync(groupId, cancellationToken).ConfigureAwait(false);
            return Results.Json(ToDto(updated, member.Role, OwnerDisplayName(updated, renamedMembers)));
        });

        
        
        
        
        
        
        
        
        
        
        group.MapDelete("/groups/{groupId}", async (
            string groupId,
            ClaimsPrincipal principal,
            IGroupStore store,
            IAuditStore audit,
            INodeConnectionRegistry registry,
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

            
            
            
            
            var group = await store.GetGroupAsync(groupId, cancellationToken).ConfigureAwait(false);
            if (group is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            if (!string.Equals(group.OwnerUserId, caller.UserId, StringComparison.Ordinal))
            {
                
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.GroupDeleted,
                        groupId, targetId: null, ErrorCodes.InsufficientRole, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
            }

            
            
            
            
            
            
            
            var deleted = await store.DeleteGroupAsync(groupId, caller.UserId, CancellationToken.None)
                .ConfigureAwait(false);

            if (!deleted)
            {
                
                
                
                var current = await store.GetGroupAsync(groupId, cancellationToken).ConfigureAwait(false);
                if (current is null)
                    return ApiResults.NotFound(ErrorCodes.GroupNotFound);

                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.GroupDeleted,
                        groupId, targetId: null, ErrorCodes.InsufficientRole, CancellationToken.None)
                    .ConfigureAwait(false);

                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
            }

            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            await registry.CloseGroupAsync(groupId, "group_deleted", CancellationToken.None)
                .ConfigureAwait(false);

            
            
            
            
            await audit.WriteAsync(new AuditEvent
            {
                EventId = NewEventId(),
                At = timeProvider.GetUtcNow(),
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.GroupDeleted,
                Outcome = AuditOutcomes.Success,
                GroupId = groupId,
                TargetId = null,
                Detail = group.Name
            }, CancellationToken.None).ConfigureAwait(false);

            return Results.NoContent();
        });

        

        group.MapGet("/groups/{groupId}/members", async (
            string groupId,
            ClaimsPrincipal principal,
            IGroupStore store,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var members = await store.ListMembersAsync(groupId, cancellationToken).ConfigureAwait(false);
            var member = members.FirstOrDefault(candidate =>
                string.Equals(candidate.UserId, caller.UserId, StringComparison.Ordinal));
            if (member is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            
            
            var result = members
                .OrderByDescending(item => item.Role)
                .ThenBy(item => item.JoinedAt)
                .Select(item =>
                {
                    var isSelf = string.Equals(item.UserId, caller.UserId, StringComparison.Ordinal);

                    return new MemberDto(
                        item.UserId,
                        item.DisplayName,
                        
                        
                        
                        item.AvatarUrl ?? (isSelf ? caller.AvatarUrl : null),
                        item.Role,
                        item.JoinedAt,
                        isSelf);
                })
                .ToList();

            return Results.Json(result);
        });

        group.MapPatch("/groups/{groupId}/members/{userId}", async (
            string groupId,
            string userId,
            ClaimsPrincipal principal,
            ChangeMemberRoleRequest request,
            IGroupStore store,
            IAuditStore audit,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var actor = await Membership.ResolveAsync(store, caller, groupId, cancellationToken)
                .ConfigureAwait(false);
            if (actor is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            var target = await store.GetMemberAsync(groupId, userId, cancellationToken).ConfigureAwait(false);
            if (target is null)
                return ApiResults.NotFound(ErrorCodes.MemberNotFound);

            
            if (request.Role == GroupRole.Owner)
            {
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.MemberRoleChanged,
                        groupId, userId, ErrorCodes.OwnerMustUseTransfer, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Forbidden(ErrorCodes.OwnerMustUseTransfer);
            }

            
            if (!Membership.CanManage(actor, target.Role))
            {
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.MemberRoleChanged,
                        groupId, userId, ErrorCodes.InsufficientRole, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
            }

            
            if (!actor.Role.Outranks(request.Role))
            {
                
                
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.MemberRoleChanged,
                        groupId, userId, ErrorCodes.InsufficientRole, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
            }

            var changed = await store.TryUpdateMemberRoleAsync(
                groupId, userId, target.Role, request.Role, cancellationToken).ConfigureAwait(false);

            if (!changed)
            {
                
                
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.MemberRoleChanged,
                        groupId, userId, ErrorCodes.ConcurrentModification, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Conflict(ErrorCodes.ConcurrentModification);
            }

            await audit.WriteAsync(new AuditEvent
            {
                EventId = NewEventId(),
                At = timeProvider.GetUtcNow(),
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.MemberRoleChanged,
                Outcome = AuditOutcomes.Success,
                GroupId = groupId,
                TargetId = userId,
                Detail = $"{target.Role}->{request.Role}"
            }, cancellationToken).ConfigureAwait(false);

            return Results.Json(new { user_id = userId, role = request.Role });
        });

        group.MapDelete("/groups/{groupId}/members/{userId}", async (
            string groupId,
            string userId,
            ClaimsPrincipal principal,
            IGroupStore store,
            IAuditStore audit,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var actor = await Membership.ResolveAsync(store, caller, groupId, cancellationToken)
                .ConfigureAwait(false);
            if (actor is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            var target = await store.GetMemberAsync(groupId, userId, cancellationToken).ConfigureAwait(false);
            if (target is null)
                return ApiResults.NotFound(ErrorCodes.MemberNotFound);

            
            
            if (target.Role == GroupRole.Owner)
            {
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.MemberRemoved,
                        groupId, userId, ErrorCodes.OwnerCannotBeRemoved, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Forbidden(ErrorCodes.OwnerCannotBeRemoved);
            }

            if (!Membership.CanManage(actor, target.Role))
            {
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.MemberRemoved,
                        groupId, userId, ErrorCodes.InsufficientRole, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
            }

            var removed = await store.TryRemoveMemberAsync(groupId, userId, target.Role, cancellationToken)
                .ConfigureAwait(false);

            if (!removed)
            {
                
                
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.MemberRemoved,
                        groupId, userId, ErrorCodes.ConcurrentModification, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Conflict(ErrorCodes.ConcurrentModification);
            }

            await audit.WriteAsync(new AuditEvent
            {
                EventId = NewEventId(),
                At = timeProvider.GetUtcNow(),
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.MemberRemoved,
                Outcome = AuditOutcomes.Success,
                GroupId = groupId,
                TargetId = userId,
                Detail = target.Role.ToString()
            }, cancellationToken).ConfigureAwait(false);

            return Results.NoContent();
        });

        

        group.MapGet("/groups/{groupId}/audit", async (
            string groupId,
            ClaimsPrincipal principal,
            int? limit,
            
            int? page,
            DateTimeOffset? before,
            [FromQuery(Name = "before_id")] string? beforeId,
            string? action,
            [FromQuery(Name = "action_prefix")] string? actionPrefix,
            string? outcome,
            
            string? actor,
            [FromQuery(Name = "actor_device")] string? actorDevice,
            [FromQuery(Name = "target_id")] string? targetId,
            DateTimeOffset? from,
            DateTimeOffset? to,
            IGroupStore store,
            IAuditStore audit,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            
            
            var members = await store.ListMembersAsync(groupId, cancellationToken).ConfigureAwait(false);
            var member = members.FirstOrDefault(candidate =>
                string.Equals(candidate.UserId, caller.UserId, StringComparison.Ordinal));
            if (member is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            
            if (!Membership.HasAtLeast(member, GroupRole.Admin))
                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);

            
            
            
            
            
            
            var outcomeText = NormalizeFilter(outcome);
            if (outcomeText is not null && !AuditOutcomes.All.Contains(outcomeText))
                return ApiResults.BadRequest(ErrorCodes.InvalidRequest);

            
            var cursorBeforeId = NormalizeFilter(beforeId);

            
            
            
            
            
            if (page.HasValue && (before.HasValue || cursorBeforeId is not null))
                return ApiResults.BadRequest(ErrorCodes.InvalidRequest);

            
            
            
            
            
            
            var effectiveLimit = Math.Clamp(limit ?? DefaultAuditLimit, 0, IAuditStore.MaxReadLimit);

            
            
            
            var filters = new AuditQuery
            {
                Action = NormalizeFilter(action),
                ActionPrefix = NormalizeFilter(actionPrefix),
                Outcome = outcomeText,
                
                
                ActorUserId = NormalizeFilter(actor),
                ActorDeviceId = NormalizeFilter(actorDevice),
                TargetId = NormalizeFilter(targetId),
                From = from,
                To = to
            };

            
            
            
            var total = await audit.CountAsync(groupId, filters, cancellationToken).ConfigureAwait(false);

            int? effectivePage = null;
            AuditQuery query;

            if (page is { } requestedPage)
            {
                
                
                
                
                
                
                
                var pageSize = Math.Max(1, effectiveLimit);
                var lastPage = Math.Max(1, (total + pageSize - 1) / pageSize);
                effectivePage = Math.Clamp(requestedPage, 1, lastPage);

                
                query = filters with { Offset = (effectivePage.Value - 1) * pageSize };
            }
            else
            {
                
                
                query = filters with { Before = before, BeforeId = cursorBeforeId };
            }

            
            
            
            
            
            
            
            
            
            
            var events = await audit.ReadAsync(groupId, effectiveLimit, query, cancellationToken)
                .ConfigureAwait(false);

            
            
            
            var nodes = await store.ListNodesAsync(groupId, cancellationToken).ConfigureAwait(false);

            
            
            
            var items = events.Select(item => new AuditEventDto(
                item.EventId, item.At, item.ActorUserId, item.ActorDeviceId,
                item.Action, item.Outcome, item.TargetId, item.Detail,
                DisplayNameOf(members, item.ActorUserId),
                ResolveTargetDisplayName(item.TargetId, item.Detail, members, nodes))).ToList();

            
            
            
            
            return Results.Json(new AuditPageDto(items, total, effectivePage, effectiveLimit));
        });

        

        
        
        
        
        
        
        
        
        
        
        group.MapGet("/groups/{groupId}/audit/facets", async (
            string groupId,
            ClaimsPrincipal principal,
            IGroupStore store,
            IAuditStore audit,
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

            var facets = await audit.ReadFacetsAsync(groupId, IAuditStore.MaxFacetItems, cancellationToken)
                .ConfigureAwait(false);

            
            
            var nodes = await store.ListNodesAsync(groupId, cancellationToken).ConfigureAwait(false);

            
            
            
            
            var members = await store.ListMembersAsync(groupId, cancellationToken).ConfigureAwait(false);

            return Results.Json(new AuditFacetsDto(
                new AuditFacetListDto<AuditDeviceFacetDto>(
                    facets.ActorDevices.Items
                        .Select(item => new AuditDeviceFacetDto(item.DeviceId, item.Count))
                        .ToList(),
                    facets.ActorDevices.Truncated),
                new AuditFacetListDto<AuditNodeFacetDto>(
                    facets.TargetNodes.Items
                        .Select(item => new AuditNodeFacetDto(
                            item.NodeId, ResolveNodeDisplayName(item.NodeId, nodes), item.Count))
                        .ToList(),
                    facets.TargetNodes.Truncated),
                new AuditFacetListDto<AuditActorFacetDto>(
                    facets.Actors.Items
                        .Select(item => new AuditActorFacetDto(
                            item.UserId, DisplayNameOf(members, item.UserId), item.Count))
                        .ToList(),
                    facets.Actors.Truncated)));
        });
    }

    private const int MaxGroupNameLength = 64;
    private const int DefaultAuditLimit = 50;

    









    private static string? NormalizeFilter(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    













    private static async Task<int> OwnedGroupCountAsync(
        IGroupStore store, string userId, CancellationToken cancellationToken)
    {
        var memberships = await store.ListGroupsForMemberAsync(userId, cancellationToken).ConfigureAwait(false);
        return memberships.Count(group => string.Equals(group.OwnerUserId, userId, StringComparison.Ordinal));
    }

    private static string NewEventId() => "evt_" + Guid.NewGuid().ToString("n")[..16];

    







    private static string? OwnerDisplayName(Group group, IReadOnlyList<Member> members) =>
        DisplayNameOf(members, group.OwnerUserId);

    







    private static string? DisplayNameOf(IReadOnlyList<Member> members, string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return null;

        var name = members.FirstOrDefault(candidate =>
            string.Equals(candidate.UserId, userId, StringComparison.Ordinal))?.DisplayName;

        return string.IsNullOrWhiteSpace(name) ? null : name;
    }

    






















    private static string? ResolveTargetDisplayName(
        string? targetId,
        string? detail,
        IReadOnlyList<Member> members,
        IReadOnlyList<Node> nodes)
    {
        if (string.IsNullOrWhiteSpace(targetId))
            return null;

        var memberName = DisplayNameOf(members, targetId);
        if (memberName is not null)
            return memberName;

        var nodeName = ResolveNodeDisplayName(targetId, nodes);
        if (nodeName is not null)
            return nodeName;

        return IsBareIdentifier(detail) ? DisplayNameOf(members, detail) : null;
    }

    







    private static string? ResolveNodeDisplayName(string? nodeId, IReadOnlyList<Node> nodes)
    {
        if (string.IsNullOrWhiteSpace(nodeId))
            return null;

        var name = nodes.FirstOrDefault(node =>
            string.Equals(node.NodeId, nodeId, StringComparison.Ordinal))?.DisplayName;

        return string.IsNullOrWhiteSpace(name) ? null : name;
    }

    







    private static bool IsBareIdentifier(string? value) =>
        !string.IsNullOrWhiteSpace(value) &&
        !value.Contains(':') &&
        !value.Contains("->", StringComparison.Ordinal) &&
        !value.Contains('=');

    private static GroupDto ToDto(Group group, GroupRole role, string? ownerDisplayName) =>
        new(group.GroupId, group.Name, group.OwnerUserId, ownerDisplayName, group.CreatedAt, role);
}

public sealed record CreateGroupRequest(string? Name);

public sealed record RenameGroupRequest(string? Name);

public sealed record ChangeMemberRoleRequest(GroupRole Role);






public sealed record GroupDto(
    string GroupId,
    string Name,
    string OwnerUserId,
    string? OwnerDisplayName,
    DateTimeOffset CreatedAt,
    GroupRole Role);






public sealed record MemberDto(
    string UserId,
    string? DisplayName,
    string? AvatarUrl,
    GroupRole Role,
    DateTimeOffset JoinedAt,
    bool IsSelf);















public sealed record AuditEventDto(
    string EventId,
    DateTimeOffset At,
    string? ActorUserId,
    string? ActorDeviceId,
    string Action,
    string Outcome,
    string? TargetId,
    string? Detail,
    string? ActorDisplayName,
    string? TargetDisplayName);




























public sealed record AuditPageDto(
    IReadOnlyList<AuditEventDto> Items,
    int Total,
    int? Page,
    int Limit);

















public sealed record AuditFacetsDto(
    AuditFacetListDto<AuditDeviceFacetDto> ActorDevices,
    AuditFacetListDto<AuditNodeFacetDto> TargetNodes,
    AuditFacetListDto<AuditActorFacetDto> Actors);









public sealed record AuditFacetListDto<T>(IReadOnlyList<T> Items, bool Truncated);


public sealed record AuditDeviceFacetDto(string DeviceId, int Count);










public sealed record AuditNodeFacetDto(string NodeId, string? DisplayName, int Count);










public sealed record AuditActorFacetDto(string UserId, string? DisplayName, int Count);
