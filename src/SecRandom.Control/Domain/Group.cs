namespace SecRandom.Control.Domain;





public sealed record Group
{
    public required string GroupId { get; init; }

    public required string Name { get; init; }

    
    public required string OwnerUserId { get; init; }

    public required DateTimeOffset CreatedAt { get; init; }
}
