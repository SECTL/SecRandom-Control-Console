namespace SecRandom.Control.Authentication;













public static class AuthConstants
{
    
    public const string SessionSchemeName = "ConsoleSession";

    
    public const string SchemeName = SessionSchemeName;

    



    public const string NodeBearerSchemeName = "NodeBearer";

    public const string NodeDeviceTokenSchemeName = "NodeDeviceToken";

    



    public const string AppBearerSchemeName = "AppBearer";

    
    public const string UserIdClaim = "srctrl:user_id";

    
    public const string SessionIdClaim = "srctrl:session_id";

    
    public const string DisplayNameClaim = "srctrl:display_name";

    



    public const string AvatarUrlClaim = "srctrl:avatar_url";

    


    public const string DeviceIdClaim = "srctrl:device_id";

    public const string NodeIdClaim = "srctrl:node_id";

    public const string GroupIdClaim = "srctrl:group_id";

    
    public const string PlatformIdClaim = "srctrl:platform_id";

    
    public const string ScopeClaim = "srctrl:scope";

    
    public const string ExpiresAtClaim = "srctrl:expires_at";
}
