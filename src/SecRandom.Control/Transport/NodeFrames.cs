using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using SecRandom.Control.Domain;

namespace SecRandom.Control.Transport;















public sealed record NodeFrame
{
    public const string TypeHello = "hello";
    public const string TypeHeartbeat = "heartbeat";

    















    public const string TypeDeregister = "node.deregister";

    public const string TypeAck = "command.ack";
    public const string TypeResult = "command.result";

    [JsonPropertyName("type")]
    public required string Type { get; init; }

    [JsonPropertyName("node_id")]
    public string? NodeId { get; init; }

    [JsonPropertyName("group_id")]
    public string? GroupId { get; init; }

    [JsonPropertyName("platform")]
    public string? Platform { get; init; }

    [JsonPropertyName("version")]
    public string? Version { get; init; }

    
    [JsonPropertyName("capabilities")]
    public IReadOnlyList<string>? Capabilities { get; init; }

    


    [JsonPropertyName("local_remote_allowed")]
    public bool? LocalRemoteAllowed { get; init; }

    










    [JsonPropertyName("display_name")]
    public string? DisplayName { get; init; }

    
    [JsonPropertyName("desired_state_revision")]
    public long? DesiredStateRevision { get; init; }

    [JsonPropertyName("command_id")]
    public string? CommandId { get; init; }

    
    [JsonPropertyName("accepted")]
    public bool? Accepted { get; init; }

    
    [JsonPropertyName("ok")]
    public bool? Ok { get; init; }

    
    [JsonPropertyName("reason")]
    public string? Reason { get; init; }

    






    [JsonPropertyName("detail")]
    public JsonElement? Detail { get; init; }

    






    [JsonPropertyName("payload")]
    public JsonElement? Payload { get; init; }

    
    public const int MaxDisplayNameLength = 64;

    
























    public static string? SanitizeDisplayName(string? value)
    {
        if (value is null)
            return null;

        var builder = new System.Text.StringBuilder(value.Length);
        var pendingSpace = false;

        for (var index = 0; index < value.Length; index++)
        {
            var ch = value[index];

            
            if (char.IsHighSurrogate(ch))
            {
                if (index + 1 >= value.Length || !char.IsLowSurrogate(value[index + 1]))
                    continue;

                
                if (!AppendCharacter(builder, char.ConvertToUtf32(ch, value[index + 1]), ref pendingSpace))
                    break;

                index++;
                continue;
            }

            if (char.IsLowSurrogate(ch))
                continue;

            if (!AppendCharacter(builder, ch, ref pendingSpace))
                break;
        }

        var sanitized = builder.ToString();
        return sanitized.Length == 0 ? null : sanitized;
    }

    






    private static bool AppendCharacter(System.Text.StringBuilder builder, int codePoint, ref bool pendingSpace)
    {
        
        
        
        
        
        
        
        if (codePoint <= char.MaxValue && char.IsWhiteSpace((char)codePoint))
        {
            
            pendingSpace = builder.Length > 0;
            return true;
        }

        
        
        
        
        var category = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(codePoint);

        if (category is System.Globalization.UnicodeCategory.Control
            or System.Globalization.UnicodeCategory.Format
            or System.Globalization.UnicodeCategory.PrivateUse
            or System.Globalization.UnicodeCategory.OtherNotAssigned)
            return true;

        if (pendingSpace)
        {
            if (builder.Length >= MaxDisplayNameLength)
                return false;

            builder.Append(' ');
            pendingSpace = false;
        }

        if (builder.Length >= MaxDisplayNameLength)
            return false;

        builder.Append(char.ConvertFromUtf32(codePoint));
        return true;
    }
}


public sealed record ServerFrame
{
    public const string TypeHelloAck = "hello.ack";
    public const string TypeCommand = "command";
    public const string TypeDesiredState = "desired_state";

    












    public const string TypeDeregisterAck = "node.deregister.ack";

    






    public const string TypeCommandRevoke = "command.revoke";

    [JsonPropertyName("type")]
    public required string Type { get; init; }

    
    [JsonPropertyName("heartbeat_seconds")]
    public int? HeartbeatSeconds { get; init; }

    


    [JsonPropertyName("offline_after_seconds")]
    public int? OfflineAfterSeconds { get; init; }

    
    [JsonPropertyName("desired_state_revision")]
    public long? DesiredStateRevision { get; init; }

    [JsonPropertyName("command_id")]
    public string? CommandId { get; init; }

    [JsonPropertyName("capability")]
    public string? Capability { get; init; }

    [JsonPropertyName("kind")]
    public string? Kind { get; init; }

    [JsonPropertyName("payload")]
    public JsonElement? Payload { get; init; }

    
    [JsonPropertyName("expires_at")]
    public DateTimeOffset? ExpiresAt { get; init; }

    
    [JsonPropertyName("code")]
    public string? Code { get; init; }

    










    [JsonPropertyName("deregistered")]
    public bool? Deregistered { get; init; }
}



















public static class NodeFrameBudget
{
    



    public const int MaxFrameBytes = 64 * 1024;

    






    public static int MeasureCommandFrameBytes(NodeCommand command) =>
        Measure(new ServerFrame
        {
            Type = ServerFrame.TypeCommand,
            CommandId = command.CommandId,
            Capability = command.Capability,
            Kind = command.Kind,
            Payload = command.Payload,
            ExpiresAt = command.ExpiresAt
        });

    
    public static int Measure(ServerFrame frame) =>
        Encoding.UTF8.GetByteCount(JsonSerializer.Serialize(frame, JsonSerialization.ProtocolJsonOptions));
}
