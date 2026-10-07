using System.Text.Json;

namespace SecRandom.Control.Domain;
















public sealed record NodeCommand
{
    







    public const string RevokedResultDetail = "revoked";

    
    public required string CommandId { get; init; }

    public required string GroupId { get; init; }

    public required string TargetNodeId { get; init; }

    
    public required string IssuerMemberId { get; init; }

    
    public string? IssuerDeviceId { get; init; }

    
    public required string Capability { get; init; }

    
    public required string Kind { get; init; }

    public JsonElement? Payload { get; init; }

    public required DateTimeOffset IssuedAt { get; init; }

    
    public required DateTimeOffset ExpiresAt { get; init; }

    public CommandStatus Status { get; init; } = CommandStatus.Queued;

    public DateTimeOffset? DeliveredAt { get; init; }

    public DateTimeOffset? ResolvedAt { get; init; }

    
    public string? ResultDetail { get; init; }

    
    public JsonElement? ResultContext { get; init; }

    
    public JsonElement? ResultPayload { get; init; }

    public bool IsExpired(DateTimeOffset now) => now >= ExpiresAt;

    














    public bool IsTerminal => Status
        is CommandStatus.Completed or CommandStatus.Rejected or CommandStatus.Expired or CommandStatus.Revoked;
}








public enum CommandStatus
{
    
    Queued,

    
    Delivered,

    
    Accepted,

    
    Completed,

    
    Rejected,

    
    Expired,

    







    Revoked
}

public static class CommandKinds
{
    
    public const string SetDesiredState = "set_desired_state";

    
    public const string Action = "action";

    







    public const string Query = "query";
}
