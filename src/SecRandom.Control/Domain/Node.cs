namespace SecRandom.Control.Domain;

























public sealed record Node
{
    public required string NodeId { get; init; }

    public required string GroupId { get; init; }

    
    public required string Platform { get; init; }

    
    public required string Version { get; init; }

    



    public IReadOnlyList<string> Capabilities { get; init; } = [];

    



    public bool LocalRemoteAllowed { get; init; }

    public string? EnrolledByUserId { get; init; }

    


















    public string? DisplayName { get; init; }

    public DateTimeOffset? LastHeartbeatAt { get; init; }

    public required DateTimeOffset RegisteredAt { get; init; }

    public bool Supports(string capability) =>
        Capabilities.Contains(capability, StringComparer.Ordinal);
}
