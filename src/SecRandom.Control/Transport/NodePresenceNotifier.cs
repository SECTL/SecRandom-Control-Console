using System.Collections.Concurrent;
using System.Threading.Channels;

namespace SecRandom.Control.Transport;









public sealed record NodePresenceChange(string GroupId, string NodeId, bool Online, DateTimeOffset At);
















public interface INodePresenceNotifier
{
    
    void Publish(NodePresenceChange change);

    
    NodePresenceSubscription Subscribe(string groupId);
}








public sealed class NodePresenceSubscription : IDisposable
{
    private readonly Action _unsubscribe;
    private bool _disposed;

    internal NodePresenceSubscription(ChannelReader<NodePresenceChange> reader, Action unsubscribe)
    {
        Reader = reader;
        _unsubscribe = unsubscribe;
    }

    public ChannelReader<NodePresenceChange> Reader { get; }

    public void Dispose()
    {
        if (_disposed)
            return;

        _disposed = true;
        _unsubscribe();
    }
}

public sealed class NodePresenceNotifier : INodePresenceNotifier
{
    private readonly ConcurrentDictionary<long, Subscriber> _subscribers = new();
    private long _nextId;

    public void Publish(NodePresenceChange change)
    {
        foreach (var subscriber in _subscribers.Values)
        {
            if (!string.Equals(subscriber.GroupId, change.GroupId, StringComparison.Ordinal))
                continue;

            
            subscriber.Channel.Writer.TryWrite(change);
        }
    }

    public NodePresenceSubscription Subscribe(string groupId)
    {
        var channel = Channel.CreateBounded<NodePresenceChange>(new BoundedChannelOptions(1)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        });

        var id = Interlocked.Increment(ref _nextId);
        _subscribers[id] = new Subscriber(groupId, channel);

        return new NodePresenceSubscription(channel.Reader, () =>
        {
            if (_subscribers.TryRemove(id, out var removed))
                removed.Channel.Writer.TryComplete();
        });
    }

    private sealed record Subscriber(string GroupId, Channel<NodePresenceChange> Channel);
}
