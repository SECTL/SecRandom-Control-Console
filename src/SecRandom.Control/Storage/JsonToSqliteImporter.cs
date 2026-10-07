using System.Text.Json;
using Microsoft.Extensions.Logging;
using SecRandom.Control.Domain;

namespace SecRandom.Control.Storage;



















public sealed class JsonToSqliteImporter(
    SqliteDatabase database,
    IGroupStore groupStore,
    IAuditStore auditStore,
    ILogger<JsonToSqliteImporter> logger)
{
    
    public async Task<bool> ImportAsync(CancellationToken cancellationToken = default)
    {
        var jsonRoot = Path.GetDirectoryName(database.DatabasePath)!;

        
        
        var groupsDirectory = Path.Combine(jsonRoot, "groups");
        var invitesDirectory = Path.Combine(jsonRoot, "invites");
        var transfersDirectory = Path.Combine(jsonRoot, "transfers");
        var commandsDirectory = Path.Combine(jsonRoot, "commands");
        var auditDirectory = Path.Combine(jsonRoot, "audit");

        var hasAnyLegacyData =
            Directory.Exists(groupsDirectory) || Directory.Exists(invitesDirectory) ||
            Directory.Exists(transfersDirectory) || Directory.Exists(commandsDirectory) ||
            Directory.Exists(auditDirectory);

        if (!hasAnyLegacyData)
            return false;

        
        var alreadyImported = await HasAnyGroupAsync(cancellationToken).ConfigureAwait(false);
        if (alreadyImported)
        {
            logger.LogDebug("SQLite 中已有数据，跳过旧 JSON 导入。");
            return false;
        }

        logger.LogInformation("检测到旧的 JSON 文件数据，开始导入 SQLite：{Root}", jsonRoot);

        var imported = new ImportCounts();

        await ImportGroupsAsync(groupsDirectory, imported, cancellationToken).ConfigureAwait(false);
        await ImportInvitesAsync(invitesDirectory, imported, cancellationToken).ConfigureAwait(false);
        await ImportTransfersAsync(transfersDirectory, imported, cancellationToken).ConfigureAwait(false);
        await ImportCommandsAsync(commandsDirectory, imported, cancellationToken).ConfigureAwait(false);
        await ImportAuditAsync(auditDirectory, imported, cancellationToken).ConfigureAwait(false);

        logger.LogInformation(
            "旧 JSON 导入完成：组 {Groups}、成员 {Members}、节点 {Nodes}、邀请 {Invites}、" +
            "转让 {Transfers}、命令 {Commands}、审计 {Audit}",
            imported.Groups, imported.Members, imported.Nodes, imported.Invites,
            imported.Transfers, imported.Commands, imported.Audit);

        return true;
    }

    private async Task<bool> HasAnyGroupAsync(CancellationToken cancellationToken)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT EXISTS (SELECT 1 FROM groups LIMIT 1)";
        var result = await command.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);
        return Convert.ToInt64(result) == 1;
    }

    private async Task ImportGroupsAsync(
        string directory, ImportCounts counts, CancellationToken cancellationToken)
    {
        if (!Directory.Exists(directory))
            return;

        foreach (var groupDirectory in Directory.EnumerateDirectories(directory))
        {
            var group = await ReadAsync<Group>(
                Path.Combine(groupDirectory, "group.json"), cancellationToken).ConfigureAwait(false);

            if (group is null)
                continue;

            
            await using (var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false))
            await using (var command = connection.CreateCommand())
            {
                command.CommandText = """
                    INSERT OR IGNORE INTO groups (group_id, name, owner_user_id, created_at)
                    VALUES (@id, @name, @owner, @at)
                    """;
                command.Parameters.AddWithValue("@id", group.GroupId);
                command.Parameters.AddWithValue("@name", group.Name);
                command.Parameters.AddWithValue("@owner", group.OwnerUserId);
                command.Parameters.AddWithValue("@at", group.CreatedAt.ToUnixTimeMilliseconds());
                await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
            }

            counts.Groups++;

            var members = await ReadAsync<List<Member>>(
                Path.Combine(groupDirectory, "members.json"), cancellationToken).ConfigureAwait(false) ?? [];

            foreach (var member in members)
            {
                
                await groupStore.AddMemberAsync(group.GroupId, member, cancellationToken).ConfigureAwait(false);
                counts.Members++;
            }

            var nodesDirectory = Path.Combine(groupDirectory, "nodes");
            if (Directory.Exists(nodesDirectory))
            {
                foreach (var path in Directory.EnumerateFiles(nodesDirectory, "*.json"))
                {
                    var node = await ReadAsync<Node>(path, cancellationToken).ConfigureAwait(false);
                    if (node is null)
                        continue;

                    await groupStore.SaveNodeAsync(node, cancellationToken).ConfigureAwait(false);
                    counts.Nodes++;
                }
            }
        }
    }

    private async Task ImportInvitesAsync(
        string directory, ImportCounts counts, CancellationToken cancellationToken)
    {
        if (!Directory.Exists(directory))
            return;

        foreach (var path in Directory.EnumerateFiles(directory, "*.json"))
        {
            var invite = await ReadAsync<Invite>(path, cancellationToken).ConfigureAwait(false);
            if (invite is null)
                continue;

            await groupStore.SaveInviteAsync(invite, cancellationToken).ConfigureAwait(false);
            counts.Invites++;
        }
    }

    private async Task ImportTransfersAsync(
        string directory, ImportCounts counts, CancellationToken cancellationToken)
    {
        if (!Directory.Exists(directory))
            return;

        foreach (var path in Directory.EnumerateFiles(directory, "*.json"))
        {
            var transfer = await ReadAsync<OwnerTransfer>(path, cancellationToken).ConfigureAwait(false);
            if (transfer is null)
                continue;

            await groupStore.SaveTransferAsync(transfer, cancellationToken).ConfigureAwait(false);
            counts.Transfers++;
        }
    }

    private async Task ImportCommandsAsync(
        string directory, ImportCounts counts, CancellationToken cancellationToken)
    {
        if (!Directory.Exists(directory))
            return;

        foreach (var path in Directory.EnumerateFiles(directory, "*.json"))
        {
            var command = await ReadAsync<NodeCommand>(path, cancellationToken).ConfigureAwait(false);
            if (command is null)
                continue;

            await groupStore.SaveCommandAsync(command, cancellationToken).ConfigureAwait(false);
            counts.Commands++;
        }
    }

    private async Task ImportAuditAsync(
        string directory, ImportCounts counts, CancellationToken cancellationToken)
    {
        if (!Directory.Exists(directory))
            return;

        
        foreach (var path in Directory.EnumerateFiles(directory, "*.jsonl"))
        {
            foreach (var line in await File.ReadAllLinesAsync(path, cancellationToken).ConfigureAwait(false))
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                AuditEvent? entry;
                try
                {
                    entry = JsonSerializer.Deserialize<AuditEvent>(
                        line, JsonSerialization.ProtocolJsonOptions);
                }
                catch (JsonException)
                {
                    
                    continue;
                }

                if (entry is null)
                    continue;

                await auditStore.WriteAsync(entry, cancellationToken).ConfigureAwait(false);
                counts.Audit++;
            }
        }
    }

    private static async Task<T?> ReadAsync<T>(string path, CancellationToken cancellationToken)
        where T : class
    {
        if (!File.Exists(path))
            return null;

        try
        {
            await using var stream = File.OpenRead(path);
            return await JsonSerializer
                .DeserializeAsync<T>(stream, JsonSerialization.ProtocolJsonOptions, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private sealed class ImportCounts
    {
        public int Groups { get; set; }
        public int Members { get; set; }
        public int Nodes { get; set; }
        public int Invites { get; set; }
        public int Transfers { get; set; }
        public int Commands { get; set; }
        public int Audit { get; set; }
    }
}
