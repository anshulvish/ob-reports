using HealthcareAnalyticsWeb.Services.Interfaces;

namespace HealthcareAnalyticsWeb.Services;

public class BigQueryInitializationService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BigQueryInitializationService> _logger;

    public BigQueryInitializationService(
        IServiceProvider serviceProvider,
        ILogger<BigQueryInitializationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting BigQuery initialization service");

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var tableService = scope.ServiceProvider.GetRequiredService<IBigQueryTableService>();
            
            await tableService.InitializeAsync();
            
            var tables = tableService.GetAvailableTables();
            if (tables.Any())
            {
                _logger.LogInformation("BigQuery initialization complete. Found {TableCount} tables", tables.Count);
                
                var latestEvent = tableService.GetLatestEventTable();
                if (latestEvent != null)
                {
                    _logger.LogInformation("Latest event data available: {TableId} ({Date:yyyy-MM-dd})", 
                        latestEvent.TableId, latestEvent.Date);
                }
            }
            else
            {
                _logger.LogWarning("No tables found during BigQuery initialization");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize BigQuery tables");
            // Don't throw - allow app to start even if BigQuery init fails
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stopping BigQuery initialization service");
        return Task.CompletedTask;
    }
}