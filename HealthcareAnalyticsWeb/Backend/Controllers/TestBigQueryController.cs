using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using HealthcareAnalyticsWeb.Configuration;
using HealthcareAnalyticsWeb.Services.Interfaces;
using Google.Cloud.BigQuery.V2;

namespace HealthcareAnalyticsWeb.Controllers;

[ApiController]
[Route("api/test/[controller]")]
public class TestBigQueryController : ControllerBase
{
    private readonly BigQueryConfig _config;
    private readonly IBigQueryClientService _bigQueryClientService;
    private readonly ILogger<TestBigQueryController> _logger;

    public TestBigQueryController(
        IOptions<BigQueryConfig> config,
        IBigQueryClientService bigQueryClientService,
        ILogger<TestBigQueryController> logger)
    {
        _config = config.Value;
        _bigQueryClientService = bigQueryClientService;
        _logger = logger;
    }

    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        return Ok(new
        {
            ProjectId = _config.ProjectId,
            DatasetId = _config.DatasetId,
            Location = _config.Location,
            FullDatasetId = _config.FullDatasetId,
            QueryTimeoutMinutes = _config.QueryTimeoutMinutes,
            EnableQueryCache = _config.EnableQueryCache,
            ServiceAccountKeyPath = _config.ServiceAccountKeyPath,
            ServiceAccountKeyExists = !string.IsNullOrEmpty(_config.ServiceAccountKeyPath) && System.IO.File.Exists(_config.ServiceAccountKeyPath),
            BigQueryClientAvailable = _bigQueryClientService.IsAvailable,
            BigQueryStatusMessage = _bigQueryClientService.StatusMessage
        });
    }

    [HttpGet("test-connection")]
    public async Task<IActionResult> TestConnection()
    {
        try
        {
            _logger.LogInformation("Testing BigQuery connection to project: {ProjectId}", _config.ProjectId);
            
            // Check if BigQuery client is available
            if (!_bigQueryClientService.IsAvailable)
            {
                _logger.LogWarning("BigQuery client not available - {StatusMessage}", _bigQueryClientService.StatusMessage);
                return Ok(new
                {
                    Status = "Configuration Required",
                    ProjectId = _config.ProjectId,
                    DatasetCount = 0,
                    TargetDataset = _config.DatasetId,
                    Message = _bigQueryClientService.StatusMessage
                });
            }
            
            // Test if we can list datasets
            var client = _bigQueryClientService.GetClient()!;
            var datasetsEnum = client.ListDatasetsAsync(_config.ProjectId);
            var datasets = new List<BigQueryDataset>();
            
            // Use await foreach for async enumeration
            await foreach (var dataset in datasetsEnum)
            {
                datasets.Add(dataset);
            }
            
            _logger.LogInformation("BigQuery connection successful. Found {DatasetCount} datasets", datasets.Count);
            
            return Ok(new
            {
                Status = "Connected",
                ProjectId = _config.ProjectId,
                DatasetCount = datasets.Count,
                TargetDataset = _config.DatasetId,
                Message = "BigQuery connection successful"
            });
        }
        catch (Google.GoogleApiException googleEx) when (googleEx.HttpStatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            _logger.LogWarning("BigQuery authentication failed: {Error}", googleEx.Message);
            return Ok(new
            {
                Status = "Authentication Required",
                ProjectId = _config.ProjectId,
                DatasetCount = 0,
                TargetDataset = _config.DatasetId,
                Message = "BigQuery credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable or configure service account key."
            });
        }
        catch (Google.GoogleApiException googleEx) when (googleEx.HttpStatusCode == System.Net.HttpStatusCode.Forbidden)
        {
            _logger.LogWarning("BigQuery access denied: {Error}", googleEx.Message);
            return Ok(new
            {
                Status = "Access Denied",
                ProjectId = _config.ProjectId,
                DatasetCount = 0,
                TargetDataset = _config.DatasetId,
                Message = "Access denied to BigQuery project. Check project permissions."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to BigQuery");
            return Ok(new
            {
                Status = "Failed",
                ProjectId = _config.ProjectId,
                DatasetCount = 0,
                TargetDataset = _config.DatasetId,
                Message = $"BigQuery connection failed: {ex.Message}"
            });
        }
    }
}