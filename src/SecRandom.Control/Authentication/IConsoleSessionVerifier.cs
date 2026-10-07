namespace SecRandom.Control.Authentication;


public enum SessionVerification
{
    
    Valid,

    



    Revoked
}



















public interface IConsoleSessionVerifier
{
    







    Task<SessionVerification> VerifyAsync(AuthSession session);
}
