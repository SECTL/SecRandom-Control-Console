using SecRandom.Control.Authentication;

namespace SecRandom.Control.Identity.Local;


public sealed class LocalPasswordAuthenticator : IPasswordAuthenticator
{
    private readonly LocalAccountStore _store;

    public LocalPasswordAuthenticator(LocalAccountStore store)
    {
        _store = store;
    }

    public Task<ProviderLoginResult?> AuthenticateWithPasswordAsync(
        string userName, string password, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(userName);
        ArgumentNullException.ThrowIfNull(password);

        return Task.Run<ProviderLoginResult?>(() =>
        {
            var account = _store.Find(userName.Trim());
            if (account is null)
            {
                LocalAccountStore.VerifyDummy(password);
                return null;
            }

            if (!_store.Verify(account, password))
                return null;

            return new ProviderLoginResult(
                account.UserId,
                account.DisplayName,
                null,
                null,
                LocalIdentityProviderModule.ProviderName,
                LocalIdentityProviderModule.ProviderName,
                null);
        }, cancellationToken);
    }
}
