using System.Text.Json;
using System.Text.Json.Serialization;
using SecRandom.Control.Domain;

namespace SecRandom.Control;











public static class JsonSerialization
{
    public static readonly JsonSerializerOptions ProtocolJsonOptions = Create();

    private static JsonSerializerOptions Create()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DictionaryKeyPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            WriteIndented = false
        };
        
        
        options.Converters.Add(new LegacyAwareGroupRoleConverter());
        options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.KebabCaseLower));
        return options;
    }

    














    private sealed class LegacyAwareGroupRoleConverter : JsonConverter<GroupRole>
    {
        public override GroupRole Read(
            ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            switch (reader.TokenType)
            {
                case JsonTokenType.String:
                    var raw = reader.GetString();
                    if (string.Equals(raw, "manager", StringComparison.OrdinalIgnoreCase))
                        return GroupRole.Admin;

                    
                    if (int.TryParse(raw, out var numeric))
                        return GroupRoleLegacy.FromPersisted(numeric);

                    if (Enum.TryParse<GroupRole>(raw, ignoreCase: true, out var parsed) &&
                        Enum.IsDefined(parsed))
                        return parsed;

                    throw new JsonException($"未知的组内角色：{raw}");

                case JsonTokenType.Number:
                    return GroupRoleLegacy.FromPersisted(reader.GetInt32());

                default:
                    throw new JsonException($"组内角色必须是字符串，实际是 {reader.TokenType}");
            }
        }

        public override void Write(
            Utf8JsonWriter writer, GroupRole value, JsonSerializerOptions options) =>
            writer.WriteStringValue(JsonNamingPolicy.KebabCaseLower.ConvertName(value.ToString()));
    }
}
