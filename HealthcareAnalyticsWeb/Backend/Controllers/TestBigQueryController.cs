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
    private readonly IBigQueryTableService _tableService;
    private readonly ILogger<TestBigQueryController> _logger;

    public TestBigQueryController(
        IOptions<BigQueryConfig> config,
        IBigQueryClientService bigQueryClientService,
        IBigQueryTableService tableService,
        ILogger<TestBigQueryController> logger)
    {
        _config = config.Value;
        _bigQueryClientService = bigQueryClientService;
        _tableService = tableService;
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

    [HttpGet("list-tables")]
    public async Task<IActionResult> ListTables()
    {
        try
        {
            _logger.LogInformation("Listing tables in BigQuery dataset");
            
            // Check if BigQuery client is available
            if (!_bigQueryClientService.IsAvailable)
            {
                return BadRequest(new
                {
                    Error = "BigQuery client not available",
                    Message = _bigQueryClientService.StatusMessage
                });
            }
            
            var client = _bigQueryClientService.GetClient()!;
            
            // Get the dataset
            var dataset = client.GetDataset(_config.DatasetId);
            
            // List all tables in the dataset
            var tables = new List<object>();
            var tablesEnum = dataset.ListTablesAsync();
            
            await foreach (var table in tablesEnum)
            {
                tables.Add(new
                {
                    TableId = table.Reference.TableId,
                    FullTableId = table.FullyQualifiedId,
                    Type = table.Resource.Type,
                    CreationTime = table.Resource.CreationTime,
                    LastModifiedTime = table.Resource.LastModifiedTime,
                    NumRows = table.Resource.NumRows,
                    NumBytes = table.Resource.NumBytes
                });
            }
            
            _logger.LogInformation("Found {TableCount} tables in dataset", tables.Count);
            
            return Ok(new
            {
                Success = true,
                DatasetId = _config.DatasetId,
                TableCount = tables.Count,
                Tables = tables,
                Message = $"Found {tables.Count} tables in dataset {_config.DatasetId}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list tables");
            return StatusCode(500, new
            {
                Error = "Failed to list tables",
                Message = ex.Message,
                DatasetId = _config.DatasetId
            });
        }
    }

    [HttpGet("test-query")]
    public async Task<IActionResult> TestQuery([FromQuery] DateTime? date = null)
    {
        try
        {
            _logger.LogInformation("Running test query against BigQuery");
            
            // Check if BigQuery client is available
            if (!_bigQueryClientService.IsAvailable)
            {
                return BadRequest(new
                {
                    Error = "BigQuery client not available",
                    Message = _bigQueryClientService.StatusMessage
                });
            }
            
            var client = _bigQueryClientService.GetClient()!;
            
            // Get table based on user-specified date or latest available
            TableInfo? targetTable;
            if (date.HasValue)
            {
                var tablesForDate = _tableService.GetTablesForDateRange(date.Value, date.Value, TableType.Events);
                targetTable = tablesForDate.FirstOrDefault();
                
                if (targetTable == null)
                {
                    return NotFound(new
                    {
                        Error = "No data available for specified date",
                        RequestedDate = date.Value.ToString("yyyy-MM-dd"),
                        Message = $"No event tables found for date {date.Value:yyyy-MM-dd}"
                    });
                }
            }
            else
            {
                targetTable = _tableService.GetLatestEventTable();
                if (targetTable == null)
                {
                    return NotFound(new
                    {
                        Error = "No event tables found",
                        Message = "Unable to find any event tables in the dataset"
                    });
                }
            }
            
            _logger.LogInformation("Using table: {TableId} ({Date:yyyy-MM-dd}, IsIntraday: {IsIntraday})", 
                targetTable.TableId, targetTable.Date, targetTable.IsIntraday);
            
            // Build the query to get top 1000 rows from specified table
            var query = $@"
                SELECT *
                FROM `{targetTable.FullyQualifiedId}`
                LIMIT 1000
            ";
            
            _logger.LogInformation("Executing query: {Query}", query);
            
            // Create and execute the query job
            var queryJob = await client.CreateQueryJobAsync(query, null);
            var results = await queryJob.GetQueryResultsAsync();
            
            // Process results
            var rows = new List<Dictionary<string, object?>>();
            var rowCount = 0;
            
            foreach (var row in results)
            {
                var rowData = new Dictionary<string, object?>();
                foreach (var field in row.Schema.Fields)
                {
                    rowData[field.Name] = row[field.Name];
                }
                rows.Add(rowData);
                rowCount++;
            }
            
            _logger.LogInformation("Query executed successfully. Retrieved {RowCount} rows", rowCount);
            
            return Ok(new
            {
                Success = true,
                Query = query,
                TableUsed = new
                {
                    targetTable.TableId,
                    targetTable.Date,
                    targetTable.IsIntraday
                },
                RequestedDate = date?.ToString("yyyy-MM-dd"),
                RowCount = rowCount,
                Rows = rows.Take(10), // Return only first 10 rows for preview
                Message = $"Query executed successfully. Retrieved {rowCount} rows (showing first 10)"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to execute test query");
            return StatusCode(500, new
            {
                Error = "Query execution failed",
                Message = ex.Message,
                RequestedDate = date?.ToString("yyyy-MM-dd")
            });
        }
    }
}