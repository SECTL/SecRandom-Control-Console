namespace SecRandom.Control.Domain;









public static class AuditActions
{
    public const string GroupCreated = "group.create";
    public const string GroupRenamed = "group.rename";

    






















    public const string GroupDeleted = "group.delete";

    public const string MemberInvited = "member.invite";
    public const string MemberJoined = "member.join";
    public const string MemberRoleChanged = "member.role_change";
    public const string MemberRemoved = "member.remove";

    public const string InviteCreated = "invite.create";
    public const string InviteRevoked = "invite.revoke";

    public const string TransferRequested = "transfer.request";
    public const string TransferConfirmed = "transfer.confirm";
    public const string TransferRejected = "transfer.reject";
    public const string TransferExpired = "transfer.expire";

    public const string NodeRegistered = "node.register";
    public const string NodePolicyChanged = "node.policy_change";

    







    public const string NodeCommandRevoked = "node.command_revoke";

    public const string EnrollmentCodeCreated = "enrollment.code_create";
    public const string EnrollmentCodeRevoked = "enrollment.code_revoke";
    public const string NodeEnrolled = "node.enroll";
    public const string NodeTokenIssued = "node.token_issue";
    public const string NodeTokenRevoked = "node.token_revoke";
}


public static class AuditOutcomes
{
    public const string Success = "success";
    public const string Denied = "denied";
    public const string Failed = "failed";

    






    public static IReadOnlySet<string> All { get; } =
        new HashSet<string>(StringComparer.Ordinal) { Success, Denied, Failed };
}















public sealed record AuditEvent
{
    public required string EventId { get; init; }

    public required DateTimeOffset At { get; init; }

    
    public string? ActorUserId { get; init; }

    
    public string? ActorDeviceId { get; init; }

    
    public required string Action { get; init; }

    
    public required string Outcome { get; init; }

    public string? GroupId { get; init; }

    
    public string? TargetId { get; init; }

    



    public string? Detail { get; init; }
}
