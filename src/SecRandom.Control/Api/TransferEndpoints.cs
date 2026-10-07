using System.Security.Claims;
using Microsoft.Extensions.Options;
using SecRandom.Control.Configuration;
using SecRandom.Control.Domain;
using SecRandom.Control.Storage;

namespace SecRandom.Control.Api;















public static class TransferEndpoints
{
    public static void MapTransferEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/v1").RequireAuthorization();

        

        group.MapPost("/groups/{groupId}/transfers", async (
            string groupId,
            ClaimsPrincipal principal,
            CreateTransferRequest request,
            IGroupStore store,
            IAuditStore audit,
            IOptions<ControlOptions> options,
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

            
            if (actor.Role != GroupRole.Owner)
            {
                
                
                
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.TransferRequested,
                        groupId, targetId: null, ErrorCodes.InsufficientRole, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
            }

            var toUserId = request.ToUserId?.Trim();
            if (string.IsNullOrWhiteSpace(toUserId))
                return ApiResults.BadRequest(ErrorCodes.MemberNotFound);

            
            if (string.Equals(toUserId, caller.UserId, StringComparison.Ordinal))
            {
                
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.TransferRequested,
                        groupId, caller.UserId, ErrorCodes.SelfActionNotAllowed, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.BadRequest(ErrorCodes.SelfActionNotAllowed);
            }

            var target = await store.GetMemberAsync(groupId, toUserId, cancellationToken).ConfigureAwait(false);
            if (target is null)
            {
                
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.TransferRequested,
                        groupId, targetId: null, ErrorCodes.MemberNotFound, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.NotFound(ErrorCodes.MemberNotFound);
            }

            
            var pending = await store.GetPendingTransferAsync(groupId, cancellationToken).ConfigureAwait(false);
            if (pending is not null)
            {
                
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.TransferRequested,
                        groupId, target.UserId, ErrorCodes.TransferPending, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Conflict(ErrorCodes.TransferPending);
            }

            var now = timeProvider.GetUtcNow();
            var transfer = new OwnerTransfer
            {
                TransferId = "trf_" + Guid.NewGuid().ToString("n")[..16],
                GroupId = groupId,
                FromUserId = caller.UserId,
                ToUserId = toUserId,
                CreatedAt = now,
                ExpiresAt = now.Add(options.Value.OwnerTransferLifetime),
                
                
                InitiatorReauthenticated = true
            };

            await store.SaveTransferAsync(transfer, cancellationToken).ConfigureAwait(false);

            await audit.WriteAsync(new AuditEvent
            {
                EventId = NewEventId(),
                At = now,
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.TransferRequested,
                Outcome = AuditOutcomes.Success,
                GroupId = groupId,
                TargetId = transfer.TransferId,
                Detail = toUserId
            }, cancellationToken).ConfigureAwait(false);

            
            return Results.Json(ToDto(transfer, now), statusCode: StatusCodes.Status201Created);
        });

        

        group.MapGet("/groups/{groupId}/transfers/pending", async (
            string groupId,
            ClaimsPrincipal principal,
            IGroupStore store,
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

            var pending = await store.GetPendingTransferAsync(groupId, cancellationToken).ConfigureAwait(false);
            if (pending is null)
                return Results.Json(null);

            
            var isInvolved = string.Equals(pending.FromUserId, caller.UserId, StringComparison.Ordinal) ||
                             string.Equals(pending.ToUserId, caller.UserId, StringComparison.Ordinal);

            return Results.Json(isInvolved
                ? ToDto(pending, timeProvider.GetUtcNow())
                : new PendingTransferBriefDto(pending.TransferId, pending.ExpiresAt, true));
        });

        

