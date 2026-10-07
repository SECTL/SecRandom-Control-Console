namespace SecRandom.Control.Authorization;


public enum CommandDenialReason
{
    
    NotAGroupMember,

    
    InsufficientRole,

    
    UnknownCapability,

    
    NodeNotInGroup,

    
    NodeDoesNotSupportCapability
}




public readonly record struct AuthorizationDecision(bool Allowed, CommandDenialReason? Reason = null)
{
    public static AuthorizationDecision Allow() => new(true);

    public static AuthorizationDecision Deny(CommandDenialReason reason) => new(false, reason);
}













public interface IAuthorizationGate
{
    



    Task<AuthorizationDecision> AuthorizeCommandAsync(
        string groupId,
        string actorUserId,
        string nodeId,
        string capability,
        CancellationToken cancellationToken = default);

    


















    Task<AuthorizationDecision> AuthorizeCommandRevokeAsync(
        string groupId,
        string actorUserId,
        string capability,
        CancellationToken cancellationToken = default);
}
