namespace SecRandom.Control.Domain;


























public enum GroupRole
{
    
    Viewer = 0,

    
    Operator = 10,

    



    Admin = 30,

    
    Owner = 40
}










public static class GroupRoleLegacy
{
    
    public const int ManagerValue = 20;

    
    public static GroupRole FromPersisted(int raw) =>
        raw == ManagerValue ? GroupRole.Admin : (GroupRole)raw;
}

public static class GroupRoleExtensions
{
    



    public static bool Outranks(this GroupRole actor, GroupRole target) => actor > target;

    



    public static bool CanInviteAs(this GroupRole actor, GroupRole inviteRole) =>
        inviteRole != GroupRole.Owner && actor.Outranks(inviteRole);
}
