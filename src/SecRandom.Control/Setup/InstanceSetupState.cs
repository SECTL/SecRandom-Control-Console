namespace SecRandom.Control.Setup;


public sealed record SetupMode(string Id, string DisplayName, bool Available, bool RequiresCredentials);


public sealed class InstanceSetupState
{
    public InstanceSetupState(IReadOnlyList<SetupMode> modes, bool legacyConfigured, InstanceStateStore store)
    {
        Modes = modes;
        LegacyConfigured = legacyConfigured;
        Store = store;
    }

    public IReadOnlyList<SetupMode> Modes { get; }

    public bool LegacyConfigured { get; }

    public InstanceStateStore Store { get; }

    public bool HasAvailableMode => Modes.Any(mode => mode.Available);

    public bool PendingInitialization => !Store.IsInitialized && !LegacyConfigured && HasAvailableMode;

    public SemaphoreSlim SetupLock { get; } = new(1, 1);
}
