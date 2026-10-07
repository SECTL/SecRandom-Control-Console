using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using SecRandom.Control.Configuration;
using SecRandom.Control.Domain;

namespace SecRandom.Control.Storage;






























public sealed class SqliteDatabase(IOptions<ControlOptions> options, ILogger<SqliteDatabase> log)
{
    private readonly ILogger<SqliteDatabase> _logger = log;

    
    private const string Schema = """
        CREATE TABLE IF NOT EXISTS groups (
            group_id        TEXT PRIMARY KEY,
            name            TEXT NOT NULL,
            owner_user_id   TEXT NOT NULL,
            created_at      INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS members (
            group_id        TEXT NOT NULL,
            user_id         TEXT NOT NULL,
            role            INTEGER NOT NULL,
            joined_at       INTEGER NOT NULL,
            display_name    TEXT NULL,
            avatar_url      TEXT NULL,
            visibility      TEXT NULL,
            PRIMARY KEY (group_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS nodes (
            group_id              TEXT NOT NULL,
            node_id               TEXT NOT NULL,
            platform              TEXT NOT NULL,
            version               TEXT NOT NULL,
            capabilities          TEXT NOT NULL DEFAULT '[]',
            local_remote_allowed  INTEGER NOT NULL DEFAULT 0,
            display_name          TEXT NULL,
            last_heartbeat_at     INTEGER NULL,
            registered_at         INTEGER NOT NULL,
            enrolled_by_user_id   TEXT NULL,
            PRIMARY KEY (group_id, node_id)
        );

        -- 邀请码在全局范围内唯一：兑换时只拿到码，不知道组。
        CREATE TABLE IF NOT EXISTS invites (
            code                TEXT PRIMARY KEY,
            group_id            TEXT NOT NULL,
            role                INTEGER NOT NULL,
            created_by_user_id  TEXT NOT NULL,
            created_at          INTEGER NOT NULL,
            expires_at          INTEGER NOT NULL,
            expected_user_id    TEXT NULL,
            used_by_user_id     TEXT NULL,
            used_at             INTEGER NULL,
            revoked_at          INTEGER NULL,
            revoked_by_user_id  TEXT NULL
        );
        CREATE INDEX IF NOT EXISTS ix_invites_group ON invites (group_id);

        -- 每人的组显示顺序。position 只用于同一用户内部比较（不要求连续），
        -- 没有记录的组按创建时间排在后面 —— 新建的组不会"消失"，也不会插到最前面。
        CREATE TABLE IF NOT EXISTS user_group_order (
            user_id   TEXT NOT NULL,
            group_id  TEXT NOT NULL,
            position  INTEGER NOT NULL,
            PRIMARY KEY (user_id, group_id)
        );

        CREATE TABLE IF NOT EXISTS transfers (
            transfer_id              TEXT PRIMARY KEY,
            group_id                 TEXT NOT NULL,
            from_user_id             TEXT NOT NULL,
            to_user_id               TEXT NOT NULL,
            created_at               INTEGER NOT NULL,
            expires_at               INTEGER NOT NULL,
            initiator_reauthenticated INTEGER NOT NULL DEFAULT 0,
            status                   INTEGER NOT NULL DEFAULT 0,
            resolved_at              INTEGER NULL,
            demoted_to               INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS ix_transfers_group_status ON transfers (group_id, status);

        -- 命令队列。expires_at 与 status 都建索引：补投时要按
        -- "该节点 + 未终态 + 未过期" 过滤，这是最热的查询。
        CREATE TABLE IF NOT EXISTS commands (
            command_id       TEXT PRIMARY KEY,
            group_id         TEXT NOT NULL,
            target_node_id   TEXT NOT NULL,
            issuer_member_id TEXT NOT NULL,
            issuer_device_id TEXT NULL,
            capability       TEXT NOT NULL,
            kind             TEXT NOT NULL,
            payload          TEXT NULL,
            issued_at        INTEGER NOT NULL,
            expires_at       INTEGER NOT NULL,
            status           INTEGER NOT NULL DEFAULT 0,
            delivered_at     INTEGER NULL,
            resolved_at      INTEGER NULL,
            result_detail    TEXT NULL,
            result_context   TEXT NULL,
            result_payload   TEXT NULL
        );
        -- 补投查询按 **(组, 节点)** 过滤，索引必须跟着走：
        -- node_id 只在组内唯一（同一台机器可以在多个组各有一份登记），
        -- 只用 target_node_id 打头的索引会让查询把别的组的行也扫进来，
        -- 而这条查询带 LIMIT —— 扫进来的行会**占掉投递名额**，是真的少投。
        CREATE INDEX IF NOT EXISTS ix_commands_group_node_status
            ON commands (group_id, target_node_id, status, expires_at);

        -- 旧索引（只按 target_node_id 打头）已被上面那条完全取代：
        -- 它的前缀是目标节点，任何按组过滤的查询都用不上它。
        -- 用 DROP IF EXISTS 让已跑起来的部署也能在下次启动时换过来。
        DROP INDEX IF EXISTS ix_commands_node_status;

        -- 期望状态：每个节点一行（只保留最新）。
        --
        -- 为什么必须落库而不能只放内存：期望状态的全部价值在于
        -- **节点离线再上线后能被重新告知**。只推一次、掉了就永远不同步，
        -- 那等于没同步 —— 老师会看到"锁了但机器还在抽"。
        CREATE TABLE IF NOT EXISTS desired_state (
            group_id       TEXT NOT NULL,
            node_id        TEXT NOT NULL,
            revision       INTEGER NOT NULL,
            draw_locked    INTEGER NOT NULL DEFAULT 0,
            policy_version TEXT NULL,
            updated_at     INTEGER NOT NULL,
            PRIMARY KEY (group_id, node_id)
        );

        -- 审计：只追加。时间倒序查询是唯一热点，因此按 (group_id, at) 建索引。
        CREATE TABLE IF NOT EXISTS audit (
            event_id        TEXT PRIMARY KEY,
            at              INTEGER NOT NULL,
            actor_user_id   TEXT NULL,
            actor_device_id TEXT NULL,
            action          TEXT NOT NULL,
            outcome         TEXT NOT NULL,
            group_id        TEXT NULL,
            target_id       TEXT NULL,
            detail          TEXT NULL
        );
        CREATE INDEX IF NOT EXISTS ix_audit_group_at ON audit (group_id, at DESC);

        -- 保留窗口清理（AuditRetentionService → PurgeBeforeAsync）按**全局时间**取最旧的一批：
        -- 上面那条索引以 group_id 打头，跨组的时间范围查询用不上它的前缀；
        -- 没有这条，每一批清理都要扫全表，而"分批"正是为了避免长时间占写锁 ——
        -- 每批扫全表等于把分批的代价放大成 O(表大小 × 批数)。
        -- 已存在的库会在下次启动时补建一次（一次性代价，在这条语句里完成），之后都是空操作。
        CREATE INDEX IF NOT EXISTS ix_audit_at ON audit (at);

        -- 接入码：一次性凭据，兑换即消费（used_at / used_by_node_id 只有一次写入机会，
        -- 单次 UPDATE 带 WHERE used_at IS NULL 保证并发下也只有一个兑换者）。
        -- node_id 非空表示这张码预先绑定到某台设备，兑换方报上来的 node_id 必须一致。
        CREATE TABLE IF NOT EXISTS enrollment_codes (
            code                TEXT PRIMARY KEY,
            group_id            TEXT NOT NULL,
            node_id             TEXT NULL,
            created_by_user_id  TEXT NULL,
            created_at          INTEGER NOT NULL,
            expires_at          INTEGER NOT NULL,
            used_at             INTEGER NULL,
            used_by_node_id     TEXT NULL,
            revoked_at          INTEGER NULL
        );
        CREATE INDEX IF NOT EXISTS ix_enrollment_codes_group ON enrollment_codes (group_id);

        -- 节点设备令牌：只存 secret 的 SHA-256，明文只在签发那一刻返回一次。
        -- 一节点一活令牌（撤销/轮换都写 revoked_at），(group_id, node_id) 索引同时服务
        -- 认证后的作用域闸门与"这台设备还有没有有效令牌"的列表查询。
        CREATE TABLE IF NOT EXISTS node_tokens (
            token_id            TEXT PRIMARY KEY,
            secret_hash         TEXT NOT NULL,
            group_id            TEXT NOT NULL,
            node_id             TEXT NOT NULL,
            enrolled_by_user_id TEXT NULL,
            created_at          INTEGER NOT NULL,
            expires_at          INTEGER NOT NULL,
            revoked_at          INTEGER NULL,
            revoked_by_user_id  TEXT NULL,
            last_used_at        INTEGER NULL
        );
        CREATE INDEX IF NOT EXISTS ix_node_tokens_node ON node_tokens (group_id, node_id);
        """;

