using System.Security.Claims;
using SecRandom.Control.Authentication;
using SecRandom.Control.Authorization;
using SecRandom.Control.Domain;
using SecRandom.Control.Storage;

namespace SecRandom.Control.Api;








public sealed record Caller(
    string UserId,
    string? DisplayName,
    string? AvatarUrl,
    string? SessionId,
    string? DeviceId)
{
    




    public string? AuditDeviceId => DeviceId ?? (SessionId is { Length: > 8 } id ? "web:" + id[..8] : null);

    public static Caller? From(ClaimsPrincipal principal)
    {
        var userId = principal.FindFirstValue(AuthConstants.UserIdClaim);
        if (string.IsNullOrWhiteSpace(userId))
            return null;

        return new Caller(
            userId,
            principal.FindFirstValue(AuthConstants.DisplayNameClaim),
            principal.FindFirstValue(AuthConstants.AvatarUrlClaim),
            principal.FindFirstValue(AuthConstants.SessionIdClaim),
            principal.FindFirstValue(AuthConstants.DeviceIdClaim));
    }
}
















public static class Membership
{
    


    public static async Task<Member?> ResolveAsync(
        IGroupStore store, Caller caller, string groupId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(groupId))
            return null;

        return await store.GetMemberAsync(groupId, caller.UserId, cancellationToken).ConfigureAwait(false);
    }

    
    public static bool HasAtLeast(Member? member, GroupRole minimum) =>
        member is not null && member.Role >= minimum;

    





    public static bool CanManage(Member actor, GroupRole targetRole) => actor.Role.Outranks(targetRole);
}
