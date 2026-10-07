using Microsoft.Data.Sqlite;

namespace SecRandom.Control.Storage;








public sealed class SqliteGroupOrderStore(SqliteDatabase database) : IGroupOrderStore
{
    public async Task<IReadOnlyList<string>> GetOrderAsync(
        string userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText =
            "SELECT group_id FROM user_group_order WHERE user_id = @userId ORDER BY position";
        command.Parameters.AddWithValue("@userId", userId);

        var result = new List<string>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            result.Add(reader.GetString(0));

        return result;
    }

    public async Task SaveOrderAsync(
        string userId, IReadOnlyList<string> groupIds, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);

        
        
        await using var transaction = (SqliteTransaction)await connection
            .BeginTransactionAsync(cancellationToken).ConfigureAwait(false);

        await using (var delete = connection.CreateCommand())
        {
            delete.Transaction = transaction;
            delete.CommandText = "DELETE FROM user_group_order WHERE user_id = @userId";
            delete.Parameters.AddWithValue("@userId", userId);
            await delete.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        }

        for (var position = 0; position < groupIds.Count; position++)
        {
            await using var insert = connection.CreateCommand();
            insert.Transaction = transaction;
            insert.CommandText = """
                INSERT INTO user_group_order (user_id, group_id, position)
                VALUES (@userId, @groupId, @position)
                """;
            insert.Parameters.AddWithValue("@userId", userId);
            insert.Parameters.AddWithValue("@groupId", groupIds[position]);
            insert.Parameters.AddWithValue("@position", position);
            await insert.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        }

        await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
    }
}
