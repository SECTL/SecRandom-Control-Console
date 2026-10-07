namespace SecRandom.Control.Authentication;


















public sealed record SessionCredential(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt,
    DateTimeOffset RefreshTokenIssuedAt);








public interface ISessionCredentialVault
{
    
    string Protect(SessionCredential credentials);

    



    SessionCredential? Unprotect(string? protectedCredentials);
}
