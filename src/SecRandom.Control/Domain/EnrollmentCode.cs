namespace SecRandom.Control.Domain;

public sealed record EnrollmentCode
{
    public required string Code { get; init; }

    public required string GroupId { get; init; }

    public string? NodeId { get; init; }

    public string? CreatedByUserId { get; init; }

    public required DateTimeOffset CreatedAt { get; init; }

    public required DateTimeOffset ExpiresAt { get; init; }

    public DateTimeOffset? UsedAt { get; init; }

    public string? UsedByNodeId { get; init; }

    public DateTimeOffset? RevokedAt { get; init; }

    public EnrollmentCodeStatus Status(DateTimeOffset now) =>
        RevokedAt is not null ? EnrollmentCodeStatus.Revoked
        : UsedAt is not null ? EnrollmentCodeStatus.Used
        : now >= ExpiresAt ? EnrollmentCodeStatus.Expired
        : EnrollmentCodeStatus.Pending;
}

public enum EnrollmentCodeStatus
{
    Pending,
    Used,
    Expired,
    Revoked
}
