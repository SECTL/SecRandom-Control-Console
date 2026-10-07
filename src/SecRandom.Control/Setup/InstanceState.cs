using System.Text.Json;
using Microsoft.Extensions.Options;
using SecRandom.Control.Configuration;

namespace SecRandom.Control.Setup;


public sealed record InstanceState
{
    public int Version { get; init; } = 1;

    public string Mode { get; init; } = string.Empty;

    public string? DisplayName { get; init; }

    public DateTimeOffset InitializedAt { get; init; }
}


public sealed class InstanceStateStore
{
    public const int CurrentVersion = 1;

    public const string FileName = "instance.json";

    private readonly object _gate = new();
    private readonly ILogger<InstanceStateStore> _logger;
    private InstanceState? _state;

    public InstanceStateStore(IOptions<ControlOptions> options, ILogger<InstanceStateStore> logger)
    {
        FilePath = FilePathFor(options.Value.DataRoot);
        _logger = logger;

        _state = Read(FilePath);
        if (_state is null && File.Exists(FilePath))
            _logger.LogWarning("实例状态文件 {Path} 无法解析，按未初始化处理。", FilePath);
    }

    public string FilePath { get; }

    public bool IsInitialized => Volatile.Read(ref _state) is not null;

    public InstanceState? Current => Volatile.Read(ref _state);

    public static string FilePathFor(string dataRoot) => Path.Combine(dataRoot, FileName);

    public static InstanceState? Read(string filePath)
    {
        try
        {
            if (!File.Exists(filePath))
                return null;

            var state = JsonSerializer.Deserialize<InstanceState>(
                File.ReadAllText(filePath), JsonSerialization.ProtocolJsonOptions);

            return string.IsNullOrWhiteSpace(state?.Mode) ? null : state;
        }
        catch (Exception exception) when (
            exception is IOException or UnauthorizedAccessException or JsonException or NotSupportedException or ArgumentException)
        {
            return null;
        }
    }

    
    public bool TryInitialize(string mode, string? displayName, out InstanceState state)
    {
        lock (_gate)
        {
            if (_state is not null)
            {
                state = _state;
                return false;
            }

            var created = new InstanceState
            {
                Version = CurrentVersion,
                Mode = mode,
                DisplayName = displayName,
                InitializedAt = DateTimeOffset.UtcNow,
            };

            Write(created);
            _state = created;
            state = created;
            return true;
        }
    }

    private void Write(InstanceState state)
    {
        var directory = Path.GetDirectoryName(FilePath);
        if (!string.IsNullOrEmpty(directory))
            Directory.CreateDirectory(directory);

        var temporary = FilePath + ".tmp";
        File.WriteAllText(temporary, JsonSerializer.Serialize(state, JsonSerialization.ProtocolJsonOptions));

        if (!OperatingSystem.IsWindows())
            File.SetUnixFileMode(temporary, UnixFileMode.UserRead | UnixFileMode.UserWrite);

        File.Move(temporary, FilePath, overwrite: true);
        _logger.LogInformation("实例状态已写入 {Path}：mode={Mode}。", FilePath, state.Mode);
    }
}
