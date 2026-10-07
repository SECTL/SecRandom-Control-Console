namespace SecRandom.Control.Authentication;











public sealed record ProviderLoginResult(
    string UserId,
    string? DisplayName,
    string? AvatarUrl,
    string? Email,
    string? AccessToken,
    string? RefreshToken,
    DateTimeOffset? AccessTokenExpiresAt);














public interface IAuthProvider
{
    
    string BuildAuthorizeUrl(string state, string codeChallenge, OAuthProviderOptions options);

    
    Task<ProviderLoginResult?> CompleteLoginAsync(
        string code, string codeVerifier, OAuthProviderOptions options,
        CancellationToken cancellationToken = default);

    











    Task<TokenRefreshResult> RefreshAsync(
        string refreshToken, OAuthProviderOptions options,
        CancellationToken cancellationToken = default);

    







    Task RevokeAccessTokenAsync(
        string accessToken, OAuthProviderOptions options,
        CancellationToken cancellationToken = default);
}
