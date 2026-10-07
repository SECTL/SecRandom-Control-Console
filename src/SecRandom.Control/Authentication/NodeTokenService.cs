using System.Security.Cryptography;
using System.Text;
using SecRandom.Control.Configuration;
using SecRandom.Control.Domain;
using SecRandom.Control.Storage;

namespace SecRandom.Control.Authentication;

public sealed class NodeTokenService(INodeTokenStore store, ILogger<NodeTokenService> logger)
{
    public const string TokenPrefix = "srn_";

    private const int TokenIdBytes = 16;

    private const int SecretBytes = 32;

    private const int MaxRawTokenLength = 256;

    public async Task<NodeTokenIssue> IssueAsync(
        string groupId,
        string nodeId,
        string? enrolledByUserId,
        DateTimeOffset now,
        TimeSpan lifetime,
        CancellationToken cancellationToken = default)
    {
        var tokenId = Convert.ToHexStringLower(RandomNumberGenerator.GetBytes(TokenIdBytes));
        var secret = Convert.ToHexStringLower(RandomNumberGenerator.GetBytes(SecretBytes));

        var token = new NodeToken
        {
            TokenId = tokenId,
            SecretHash = HashSecret(secret),
            GroupId = groupId,
            NodeId = nodeId,
            EnrolledByUserId = enrolledByUserId,
            CreatedAt = now,
            ExpiresAt = now.Add(lifetime > TimeSpan.Zero
                ? lifetime
                : TimeSpan.FromDays(ControlOptions.DefaultNodeTokenLifetimeDays))
        };

        await store.SaveAsync(token, cancellationToken).ConfigureAwait(false);

        return new NodeTokenIssue(token, TokenPrefix + tokenId + "_" + secret);
    }

    public async Task<NodeTokenAuthenticationResult> AuthenticateAsync(
        string? rawToken, DateTimeOffset now, CancellationToken cancellationToken = default)
    {
        var parsed = Parse(rawToken);
        if (parsed is null)
            return NodeTokenAuthenticationResult.Fail(NodeTokenFailure.Malformed);

        var token = await store.GetAsync(parsed.Value.TokenId, cancellationToken).ConfigureAwait(false);
        if (token is null)
            return NodeTokenAuthenticationResult.Fail(NodeTokenFailure.Unknown);

        if (token.IsRevoked)
            return NodeTokenAuthenticationResult.Fail(NodeTokenFailure.Revoked);

        if (token.IsExpired(now))
            return NodeTokenAuthenticationResult.Fail(NodeTokenFailure.Expired);

        var presented = Encoding.ASCII.GetBytes(HashSecret(parsed.Value.Secret));
        var expected = Encoding.ASCII.GetBytes(token.SecretHash);
        if (!CryptographicOperations.FixedTimeEquals(presented, expected))
            return NodeTokenAuthenticationResult.Fail(NodeTokenFailure.Unknown);

        try
        {
            await store.TouchAsync(token.TokenId, now, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(exception, "更新节点令牌 {TokenId} 的最后使用时间失败。", token.TokenId);
        }

        return NodeTokenAuthenticationResult.Success(token);
    }

    public static (string TokenId, string Secret)? Parse(string? rawToken)
    {
        if (string.IsNullOrWhiteSpace(rawToken) || rawToken.Length > MaxRawTokenLength)
            return null;

        var trimmed = rawToken.Trim();
        if (!trimmed.StartsWith(TokenPrefix, StringComparison.Ordinal))
            return null;

        var parts = trimmed[TokenPrefix.Length..].Split('_');
        if (parts.Length != 2)
            return null;

        var tokenId = parts[0];
        var secret = parts[1];
        if (tokenId.Length != TokenIdBytes * 2 || secret.Length != SecretBytes * 2)
            return null;

        if (!IsLowerHex(tokenId) || !IsLowerHex(secret))
            return null;

        return (tokenId, secret);
    }

    public static bool HasTokenPrefix(string? rawToken) =>
        rawToken is not null && rawToken.TrimStart().StartsWith(TokenPrefix, StringComparison.Ordinal);

    public static string HashSecret(string secret) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(secret)));

    private static bool IsLowerHex(string value)
    {
        foreach (var character in value)
        {
            if (character is (>= '0' and <= '9') or (>= 'a' and <= 'f'))
                continue;

            return false;
        }

        return true;
    }
}

public enum NodeTokenFailure
{
    None,
    Malformed,
    Unknown,
    Expired,
    Revoked
}

public sealed record NodeTokenAuthenticationResult(NodeTokenFailure Failure, NodeToken? Token)
{
    public bool Succeeded => Failure == NodeTokenFailure.None && Token is not null;

    public static NodeTokenAuthenticationResult Success(NodeToken token) => new(NodeTokenFailure.None, token);

    public static NodeTokenAuthenticationResult Fail(NodeTokenFailure failure) => new(failure, null);
}

public sealed record NodeTokenIssue(NodeToken Token, string PlainTextToken);
