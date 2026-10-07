using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using SecRandom.Control.Configuration;
using SecRandom.Control.Domain;
using SecRandom.Control.Storage;

namespace SecRandom.Control.Api;
















public static class InviteEndpoints
{
    


    private const string Alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

    
    private const int CodeLength = 8;

    private const int MaxPendingInvitesPerGroup = 50;

    public static void MapInviteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/v1").RequireAuthorization();

        

        group.MapPost("/groups/{groupId}/invites", async (
            string groupId,
            ClaimsPrincipal principal,
            CreateInviteRequest request,
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

            
            
            if (!actor.Role.CanInviteAs(request.Role))
            {
                
                
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.InviteCreated,
                        groupId, targetId: null, ErrorCodes.InsufficientRole, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
            }

            var existing = await store.ListInvitesAsync(groupId, cancellationToken).ConfigureAwait(false);
            var now = timeProvider.GetUtcNow();

            var pendingCount = existing.Count(invite => invite.Status(now) == InviteStatus.Pending);
            if (pendingCount >= MaxPendingInvitesPerGroup)
                return ApiResults.Conflict(ErrorCodes.InvalidRequest);

            var lifetime = options.Value.InviteLifetime;
            var invite = new Invite
            {
                Code = GenerateCode(),
                GroupId = groupId,
                Role = request.Role,
                CreatedByUserId = caller.UserId,
                CreatedAt = now,
                ExpiresAt = now.Add(lifetime),
                ExpectedUserId = string.IsNullOrWhiteSpace(request.ExpectedUserId)
                    ? null
                    : request.ExpectedUserId.Trim()
            };

            await store.SaveInviteAsync(invite, cancellationToken).ConfigureAwait(false);

            await audit.WriteAsync(new AuditEvent
            {
                EventId = NewEventId(),
                At = now,
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.InviteCreated,
                Outcome = AuditOutcomes.Success,
                GroupId = groupId,
                TargetId = invite.Code,
                Detail = request.Role.ToString()
            }, cancellationToken).ConfigureAwait(false);

            return Results.Json(ToDto(invite, now), statusCode: StatusCodes.Status201Created);
        });

        
        group.MapGet("/groups/{groupId}/invites", async (
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

            
            if (!Membership.HasAtLeast(actor, GroupRole.Admin))
                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);

            var now = timeProvider.GetUtcNow();
            var invites = await store.ListInvitesAsync(groupId, cancellationToken).ConfigureAwait(false);

            return Results.Json(invites.Select(invite => ToDto(invite, now)).ToList());
        });

        

        group.MapDelete("/groups/{groupId}/invites/{code}", async (
            string groupId,
            string code,
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

            var invite = await store.GetInviteByCodeAsync(code, cancellationToken).ConfigureAwait(false);
            if (invite is null || !string.Equals(invite.GroupId, groupId, StringComparison.Ordinal))
                return ApiResults.NotFound(ErrorCodes.InviteNotFound);

            var now = timeProvider.GetUtcNow();

            
            var isCreator = string.Equals(invite.CreatedByUserId, caller.UserId, StringComparison.Ordinal);
            if (!isCreator && !Membership.HasAtLeast(actor, GroupRole.Admin))
            {
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.InviteRevoked,
                        groupId, code, ErrorCodes.InsufficientRole, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Forbidden(ErrorCodes.InsufficientRole);
            }

            var status = invite.Status(now);
            if (status != InviteStatus.Pending)
            {
                
                
                var errorCode = status switch
                {
                    InviteStatus.Used => ErrorCodes.InviteUsed,
                    InviteStatus.Expired => ErrorCodes.InviteExpired,
                    _ => ErrorCodes.InviteRevoked
                };

                
                
                await AuditDenials.WriteDeniedAsync(
                        audit, timeProvider, caller, AuditActions.InviteRevoked,
                        groupId, code, errorCode, cancellationToken)
                    .ConfigureAwait(false);

                return ApiResults.Gone(errorCode);
            }

            var revoked = invite with { RevokedAt = now, RevokedByUserId = caller.UserId };
            await store.SaveInviteAsync(revoked, cancellationToken).ConfigureAwait(false);

            await audit.WriteAsync(new AuditEvent
            {
                EventId = NewEventId(),
                At = now,
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.InviteRevoked,
                Outcome = AuditOutcomes.Success,
                GroupId = groupId,
                TargetId = code
            }, cancellationToken).ConfigureAwait(false);

            return Results.NoContent();
        });

        

        group.MapPost("/invites/redeem", async (
            ClaimsPrincipal principal,
            RedeemInviteRequest request,
            IGroupStore store,
            IAuditStore audit,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var code = NormalizeCode(request.Code);
            if (string.IsNullOrWhiteSpace(code))
                return ApiResults.BadRequest(ErrorCodes.InviteNotFound);

            var invite = await store.GetInviteByCodeAsync(code, cancellationToken).ConfigureAwait(false);
            if (invite is null)
                return ApiResults.NotFound(ErrorCodes.InviteNotFound);

            var now = timeProvider.GetUtcNow();

            
            switch (invite.Status(now))
            {
                case InviteStatus.Used:
                    return ApiResults.Gone(ErrorCodes.InviteUsed);
                case InviteStatus.Expired:
                    return ApiResults.Gone(ErrorCodes.InviteExpired);
                case InviteStatus.Revoked:
                    return ApiResults.Gone(ErrorCodes.InviteRevoked);
            }

            
            if (invite.ExpectedUserId is { Length: > 0 } expected &&
                !string.Equals(expected, caller.UserId, StringComparison.Ordinal))
            {
                await audit.WriteAsync(new AuditEvent
                {
                    EventId = NewEventId(),
                    At = now,
                    ActorUserId = caller.UserId,
                    ActorDeviceId = caller.AuditDeviceId,
                    Action = AuditActions.MemberJoined,
                    Outcome = AuditOutcomes.Denied,
                    GroupId = invite.GroupId,
                    TargetId = code,
                    Detail = "expected_user_mismatch"
                }, cancellationToken).ConfigureAwait(false);

                return ApiResults.Forbidden(ErrorCodes.InviteNotForCaller);
            }

            var group = await store.GetGroupAsync(invite.GroupId, cancellationToken).ConfigureAwait(false);
            if (group is null)
                return ApiResults.NotFound(ErrorCodes.GroupNotFound);

            
            
            var existing = await store.GetMemberAsync(invite.GroupId, caller.UserId, cancellationToken)
                .ConfigureAwait(false);
            if (existing is not null)
            {
                await audit.WriteAsync(new AuditEvent
                {
                    EventId = NewEventId(),
                    At = now,
                    ActorUserId = caller.UserId,
                    ActorDeviceId = caller.AuditDeviceId,
                    Action = AuditActions.MemberJoined,
                    Outcome = AuditOutcomes.Denied,
                    GroupId = invite.GroupId,
                    TargetId = code,
                    Detail = "already_member"
                }, cancellationToken).ConfigureAwait(false);

                return ApiResults.Conflict(ErrorCodes.InviteAlreadyMember);
            }

            await store.AddMemberAsync(invite.GroupId, new Member
            {
                UserId = caller.UserId,
                Role = invite.Role,
                JoinedAt = now,
                DisplayName = caller.DisplayName,
                
                
                AvatarUrl = caller.AvatarUrl
            }, cancellationToken).ConfigureAwait(false);

            
            
            
            await store.SaveInviteAsync(invite with
            {
                UsedByUserId = caller.UserId,
                UsedAt = now
            }, cancellationToken).ConfigureAwait(false);

            await audit.WriteAsync(new AuditEvent
            {
                EventId = NewEventId(),
                At = now,
                ActorUserId = caller.UserId,
                ActorDeviceId = caller.AuditDeviceId,
                Action = AuditActions.MemberJoined,
                Outcome = AuditOutcomes.Success,
                GroupId = invite.GroupId,
                TargetId = caller.UserId,
                Detail = invite.Role.ToString()
            }, cancellationToken).ConfigureAwait(false);

            return Results.Json(new RedeemResultDto(invite.GroupId, invite.Role, group.Name, AlreadyMember: false));
        });
    }

    
    private static string NormalizeCode(string? raw) =>
        string.IsNullOrWhiteSpace(raw)
            ? string.Empty
            : new string(raw.Where(char.IsLetterOrDigit).Select(char.ToUpperInvariant).ToArray());

    







    private static string GenerateCode()
    {
        Span<char> buffer = stackalloc char[CodeLength];
        for (var index = 0; index < CodeLength; index++)
            buffer[index] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];

        return new string(buffer);
    }

    
    private static string FormatForDisplay(string code) =>
        code.Length == CodeLength ? code[..4] + "-" + code[4..] : code;

    private static string NewEventId() => "evt_" + Guid.NewGuid().ToString("n")[..16];

    private static InviteDto ToDto(Invite invite, DateTimeOffset now) => new(
        invite.Code,
        FormatForDisplay(invite.Code),
        invite.Role,
        invite.CreatedByUserId,
        invite.CreatedAt,
        invite.ExpiresAt,
        invite.Status(now).ToString().ToLowerInvariant(),
        invite.UsedByUserId,
        invite.UsedAt);
}

public sealed record CreateInviteRequest(GroupRole Role, string? ExpectedUserId);

public sealed record RedeemInviteRequest(string? Code);





public sealed record InviteDto(
    string Code,
    string DisplayCode,
    GroupRole Role,
    string CreatedByUserId,
    DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt,
    string Status,
    string? UsedByUserId,
    DateTimeOffset? UsedAt);

public sealed record RedeemResultDto(
    string GroupId, GroupRole Role, string GroupName, bool AlreadyMember);
