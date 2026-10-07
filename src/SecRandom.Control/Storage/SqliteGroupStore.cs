using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using SecRandom.Control.Domain;

namespace SecRandom.Control.Storage;



















public sealed class SqliteGroupStore(SqliteDatabase database) : IGroupStore
{
    

    public async Task<Group?> GetGroupAsync(string groupId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText =
            "SELECT group_id, name, owner_user_id, created_at FROM groups WHERE group_id = @id";
        command.Parameters.AddWithValue("@id", groupId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        return await reader.ReadAsync(cancellationToken).ConfigureAwait(false) ? ReadGroup(reader) : null;
    }

    public async Task<IReadOnlyList<Group>> ListGroupsForMemberAsync(
        string userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT g.group_id, g.name, g.owner_user_id, g.created_at
            FROM groups g
            JOIN members m ON m.group_id = g.group_id
            WHERE m.user_id = @userId
            ORDER BY g.created_at
            """;
        command.Parameters.AddWithValue("@userId", userId);

        var result = new List<Group>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            result.Add(ReadGroup(reader));

        return result;
    }

    public async Task<Group> CreateGroupAsync(
        string name, string ownerUserId, string? ownerDisplayName, string? ownerAvatarUrl,
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var group = new Group
        {
            GroupId = "grp_" + Convert.ToHexString(RandomNumberGenerator.GetBytes(6)).ToLowerInvariant(),
            Name = name,
            OwnerUserId = ownerUserId,
            CreatedAt = now
        };

        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken)
            .ConfigureAwait(false);

        await using (var command = connection.CreateCommand())
        {
            command.Transaction = (SqliteTransaction)transaction;
            command.CommandText =
                "INSERT INTO groups (group_id, name, owner_user_id, created_at) VALUES (@id, @name, @owner, @at)";
            command.Parameters.AddWithValue("@id", group.GroupId);
            command.Parameters.AddWithValue("@name", group.Name);
            command.Parameters.AddWithValue("@owner", group.OwnerUserId);
            command.Parameters.AddWithValue("@at", ToMillis(now));
            await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        }

        await using (var command = connection.CreateCommand())
        {
            command.Transaction = (SqliteTransaction)transaction;
            command.CommandText = """
                INSERT INTO members (group_id, user_id, role, joined_at, display_name, avatar_url)
                VALUES (@groupId, @userId, @role, @at, @name, @avatar)
                """;
            command.Parameters.AddWithValue("@groupId", group.GroupId);
            command.Parameters.AddWithValue("@userId", ownerUserId);
            command.Parameters.AddWithValue("@role", (int)GroupRole.Owner);
            command.Parameters.AddWithValue("@at", ToMillis(now));
            command.Parameters.AddWithValue("@name", (object?)ownerDisplayName ?? DBNull.Value);
            
            command.Parameters.AddWithValue("@avatar", (object?)ownerAvatarUrl ?? DBNull.Value);
            await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        }

        await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
        return group;
    }

    public async Task<Group?> TryRenameGroupAsync(
        string groupId, string name, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = "UPDATE groups SET name = @name WHERE group_id = @id";
        command.Parameters.AddWithValue("@name", name);
        command.Parameters.AddWithValue("@id", groupId);

        var affected = await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        return affected == 0 ? null : await GetGroupAsync(groupId, cancellationToken).ConfigureAwait(false);
    }

    public async Task UpdateGroupOwnerAsync(
        string groupId, string ownerUserId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = "UPDATE groups SET owner_user_id = @owner WHERE group_id = @id";
        command.Parameters.AddWithValue("@owner", ownerUserId);
        command.Parameters.AddWithValue("@id", groupId);
        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    



















    public async Task<bool> DeleteGroupAsync(
        string groupId, string expectedOwnerUserId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var transaction = (SqliteTransaction)await connection
            .BeginTransactionAsync(cancellationToken).ConfigureAwait(false);

        
        await using (var command = connection.CreateCommand())
        {
            command.Transaction = transaction;
            command.CommandText =
                "DELETE FROM groups WHERE group_id = @groupId AND owner_user_id = @ownerUserId";
            command.Parameters.AddWithValue("@groupId", groupId);
            command.Parameters.AddWithValue("@ownerUserId", expectedOwnerUserId);

            if (await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false) == 0)
            {
                
                
                await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);
                return false;
            }
        }

        
        
        foreach (var sql in new[]
                 {
                     "DELETE FROM members WHERE group_id = @groupId",
                     "DELETE FROM nodes WHERE group_id = @groupId",
                     "DELETE FROM invites WHERE group_id = @groupId",
                     "DELETE FROM transfers WHERE group_id = @groupId",
                     "DELETE FROM commands WHERE group_id = @groupId",
                     "DELETE FROM desired_state WHERE group_id = @groupId",
                     "DELETE FROM user_group_order WHERE group_id = @groupId"
                 })
        {
            await using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = sql;
            command.Parameters.AddWithValue("@groupId", groupId);
            await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        }

        await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
        return true;
    }

    

    public async Task<Member?> GetMemberAsync(
        string groupId, string userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT user_id, role, joined_at, display_name, avatar_url, visibility
            FROM members WHERE group_id = @groupId AND user_id = @userId
            """;
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@userId", userId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        return await reader.ReadAsync(cancellationToken).ConfigureAwait(false) ? ReadMember(reader) : null;
    }

    public async Task<IReadOnlyList<Member>> ListMembersAsync(
        string groupId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        
        command.CommandText = """
            SELECT user_id, role, joined_at, display_name, avatar_url, visibility
            FROM members WHERE group_id = @groupId
            ORDER BY role DESC, joined_at
            """;
        command.Parameters.AddWithValue("@groupId", groupId);

        var result = new List<Member>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            result.Add(ReadMember(reader));

        return result;
    }

    public async Task AddMemberAsync(
        string groupId, Member member, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        
        command.CommandText = """
            INSERT OR IGNORE INTO members (group_id, user_id, role, joined_at, display_name, avatar_url, visibility)
            VALUES (@groupId, @userId, @role, @at, @name, @avatar, @visibility)
            """;
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@userId", member.UserId);
        command.Parameters.AddWithValue("@role", (int)member.Role);
        command.Parameters.AddWithValue("@at", ToMillis(member.JoinedAt));
        command.Parameters.AddWithValue("@name", (object?)member.DisplayName ?? DBNull.Value);
        command.Parameters.AddWithValue("@avatar", (object?)member.AvatarUrl ?? DBNull.Value);
        command.Parameters.AddWithValue("@visibility", (object?)member.Visibility ?? DBNull.Value);
        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> TryUpdateMemberRoleAsync(
        string groupId, string userId, GroupRole expectedRole, GroupRole newRole,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        
        
        command.CommandText = """
            UPDATE members SET role = @newRole
            WHERE group_id = @groupId AND user_id = @userId AND role = @expected
            """;
        command.Parameters.AddWithValue("@newRole", (int)newRole);
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@expected", (int)expectedRole);

        return await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false) == 1;
    }

    public async Task<bool> TryRemoveMemberAsync(
        string groupId, string userId, GroupRole expectedRole, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            DELETE FROM members
            WHERE group_id = @groupId AND user_id = @userId AND role = @expected
            """;
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@expected", (int)expectedRole);

        return await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false) == 1;
    }

    


    public async Task<bool> TryTransferOwnershipAsync(
        string groupId, string fromUserId, string toUserId, GroupRole expectedFromRole, GroupRole demoteTo,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken)
            .ConfigureAwait(false);

        
        await using (var command = connection.CreateCommand())
        {
            command.Transaction = (SqliteTransaction)transaction;
            command.CommandText = """
                UPDATE members SET role = @demoteTo
                WHERE group_id = @groupId AND user_id = @from AND role = @expected
                """;
            command.Parameters.AddWithValue("@demoteTo", (int)demoteTo);
            command.Parameters.AddWithValue("@groupId", groupId);
            command.Parameters.AddWithValue("@from", fromUserId);
            command.Parameters.AddWithValue("@expected", (int)expectedFromRole);

            if (await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false) != 1)
            {
                await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);
                return false;
            }
        }

        
        await using (var command = connection.CreateCommand())
        {
            command.Transaction = (SqliteTransaction)transaction;
            command.CommandText = """
                UPDATE members SET role = @owner
                WHERE group_id = @groupId AND user_id = @to
                """;
            command.Parameters.AddWithValue("@owner", (int)GroupRole.Owner);
            command.Parameters.AddWithValue("@groupId", groupId);
            command.Parameters.AddWithValue("@to", toUserId);

            if (await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false) != 1)
            {
                await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);
                return false;
            }
        }

        
        await using (var command = connection.CreateCommand())
        {
            command.Transaction = (SqliteTransaction)transaction;
            command.CommandText = "UPDATE groups SET owner_user_id = @to WHERE group_id = @groupId";
            command.Parameters.AddWithValue("@to", toUserId);
            command.Parameters.AddWithValue("@groupId", groupId);
            await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        }

        await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
        return true;
    }

    

    public async Task<Node?> GetNodeAsync(
        string groupId, string nodeId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = $"{NodeSelect} WHERE group_id = @groupId AND node_id = @nodeId";
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@nodeId", nodeId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        return await reader.ReadAsync(cancellationToken).ConfigureAwait(false) ? ReadNode(reader) : null;
    }

    public async Task<IReadOnlyList<Node>> ListNodesAsync(
        string groupId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = $"{NodeSelect} WHERE group_id = @groupId ORDER BY registered_at, node_id";
        command.Parameters.AddWithValue("@groupId", groupId);

        var result = new List<Node>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            result.Add(ReadNode(reader));

        return result;
    }

    public async Task SaveNodeAsync(Node node, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO nodes (group_id, node_id, platform, version, capabilities,
                               local_remote_allowed, display_name, last_heartbeat_at, registered_at,
                               enrolled_by_user_id)
            VALUES (@groupId, @nodeId, @platform, @version, @capabilities,
                    @allowed, @displayName, @heartbeat, @registeredAt,
                    @enrolledByUserId)
            ON CONFLICT (group_id, node_id) DO UPDATE SET
                platform = excluded.platform,
                version = excluded.version,
                capabilities = excluded.capabilities,
                local_remote_allowed = excluded.local_remote_allowed,
                display_name = excluded.display_name,
                last_heartbeat_at = excluded.last_heartbeat_at
            """;
        command.Parameters.AddWithValue("@groupId", node.GroupId);
        command.Parameters.AddWithValue("@nodeId", node.NodeId);
        command.Parameters.AddWithValue("@platform", node.Platform);
        command.Parameters.AddWithValue("@version", node.Version);
        command.Parameters.AddWithValue(
            "@capabilities", JsonSerializer.Serialize(node.Capabilities, JsonSerialization.ProtocolJsonOptions));
        command.Parameters.AddWithValue("@allowed", node.LocalRemoteAllowed ? 1 : 0);
        
        command.Parameters.AddWithValue("@displayName", (object?)EmptyToNull(node.DisplayName) ?? DBNull.Value);
        command.Parameters.AddWithValue(
            "@heartbeat", node.LastHeartbeatAt is { } hb ? ToMillis(hb) : DBNull.Value);
        command.Parameters.AddWithValue("@registeredAt", ToMillis(node.RegisteredAt));
        command.Parameters.AddWithValue(
            "@enrolledByUserId", (object?)EmptyToNull(node.EnrolledByUserId) ?? DBNull.Value);
        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> SetNodeEnrolledByAsync(
        string groupId, string nodeId, string? enrolledByUserId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE nodes SET enrolled_by_user_id = @enrolledByUserId
            WHERE group_id = @groupId AND node_id = @nodeId
            """;
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@nodeId", nodeId);
        command.Parameters.AddWithValue(
            "@enrolledByUserId", (object?)EmptyToNull(enrolledByUserId) ?? DBNull.Value);

        return await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false) > 0;
    }

    
    private static string? EmptyToNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value;

    public async Task DeleteNodeAsync(string groupId, string nodeId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);

        
        
        foreach (var sql in new[]
                 {
                     "DELETE FROM nodes WHERE group_id = @groupId AND node_id = @nodeId",
                     "DELETE FROM desired_state WHERE group_id = @groupId AND node_id = @nodeId",
                     "DELETE FROM commands WHERE group_id = @groupId AND target_node_id = @nodeId",
                     "DELETE FROM node_tokens WHERE group_id = @groupId AND node_id = @nodeId"
                 })
        {
            await using var command = connection.CreateCommand();
            command.CommandText = sql;
            command.Parameters.AddWithValue("@groupId", groupId);
            command.Parameters.AddWithValue("@nodeId", nodeId);
            await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        }
    }

    

    public async Task SaveInviteAsync(Invite invite, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO invites (code, group_id, role, created_by_user_id, created_at, expires_at,
                                 expected_user_id, used_by_user_id, used_at, revoked_at, revoked_by_user_id)
            VALUES (@code, @groupId, @role, @createdBy, @createdAt, @expiresAt,
                    @expected, @usedBy, @usedAt, @revokedAt, @revokedBy)
            ON CONFLICT (code) DO UPDATE SET
                used_by_user_id = excluded.used_by_user_id,
                used_at = excluded.used_at,
                revoked_at = excluded.revoked_at,
                revoked_by_user_id = excluded.revoked_by_user_id,
                expected_user_id = excluded.expected_user_id
            """;
        command.Parameters.AddWithValue("@code", invite.Code);
        command.Parameters.AddWithValue("@groupId", invite.GroupId);
        command.Parameters.AddWithValue("@role", (int)invite.Role);
        command.Parameters.AddWithValue("@createdBy", invite.CreatedByUserId);
        command.Parameters.AddWithValue("@createdAt", ToMillis(invite.CreatedAt));
        command.Parameters.AddWithValue("@expiresAt", ToMillis(invite.ExpiresAt));
        command.Parameters.AddWithValue("@expected", (object?)invite.ExpectedUserId ?? DBNull.Value);
        command.Parameters.AddWithValue("@usedBy", (object?)invite.UsedByUserId ?? DBNull.Value);
        command.Parameters.AddWithValue("@usedAt", invite.UsedAt is { } u ? ToMillis(u) : DBNull.Value);
        command.Parameters.AddWithValue("@revokedAt", invite.RevokedAt is { } r ? ToMillis(r) : DBNull.Value);
        command.Parameters.AddWithValue("@revokedBy", (object?)invite.RevokedByUserId ?? DBNull.Value);
        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<Invite?> GetInviteByCodeAsync(
        string code, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = $"{InviteSelect} WHERE code = @code";
        command.Parameters.AddWithValue("@code", code);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        return await reader.ReadAsync(cancellationToken).ConfigureAwait(false) ? ReadInvite(reader) : null;
    }

    public async Task<IReadOnlyList<Invite>> ListInvitesAsync(
        string groupId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = $"{InviteSelect} WHERE group_id = @groupId ORDER BY created_at DESC";
        command.Parameters.AddWithValue("@groupId", groupId);

        var result = new List<Invite>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            result.Add(ReadInvite(reader));

        return result;
    }

    

    public async Task SaveTransferAsync(
        OwnerTransfer transfer, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO transfers (transfer_id, group_id, from_user_id, to_user_id, created_at, expires_at,
                                   initiator_reauthenticated, status, resolved_at, demoted_to)
            VALUES (@id, @groupId, @from, @to, @createdAt, @expiresAt, @reauth, @status, @resolvedAt, @demotedTo)
            ON CONFLICT (transfer_id) DO UPDATE SET
                status = excluded.status,
                resolved_at = excluded.resolved_at
            """;
        command.Parameters.AddWithValue("@id", transfer.TransferId);
        command.Parameters.AddWithValue("@groupId", transfer.GroupId);
        command.Parameters.AddWithValue("@from", transfer.FromUserId);
        command.Parameters.AddWithValue("@to", transfer.ToUserId);
        command.Parameters.AddWithValue("@createdAt", ToMillis(transfer.CreatedAt));
        command.Parameters.AddWithValue("@expiresAt", ToMillis(transfer.ExpiresAt));
        command.Parameters.AddWithValue("@reauth", transfer.InitiatorReauthenticated ? 1 : 0);
        command.Parameters.AddWithValue("@status", (int)transfer.Status);
        command.Parameters.AddWithValue(
            "@resolvedAt", transfer.ResolvedAt is { } r ? ToMillis(r) : DBNull.Value);
        command.Parameters.AddWithValue("@demotedTo", (int)transfer.DemotedTo);
        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<OwnerTransfer?> GetTransferAsync(
        string transferId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = $"{TransferSelect} WHERE transfer_id = @id";
        command.Parameters.AddWithValue("@id", transferId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        return await reader.ReadAsync(cancellationToken).ConfigureAwait(false) ? ReadTransfer(reader) : null;
    }

    public async Task<OwnerTransfer?> GetPendingTransferAsync(
        string groupId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        
        
        command.CommandText = $"""
            {TransferSelect}
            WHERE group_id = @groupId AND status = @pending AND expires_at > @now
            ORDER BY created_at DESC LIMIT 1
            """;
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@pending", (int)TransferStatus.Pending);
        command.Parameters.AddWithValue("@now", ToMillis(DateTimeOffset.UtcNow));

        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        return await reader.ReadAsync(cancellationToken).ConfigureAwait(false) ? ReadTransfer(reader) : null;
    }

    

    public async Task SaveCommandAsync(NodeCommand command, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command2 = connection.CreateCommand();
        command2.CommandText = """
            INSERT INTO commands (command_id, group_id, target_node_id, issuer_member_id, issuer_device_id,
                                  capability, kind, payload, issued_at, expires_at, status,
                                  delivered_at, resolved_at, result_detail, result_context, result_payload)
            VALUES (@id, @groupId, @nodeId, @issuer, @device, @capability, @kind, @payload,
                    @issuedAt, @expiresAt, @status, @deliveredAt, @resolvedAt, @detail, @context, @resultPayload)
            ON CONFLICT (command_id) DO UPDATE SET
                status = excluded.status,
                delivered_at = excluded.delivered_at,
                resolved_at = excluded.resolved_at,
                result_detail = excluded.result_detail,
                result_context = excluded.result_context,
                result_payload = excluded.result_payload
            """;
        command2.Parameters.AddWithValue("@id", command.CommandId);
        command2.Parameters.AddWithValue("@groupId", command.GroupId);
        command2.Parameters.AddWithValue("@nodeId", command.TargetNodeId);
        command2.Parameters.AddWithValue("@issuer", command.IssuerMemberId);
        command2.Parameters.AddWithValue("@device", (object?)command.IssuerDeviceId ?? DBNull.Value);
        command2.Parameters.AddWithValue("@capability", command.Capability);
        command2.Parameters.AddWithValue("@kind", command.Kind);
        command2.Parameters.AddWithValue(
            "@payload", command.Payload is { } payload ? payload.GetRawText() : DBNull.Value);
        command2.Parameters.AddWithValue("@issuedAt", ToMillis(command.IssuedAt));
        command2.Parameters.AddWithValue("@expiresAt", ToMillis(command.ExpiresAt));
        command2.Parameters.AddWithValue("@status", (int)command.Status);
        command2.Parameters.AddWithValue(
            "@deliveredAt", command.DeliveredAt is { } d ? ToMillis(d) : DBNull.Value);
        command2.Parameters.AddWithValue(
            "@resolvedAt", command.ResolvedAt is { } r ? ToMillis(r) : DBNull.Value);
        command2.Parameters.AddWithValue("@detail", (object?)command.ResultDetail ?? DBNull.Value);
        
        command2.Parameters.AddWithValue(
            "@context", command.ResultContext is { } context ? context.GetRawText() : DBNull.Value);
        command2.Parameters.AddWithValue(
            "@resultPayload", command.ResultPayload is { } resultPayload ? resultPayload.GetRawText() : DBNull.Value);
        await command2.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<NodeCommand?> GetCommandAsync(
        string commandId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = $"{CommandSelect} WHERE command_id = @id";
        command.Parameters.AddWithValue("@id", commandId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        return await reader.ReadAsync(cancellationToken).ConfigureAwait(false) ? ReadCommand(reader) : null;
    }

    








    public async Task<bool> TryRevokeCommandAsync(
        string groupId, string commandId, DateTimeOffset now, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE commands SET status = @revoked, resolved_at = @now, result_detail = @detail
            WHERE command_id = @id AND group_id = @groupId AND status = @queued
            """;
        command.Parameters.AddWithValue("@revoked", (int)CommandStatus.Revoked);
        command.Parameters.AddWithValue("@now", ToMillis(now));
        command.Parameters.AddWithValue("@detail", NodeCommand.RevokedResultDetail);
        command.Parameters.AddWithValue("@id", commandId);
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@queued", (int)CommandStatus.Queued);

        var affected = await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        return affected > 0;
    }

    







    public async Task<bool> MarkCommandDeliveredAsync(
        string commandId, DateTimeOffset at, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE commands SET status = @delivered, delivered_at = COALESCE(delivered_at, @at)
            WHERE command_id = @id AND status = @queued
            """;
        command.Parameters.AddWithValue("@delivered", (int)CommandStatus.Delivered);
        command.Parameters.AddWithValue("@at", ToMillis(at));
        command.Parameters.AddWithValue("@id", commandId);
        command.Parameters.AddWithValue("@queued", (int)CommandStatus.Queued);

        var affected = await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        return affected > 0;
    }

    public async Task<IReadOnlyList<NodeCommand>> GetDeliverableCommandsAsync(
        string groupId, string nodeId, DateTimeOffset now, int limit, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);

        
        
        
        
        
        
        
        
        
        
        
        await using (var expire = connection.CreateCommand())
        {
            expire.CommandText = """
                UPDATE commands SET status = @expired, resolved_at = @now
                WHERE group_id = @groupId AND target_node_id = @nodeId AND expires_at <= @now
                  AND status NOT IN (@completed, @rejected, @expired, @revoked)
                """;
            expire.Parameters.AddWithValue("@expired", (int)CommandStatus.Expired);
            expire.Parameters.AddWithValue("@completed", (int)CommandStatus.Completed);
            expire.Parameters.AddWithValue("@rejected", (int)CommandStatus.Rejected);
            expire.Parameters.AddWithValue("@revoked", (int)CommandStatus.Revoked);
            expire.Parameters.AddWithValue("@now", ToMillis(now));
            expire.Parameters.AddWithValue("@groupId", groupId);
            expire.Parameters.AddWithValue("@nodeId", nodeId);
            await expire.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        }

        await using var command = connection.CreateCommand();
        command.CommandText = $"""
            {CommandSelect}
            WHERE group_id = @groupId AND target_node_id = @nodeId
              AND expires_at > @now
              AND status NOT IN (@completed, @rejected, @expired, @revoked)
            ORDER BY issued_at LIMIT @limit
            """;
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@nodeId", nodeId);
        command.Parameters.AddWithValue("@now", ToMillis(now));
        command.Parameters.AddWithValue("@completed", (int)CommandStatus.Completed);
        command.Parameters.AddWithValue("@rejected", (int)CommandStatus.Rejected);
        command.Parameters.AddWithValue("@expired", (int)CommandStatus.Expired);
        command.Parameters.AddWithValue("@revoked", (int)CommandStatus.Revoked);
        command.Parameters.AddWithValue("@limit", limit);

        var result = new List<NodeCommand>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            result.Add(ReadCommand(reader));

        return result;
    }

    

    public async Task SaveDesiredStateAsync(
        DesiredState state, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        
        
        command.CommandText = """
            INSERT INTO desired_state (group_id, node_id, revision, draw_locked, policy_version, updated_at)
            VALUES (@groupId, @nodeId, @revision, @locked, @policy, @updatedAt)
            ON CONFLICT (group_id, node_id) DO UPDATE SET
                revision = excluded.revision,
                draw_locked = excluded.draw_locked,
                policy_version = excluded.policy_version,
                updated_at = excluded.updated_at
            """;
        command.Parameters.AddWithValue("@groupId", state.GroupId);
        command.Parameters.AddWithValue("@nodeId", state.NodeId);
        command.Parameters.AddWithValue("@revision", state.Revision);
        command.Parameters.AddWithValue("@locked", state.DrawLocked ? 1 : 0);
        command.Parameters.AddWithValue("@policy", (object?)state.PolicyVersion ?? DBNull.Value);
        command.Parameters.AddWithValue("@updatedAt", ToMillis(state.UpdatedAt));
        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<DesiredState?> GetDesiredStateAsync(
        string groupId, string nodeId, CancellationToken cancellationToken = default)
    {
        await using var connection = await database.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT group_id, node_id, revision, draw_locked, policy_version, updated_at
            FROM desired_state WHERE group_id = @groupId AND node_id = @nodeId
            """;
        command.Parameters.AddWithValue("@groupId", groupId);
        command.Parameters.AddWithValue("@nodeId", nodeId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        if (!await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            return null;

        return new DesiredState
        {
            GroupId = reader.GetString(0),
            NodeId = reader.GetString(1),
            Revision = reader.GetInt64(2),
            DrawLocked = reader.GetInt32(3) != 0,
            PolicyVersion = reader.IsDBNull(4) ? null : reader.GetString(4),
            UpdatedAt = FromMillis(reader.GetInt64(5))
        };
    }

    

    private const string NodeSelect = """
        SELECT group_id, node_id, platform, version, capabilities,
               local_remote_allowed, display_name, last_heartbeat_at, registered_at,
               enrolled_by_user_id
        FROM nodes
        """;

    private const string InviteSelect = """
        SELECT code, group_id, role, created_by_user_id, created_at, expires_at,
               expected_user_id, used_by_user_id, used_at, revoked_at, revoked_by_user_id
        FROM invites
        """;

    private const string TransferSelect = """
        SELECT transfer_id, group_id, from_user_id, to_user_id, created_at, expires_at,
               initiator_reauthenticated, status, resolved_at, demoted_to
        FROM transfers
        """;

    private const string CommandSelect = """
        SELECT command_id, group_id, target_node_id, issuer_member_id, issuer_device_id,
               capability, kind, payload, issued_at, expires_at, status,
               delivered_at, resolved_at, result_detail, result_context, result_payload
        FROM commands
        """;

    

    private static Group ReadGroup(SqliteDataReader reader) => new()
    {
        GroupId = reader.GetString(0),
        Name = reader.GetString(1),
        OwnerUserId = reader.GetString(2),
        CreatedAt = FromMillis(reader.GetInt64(3))
    };

    private static Member ReadMember(SqliteDataReader reader) => new()
    {
        UserId = reader.GetString(0),
        Role = (GroupRole)reader.GetInt32(1),
        JoinedAt = FromMillis(reader.GetInt64(2)),
        DisplayName = reader.IsDBNull(3) ? null : reader.GetString(3),
        AvatarUrl = reader.IsDBNull(4) ? null : reader.GetString(4),
        Visibility = reader.IsDBNull(5) ? null : reader.GetString(5)
    };

    private static Node ReadNode(SqliteDataReader reader) => new()
    {
        GroupId = reader.GetString(0),
        NodeId = reader.GetString(1),
        Platform = reader.GetString(2),
        Version = reader.GetString(3),
        Capabilities = reader.IsDBNull(4)
            ? []
            : JsonSerializer.Deserialize<List<string>>(reader.GetString(4), JsonSerialization.ProtocolJsonOptions)
              ?? [],
        LocalRemoteAllowed = reader.GetInt32(5) != 0,
        DisplayName = reader.IsDBNull(6) ? null : reader.GetString(6),
        LastHeartbeatAt = reader.IsDBNull(7) ? null : FromMillis(reader.GetInt64(7)),
        RegisteredAt = FromMillis(reader.GetInt64(8)),
        EnrolledByUserId = reader.IsDBNull(9) ? null : reader.GetString(9)
    };

    private static Invite ReadInvite(SqliteDataReader reader) => new()
    {
        Code = reader.GetString(0),
        GroupId = reader.GetString(1),
        Role = (GroupRole)reader.GetInt32(2),
        CreatedByUserId = reader.GetString(3),
        CreatedAt = FromMillis(reader.GetInt64(4)),
        ExpiresAt = FromMillis(reader.GetInt64(5)),
        ExpectedUserId = reader.IsDBNull(6) ? null : reader.GetString(6),
        UsedByUserId = reader.IsDBNull(7) ? null : reader.GetString(7),
        UsedAt = reader.IsDBNull(8) ? null : FromMillis(reader.GetInt64(8)),
        RevokedAt = reader.IsDBNull(9) ? null : FromMillis(reader.GetInt64(9)),
        RevokedByUserId = reader.IsDBNull(10) ? null : reader.GetString(10)
    };

    private static OwnerTransfer ReadTransfer(SqliteDataReader reader) => new()
    {
        TransferId = reader.GetString(0),
        GroupId = reader.GetString(1),
        FromUserId = reader.GetString(2),
        ToUserId = reader.GetString(3),
        CreatedAt = FromMillis(reader.GetInt64(4)),
        ExpiresAt = FromMillis(reader.GetInt64(5)),
        InitiatorReauthenticated = reader.GetInt32(6) != 0,
        Status = (TransferStatus)reader.GetInt32(7),
        ResolvedAt = reader.IsDBNull(8) ? null : FromMillis(reader.GetInt64(8)),
        DemotedTo = (GroupRole)reader.GetInt32(9)
    };

    private static NodeCommand ReadCommand(SqliteDataReader reader) => new()
    {
        CommandId = reader.GetString(0),
        GroupId = reader.GetString(1),
        TargetNodeId = reader.GetString(2),
        IssuerMemberId = reader.GetString(3),
        IssuerDeviceId = reader.IsDBNull(4) ? null : reader.GetString(4),
        Capability = reader.GetString(5),
        Kind = reader.GetString(6),
        Payload = reader.IsDBNull(7) ? null : JsonDocument.Parse(reader.GetString(7)).RootElement.Clone(),
        IssuedAt = FromMillis(reader.GetInt64(8)),
        ExpiresAt = FromMillis(reader.GetInt64(9)),
        Status = (CommandStatus)reader.GetInt32(10),
        DeliveredAt = reader.IsDBNull(11) ? null : FromMillis(reader.GetInt64(11)),
        ResolvedAt = reader.IsDBNull(12) ? null : FromMillis(reader.GetInt64(12)),
        ResultDetail = reader.IsDBNull(13) ? null : reader.GetString(13),
        ResultContext = reader.IsDBNull(14)
            ? null
            : JsonDocument.Parse(reader.GetString(14)).RootElement.Clone(),
        ResultPayload = reader.IsDBNull(15)
            ? null
            : JsonDocument.Parse(reader.GetString(15)).RootElement.Clone()
    };

    private static long ToMillis(DateTimeOffset value) => value.ToUnixTimeMilliseconds();

    private static DateTimeOffset FromMillis(long value) => DateTimeOffset.FromUnixTimeMilliseconds(value);
}
