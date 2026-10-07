using SecRandom.Control.Domain;

namespace SecRandom.Control.Storage;

public interface INodeTokenStore
{
    Task<NodeToken?> GetAsync(string tokenId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<NodeToken>> ListByNodeAsync(
        string groupId, string nodeId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<NodeToken>> ListByGroupAsync(
        string groupId, CancellationToken cancellationToken = default);

    Task<NodeToken?> GetActiveByNodeAsync(
        string groupId, string nodeId, DateTimeOffset now, CancellationToken cancellationToken = default);

    Task<Dictionary<string, NodeToken>> GetActiveByGroupAsync(
        string groupId, DateTimeOffset now, CancellationToken cancellationToken = default);

    Task SaveAsync(NodeToken token, CancellationToken cancellationToken = default);

    Task<bool> TryRevokeAsync(
        string tokenId, DateTimeOffset revokedAt, string? revokedByUserId,
        CancellationToken cancellationToken = default);

    Task<int> RevokeActiveByNodeAsync(
        string groupId, string nodeId, DateTimeOffset revokedAt, string? revokedByUserId,
        CancellationToken cancellationToken = default);

    Task TouchAsync(string tokenId, DateTimeOffset usedAt, CancellationToken cancellationToken = default);

    Task<int> PurgeExpiredBeforeAsync(DateTimeOffset cutoff, CancellationToken cancellationToken = default);
}
