namespace SecRandom.Control.Authentication;









public enum TokenRefreshStatus
{
    
    Refreshed,

    



    Rejected,

    



    Unavailable
}


public sealed record RefreshedTokenPair(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt);


public sealed record TokenRefreshResult(TokenRefreshStatus Status, RefreshedTokenPair? Tokens)
{
    public static TokenRefreshResult Refreshed(RefreshedTokenPair tokens) =>
        new(TokenRefreshStatus.Refreshed, tokens);

    public static TokenRefreshResult Rejected() => new(TokenRefreshStatus.Rejected, null);

    public static TokenRefreshResult Unavailable() => new(TokenRefreshStatus.Unavailable, null);
}
