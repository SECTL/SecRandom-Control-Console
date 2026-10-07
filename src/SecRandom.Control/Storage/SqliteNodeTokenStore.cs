using Microsoft.Data.Sqlite;
using SecRandom.Control.Domain;

namespace SecRandom.Control.Storage;

public sealed class SqliteNodeTokenStore(SqliteDatabase database) : INodeTokenStore
{
    private const string TokenSelect = """
        SELECT token_id, secret_hash, group_id, node_id, enrolled_by_user_id, created_at, expires_at,
               revoked_at, revoked_by_user_id, last_used_at
        FROM node_tokens
        """;

    public async Task<NodeToken?> GetAsync(string tokenId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(tokenId))
            return null;

        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = $"{TokenSelect} WHERE token_id = @tokenId";
        command.Parameters.AddWithValue("@tokenId", tokenId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        return await reader.ReadAsync(cancellationToken).ConfigureAwait(false) ? ReadToken(reader) : null;
    }

    public async Task<IReadOnlyList<NodeToken>> ListByNodeAsync(
        string groupId, string nodeId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = $"{TokenSelect} WHERE group_id = @groupId AND node_id = @nodeId ORDER BY created_at DESC";
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@nodeId", nodeId);

        var tokens = new List<NodeToken>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            tokens.Add(ReadToken(reader));

        return tokens;
    }

    public async Task<NodeToken?> GetActiveByNodeAsync(
        string groupId, string nodeId, DateTimeOffset now, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = $"""
            {TokenSelect}
            WHERE group_id = @groupId AND node_id = @nodeId AND revoked_at IS NULL AND expires_at > @now
            ORDER BY created_at DESC
            LIMIT 1
            """;
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@nodeId", nodeId);
        command.Parameters.AddWithValue("@now", ToMillis(now));

        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        return await reader.ReadAsync(cancellationToken).ConfigureAwait(false) ? ReadToken(reader) : null;
    }

    public async Task<Dictionary<string, NodeToken>> GetActiveByGroupAsync(
        string groupId, DateTimeOffset now, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = $"""
            {TokenSelect}
            WHERE group_id = @groupId AND revoked_at IS NULL AND expires_at > @now
            ORDER BY created_at DESC
            """;
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@now", ToMillis(now));

        var result = new Dictionary<string, NodeToken>(StringComparer.Ordinal);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            var token = ReadToken(reader);
            if (!result.ContainsKey(token.NodeId))
                result[token.NodeId] = token;
        }

        return result;
    }

    public async Task SaveAsync(NodeToken token, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO node_tokens (
                token_id, secret_hash, group_id, node_id, enrolled_by_user_id,
                created_at, expires_at, revoked_at, revoked_by_user_id, last_used_at)
            VALUES (
                @tokenId, @secretHash, @groupId, @nodeId, @enrolledByUserId,
                @createdAt, @expiresAt, @revokedAt, @revokedByUserId, @lastUsedAt)
            ON CONFLICT (token_id) DO UPDATE SET
                secret_hash = excluded.secret_hash,
                group_id = excluded.group_id,
                node_id = excluded.node_id,
                enrolled_by_user_id = excluded.enrolled_by_user_id,
                created_at = excluded.created_at,
                expires_at = excluded.expires_at,
                revoked_at = excluded.revoked_at,
                revoked_by_user_id = excluded.revoked_by_user_id,
                last_used_at = excluded.last_used_at
            """;
        command.Parameters.AddWithValue("@tokenId", token.TokenId);
        command.Parameters.AddWithValue("@secretHash", token.SecretHash);
        command.Parameters.AddWithValue("@groupId", token.GroupId);
        command.Parameters.AddWithValue("@nodeId", token.NodeId);
        command.Parameters.AddWithValue("@enrolledByUserId", (object?)token.EnrolledByUserId ?? DBNull.Value);
        command.Parameters.AddWithValue("@createdAt", ToMillis(token.CreatedAt));
        command.Parameters.AddWithValue("@expiresAt", ToMillis(token.ExpiresAt));
        command.Parameters.AddWithValue(
            "@revokedAt", token.RevokedAt is { } revokedAt ? ToMillis(revokedAt) : DBNull.Value);
        command.Parameters.AddWithValue("@revokedByUserId", (object?)token.RevokedByUserId ?? DBNull.Value);
        command.Parameters.AddWithValue(
            "@lastUsedAt", token.LastUsedAt is { } lastUsedAt ? ToMillis(lastUsedAt) : DBNull.Value);

        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> TryRevokeAsync(
        string tokenId, DateTimeOffset revokedAt, string? revokedByUserId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE node_tokens
            SET revoked_at = @revokedAt, revoked_by_user_id = @revokedByUserId
            WHERE token_id = @tokenId AND revoked_at IS NULL
            """;
        command.Parameters.AddWithValue("@tokenId", tokenId);
        command.Parameters.AddWithValue("@revokedAt", ToMillis(revokedAt));
        command.Parameters.AddWithValue("@revokedByUserId", (object?)revokedByUserId ?? DBNull.Value);

        return await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false) > 0;
    }

    public async Task<int> RevokeActiveByNodeAsync(
        string groupId, string nodeId, DateTimeOffset revokedAt, string? revokedByUserId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE node_tokens
            SET revoked_at = @revokedAt, revoked_by_user_id = @revokedByUserId
            WHERE group_id = @groupId AND node_id = @nodeId AND revoked_at IS NULL
            """;
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@nodeId", nodeId);
        command.Parameters.AddWithValue("@revokedAt", ToMillis(revokedAt));
        command.Parameters.AddWithValue("@revokedByUserId", (object?)revokedByUserId ?? DBNull.Value);

        return await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task TouchAsync(string tokenId, DateTimeOffset usedAt, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = "UPDATE node_tokens SET last_used_at = @usedAt WHERE token_id = @tokenId";
        command.Parameters.AddWithValue("@tokenId", tokenId);
        command.Parameters.AddWithValue("@usedAt", ToMillis(usedAt));

        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<int> PurgeExpiredBeforeAsync(DateTimeOffset cutoff, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM node_tokens WHERE expires_at < @cutoff AND revoked_at IS NULL";
        command.Parameters.AddWithValue("@cutoff", ToMillis(cutoff));

        return await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    private static NodeToken ReadToken(SqliteDataReader reader) => new()
    {
        TokenId = reader.GetString(0),
        SecretHash = reader.GetString(1),
        GroupId = reader.GetString(2),
        NodeId = reader.GetString(3),
        EnrolledByUserId = reader.IsDBNull(4) ? null : reader.GetString(4),
        CreatedAt = FromMillis(reader.GetInt64(5)),
        ExpiresAt = FromMillis(reader.GetInt64(6)),
        RevokedAt = reader.IsDBNull(7) ? null : FromMillis(reader.GetInt64(7)),
        RevokedByUserId = reader.IsDBNull(8) ? null : reader.GetString(8),
        LastUsedAt = reader.IsDBNull(9) ? null : FromMillis(reader.GetInt64(9))
    };

    private static long ToMillis(DateTimeOffset value) => value.ToUnixTimeMilliseconds();

    private static DateTimeOffset FromMillis(long value) => DateTimeOffset.FromUnixTimeMilliseconds(value);
}
