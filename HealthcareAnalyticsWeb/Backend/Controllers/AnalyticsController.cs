using Microsoft.AspNetCore.Mvc;
using HealthcareAnalyticsWeb.Services.Interfaces;
using HealthcareAnalyticsWeb.Configuration;
using Microsoft.Extensions.Options;
using NSwag.Annotations;
using System.ComponentModel.DataAnnotations;

namespace HealthcareAnalyticsWeb.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IBigQueryClientService _bigQueryClientService;
    private readonly IBigQueryTableService _tableService;
    private readonly BigQueryConfig _config;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        IBigQueryClientService bigQueryClientService,
        IBigQueryTableService tableService,
        IOptions<BigQueryConfig> config,
        ILogger<AnalyticsController> logger)
    {
        _bigQueryClientService = bigQueryClientService;
        _tableService = tableService;
        _config = config.Value;
        _logger = logger;
    }

    [HttpGet("date-ranges")]
    public IActionResult GetAvailableDateRanges()
    {
        try
        {
            var eventTables = _tableService.GetEventTables();
            
            if (!eventTables.Any())
            {
                return Ok(new
                {
                    Available = false,
                    Message = "No event data available"
                });
            }

            var dateRange = new
            {
                Available = true,
                EarliestDate = eventTables.Last().Date,
                LatestDate = eventTables.First().Date,
                TotalDays = eventTables.Count,
                DailyTables = eventTables.Count(t => !t.IsIntraday),
                IntradayTables = eventTables.Count(t => t.IsIntraday)
            };

            return Ok(dateRange);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get available date ranges");
            return StatusCode(500, new { Error = "Failed to retrieve available date ranges", Message = ex.Message });
        }
    }

    [HttpPost("query")]
    public async Task<IActionResult> ExecuteAnalyticsQuery([FromBody] AnalyticsQueryRequest request)
    {
        try
        {
            // Validate request
            if (request.StartDate > request.EndDate)
            {
                return BadRequest(new { Error = "Start date must be before end date" });
            }

            // Check if BigQuery client is available
            if (!_bigQueryClientService.IsAvailable)
            {
                return BadRequest(new
                {
                    Error = "BigQuery client not available",
                    Message = _bigQueryClientService.StatusMessage
                });
            }

            // Get tables for the requested date range
            var tables = _tableService.GetTablesForDateRange(request.StartDate, request.EndDate, TableType.Events);
            
            if (!tables.Any())
            {
                return NotFound(new
                {
                    Error = "No data available for selected date range",
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    Message = "No event tables found for the specified date range"
                });
            }

            _logger.LogInformation("Executing analytics query for date range {StartDate:yyyy-MM-dd} to {EndDate:yyyy-MM-dd} using {TableCount} tables", 
                request.StartDate, request.EndDate, tables.Count);

            var client = _bigQueryClientService.GetClient()!;

            // Build the query based on request type
            string query = request.QueryType.ToLower() switch
            {
                "sample" => BuildSampleQuery(tables, request.Limit ?? 1000),
                "engagement" => BuildEngagementQuery(tables, request),
                "user_journeys" => BuildUserJourneysQuery(tables, request),
                _ => BuildSampleQuery(tables, request.Limit ?? 1000)
            };

            _logger.LogInformation("Executing query: {Query}", query);

            // Execute the query
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
                QueryType = request.QueryType,
                DateRange = new
                {
                    StartDate = request.StartDate,
                    EndDate = request.EndDate
                },
                TablesUsed = tables.Select(t => new { t.TableId, t.Date, t.IsIntraday }),
                RowCount = rowCount,
                Data = rowCount <= 100 ? rows : rows.Take(100), // Return all rows if <= 100, otherwise first 100
                Message = rowCount > 100 ? $"Query returned {rowCount} rows (showing first 100)" : $"Query returned {rowCount} rows"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to execute analytics query");
            return StatusCode(500, new
            {
                Error = "Query execution failed",
                Message = ex.Message,
                StartDate = request.StartDate,
                EndDate = request.EndDate
            });
        }
    }

    private string BuildSampleQuery(List<TableInfo> tables, int limit)
    {
        if (tables.Count == 1)
        {
            return $@"
                SELECT *
                FROM `{tables.First().FullyQualifiedId}`
                LIMIT {limit}
            ";
        }

        // Union query for multiple tables
        return _tableService.BuildUnionQuery(tables, "*", "") + $"\nLIMIT {limit}";
    }

    private string BuildEngagementQuery(List<TableInfo> tables, AnalyticsQueryRequest request)
    {
        var selectClause = @"
            user_pseudo_id,
            event_name,
            event_timestamp,
            COUNT(*) as event_count,
            MIN(event_timestamp) as first_event,
            MAX(event_timestamp) as last_event
        ";

        var whereClause = "event_name IS NOT NULL";
        var baseQuery = tables.Count == 1 
            ? $"SELECT {selectClause} FROM `{tables.First().FullyQualifiedId}` WHERE {whereClause} GROUP BY user_pseudo_id, event_name, event_timestamp"
            : BuildUnionQueryWithGroupBy(tables, selectClause, whereClause, "user_pseudo_id, event_name, event_timestamp");

        return $@"
            WITH user_events AS (
                {baseQuery}
            )
            SELECT 
                user_pseudo_id,
                event_name,
                SUM(event_count) as total_events,
                MIN(first_event) as user_first_event,
                MAX(last_event) as user_last_event
            FROM user_events
            GROUP BY user_pseudo_id, event_name
            ORDER BY total_events DESC
            LIMIT {request.Limit ?? 1000}
        ";
    }

    private string BuildUserJourneysQuery(List<TableInfo> tables, AnalyticsQueryRequest request)
    {
        var selectClause = @"
            user_pseudo_id,
            event_name,
            event_timestamp,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_title') as page_title,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_location
        ";

        var whereClause = "user_pseudo_id IS NOT NULL AND event_name IS NOT NULL";
        var baseQuery = tables.Count == 1 
            ? $"SELECT {selectClause} FROM `{tables.First().FullyQualifiedId}` WHERE {whereClause}"
            : _tableService.BuildUnionQuery(tables, selectClause, whereClause);

        return $@"
            WITH user_events AS (
                {baseQuery}
            ),
            user_journeys AS (
                SELECT 
                    user_pseudo_id,
                    event_name,
                    page_title,
                    page_location,
                    event_timestamp,
                    ROW_NUMBER() OVER (PARTITION BY user_pseudo_id ORDER BY event_timestamp) as step_number
                FROM user_events
            )
            SELECT *
            FROM user_journeys
            ORDER BY user_pseudo_id, step_number
            LIMIT {request.Limit ?? 1000}
        ";
    }

    private string BuildUnionQueryWithGroupBy(List<TableInfo> tables, string selectClause, string whereClause, string groupByClause)
    {
        var tableQueries = tables.Select(table =>
        {
            var query = $"SELECT {selectClause} FROM `{table.FullyQualifiedId}`";
            if (!string.IsNullOrWhiteSpace(whereClause))
            {
                query += $" WHERE {whereClause}";
            }
            query += $" GROUP BY {groupByClause}";
            return query;
        });

        return string.Join("\nUNION ALL\n", tableQueries);
    }
}

public class AnalyticsQueryRequest
{
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
    
    [Required]
    public string QueryType { get; set; } = "sample"; // "sample", "engagement", "user_journeys"
    
    public int? Limit { get; set; }
    
    public Dictionary<string, object>? Filters { get; set; }
}

public class DateRangeResponse
{
    public bool Available { get; set; }
    public DateTime? EarliestDate { get; set; }
    public DateTime? LatestDate { get; set; }
    public int? TotalDays { get; set; }
    public int? DailyTables { get; set; }
    public int? IntradayTables { get; set; }
    public string? Message { get; set; }
}

public class AnalyticsQueryResponse
{
    public bool Success { get; set; }
    public string QueryType { get; set; } = string.Empty;
    public DateRangeInfo DateRange { get; set; } = new();
    public List<TableUsedInfo> TablesUsed { get; set; } = new();
    public int RowCount { get; set; }
    public object[] Data { get; set; } = Array.Empty<object>();
    public string Message { get; set; } = string.Empty;
}

public class DateRangeInfo
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class TableUsedInfo
{
    public string TableId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public bool IsIntraday { get; set; }
}