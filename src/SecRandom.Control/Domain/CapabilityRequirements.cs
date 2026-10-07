namespace SecRandom.Control.Domain;























public static class CapabilityRequirements
{
    private static readonly Dictionary<string, GroupRole> MinimumRoleByCapability =
        new(StringComparer.Ordinal)
        {
            [NodeCapabilities.StatusRead] = GroupRole.Viewer,
            [NodeCapabilities.ProofList] = GroupRole.Viewer,

            [NodeCapabilities.DrawLock] = GroupRole.Operator,
            [NodeCapabilities.DrawTrigger] = GroupRole.Operator,
            [NodeCapabilities.MediaPlay] = GroupRole.Operator,

            
            [NodeCapabilities.DrawReset] = GroupRole.Operator,

            [NodeCapabilities.RosterRead] = GroupRole.Admin,

        
        
        [NodeCapabilities.SettingsRead] = GroupRole.Operator,
            [NodeCapabilities.SettingsWrite] = GroupRole.Admin,

            [NodeCapabilities.RosterWrite] = GroupRole.Admin
        };

    



    public static GroupRole? MinimumRole(string capability) =>
        MinimumRoleByCapability.TryGetValue(capability, out var role) ? role : null;

    public static bool IsKnown(string capability) => MinimumRoleByCapability.ContainsKey(capability);

    public static IReadOnlyCollection<string> All => MinimumRoleByCapability.Keys;
}
