namespace SecRandom.Control.Domain;














public sealed record OwnerTransfer
{
    public required string TransferId { get; init; }

    public required string GroupId { get; init; }

    public required string FromUserId { get; init; }

    public required string ToUserId { get; init; }

    public required DateTimeOffset CreatedAt { get; init; }

    public required DateTimeOffset ExpiresAt { get; init; }

    
    public required bool InitiatorReauthenticated { get; init; }

    public TransferStatus Status { get; init; } = TransferStatus.Pending;

    public DateTimeOffset? ResolvedAt { get; init; }

    
    public GroupRole DemotedTo { get; init; } = GroupRole.Admin;

    public TransferStatus EffectiveStatus(DateTimeOffset now) =>
        Status == TransferStatus.Pending && now >= ExpiresAt ? TransferStatus.Expired : Status;
}

public enum TransferStatus
{
    
    Pending,

    
    Confirmed,

    
    Rejected,

    
    Expired
}
