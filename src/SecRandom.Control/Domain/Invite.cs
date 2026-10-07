namespace SecRandom.Control.Domain;










public sealed record Invite
{
    
    public required string Code { get; init; }

    public required string GroupId { get; init; }

    
    public required GroupRole Role { get; init; }

    public required string CreatedByUserId { get; init; }

    public required DateTimeOffset CreatedAt { get; init; }

    public required DateTimeOffset ExpiresAt { get; init; }

    



    public string? ExpectedUserId { get; init; }

    public string? UsedByUserId { get; init; }

    public DateTimeOffset? UsedAt { get; init; }

    public DateTimeOffset? RevokedAt { get; init; }

    
    public string? RevokedByUserId { get; init; }

    



    public InviteStatus Status(DateTimeOffset now) =>
        RevokedAt is not null ? InviteStatus.Revoked
        : UsedAt is not null ? InviteStatus.Used
        : now >= ExpiresAt ? InviteStatus.Expired
        : InviteStatus.Pending;
}

public enum InviteStatus
{
    
    Pending,

    
    Used,

    
    Expired,

    
    Revoked
}
