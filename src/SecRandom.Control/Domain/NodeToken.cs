namespace SecRandom.Control.Domain;

public sealed record NodeToken
{
    public required string TokenId { get; init; }

    public required string SecretHash { get; init; }

    public required string GroupId { get; init; }

    public required string NodeId { get; init; }

    public string? EnrolledByUserId { get; init; }

    public required DateTimeOffset CreatedAt { get; init; }

    public required DateTimeOffset ExpiresAt { get; init; }

    public DateTimeOffset? RevokedAt { get; init; }

    public string? RevokedByUserId { get; init; }

    public DateTimeOffset? LastUsedAt { get; init; }

    public bool IsRevoked => RevokedAt is not null;

    public bool IsExpired(DateTimeOffset now) => now >= ExpiresAt;

    public bool IsActive(DateTimeOffset now) => !IsRevoked && !IsExpired(now);
}
