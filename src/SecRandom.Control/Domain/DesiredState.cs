namespace SecRandom.Control.Domain;

















public sealed record DesiredState
{
    
    public required string GroupId { get; init; }

    
    public required string NodeId { get; init; }

    


    public required long Revision { get; init; }

    



    public bool DrawLocked { get; init; }

    
    public string? PolicyVersion { get; init; }

    public required DateTimeOffset UpdatedAt { get; init; }
}
