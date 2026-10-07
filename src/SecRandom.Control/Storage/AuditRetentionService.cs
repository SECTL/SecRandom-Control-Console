using Microsoft.Extensions.Options;
using SecRandom.Control.Configuration;

namespace SecRandom.Control.Storage;




























public sealed class AuditRetentionService : BackgroundService
{
    







    public static readonly TimeSpan SweepInterval = TimeSpan.FromHours(1);

    private readonly IAuditStore _auditStore;
    private readonly IOptions<ControlOptions> _options;
    private readonly TimeProvider _timeProvider;
    private readonly ILogger<AuditRetentionService> _logger;
    private readonly TimeSpan _interval;

    public AuditRetentionService(
        IAuditStore auditStore,
        IOptions<ControlOptions> options,
        TimeProvider timeProvider,
        ILogger<AuditRetentionService> logger)
        : this(auditStore, options, timeProvider, logger, SweepInterval)
    {
    }

    


    internal AuditRetentionService(
        IAuditStore auditStore,
        IOptions<ControlOptions> options,
        TimeProvider timeProvider,
        ILogger<AuditRetentionService> logger,
        TimeSpan interval)
    {
        _auditStore = auditStore;
        _options = options;
        _timeProvider = timeProvider;
        _logger = logger;
        _interval = interval;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        
        await SweepOnceAsync(stoppingToken).ConfigureAwait(false);

        using var timer = new PeriodicTimer(_interval, _timeProvider);

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
        var retentionDays = _options.Value.AuditRetentionDays;
        if (retentionDays <= 0)
        {
            
            
            _logger.LogDebug(
                "审计保留已关闭（AuditRetentionDays={Days}），不清理任何记录。", retentionDays);
            return 0;
        }

        var cutoff = _timeProvider.GetUtcNow() - TimeSpan.FromDays(retentionDays);

        try
        {
            var deleted = await _auditStore.PurgeBeforeAsync(cutoff, cancellationToken)
                .ConfigureAwait(false);

            if (deleted > 0)
                _logger.LogInformation(
                    "审计保留清理：删除 {Count} 条早于 {Cutoff:O} 的记录（保留 {Days} 天）。",
                    deleted, cutoff, retentionDays);
            else
                _logger.LogDebug("审计保留清理：没有早于 {Cutoff:O} 的记录。", cutoff);

            return deleted;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            
            return 0;
        }
        catch (Exception exception)
        {
            
            
            _logger.LogError(
                exception,
                "审计保留清理失败（服务继续运行，下一轮重试）：cutoff={Cutoff:O} 保留 {Days} 天。",
                cutoff, retentionDays);
            return 0;
        }
    }
}
