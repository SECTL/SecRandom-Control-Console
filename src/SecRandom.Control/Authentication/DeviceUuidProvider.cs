using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using SecRandom.Control.Configuration;

namespace SecRandom.Control.Authentication;











public sealed class DeviceUuidProvider
{
    private readonly Lock _gate = new();
    private readonly string _path;
    private string? _cached;

    public DeviceUuidProvider(IOptions<ControlOptions> options)
    {
        _path = Path.Combine(options.Value.DataRoot, "instance-device-uuid");
    }

    public string Get()
    {
        if (_cached is not null)
            return _cached;

        lock (_gate)
        {
            if (_cached is not null)
                return _cached;

            if (File.Exists(_path))
            {
                var existing = File.ReadAllText(_path).Trim();
                if (Guid.TryParse(existing, out var parsed))
                    return _cached = parsed.ToString();
            }

            var generated = Guid.NewGuid().ToString();
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
                File.WriteAllText(_path, generated);
            }
            catch (IOException)
            {
                
            }

            return _cached = generated;
        }
    }
}
