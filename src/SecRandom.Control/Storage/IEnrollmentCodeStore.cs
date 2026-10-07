using SecRandom.Control.Domain;

namespace SecRandom.Control.Storage;

public interface IEnrollmentCodeStore
{
    Task<EnrollmentCode?> GetAsync(string code, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<EnrollmentCode>> ListByGroupAsync(
        string groupId, CancellationToken cancellationToken = default);

    Task SaveAsync(EnrollmentCode code, CancellationToken cancellationToken = default);

    Task<bool> TryRedeemAsync(
        string code, string nodeId, DateTimeOffset usedAt, CancellationToken cancellationToken = default);

    Task<bool> TryRevokeAsync(string code, DateTimeOffset revokedAt, CancellationToken cancellationToken = default);

    Task<int> PurgeExpiredBeforeAsync(DateTimeOffset cutoff, CancellationToken cancellationToken = default);
}
