using SecRandom.Control.Domain;

namespace SecRandom.Control.Storage;






public interface IGroupStore
{
    Task<Group?> GetGroupAsync(string groupId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Group>> ListGroupsForMemberAsync(string userId, CancellationToken cancellationToken = default);

    Task<Member?> GetMemberAsync(string groupId, string userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Member>> ListMembersAsync(string groupId, CancellationToken cancellationToken = default);

    Task<Node?> GetNodeAsync(string groupId, string nodeId, CancellationToken cancellationToken = default);

    Task SaveNodeAsync(Node node, CancellationToken cancellationToken = default);

    Task<bool> SetNodeEnrolledByAsync(
        string groupId, string nodeId, string? enrolledByUserId, CancellationToken cancellationToken = default);

    











    Task DeleteNodeAsync(string groupId, string nodeId, CancellationToken cancellationToken = default);

    







    Task<Group> CreateGroupAsync(string name, string ownerUserId, string? ownerDisplayName,
        string? ownerAvatarUrl, CancellationToken cancellationToken = default);

    




    Task<bool> TryUpdateMemberRoleAsync(string groupId, string userId, GroupRole expectedRole, GroupRole newRole,
        CancellationToken cancellationToken = default);

    Task<bool> TryRemoveMemberAsync(string groupId, string userId, GroupRole expectedRole,
        CancellationToken cancellationToken = default);

    Task AddMemberAsync(string groupId, Member member, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Node>> ListNodesAsync(string groupId, CancellationToken cancellationToken = default);

    


    Task<Group?> TryRenameGroupAsync(string groupId, string name, CancellationToken cancellationToken = default);

    














































    Task<bool> DeleteGroupAsync(
        string groupId, string expectedOwnerUserId, CancellationToken cancellationToken = default);

    







    Task<bool> TryTransferOwnershipAsync(
        string groupId,
        string fromUserId,
        string toUserId,
        GroupRole expectedFromRole,
        GroupRole demoteTo,
        CancellationToken cancellationToken = default);

    
    Task UpdateGroupOwnerAsync(string groupId, string ownerUserId, CancellationToken cancellationToken = default);

    

    



    Task SaveInviteAsync(Invite invite, CancellationToken cancellationToken = default);

    
    Task<Invite?> GetInviteByCodeAsync(string code, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Invite>> ListInvitesAsync(string groupId, CancellationToken cancellationToken = default);

    

    Task SaveTransferAsync(OwnerTransfer transfer, CancellationToken cancellationToken = default);

    Task<OwnerTransfer?> GetTransferAsync(string transferId, CancellationToken cancellationToken = default);

    
    Task<OwnerTransfer?> GetPendingTransferAsync(string groupId, CancellationToken cancellationToken = default);

    

    Task SaveCommandAsync(NodeCommand command, CancellationToken cancellationToken = default);

    Task<NodeCommand?> GetCommandAsync(string commandId, CancellationToken cancellationToken = default);

    



















    Task<bool> TryRevokeCommandAsync(
        string groupId, string commandId, DateTimeOffset now, CancellationToken cancellationToken = default);

    
















    Task<bool> MarkCommandDeliveredAsync(
        string commandId, DateTimeOffset at, CancellationToken cancellationToken = default);

    



















    Task<IReadOnlyList<NodeCommand>> GetDeliverableCommandsAsync(
        string groupId, string nodeId, DateTimeOffset now, int limit, CancellationToken cancellationToken = default);

    

    







    Task SaveDesiredStateAsync(DesiredState state, CancellationToken cancellationToken = default);

    
    Task<DesiredState?> GetDesiredStateAsync(
        string groupId, string nodeId, CancellationToken cancellationToken = default);
}
