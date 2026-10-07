using SecRandom.Control.Domain;
using SecRandom.Control.Storage;

namespace SecRandom.Control.Authorization;

















public sealed class AuthorizationGate(IGroupStore groupStore) : IAuthorizationGate
{
    public async Task<AuthorizationDecision> AuthorizeCommandAsync(
        string groupId,
        string actorUserId,
        string nodeId,
        string capability,
        CancellationToken cancellationToken = default)
    {
        
        var minimumRole = CapabilityRequirements.MinimumRole(capability);
        if (minimumRole is null)
            return AuthorizationDecision.Deny(CommandDenialReason.UnknownCapability);

        
        var member = await groupStore.GetMemberAsync(groupId, actorUserId, cancellationToken)
            .ConfigureAwait(false);
        if (member is null)
            return AuthorizationDecision.Deny(CommandDenialReason.NotAGroupMember);

        
        if (member.Role < minimumRole.Value)
            return AuthorizationDecision.Deny(CommandDenialReason.InsufficientRole);

        
        var node = await groupStore.GetNodeAsync(groupId, nodeId, cancellationToken).ConfigureAwait(false);
        if (node is null)
            return AuthorizationDecision.Deny(CommandDenialReason.NodeNotInGroup);

        
        
        if (!node.Supports(capability))
            return AuthorizationDecision.Deny(CommandDenialReason.NodeDoesNotSupportCapability);

        return AuthorizationDecision.Allow();
    }

    









    public async Task<AuthorizationDecision> AuthorizeCommandRevokeAsync(
        string groupId,
        string actorUserId,
        string capability,
        CancellationToken cancellationToken = default)
    {
        
        var minimumRole = CapabilityRequirements.MinimumRole(capability);
        if (minimumRole is null)
            return AuthorizationDecision.Deny(CommandDenialReason.UnknownCapability);

        
        var member = await groupStore.GetMemberAsync(groupId, actorUserId, cancellationToken)
            .ConfigureAwait(false);
        if (member is null)
            return AuthorizationDecision.Deny(CommandDenialReason.NotAGroupMember);

        
        if (member.Role < minimumRole.Value)
            return AuthorizationDecision.Deny(CommandDenialReason.InsufficientRole);

        return AuthorizationDecision.Allow();
    }

    






    public AuthorizationDecision AuthorizeMemberMutation(Member actor, GroupRole targetRole) =>
        actor.Role.Outranks(targetRole)
            ? AuthorizationDecision.Allow()
            : AuthorizationDecision.Deny(CommandDenialReason.InsufficientRole);

    
    public AuthorizationDecision AuthorizeInviteCreation(Member actor, GroupRole inviteRole) =>
        actor.Role.CanInviteAs(inviteRole)
            ? AuthorizationDecision.Allow()
            : AuthorizationDecision.Deny(CommandDenialReason.InsufficientRole);
}
