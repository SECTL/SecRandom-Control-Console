using System.Globalization;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using SecRandom.Control.Domain;

namespace SecRandom.Control.Storage;






















public sealed class SqliteAuditStore(
    SqliteDatabase database,
    ILogger<SqliteAuditStore> logger) : IAuditStore
{
    
















    private const string FilterSql = """
          AND (@action  IS NULL OR action = @action)
          AND (@prefix  IS NULL OR substr(action, 1, length(@prefix) + 1) = @prefix || '.')
          AND (@outcome IS NULL OR outcome = @outcome)
          AND (@actorUser IS NULL OR actor_user_id = @actorUser)
          AND (@actorDevice IS NULL OR actor_device_id = @actorDevice)
          AND (@targetDevice IS NULL OR target_id = @targetDevice)
          AND (@from    IS NULL OR at >= @from)
          AND (@to      IS NULL OR at <= @to)
        """;

    














    private const string SelectSql = $"""
          SELECT event_id, at, actor_user_id, actor_device_id, action, outcome, group_id, target_id, detail
          FROM audit
          WHERE group_id = @groupId
        {FilterSql}
          AND (@before  IS NULL
               OR at < @before
               OR (at = @before AND @beforeId IS NOT NULL AND event_id < @beforeId))
          ORDER BY at DESC, event_id DESC
          LIMIT @limit OFFSET @offset
        """;

    







    private const string CountSql = $"""
          SELECT COUNT(*)
          FROM audit
          WHERE group_id = @groupId
        {FilterSql}
        """;

    













    private const string ActorDeviceFacetSql = """
        SELECT actor_device_id, COUNT(*) AS n
        FROM audit
        WHERE group_id = @groupId
          AND actor_device_id IS NOT NULL
          AND actor_device_id <> ''
        GROUP BY actor_device_id
        ORDER BY n DESC, actor_device_id ASC
        LIMIT @limit
        """;

    

















    private const string ActorUserFacetSql = """
        SELECT actor_user_id, COUNT(*) AS n
        FROM audit
        WHERE group_id = @groupId
          AND actor_user_id IS NOT NULL
          AND actor_user_id <> ''
        GROUP BY actor_user_id
        ORDER BY n DESC, actor_user_id ASC
        LIMIT @limit
        """;

    















    private const string TargetNodeFacetSql = """
        SELECT target_id, COUNT(*) AS n
        FROM audit
        WHERE group_id = @groupId
          AND target_id IS NOT NULL
          AND target_id <> ''
          AND action LIKE 'node.%'
        GROUP BY target_id
        ORDER BY n DESC, target_id ASC
        LIMIT @limit
        """;

    















    private const string PurgeBatchSql = """
        DELETE FROM audit
        WHERE event_id IN (
            SELECT event_id
            FROM audit
            WHERE at < @cutoff
            ORDER BY at ASC
            LIMIT @batch
        )
        """;

    













    private const int PurgeBatchSize = 500;

    public async Task WriteAsync(AuditEvent auditEvent, CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
            await using var command = connection.CreateCommand();

            
            command.CommandText = """
                INSERT OR IGNORE INTO audit
                    (event_id, at, actor_user_id, actor_device_id, action, outcome, group_id, target_id, detail)
                VALUES (@id, @at, @actor, @device, @action, @outcome, @groupId, @target, @detail)
                """;
            command.Parameters.AddWithValue("@id", auditEvent.EventId);
            command.Parameters.AddWithValue("@at", auditEvent.At.ToUnixTimeMilliseconds());
            command.Parameters.AddWithValue("@actor", (object?)auditEvent.ActorUserId ?? DBNull.Value);
            command.Parameters.AddWithValue("@device", (object?)auditEvent.ActorDeviceId ?? DBNull.Value);
            command.Parameters.AddWithValue("@action", auditEvent.Action);
            command.Parameters.AddWithValue("@outcome", auditEvent.Outcome);
            command.Parameters.AddWithValue("@groupId", (object?)auditEvent.GroupId ?? DBNull.Value);
            command.Parameters.AddWithValue("@target", (object?)auditEvent.TargetId ?? DBNull.Value);
            command.Parameters.AddWithValue("@detail", (object?)auditEvent.Detail ?? DBNull.Value);

            await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (Exception exception) when (exception is SqliteException or InvalidOperationException)
        {
            logger.LogError(
                exception,
                "审计写入失败（业务操作未受影响）：action={Action} group={GroupId}",
                auditEvent.Action, auditEvent.GroupId);
        }
    }

    public async Task<int> PurgeBeforeAsync(
        DateTimeOffset cutoff,
        CancellationToken cancellationToken = default)
    {
        
        
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);

        var cutoffMilliseconds = cutoff.ToUnixTimeMilliseconds();
        var totalDeleted = 0;

        while (true)
        {
            await using var command = connection.CreateCommand();
            command.CommandText = PurgeBatchSql;
            command.Parameters.AddWithValue("@cutoff", cutoffMilliseconds);
            command.Parameters.AddWithValue("@batch", PurgeBatchSize);

            var deleted = await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
            totalDeleted += deleted;

            
            
            if (deleted < PurgeBatchSize)
                return totalDeleted;
        }
    }

    public async Task<IReadOnlyList<AuditEvent>> ReadAsync(
        string groupId,
        int limit,
        AuditQuery? query = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(groupId) || limit <= 0)
            return [];

        var effectiveLimit = Math.Min(limit, IAuditStore.MaxReadLimit);

        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();

        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        command.CommandText = SelectSql;

        AddFilterParameters(command, groupId, query);
        command.Parameters.AddWithValue(
            "@before", query?.Before is { } cursor ? cursor.ToUnixTimeMilliseconds() : DBNull.Value);
        command.Parameters.AddWithValue(
            "@beforeId", (object?)query?.BeforeId ?? DBNull.Value);
        command.Parameters.AddWithValue("@limit", effectiveLimit);
        
        
        command.Parameters.AddWithValue("@offset", Math.Max(0, query?.Offset ?? 0));

        var result = new List<AuditEvent>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            result.Add(new AuditEvent
            {
                EventId = reader.GetString(0),
                At = DateTimeOffset.FromUnixTimeMilliseconds(reader.GetInt64(1)),
                ActorUserId = reader.IsDBNull(2) ? null : reader.GetString(2),
                ActorDeviceId = reader.IsDBNull(3) ? null : reader.GetString(3),
                Action = reader.GetString(4),
                Outcome = reader.GetString(5),
                GroupId = reader.IsDBNull(6) ? null : reader.GetString(6),
                TargetId = reader.IsDBNull(7) ? null : reader.GetString(7),
                Detail = reader.IsDBNull(8) ? null : reader.GetString(8)
            });
        }

        return result;
    }

    public async Task<int> CountAsync(
        string groupId,
        AuditQuery? query,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(groupId))
            return 0;

        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();

        
        
        command.CommandText = CountSql;
        AddFilterParameters(command, groupId, query);

        var scalar = await command.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);
        
        
        return Convert.ToInt32(scalar, CultureInfo.InvariantCulture);
    }

    













    private static void AddFilterParameters(SqliteCommand command, string groupId, AuditQuery? query)
    {
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue(
            "@action", (object?)query?.Action ?? DBNull.Value);
        command.Parameters.AddWithValue(
            "@prefix", (object?)query?.ActionPrefix ?? DBNull.Value);
        command.Parameters.AddWithValue(
            "@outcome", (object?)query?.Outcome ?? DBNull.Value);
        
        
        
        command.Parameters.AddWithValue(
            "@actorUser", (object?)query?.ActorUserId ?? DBNull.Value);
        command.Parameters.AddWithValue(
            "@actorDevice", (object?)query?.ActorDeviceId ?? DBNull.Value);
        command.Parameters.AddWithValue(
            "@targetDevice", (object?)query?.TargetId ?? DBNull.Value);
        command.Parameters.AddWithValue(
            "@from", query?.From is { } from ? from.ToUnixTimeMilliseconds() : DBNull.Value);
        command.Parameters.AddWithValue(
            "@to", query?.To is { } to ? to.ToUnixTimeMilliseconds() : DBNull.Value);
    }

    public async Task<AuditFacets> ReadFacetsAsync(
        string groupId,
        int maxPerList,
        CancellationToken cancellationToken = default)
    {
        
        
        if (string.IsNullOrWhiteSpace(groupId) || maxPerList <= 0)
            return EmptyFacets();

        
        var effectiveLimit = Math.Min(maxPerList, IAuditStore.MaxFacetItems);

        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);

        
        
        var actorDevices = await ReadFacetListAsync(
                connection,
                ActorDeviceFacetSql,
                groupId,
                effectiveLimit,
                static (value, count) => new AuditDeviceFacet(value, count),
                cancellationToken)
            .ConfigureAwait(false);

        var targetNodes = await ReadFacetListAsync(
                connection,
                TargetNodeFacetSql,
                groupId,
                effectiveLimit,
                static (value, count) => new AuditNodeFacet(value, count),
                cancellationToken)
            .ConfigureAwait(false);

        
        
        var actors = await ReadFacetListAsync(
                connection,
                ActorUserFacetSql,
                groupId,
                effectiveLimit,
                static (value, count) => new AuditActorFacet(value, count),
                cancellationToken)
            .ConfigureAwait(false);

        return new AuditFacets(actorDevices, targetNodes, actors);
    }

    
    private static AuditFacets EmptyFacets() => new(
        new AuditFacetList<AuditDeviceFacet>([], false),
        new AuditFacetList<AuditNodeFacet>([], false),
        new AuditFacetList<AuditActorFacet>([], false));

    








    private static async Task<AuditFacetList<T>> ReadFacetListAsync<T>(
        SqliteConnection connection,
        string sql,
        string groupId,
        int effectiveLimit,
        Func<string, int, T> create,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@limit", effectiveLimit + 1);

        var items = new List<T>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            items.Add(create(reader.GetString(0), (int)reader.GetInt64(1)));

        
        var truncated = items.Count > effectiveLimit;
        if (truncated)
            items.RemoveAt(items.Count - 1);

        return new AuditFacetList<T>(items, truncated);
    }
}
