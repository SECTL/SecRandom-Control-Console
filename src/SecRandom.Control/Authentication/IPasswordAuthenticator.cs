namespace SecRandom.Control.Authentication;


public interface IPasswordAuthenticator
{
    Task<ProviderLoginResult?> AuthenticateWithPasswordAsync(
        string userName, string password, CancellationToken cancellationToken = default);
}
