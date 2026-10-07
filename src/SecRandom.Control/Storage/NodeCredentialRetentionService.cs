namespace SecRandom.Control.Storage;

public sealed class NodeCredentialRetentionService(
    IEnrollmentCodeStore enrollmentCodes,
    INodeTokenStore tokens,
    TimeProvider timeProvider,
    ILogger<NodeCredentialRetentionService> logger) : BackgroundService
{
    public static readonly TimeSpan SweepInterval = TimeSpan.FromHours(1);

    public static readonly TimeSpan GracePeriod = TimeSpan.FromDays(30);

    private readonly TimeSpan _interval = SweepInterval;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await SweepOnceAsync(stoppingToken).ConfigureAwait(false);

        using var timer = new PeriodicTimer(_interval, timeProvider);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (!await timer.WaitForNextTickAsync(stoppingToken).ConfigureAwait(false))
                    return;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }

            await SweepOnceAsync(stoppingToken).ConfigureAwait(false);
        }
    }

    public async Task<int> SweepOnceAsync(CancellationToken cancellationToken = default)
    {
        var cutoff = timeProvider.GetUtcNow() - GracePeriod;

        try
        {
            var codes = await enrollmentCodes.PurgeExpiredBeforeAsync(cutoff, cancellationToken).ConfigureAwait(false);
            var revoked = await tokens.PurgeExpiredBeforeAsync(cutoff, cancellationToken).ConfigureAwait(false);

            if (codes > 0 || revoked > 0)
            {
                logger.LogInformation(
                    "接入凭据保留清理：删除 {Codes} 个接入码、{Tokens} 个节点令牌（早于 {Cutoff:O}）。",
                    codes, revoked, cutoff);
            }

            return codes + revoked;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return 0;
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception, "接入凭据保留清理失败（服务继续运行，下一轮重试）：cutoff={Cutoff:O}。", cutoff);
            return 0;
        }
    }
}
