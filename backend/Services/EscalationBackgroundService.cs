namespace HelpdeskApi.Services;

public class EscalationBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EscalationBackgroundService> _logger;

    public EscalationBackgroundService(IServiceScopeFactory scopeFactory, ILogger<EscalationBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Escalation background service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);

                using var scope = _scopeFactory.CreateScope();
                var escalationService = scope.ServiceProvider.GetRequiredService<IEscalationService>();
                await escalationService.ProcessEscalationsAsync();

                _logger.LogDebug("Escalation check completed.");
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing escalations.");
            }
        }

        _logger.LogInformation("Escalation background service stopped.");
    }
}
