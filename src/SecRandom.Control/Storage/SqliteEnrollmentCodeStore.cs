using Microsoft.Data.Sqlite;
using SecRandom.Control.Domain;

namespace SecRandom.Control.Storage;

public sealed class SqliteEnrollmentCodeStore(SqliteDatabase database) : IEnrollmentCodeStore
{
    private const string CodeSelect = """
        SELECT code, group_id, node_id, created_by_user_id, created_at, expires_at,
               used_at, used_by_node_id, revoked_at
        FROM enrollment_codes
        """;

    public async Task<EnrollmentCode?> GetAsync(string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;

        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = $"{CodeSelect} WHERE code = @code";
        command.Parameters.AddWithValue("@code", code);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        return await reader.ReadAsync(cancellationToken).ConfigureAwait(false) ? ReadCode(reader) : null;
    }

    public async Task<IReadOnlyList<EnrollmentCode>> ListByGroupAsync(
        string groupId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = $"{CodeSelect} WHERE group_id = @groupId ORDER BY created_at DESC";
        command.Parameters.AddWithValue("@groupId", groupId);

        var codes = new List<EnrollmentCode>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            codes.Add(ReadCode(reader));

        return codes;
    }

    public async Task SaveAsync(EnrollmentCode code, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO enrollment_codes (
                code, group_id, node_id, created_by_user_id, created_at, expires_at,
                used_at, used_by_node_id, revoked_at)
            VALUES (
                @code, @groupId, @nodeId, @createdByUserId, @createdAt, @expiresAt,
                @usedAt, @usedByNodeId, @revokedAt)
            ON CONFLICT (code) DO UPDATE SET
                group_id = excluded.group_id,
                node_id = excluded.node_id,
                created_by_user_id = excluded.created_by_user_id,
                created_at = excluded.created_at,
                expires_at = excluded.expires_at,
                used_at = excluded.used_at,
                used_by_node_id = excluded.used_by_node_id,
                revoked_at = excluded.revoked_at
            """;
        command.Parameters.AddWithValue("@code", code.Code);
        command.Parameters.AddWithValue("@groupId", code.GroupId);
        command.Parameters.AddWithValue("@nodeId", (object?)code.NodeId ?? DBNull.Value);
        command.Parameters.AddWithValue("@createdByUserId", (object?)code.CreatedByUserId ?? DBNull.Value);
        command.Parameters.AddWithValue("@createdAt", ToMillis(code.CreatedAt));
        command.Parameters.AddWithValue("@expiresAt", ToMillis(code.ExpiresAt));
        command.Parameters.AddWithValue("@usedAt", code.UsedAt is { } usedAt ? ToMillis(usedAt) : DBNull.Value);
        command.Parameters.AddWithValue("@usedByNodeId", (object?)code.UsedByNodeId ?? DBNull.Value);
        command.Parameters.AddWithValue(
            "@revokedAt", code.RevokedAt is { } revokedAt ? ToMillis(revokedAt) : DBNull.Value);

        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> TryRedeemAsync(
        string code, string nodeId, DateTimeOffset usedAt, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE enrollment_codes
            SET used_at = @usedAt, used_by_node_id = @nodeId
            WHERE code = @code AND used_at IS NULL AND revoked_at IS NULL AND expires_at > @usedAt
            """;
        command.Parameters.AddWithValue("@code", code);
        command.Parameters.AddWithValue("@nodeId", nodeId);
        command.Parameters.AddWithValue("@usedAt", ToMillis(usedAt));

        return await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false) > 0;
    }

    public async Task<bool> TryRevokeAsync(
        string code, DateTimeOffset revokedAt, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE enrollment_codes
            SET revoked_at = @revokedAt
            WHERE code = @code AND revoked_at IS NULL
            """;
        command.Parameters.AddWithValue("@code", code);
        command.Parameters.AddWithValue("@revokedAt", ToMillis(revokedAt));

        return await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false) > 0;
    }

    public async Task<int> PurgeExpiredBeforeAsync(DateTimeOffset cutoff, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            DELETE FROM enrollment_codes
            WHERE expires_at < @cutoff AND used_at IS NULL AND revoked_at IS NULL
            """;
        command.Parameters.AddWithValue("@cutoff", ToMillis(cutoff));

        return await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    private static EnrollmentCode ReadCode(SqliteDataReader reader) => new()
    {
        Code = reader.GetString(0),
        GroupId = reader.GetString(1),
        NodeId = reader.IsDBNull(2) ? null : reader.GetString(2),
        CreatedByUserId = reader.IsDBNull(3) ? null : reader.GetString(3),
        CreatedAt = FromMillis(reader.GetInt64(4)),
        ExpiresAt = FromMillis(reader.GetInt64(5)),
        UsedAt = reader.IsDBNull(6) ? null : FromMillis(reader.GetInt64(6)),
        UsedByNodeId = reader.IsDBNull(7) ? null : reader.GetString(7),
        RevokedAt = reader.IsDBNull(8) ? null : FromMillis(reader.GetInt64(8))
    };

    private static long ToMillis(DateTimeOffset value) => value.ToUnixTimeMilliseconds();

    private static DateTimeOffset FromMillis(long value) => DateTimeOffset.FromUnixTimeMilliseconds(value);
}
