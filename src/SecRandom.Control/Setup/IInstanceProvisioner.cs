namespace SecRandom.Control.Setup;


public sealed record InstanceProvisionRequest(
    string Mode,
    string? DisplayName,
    string? AdminUserName,
    string? AdminPassword);


public sealed record InstanceProvisionResult(bool Success, string? Code = null)
{
    public static InstanceProvisionResult Ok() => new(true);

    public static InstanceProvisionResult Fail(string code) => new(false, code);
}


public interface IInstanceProvisioner
{
    string Mode { get; }

    string DisplayName { get; }

    bool RequiresCredentials { get; }

    Task<InstanceProvisionResult> ProvisionAsync(
        InstanceProvisionRequest request, CancellationToken cancellationToken = default);
}
