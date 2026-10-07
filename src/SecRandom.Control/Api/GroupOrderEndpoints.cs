using System.Security.Claims;
using SecRandom.Control.Storage;

namespace SecRandom.Control.Api;















public static class GroupOrderEndpoints
{
    public static void MapGroupOrderEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/v1").RequireAuthorization();

        group.MapPut("/users/me/group-order", async (
            ClaimsPrincipal principal,
            SaveGroupOrderRequest request,
            IGroupStore store,
            IGroupOrderStore orderStore,
            CancellationToken cancellationToken) =>
        {
            var caller = Caller.From(principal);
            if (caller is null)
                return ApiResults.Unauthorized();

            var groupIds = request.GroupIds ?? [];

            
            
            if (groupIds.Count != groupIds.Distinct(StringComparer.Ordinal).Count())
                return ApiResults.BadRequest(ErrorCodes.InvalidRequest);

            
            
            var mine = await store.ListGroupsForMemberAsync(caller.UserId, cancellationToken)
                .ConfigureAwait(false);
            var allowed = mine.Select(item => item.GroupId).ToHashSet(StringComparer.Ordinal);

            if (groupIds.Any(id => !allowed.Contains(id)))
                return ApiResults.BadRequest(ErrorCodes.InvalidRequest);

            await orderStore.SaveOrderAsync(caller.UserId, groupIds, cancellationToken)
                .ConfigureAwait(false);

            return Results.NoContent();
        });
    }
}

public sealed record SaveGroupOrderRequest(IReadOnlyList<string>? GroupIds);








internal static class GroupOrdering
{
    
    public static Dictionary<string, int> Ranks(IReadOnlyList<string> order)
    {
        var ranks = new Dictionary<string, int>(order.Count, StringComparer.Ordinal);
        for (var index = 0; index < order.Count; index++)
            ranks[order[index]] = index;

        return ranks;
    }

    



    public static List<T> Apply<T>(
        IEnumerable<T> items,
        Dictionary<string, int> ranks,
        Func<T, string> idOf,
        Func<T, DateTimeOffset> createdAtOf) =>
    [
        .. items
            .OrderBy(item => ranks.TryGetValue(idOf(item), out var rank) ? rank : int.MaxValue)
            .ThenBy(createdAtOf)
    ];
}
