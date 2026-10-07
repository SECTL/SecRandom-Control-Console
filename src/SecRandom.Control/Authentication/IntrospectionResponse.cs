namespace SecRandom.Control.Authentication;
















public sealed record IntrospectionResponse(
    string UserId,
    string? PlatformId,
    string? Scope,
    DateTimeOffset? ExpiresAt);















public interface ITokenIntrospector
{
    
    Task<IntrospectionResult> IntrospectAsync(
        string accessToken,
        IntrospectionAudience audience = IntrospectionAudience.ConsoleSession,
        CancellationToken cancellationToken = default);
}
















public enum IntrospectionAudience
{
    
    ConsoleSession,

    
    Node,

    







    ConsoleApp
}





public enum IntrospectionStatus
{
    
    Active,

    
    Inactive,

    
    Unavailable
}


public sealed record IntrospectionResult(IntrospectionStatus Status, IntrospectionResponse? Response)
{
    public static IntrospectionResult Active(IntrospectionResponse response) =>
        new(IntrospectionStatus.Active, response);

    public static IntrospectionResult Inactive() => new(IntrospectionStatus.Inactive, null);

    public static IntrospectionResult Unavailable() => new(IntrospectionStatus.Unavailable, null);
}
