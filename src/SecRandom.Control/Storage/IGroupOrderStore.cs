namespace SecRandom.Control.Storage;















public interface IGroupOrderStore
{
    






    Task<IReadOnlyList<string>> GetOrderAsync(string userId, CancellationToken cancellationToken = default);

    


    Task SaveOrderAsync(
        string userId, IReadOnlyList<string> groupIds, CancellationToken cancellationToken = default);
}
