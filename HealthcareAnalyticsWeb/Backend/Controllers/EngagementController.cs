using Microsoft.AspNetCore.Mvc;
using HealthcareAnalyticsWeb.Services.Interfaces;
using HealthcareAnalyticsWeb.Configuration;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using Google.Cloud.BigQuery.V2;

namespace HealthcareAnalyticsWeb.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EngagementController : ControllerBase
{
    private readonly IBigQueryClientService _bigQueryClientService;
    private readonly IBigQueryTableService _tableService;
    private readonly BigQueryConfig _config;
    private readonly ILogger<EngagementController> _logger;

    public EngagementController(
        IBigQueryClientService bigQueryClientService,
        IBigQueryTableService tableService,
        IOptions<BigQueryConfig> config,
        ILogger<EngagementController> logger)
    {
        _bigQueryClientService = bigQueryClientService;
        _tableService = tableService;
        _config = config.Value;
        _logger = logger;
    }

    [HttpPost("metrics")]
    public async Task<IActionResult> GetEngagementMetrics([FromBody] EngagementMetricsRequest request)
    {
        try {
            if (request.StartDate > request.EndDate)
            {
                return BadRequest(new { Error = "Start date must be before end date" });
            }

            if (!_bigQueryClientService.IsAvailable)
            {
                return BadRequest(new { Error = "BigQuery client not available", Message = _bigQueryClientService.StatusMessage });
            }

            var tables = _tableService.GetTablesForDateRange(request.StartDate, request.EndDate, TableType.Events);
            
            if (!tables.Any())
            {
                return NotFound(new { Error = "No data available for selected date range", StartDate = request.StartDate, EndDate = request.EndDate });
            }

            _logger.LogInformation("Calculating engagement metrics for date range {StartDate:yyyy-MM-dd} to {EndDate:yyyy-MM-dd} using {TableCount} tables", 
                request.StartDate, request.EndDate, tables.Count);

            var client = _bigQueryClientService.GetClient()!;

            // Build engagement metrics query
            var query = BuildEngagementMetricsQuery(tables, request);
            
            _logger.LogInformation("Executing engagement metrics query");

            var queryJob = await client.CreateQueryJobAsync(query, null);
            var results = await queryJob.GetQueryResultsAsync();

            var metrics = ProcessEngagementResults(results);

            _logger.LogInformation("Engagement metrics calculated successfully");

            return Ok(new EngagementMetricsResponse
            {
                Success = true,
                DateRange = new DateRangeInfo { StartDate = request.StartDate, EndDate = request.EndDate },
                TablesUsed = tables.Select(t => new TableUsedInfo { TableId = t.TableId, Date = t.Date ?? DateTime.MinValue, IsIntraday = t.IsIntraday }).ToList(),
                Metrics = metrics,
                Message = "Engagement metrics calculated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate engagement metrics");
            return StatusCode(500, new { Error = "Failed to calculate engagement metrics", Message = ex.Message });
        }
    }

    [HttpPost("user-sessions")]
    public async Task<IActionResult> GetUserSessions([FromBody] UserSessionsRequest request)
    {
        try {
            if (request.StartDate > request.EndDate)
            {
                return BadRequest(new { Error = "Start date must be before end date" });
            }

            if (!_bigQueryClientService.IsAvailable)
            {
                return BadRequest(new { Error = "BigQuery client not available", Message = _bigQueryClientService.StatusMessage });
            }

            var tables = _tableService.GetTablesForDateRange(request.StartDate, request.EndDate, TableType.Events);
            
            if (!tables.Any())
            {
                return NotFound(new { Error = "No data available for selected date range", StartDate = request.StartDate, EndDate = request.EndDate });
            }

            var client = _bigQueryClientService.GetClient()!;
            var query = BuildUserSessionsQuery(tables, request);
            
            var queryJob = await client.CreateQueryJobAsync(query, null);
            var results = await queryJob.GetQueryResultsAsync();

            var sessions = ProcessUserSessionsResults(results);

            return Ok(new UserSessionsResponse
            {
                Success = true,
                DateRange = new DateRangeInfo { StartDate = request.StartDate, EndDate = request.EndDate },
                Sessions = sessions,
                TotalSessions = sessions.Count,
                Message = $"Retrieved {sessions.Count} user sessions"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve user sessions");
            return StatusCode(500, new { Error = "Failed to retrieve user sessions", Message = ex.Message });
        }
    }

    private string BuildEngagementMetricsQuery(List<TableInfo> tables, EngagementMetricsRequest request)
    {
        var selectClause = @"
            user_pseudo_id,
            COUNT(DISTINCT CASE WHEN event_name = 'session_start' THEN 
                (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') 
            END) as session_count,
            COUNT(*) as total_events,
            COUNT(DISTINCT event_name) as unique_events,
            MIN(event_timestamp) as first_event_timestamp,
            MAX(event_timestamp) as last_event_timestamp,
            COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN 
                (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location')
            END) as unique_pages_viewed,
            AVG(CASE WHEN event_name = 'page_view' THEN 
                (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec')
            END) as avg_engagement_time_msec,
            COUNT(CASE WHEN event_name = 'aifp_screen_view' THEN 1 END) as screen_views,
            COUNT(CASE WHEN event_name LIKE 'aifp_%' AND event_name != 'aifp_screen_view' THEN 1 END) as aifp_interactions
        ";

        var whereClause = "user_pseudo_id IS NOT NULL AND event_name IS NOT NULL";
        
        if (request.EventFilter?.Any() == true)
        {
            var eventFilter = string.Join("','", request.EventFilter);
            whereClause += $" AND event_name IN ('{eventFilter}')";
        }

        var baseQuery = tables.Count == 1 
            ? $"SELECT {selectClause} FROM `{tables.First().FullyQualifiedId}` WHERE {whereClause} GROUP BY user_pseudo_id"
            : BuildUnionQueryWithGroupBy(tables, selectClause, whereClause, "user_pseudo_id");

        return $@"
            WITH user_engagement AS (
                {baseQuery}
            ),
            engagement_metrics AS (
                SELECT
                    COUNT(*) as total_users,
                    AVG(session_count) as avg_sessions_per_user,
                    AVG(total_events) as avg_events_per_user,
                    AVG(unique_events) as avg_unique_events_per_user,
                    AVG(unique_pages_viewed) as avg_pages_per_user,
                    AVG((last_event_timestamp - first_event_timestamp) / 1000000) as avg_session_duration_seconds,
                    AVG(avg_engagement_time_msec / 1000) as avg_engagement_time_seconds,
                    AVG(screen_views) as avg_screen_views_per_user,
                    AVG(aifp_interactions) as avg_aifp_interactions_per_user
                FROM user_engagement
            ),
            engagement_distribution AS (
                SELECT
                    'High' as engagement_level,
                    COUNT(*) as user_count
                FROM user_engagement 
                WHERE total_events >= (SELECT AVG(total_events) + STDDEV(total_events) FROM user_engagement)
                UNION ALL
                SELECT
                    'Medium' as engagement_level,
                    COUNT(*) as user_count
                FROM user_engagement 
                WHERE total_events >= (SELECT AVG(total_events) FROM user_engagement)
                    AND total_events < (SELECT AVG(total_events) + STDDEV(total_events) FROM user_engagement)
                UNION ALL
                SELECT
                    'Low' as engagement_level,
                    COUNT(*) as user_count
                FROM user_engagement 
                WHERE total_events < (SELECT AVG(total_events) FROM user_engagement)
            )
            SELECT 
                'overall' as metric_type,
                total_users,
                avg_sessions_per_user,
                avg_events_per_user,
                avg_unique_events_per_user,
                avg_pages_per_user,
                avg_session_duration_seconds,
                avg_engagement_time_seconds,
                avg_screen_views_per_user,
                avg_aifp_interactions_per_user,
                NULL as engagement_level,
                NULL as user_count
            FROM engagement_metrics
            UNION ALL
            SELECT
                'distribution' as metric_type,
                NULL as total_users,
                NULL as avg_sessions_per_user,
                NULL as avg_events_per_user,
                NULL as avg_unique_events_per_user,
                NULL as avg_pages_per_user,
                NULL as avg_session_duration_seconds,
                NULL as avg_engagement_time_seconds,
                NULL as avg_screen_views_per_user,
                NULL as avg_aifp_interactions_per_user,
                engagement_level,
                user_count
            FROM engagement_distribution
            ORDER BY metric_type, engagement_level
        ";
    }

    private string BuildUserSessionsQuery(List<TableInfo> tables, UserSessionsRequest request)
    {
        var selectClause = @"
            user_pseudo_id,
            (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') as session_id,
            MIN(event_timestamp) as session_start,
            MAX(event_timestamp) as session_end,
            COUNT(*) as event_count,
            COUNT(DISTINCT event_name) as unique_events,
            COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views,
            COUNT(CASE WHEN event_name = 'aifp_screen_view' THEN 1 END) as screen_views,
            ARRAY_AGG(DISTINCT event_name) as events_in_session,
            ARRAY_AGG(
                CASE WHEN event_name = 'aifp_screen_view' THEN 
                    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'screenName')
                END 
                IGNORE NULLS
            ) as screens_visited
        ";

        var whereClause = @"
            user_pseudo_id IS NOT NULL 
            AND (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') IS NOT NULL
        ";

        var baseQuery = tables.Count == 1 
            ? $"SELECT {selectClause} FROM `{tables.First().FullyQualifiedId}` WHERE {whereClause} GROUP BY user_pseudo_id, session_id"
            : BuildUnionQueryWithGroupBy(tables, selectClause, whereClause, "user_pseudo_id, session_id");

        return $@"
            WITH user_sessions AS (
                {baseQuery}
                HAVING session_id IS NOT NULL
            )
            SELECT 
                user_pseudo_id,
                session_id,
                session_start,
                session_end,
                (session_end - session_start) / 1000000 as session_duration_seconds,
                event_count,
                unique_events,
                page_views,
                screen_views,
                events_in_session,
                screens_visited,
                CASE 
                    WHEN event_count >= 20 THEN 'High'
                    WHEN event_count >= 5 THEN 'Medium'
                    ELSE 'Low'
                END as engagement_level
            FROM user_sessions
            ORDER BY session_start DESC
            LIMIT {request.Limit ?? 100}
        ";
    }

    private EngagementMetrics ProcessEngagementResults(BigQueryResults results)
    {
        var metrics = new EngagementMetrics();
        var distribution = new List<EngagementDistribution>();

        foreach (var row in results)
        {
            var metricType = row["metric_type"]?.ToString();

            if (metricType == "overall")
            {
                metrics.TotalUsers = Convert.ToInt32(row["total_users"] ?? 0);
                metrics.AverageSessionsPerUser = Convert.ToDouble(row["avg_sessions_per_user"] ?? 0);
                metrics.AverageEventsPerUser = Convert.ToDouble(row["avg_events_per_user"] ?? 0);
                metrics.AverageUniqueEventsPerUser = Convert.ToDouble(row["avg_unique_events_per_user"] ?? 0);
                metrics.AveragePagesPerUser = Convert.ToDouble(row["avg_pages_per_user"] ?? 0);
                metrics.AverageSessionDurationSeconds = Convert.ToDouble(row["avg_session_duration_seconds"] ?? 0);
                metrics.AverageEngagementTimeSeconds = Convert.ToDouble(row["avg_engagement_time_seconds"] ?? 0);
                metrics.AverageScreenViewsPerUser = Convert.ToDouble(row["avg_screen_views_per_user"] ?? 0);
                metrics.AverageAifpInteractionsPerUser = Convert.ToDouble(row["avg_aifp_interactions_per_user"] ?? 0);
            }
            else if (metricType == "distribution")
            {
                distribution.Add(new EngagementDistribution
                {
                    Level = row["engagement_level"]?.ToString() ?? "Unknown",
                    UserCount = Convert.ToInt32(row["user_count"] ?? 0)
                });
            }
        }

        metrics.EngagementDistribution = distribution;
        return metrics;
    }

    private List<UserSession> ProcessUserSessionsResults(BigQueryResults results)
    {
        var sessions = new List<UserSession>();

        foreach (var row in results)
        {
            var session = new UserSession
            {
                UserPseudoId = row["user_pseudo_id"]?.ToString() ?? "",
                SessionId = Convert.ToInt64(row["session_id"] ?? 0),
                SessionStart = DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(row["session_start"] ?? 0) / 1000).DateTime,
                SessionEnd = DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(row["session_end"] ?? 0) / 1000).DateTime,
                SessionDurationSeconds = Convert.ToDouble(row["session_duration_seconds"] ?? 0),
                EventCount = Convert.ToInt32(row["event_count"] ?? 0),
                UniqueEvents = Convert.ToInt32(row["unique_events"] ?? 0),
                PageViews = Convert.ToInt32(row["page_views"] ?? 0),
                ScreenViews = Convert.ToInt32(row["screen_views"] ?? 0),
                EngagementLevel = row["engagement_level"]?.ToString() ?? "Low"
            };

            // Process events array (simplified for now)
            session.EventsInSession = new List<string>();
            session.ScreensVisited = new List<string>();

            sessions.Add(session);
        }

        return sessions;
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

// Request/Response Models
public class EngagementMetricsRequest
{
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
    
    public List<string>? EventFilter { get; set; }
}

public class UserSessionsRequest
{
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
    
    public int? Limit { get; set; }
}

public class EngagementMetricsResponse
{
    public bool Success { get; set; }
    public DateRangeInfo DateRange { get; set; } = new();
    public List<TableUsedInfo> TablesUsed { get; set; } = new();
    public EngagementMetrics Metrics { get; set; } = new();
    public string Message { get; set; } = "";
}

public class UserSessionsResponse
{
    public bool Success { get; set; }
    public DateRangeInfo DateRange { get; set; } = new();
    public List<UserSession> Sessions { get; set; } = new();
    public int TotalSessions { get; set; }
    public string Message { get; set; } = "";
}

public class EngagementMetrics
{
    public int TotalUsers { get; set; }
    public double AverageSessionsPerUser { get; set; }
    public double AverageEventsPerUser { get; set; }
    public double AverageUniqueEventsPerUser { get; set; }
    public double AveragePagesPerUser { get; set; }
    public double AverageSessionDurationSeconds { get; set; }
    public double AverageEngagementTimeSeconds { get; set; }
    public double AverageScreenViewsPerUser { get; set; }
    public double AverageAifpInteractionsPerUser { get; set; }
    public double MedianSessionsPerUser { get; set; }
    public double MedianEventsPerUser { get; set; }
    public List<EngagementDistribution> EngagementDistribution { get; set; } = new();
}

public class EngagementDistribution
{
    public string Level { get; set; } = "";
    public int UserCount { get; set; }
}

public class UserSession
{
    public string UserPseudoId { get; set; } = "";
    public long SessionId { get; set; }
    public DateTime SessionStart { get; set; }
    public DateTime SessionEnd { get; set; }
    public double SessionDurationSeconds { get; set; }
    public int EventCount { get; set; }
    public int UniqueEvents { get; set; }
    public int PageViews { get; set; }
    public int ScreenViews { get; set; }
    public string EngagementLevel { get; set; } = "";
    public List<string> EventsInSession { get; set; } = new();
    public List<string> ScreensVisited { get; set; } = new();
}