using System.Text.Json;

namespace SecRandom.Control.Api;


internal static class RequestJson
{
    public static async Task<T?> ReadAsync<T>(HttpRequest request, CancellationToken cancellationToken)
        where T : class
    {
        try
        {
            return await request.ReadFromJsonAsync<T>(cancellationToken);
        }
        catch (Exception exception) when (
            exception is JsonException or InvalidOperationException or NotSupportedException or IOException)
        {
            return null;
        }
    }
}
