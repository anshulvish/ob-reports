using Google.Cloud.BigQuery.V2;
using Google.Apis.Auth.OAuth2;
using HealthcareAnalyticsWeb.Configuration;
using HealthcareAnalyticsWeb.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace HealthcareAnalyticsWeb.Services;

public class BigQueryClientService : IBigQueryClientService
{
    private readonly BigQueryClient? _client;
    private readonly ILogger<BigQueryClientService> _logger;

    public bool IsAvailable => _client != null;
    public string StatusMessage { get; private set; }

    public BigQueryClientService(IOptions<BigQueryConfig> config, ILogger<BigQueryClientService> logger)
    {
        _logger = logger;
        var bigQueryConfig = config.Value;
        StatusMessage = "Not configured";

        _logger.LogInformation("Initializing BigQuery client. ServiceAccountKeyPath: '{Path}'", bigQueryConfig.ServiceAccountKeyPath ?? "null");

        try
        {
            if (!string.IsNullOrEmpty(bigQueryConfig.ServiceAccountKeyPath))
            {
                _logger.LogInformation("Checking if service account key file exists: {Path}", bigQueryConfig.ServiceAccountKeyPath);
                
                if (File.Exists(bigQueryConfig.ServiceAccountKeyPath))
                {
                    _logger.LogInformation("Service account key file found, creating BigQuery client");
                    var credential = GoogleCredential.FromFile(bigQueryConfig.ServiceAccountKeyPath);
                    _client = BigQueryClient.Create(bigQueryConfig.ProjectId, credential);
                    StatusMessage = "Connected using service account key";
                    _logger.LogInformation("BigQuery client created successfully using service account key");
                }
                else
                {
                    _logger.LogWarning("Service account key file not found: {Path}", bigQueryConfig.ServiceAccountKeyPath);
                    StatusMessage = $"Service account key file not found: {bigQueryConfig.ServiceAccountKeyPath}";
                    _client = null;
                    return;
                }
            }
            else
            {
                _logger.LogInformation("No service account key path configured, trying default credentials");
                // Try to use default credentials
                _client = BigQueryClient.Create(bigQueryConfig.ProjectId);
                StatusMessage = "Connected using default credentials";
                _logger.LogInformation("BigQuery client created successfully using default credentials");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to create BigQuery client: {Error}", ex.Message);
            StatusMessage = $"Configuration error: {ex.Message}";
            _client = null;
        }
    }

    public BigQueryClient? GetClient() => _client;
}