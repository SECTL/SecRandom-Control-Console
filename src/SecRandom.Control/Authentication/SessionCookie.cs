using Microsoft.AspNetCore.Http;
using SecRandom.Control.Configuration;

namespace SecRandom.Control.Authentication;








internal static class SessionCookie
{
    



    public static string Name(AuthOptions options) =>
        options.CookieSecure ? "__Host-" + options.SessionCookieName : options.SessionCookieName;

    public static CookieOptions Build(AuthOptions options, DateTimeOffset expiresAt) => new()
    {
        HttpOnly = true,                 
        Secure = options.CookieSecure,   
        SameSite = SameSiteMode.Lax,     
        Path = "/",
        Expires = expiresAt
    };

    public static void Append(
        HttpResponse response, AuthOptions options, string sessionId, DateTimeOffset expiresAt) =>
        response.Cookies.Append(Name(options), sessionId, Build(options, expiresAt));

    
    public static void Delete(HttpResponse response, AuthOptions options) =>
        response.Cookies.Delete(Name(options), Build(options, DateTimeOffset.UnixEpoch));
}
