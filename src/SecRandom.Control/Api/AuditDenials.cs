using SecRandom.Control.Domain;
using SecRandom.Control.Storage;

namespace SecRandom.Control.Api;














































internal static class AuditDenials
{
    



    internal static string NewEventId() => "evt_" + Guid.NewGuid().ToString("n")[..16];

    public static Task WriteDeniedAsync(
        IAuditStore audit,
        TimeProvider timeProvider,
        Caller caller,
        string action,
        string groupId,
        string? targetId,
        string errorCode,
        CancellationToken cancellationToken) =>
        audit.WriteAsync(new AuditEvent
        {
            EventId = NewEventId(),
            At = timeProvider.GetUtcNow(),
            ActorUserId = caller.UserId,
            ActorDeviceId = caller.AuditDeviceId,
            Action = action,
            Outcome = AuditOutcomes.Denied,
            GroupId = groupId,
            TargetId = targetId,
            Detail = errorCode
        }, cancellationToken);
}