    private readonly ControlOptions _options = options.Value;
    private string? _connectionString;

    
    public string DatabasePath => Path.Combine(_options.DataRoot, "control.db");

    


    public string ConnectionString =>
        _connectionString ??= new SqliteConnectionStringBuilder
        {
            DataSource = DatabasePath,
            Mode = SqliteOpenMode.ReadWriteCreate,
            Cache = SqliteCacheMode.Shared,
            Pooling = true
        }.ToString();

    


    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(_options.DataRoot);

        await using var connection = await OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = Schema;
        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);

        await MigrateMergedManagerRoleAsync(connection, cancellationToken).ConfigureAwait(false);
        await MigrateNodeDisplayNameAsync(connection, cancellationToken).ConfigureAwait(false);
        await MigrateNodeEnrolledByAsync(connection, cancellationToken).ConfigureAwait(false);
        await MigrateCommandResultColumnsAsync(connection, cancellationToken).ConfigureAwait(false);
        await ReconcileGroupOwnershipAsync(connection, cancellationToken).ConfigureAwait(false);

        _logger.LogInformation("SQLite 存储就绪：{Path}", DatabasePath);
    }

    















    private async Task MigrateNodeDisplayNameAsync(
        SqliteConnection connection, CancellationToken cancellationToken)
    {
        await using (var probe = connection.CreateCommand())
        {
            probe.CommandText = "PRAGMA table_info(nodes)";
            await using var reader = await probe.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
            while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                
                if (reader.GetString(1) == "display_name")
                    return;
            }
        }

        await using var alter = connection.CreateCommand();
        alter.CommandText = "ALTER TABLE nodes ADD COLUMN display_name TEXT NULL";
        await alter.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation("nodes 表已补上 display_name 列（设备显示名）。");
    }

    








    private async Task MigrateNodeEnrolledByAsync(
        SqliteConnection connection, CancellationToken cancellationToken)
    {
        await using (var probe = connection.CreateCommand())
        {
            probe.CommandText = "PRAGMA table_info(nodes)";
            await using var reader = await probe.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
            while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                if (reader.GetString(1) == "enrolled_by_user_id")
                    return;
            }
        }

        await using var alter = connection.CreateCommand();
        alter.CommandText = "ALTER TABLE nodes ADD COLUMN enrolled_by_user_id TEXT NULL";
        await alter.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation("nodes 表已补上 enrolled_by_user_id 列（接入来源账号）。");
    }

    private static async Task MigrateCommandResultColumnsAsync(
        SqliteConnection connection, CancellationToken cancellationToken)
    {
        var existing = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        await using (var probe = connection.CreateCommand())
        {
            probe.CommandText = "PRAGMA table_info(commands)";
            await using var reader = await probe.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
            while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
                existing.Add(reader.GetString(1));
        }

        foreach (var column in (string[])["result_context", "result_payload"])
        {
            if (existing.Contains(column))
                continue;

            await using var alter = connection.CreateCommand();
            alter.CommandText = $"ALTER TABLE commands ADD COLUMN {column} TEXT NULL";
            await alter.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        }
    }

    














    private async Task MigrateMergedManagerRoleAsync(
        SqliteConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        
        
        command.CommandText = $"""
            UPDATE members   SET role       = {(int)GroupRole.Admin} WHERE role        = {GroupRoleLegacy.ManagerValue};
            UPDATE invites   SET role       = {(int)GroupRole.Admin} WHERE role        = {GroupRoleLegacy.ManagerValue};
            UPDATE transfers SET demoted_to = {(int)GroupRole.Admin} WHERE demoted_to  = {GroupRoleLegacy.ManagerValue};
            """;

        var updated = await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        if (updated > 0)
            _logger.LogInformation(
                "已把 {Count} 条存量 manager({Legacy}) 角色合并为 admin({Admin})。",
                updated, GroupRoleLegacy.ManagerValue, (int)GroupRole.Admin);
    }

    




















    private async Task ReconcileGroupOwnershipAsync(
        SqliteConnection connection, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = $"""
            UPDATE members SET role = {(int)GroupRole.Owner}
            WHERE role <> {(int)GroupRole.Owner}
              AND EXISTS (SELECT 1 FROM groups g
                          WHERE g.group_id = members.group_id
                            AND g.owner_user_id = members.user_id);

            UPDATE members SET role = {(int)GroupRole.Admin}
            WHERE role = {(int)GroupRole.Owner}
              AND EXISTS (SELECT 1 FROM groups g
                          WHERE g.group_id = members.group_id
                            AND g.owner_user_id <> members.user_id);
            """;

        var repaired = await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        if (repaired > 0)
            _logger.LogWarning(
                "修复了 {Count} 条与创建者指针不一致的成员角色（以 groups.owner_user_id 为准）。",
                repaired);
    }

    






    public async Task<SqliteConnection> OpenAsync(CancellationToken cancellationToken = default)
    {
        var connection = new SqliteConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA foreign_keys = ON;
            PRAGMA busy_timeout = 5000;
            """;
        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);

        return connection;
    }
}
