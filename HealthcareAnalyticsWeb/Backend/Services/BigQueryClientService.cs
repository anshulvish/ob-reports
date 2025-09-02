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
                // Auto-detect and convert path between Windows and WSL formats
                var keyPath = ConvertPathForEnvironment(bigQueryConfig.ServiceAccountKeyPath);
                _logger.LogInformation("Original path: {OriginalPath}, Converted path: {ConvertedPath}", 
                    bigQueryConfig.ServiceAccountKeyPath, keyPath);
                
                _logger.LogInformation("Checking if service account key file exists: {Path}", keyPath);
                
                if (File.Exists(keyPath))
                {
                    _logger.LogInformation("Service account key file found, creating BigQuery client");
                    var credential = GoogleCredential.FromFile(keyPath);
                    _client = BigQueryClient.Create(bigQueryConfig.ProjectId, credential);
                    StatusMessage = "Connected using service account key";
                    _logger.LogInformation("BigQuery client created successfully using service account key");
                }
                else
                {
                    _logger.LogWarning("Service account key file not found: {Path}", keyPath);
                    StatusMessage = $"Service account key file not found: {keyPath}";
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

    private string ConvertPathForEnvironment(string path)
    {
        // Check if we're running in WSL
        bool isWSL = File.Exists("/proc/version") && 
                     File.ReadAllText("/proc/version").Contains("Microsoft", StringComparison.OrdinalIgnoreCase);

        if (isWSL)
        {
            // Running in WSL
            if (path.StartsWith("C:\\") || path.StartsWith("c:\\"))
            {
                // Convert Windows path to WSL path
                // C:\path\to\file -> /mnt/c/path/to/file
                var driveLetter = char.ToLower(path[0]);
                var remainingPath = path.Substring(3).Replace('\\', '/');
                return $"/mnt/{driveLetter}/{remainingPath}";
            }
            // Already in WSL format or relative path
            return path;
        }
        else
        {
            // Running in Windows
            if (path.StartsWith("/mnt/"))
            {
                // Convert WSL path to Windows path
                // /mnt/c/path/to/file -> C:\path\to\file
                var parts = path.Substring(5).Split('/');
                if (parts.Length > 0)
                {
                    var driveLetter = char.ToUpper(parts[0][0]);
                    var remainingPath = string.Join("\\", parts.Skip(1));
                    return $"{driveLetter}:\\{remainingPath}";
                }
            }
            // Already in Windows format or relative path
            return path;
        }
    }
}