using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using SecRandom.Control.Domain;

namespace SecRandom.Control.Transport;








public sealed class NodeConnection(WebSocket socket, string nodeId, string groupId)
{
    private readonly SemaphoreSlim _writeGate = new(1, 1);
    private int _closeStarted;

    public string NodeId { get; } = nodeId;

    public string GroupId { get; } = groupId;

    public DateTimeOffset ConnectedAt { get; } = DateTimeOffset.UtcNow;

    public WebSocket Socket { get; } = socket;

    


















    public bool TryBeginClose() => Interlocked.Exchange(ref _closeStarted, 1) == 0;

    public async Task SendAsync<T>(T frame, CancellationToken cancellationToken = default)
    {
        if (Socket.State != WebSocketState.Open)
            return;

        var json = JsonSerializer.Serialize(frame, JsonSerialization.ProtocolJsonOptions);
        var bytes = Encoding.UTF8.GetBytes(json);

        await _writeGate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (Socket.State != WebSocketState.Open)
                return;

            await Socket.SendAsync(
                bytes, WebSocketMessageType.Text, endOfMessage: true, cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            _writeGate.Release();
        }
    }
}















public interface INodeConnectionRegistry
{
    
    Task<bool> AddAsync(NodeConnection connection, CancellationToken cancellationToken = default);

    







    Task RemoveAsync(NodeConnection connection, string reason = "replaced", CancellationToken cancellationToken = default);

    

















    Task<int> CloseGroupAsync(string groupId, string reason, CancellationToken cancellationToken = default);

    






    NodeConnection? Get(string groupId, string nodeId);

    IReadOnlyCollection<NodeConnection> InGroup(string groupId);

    int Count { get; }
}

public sealed class NodeConnectionRegistry : INodeConnectionRegistry
{
    
    private readonly ConcurrentDictionary<string, NodeConnection> _connections = new(StringComparer.Ordinal);

    public int Count => _connections.Count;

    private static string Key(string groupId, string nodeId) => groupId + "/" + nodeId;

    public async Task<bool> AddAsync(NodeConnection connection, CancellationToken cancellationToken = default)
    {
        var replaced = false;
        var key = Key(connection.GroupId, connection.NodeId);

        
        
        if (_connections.TryGetValue(key, out var existing))
        {
            replaced = true;
            await CloseAsync(existing).ConfigureAwait(false);
        }

        _connections[key] = connection;
        return replaced;
    }

    public async Task RemoveAsync(
        NodeConnection connection, string reason = "replaced", CancellationToken cancellationToken = default)
    {
        var key = Key(connection.GroupId, connection.NodeId);

        
        if (_connections.TryGetValue(key, out var current) && ReferenceEquals(current, connection))
            _connections.TryRemove(key, out _);

        await CloseAsync(connection, reason).ConfigureAwait(false);
    }

    






    public async Task<int> CloseGroupAsync(
        string groupId, string reason, CancellationToken cancellationToken = default)
    {
        var victims = InGroup(groupId);

        foreach (var connection in victims)
        {
            var key = Key(connection.GroupId, connection.NodeId);
            if (_connections.TryGetValue(key, out var current) && ReferenceEquals(current, connection))
                _connections.TryRemove(key, out _);

            await CloseAsync(connection, reason).ConfigureAwait(false);
        }

        return victims.Count;
    }

    public NodeConnection? Get(string groupId, string nodeId) =>
        _connections.TryGetValue(Key(groupId, nodeId), out var connection) ? connection : null;

    public IReadOnlyCollection<NodeConnection> InGroup(string groupId) =>
        [.. _connections.Values.Where(c => string.Equals(c.GroupId, groupId, StringComparison.Ordinal))];

    



























    private static async Task CloseAsync(NodeConnection connection, string reason = "replaced")
    {
        
        
        if (!connection.TryBeginClose())
            return;

        try
        {
            if (connection.Socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
            {
                await connection.Socket
                    .CloseOutputAsync(WebSocketCloseStatus.NormalClosure, reason, CancellationToken.None)
                    .ConfigureAwait(false);
            }
        }
        catch (Exception exception) when (
            exception is WebSocketException or ObjectDisposedException or IOException)
        {
            
            
            
            
            
            
            
            
            
            
            
        }
    }
}
