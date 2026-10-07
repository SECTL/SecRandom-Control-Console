using SecRandom.Control.Domain;

namespace SecRandom.Control.Storage;






























public interface IAuditStore
{
    
    Task WriteAsync(AuditEvent auditEvent, CancellationToken cancellationToken = default);

    


























    Task<int> PurgeBeforeAsync(DateTimeOffset cutoff, CancellationToken cancellationToken = default);

    








    Task<IReadOnlyList<AuditEvent>> ReadAsync(
        string groupId,
        int limit,
        AuditQuery? query = null,
        CancellationToken cancellationToken = default);

    



















    Task<int> CountAsync(string groupId, AuditQuery? query, CancellationToken cancellationToken = default);

    























    Task<AuditFacets> ReadFacetsAsync(
        string groupId,
        int maxPerList,
        CancellationToken cancellationToken = default);

    








    public const int MaxReadLimit = 500;

    







    public const int MaxFacetItems = 500;
}








public sealed record AuditFacets(
    AuditFacetList<AuditDeviceFacet> ActorDevices,
    AuditFacetList<AuditNodeFacet> TargetNodes,
    AuditFacetList<AuditActorFacet> Actors);








public sealed record AuditFacetList<T>(IReadOnlyList<T> Items, bool Truncated);


public sealed record AuditDeviceFacet(string DeviceId, int Count);








public sealed record AuditNodeFacet(string NodeId, int Count);



















public sealed record AuditActorFacet(string UserId, int Count);


















public sealed record AuditQuery
{
    






    public DateTimeOffset? Before { get; init; }

    






    public string? BeforeId { get; init; }

    
    public string? Action { get; init; }

    







    public string? ActionPrefix { get; init; }

    
    public string? Outcome { get; init; }

    







    public string? ActorDeviceId { get; init; }

    







    public string? ActorUserId { get; init; }

    








    public string? TargetId { get; init; }

    
    public DateTimeOffset? From { get; init; }

    




    public DateTimeOffset? To { get; init; }

    




















    public int? Offset { get; init; }
}