        group.MapPost("/groups/{groupId}/transfers/{transferId}/confirm", async (
            string groupId,
            string transferId,
            ClaimsPrincipal principal,
            IGroupStore store,
            IAuditStore audit,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var transfer = await store.GetTransferAsync(transferId, cancellationToken).ConfigureAwait(false);
            if (transfer is null || !string.Equals(transfer.GroupId, groupId, StringComparison.Ordinal))
                return ApiResults.NotFound(ErrorCodes.TransferNotFound);

            
            
            var actor = await Membership.ResolveAsync(store, caller, groupId, cancellationToken)
                .ConfigureAwait(false);

            
            if (!string.Equals(transfer.ToUserId, caller.UserId, StringComparison.Ordinal))
            {
                if (actor is not null)
                {
                    await AuditDenials.WriteDeniedAsync(
                            audit, timeProvider, caller, AuditActions.TransferConfirmed,
                            groupId, transferId, ErrorCodes.TransferNotRecipient, cancellationToken)
                        .ConfigureAwait(false);
                }

                return ApiResults.Forbidden(ErrorCodes.TransferNotRecipient);
            }

            var now = timeProvider.GetUtcNow();
            var status = transfer.EffectiveStatus(now);

            if (status == TransferStatus.Expired)
            {
                await MarkResolvedAsync(store, transfer, TransferStatus.Expired, now, cancellationToken)
                    .ConfigureAwait(false);

                if (actor is not null)
                {
                    
                    
                    
                    
                    await audit.WriteAsync(new AuditEvent
                    {
                        EventId = NewEventId(),
                        At = now,
                        ActorUserId = caller.UserId,
                        ActorDeviceId = caller.AuditDeviceId,
                        Action = AuditActions.TransferExpired,
                        Outcome = AuditOutcomes.Failed,
                        GroupId = groupId,
                        TargetId = transferId,
                        Detail = ErrorCodes.TransferExpired
                    }, cancellationToken).ConfigureAwait(false);
                }

                return ApiResults.Gone(ErrorCodes.TransferExpired);
            }

            if (status != TransferStatus.Pending)
            {
                if (actor is not null)
                {
                    await AuditDenials.WriteDeniedAsync(
                            audit, timeProvider, caller, AuditActions.TransferConfirmed,
                            groupId, transferId, ErrorCodes.TransferResolved, cancellationToken)
                        .ConfigureAwait(false);
                }

                return ApiResults.Conflict(ErrorCodes.TransferResolved);
            }

            if (!transfer.InitiatorReauthenticated)
            {
                if (actor is not null)
                {
                    await AuditDenials.WriteDeniedAsync(
                            audit, timeProvider, caller, AuditActions.TransferConfirmed,
                            groupId, transferId, ErrorCodes.InsufficientRole, cancellationToken)
                        .ConfigureAwait(false);
                }

                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
            }

            
            
            if (actor is null)
                return ApiResults.NotFound(ErrorCodes.MemberNotFound);

            
            var transferred = await store.TryTransferOwnershipAsync(
                groupId,
                transfer.FromUserId,
                transfer.ToUserId,
                GroupRole.Owner,
                transfer.DemotedTo,
                cancellationToken).ConfigureAwait(false);

            if (!transferred)
            {
                
                
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.TransferConfirmed,
                        groupId, transferId, ErrorCodes.ConcurrentModification, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Conflict(ErrorCodes.ConcurrentModification);
            }

            await MarkResolvedAsync(store, transfer, TransferStatus.Confirmed, now, cancellationToken)
                .ConfigureAwait(false);

            await audit.WriteAsync(new AuditEvent
            {
                EventId = NewEventId(),
                At = now,
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.TransferConfirmed,
                Outcome = AuditOutcomes.Success,
                GroupId = groupId,
                TargetId = transferId,
                Detail = transfer.FromUserId
            }, cancellationToken).ConfigureAwait(false);

            return Results.Json(new { group_id = groupId, owner_user_id = transfer.ToUserId });
        });

        

        group.MapPost("/groups/{groupId}/transfers/{transferId}/reject", async (
            string groupId,
            string transferId,
            ClaimsPrincipal principal,
            IGroupStore store,
            IAuditStore audit,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var transfer = await store.GetTransferAsync(transferId, cancellationToken).ConfigureAwait(false);
            if (transfer is null || !string.Equals(transfer.GroupId, groupId, StringComparison.Ordinal))
                return ApiResults.NotFound(ErrorCodes.TransferNotFound);

            
            var actor = await Membership.ResolveAsync(store, caller, groupId, cancellationToken)
                .ConfigureAwait(false);

            if (!string.Equals(transfer.ToUserId, caller.UserId, StringComparison.Ordinal))
            {
                if (actor is not null)
                {
                    await AuditDenials.WriteDeniedAsync(
                            audit, timeProvider, caller, AuditActions.TransferRejected,
                            groupId, transferId, ErrorCodes.TransferNotRecipient, cancellationToken)
                        .ConfigureAwait(false);
                }

                return ApiResults.Forbidden(ErrorCodes.TransferNotRecipient);
            }

            var now = timeProvider.GetUtcNow();
            if (transfer.EffectiveStatus(now) != TransferStatus.Pending)
            {
                
                
                
                
                if (actor is not null)
                {
                    await AuditDenials.WriteDeniedAsync(
                            audit, timeProvider, caller, AuditActions.TransferRejected,
                            groupId, transferId, ErrorCodes.TransferResolved, cancellationToken)
                        .ConfigureAwait(false);
                }

                return ApiResults.Conflict(ErrorCodes.TransferResolved);
            }

            await MarkResolvedAsync(store, transfer, TransferStatus.Rejected, now, cancellationToken)
                .ConfigureAwait(false);

            await audit.WriteAsync(new AuditEvent
            {
                EventId = NewEventId(),
                At = now,
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.TransferRejected,
                Outcome = AuditOutcomes.Success,
                GroupId = groupId,
                TargetId = transferId
            }, cancellationToken).ConfigureAwait(false);

            
            return Results.NoContent();
        });
    }

    private static Task MarkResolvedAsync(
        IGroupStore store, OwnerTransfer transfer, TransferStatus status,
        DateTimeOffset now, CancellationToken cancellationToken) =>
        store.SaveTransferAsync(
            transfer with { Status = status, ResolvedAt = now }, cancellationToken);

    private static string NewEventId() => "evt_" + Guid.NewGuid().ToString("n")[..16];

    private static TransferDto ToDto(OwnerTransfer transfer, DateTimeOffset now) => new(
        transfer.TransferId,
        transfer.GroupId,
        transfer.FromUserId,
        transfer.ToUserId,
        transfer.CreatedAt,
        transfer.ExpiresAt,
        transfer.EffectiveStatus(now).ToString().ToLowerInvariant(),
        transfer.DemotedTo);
}

public sealed record CreateTransferRequest(string? ToUserId);

public sealed record TransferDto(
    string TransferId,
    string GroupId,
    string FromUserId,
    string ToUserId,
    DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt,
    string Status,
    GroupRole DemotedTo);


public sealed record PendingTransferBriefDto(string TransferId, DateTimeOffset ExpiresAt, bool Restricted);
