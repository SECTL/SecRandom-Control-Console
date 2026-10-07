namespace SecRandom.Control.Authentication;


































public interface IIdentityProviderModule
{
    



    string Name { get; }

    
    void Register(IServiceCollection services, IConfiguration configuration);

    


















    bool IsConfigured(IConfiguration configuration) => true;
}
