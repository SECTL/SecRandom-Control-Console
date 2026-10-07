using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SecRandom.Control.Api;
using SecRandom.Control.Authentication;
using SecRandom.Control.Configuration;
using SecRandom.Control.Setup;

namespace SecRandom.Control.Identity.Local;


public sealed class LocalIdentityProviderModule : IIdentityProviderModule, IInstanceProvisioner
{
    public const string ProviderName = "local";

    public const string DisplayNameText = "本地账号";

    private IConfiguration? _configuration;

    public string Name => ProviderName;

    public string Mode => ProviderName;

    public string DisplayName => DisplayNameText;

    public bool RequiresCredentials => true;

    public bool IsConfigured(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        try
        {
            var dataRoot = ControlOptions.FromConfiguration(configuration).DataRoot;
            var state = InstanceStateStore.Read(InstanceStateStore.FilePathFor(dataRoot));

            return state is not null && string.Equals(state.Mode, ProviderName, StringComparison.OrdinalIgnoreCase);
        }
        catch (Exception exception) when (
            exception is IOException or UnauthorizedAccessException or ArgumentException or
            JsonException or NotSupportedException or InvalidOperationException)
        {
            return false;
        }
    }

    public void Register(IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        _configuration = configuration;

        services.AddSingleton(sp => new LocalAccountStore(
            sp.GetRequiredService<IOptions<ControlOptions>>().Value));
        services.AddSingleton<IPasswordAuthenticator, LocalPasswordAuthenticator>();
        services.AddSingleton<IInstanceProvisioner>(this);
        services.AddSingleton<ISessionCredentialVault, LocalSessionCredentialVault>();
        services.AddSingleton<IConsoleSessionVerifier, LocalConsoleSessionVerifier>();
    }

    public Task<InstanceProvisionResult> ProvisionAsync(
        InstanceProvisionRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        var configuration = _configuration;
        if (configuration is null)
            return Task.FromResult(InstanceProvisionResult.Fail(ErrorCodes.ServiceUnavailable));

        if (LocalAccountStore.ValidateUserName(request.AdminUserName) is { } userNameFailure)
            return Task.FromResult(InstanceProvisionResult.Fail(userNameFailure));

        if (LocalAccountStore.ValidatePassword(request.AdminPassword) is { } passwordFailure)
            return Task.FromResult(InstanceProvisionResult.Fail(passwordFailure));

        try
        {
            var store = new LocalAccountStore(ControlOptions.FromConfiguration(configuration));
            store.Create(
                request.AdminUserName ?? string.Empty,
                request.AdminPassword ?? string.Empty,
                request.DisplayName);
        }
        catch (Exception exception) when (
            exception is IOException or UnauthorizedAccessException or ArgumentException or
            JsonException or NotSupportedException or InvalidOperationException)
        {
            return Task.FromResult(InstanceProvisionResult.Fail(ErrorCodes.ServiceUnavailable));
        }

        return Task.FromResult(InstanceProvisionResult.Ok());
    }
}
