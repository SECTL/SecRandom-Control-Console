using SecRandom.Control.Authentication;

namespace SecRandom.Control.Identity.Local;


public sealed class LocalSessionCredentialVault : ISessionCredentialVault
{
    private const string Marker = LocalIdentityProviderModule.ProviderName;

    public string Protect(SessionCredential credentials)
    {
        ArgumentNullException.ThrowIfNull(credentials);
        return Marker;
    }

    public SessionCredential? Unprotect(string? protectedCredentials) =>
        string.Equals(protectedCredentials, Marker, StringComparison.Ordinal)
            ? new SessionCredential(Marker, Marker, DateTimeOffset.MaxValue, DateTimeOffset.UnixEpoch)
            : null;
}


public sealed class LocalConsoleSessionVerifier : IConsoleSessionVerifier
{
    public Task<SessionVerification> VerifyAsync(AuthSession session) =>
        Task.FromResult(session is null ? SessionVerification.Revoked : SessionVerification.Valid);
}
