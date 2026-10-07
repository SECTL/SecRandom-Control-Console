namespace SecRandom.Control.Domain;






public sealed record Member
{
    public required string UserId { get; init; }

    public required GroupRole Role { get; init; }

    public required DateTimeOffset JoinedAt { get; init; }

    





    public string? DisplayName { get; init; }

    















    public string? AvatarUrl { get; init; }

    




    public string? Visibility { get; init; }
}
