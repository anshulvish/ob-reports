using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using HealthcareAnalyticsWeb.Configuration;
using Google.Cloud.BigQuery.V2;

namespace HealthcareAnalyticsWeb.Controllers;

[ApiController]
[Route("api/test/[controller]")]
public class TestBigQueryController : ControllerBase
{
    private readonly BigQueryConfig _config;
    private readonly BigQueryClient _bigQueryClient;
    private readonly ILogger<TestBigQueryController> _logger;

    public TestBigQueryController(
        IOptions<BigQueryConfig> config,
        BigQueryClient bigQueryClient,
        ILogger<TestBigQueryController> logger)
    {
        _config = config.Value;
        _bigQueryClient = bigQueryClient;
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
            EnableQueryCache = _config.EnableQueryCache
        });
    }

    [HttpGet("test-connection")]
    public async Task<IActionResult> TestConnection()
    {
        try
        {
            // Test if we can list datasets
            var datasets = await _bigQueryClient.ListDatasetsAsync(_config.ProjectId).ToListAsync();
            
            return Ok(new
            {
                Status = "Connected",
                ProjectId = _config.ProjectId,
                DatasetCount = datasets.Count,
                TargetDataset = _config.DatasetId,
                Message = "BigQuery connection successful"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to BigQuery");
            return StatusCode(500, new
            {
                Status = "Failed",
                Error = ex.Message,
                Message = "Please check your BigQuery configuration and credentials"
            });
        }
    }
}