namespace SecRandom.Control.Authentication;
















public sealed class OAuthProviderOptions
{
    
    public string AuthorizeEndpoint { get; set; } = string.Empty;

    
    public string TokenEndpoint { get; set; } = string.Empty;

    



    public string RedirectUri { get; set; } = string.Empty;
}
