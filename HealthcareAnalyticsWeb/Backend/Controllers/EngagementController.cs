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

    [HttpPost("device-analytics")]
    public async Task<IActionResult> GetDeviceAnalytics([FromBody] DeviceAnalyticsRequest request)
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

            var query = BuildDeviceAnalyticsQuery(tables, request);
            var client = _bigQueryClientService.GetClient()!;
            var queryJob = await client.CreateQueryJobAsync(query, null);
            var results = await queryJob.GetQueryResultsAsync();
            
            var deviceMetrics = ProcessDeviceAnalyticsResults(results);

            return Ok(new DeviceAnalyticsResponse
            {
                Success = true,
                DateRange = new DateRangeInfo
                {
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    TotalDays = (request.EndDate - request.StartDate).Days + 1
                },
                TablesUsed = tables.Select(t => new TableUsedInfo 
                { 
                    TableName = t.TableId, 
                    TableId = t.TableId,
                    RowCount = t.RowCount ?? 0 
                }).ToList(),
                DeviceMetrics = deviceMetrics,
                Message = $"Device analytics retrieved for {deviceMetrics.TotalUsers:N0} users from {tables.Count} tables"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving device analytics for date range {StartDate} to {EndDate}", request.StartDate, request.EndDate);
            return StatusCode(500, new { Error = "Internal server error", Details = ex.Message });
        }
    }

    [HttpPost("stage-progression")]
    public async Task<IActionResult> GetStageProgression([FromBody] StageProgressionRequest request)
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

            _logger.LogInformation("Building stage progression query for {TableCount} tables", tables.Count);
            
            var query = BuildStageProgressionQuery(tables, request);
            
            _logger.LogInformation("Executing stage progression query: {Query}", query.Substring(0, Math.Min(500, query.Length)));
            
            var client = _bigQueryClientService.GetClient()!;
            var queryJob = await client.CreateQueryJobAsync(query, null);
            var results = await queryJob.GetQueryResultsAsync();
            
            _logger.LogInformation("Stage progression query returned {RowCount} rows", results.Count());
            
            var stageMetrics = ProcessStageProgressionResults(results);

            return Ok(new StageProgressionResponse
            {
                Success = true,
                DateRange = new DateRangeInfo
                {
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    TotalDays = (request.EndDate - request.StartDate).Days + 1
                },
                TablesUsed = tables.Select(t => new TableUsedInfo 
                { 
                    TableName = t.TableId, 
                    TableId = t.TableId,
                    RowCount = t.RowCount ?? 0 
                }).ToList(),
                StageMetrics = stageMetrics,
                Message = $"Stage progression retrieved for {stageMetrics.TotalUsers:N0} users from {tables.Count} tables"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stage progression for date range {StartDate} to {EndDate}. Error: {ErrorMessage}", 
                request.StartDate, request.EndDate, ex.Message);
            return StatusCode(500, new { Error = "Internal server error", Details = ex.Message, StackTrace = ex.StackTrace });
        }
    }

    [HttpPost("welcome-engagement")]
    public async Task<IActionResult> GetWelcomeEngagement([FromBody] WelcomeEngagementRequest request)
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

            _logger.LogInformation("Building welcome engagement query for {TableCount} tables", tables.Count);
            
            var query = BuildWelcomeEngagementQuery(tables, request);
            
            _logger.LogInformation("Executing welcome engagement query");
            
            var client = _bigQueryClientService.GetClient()!;
            var queryJob = await client.CreateQueryJobAsync(query, null);
            var results = await queryJob.GetQueryResultsAsync();
            
            _logger.LogInformation("Welcome engagement query returned {RowCount} rows", results.Count());
            
            var welcomeMetrics = ProcessWelcomeEngagementResults(results);

            return Ok(new WelcomeEngagementResponse
            {
                Success = true,
                DateRange = new DateRangeInfo
                {
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    TotalDays = (request.EndDate - request.StartDate).Days + 1
                },
                TablesUsed = tables.Select(t => new TableUsedInfo 
                { 
                    TableName = t.TableId, 
                    TableId = t.TableId,
                    RowCount = t.RowCount ?? 0 
                }).ToList(),
                WelcomeMetrics = welcomeMetrics,
                Message = $"Welcome engagement retrieved for {welcomeMetrics.TotalUsers:N0} users from {tables.Count} tables"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving welcome engagement for date range {StartDate} to {EndDate}. Error: {ErrorMessage}", 
                request.StartDate, request.EndDate, ex.Message);
            return StatusCode(500, new { Error = "Internal server error", Details = ex.Message, StackTrace = ex.StackTrace });
        }
    }

    [HttpPost("job-search-exposure")]
    public async Task<IActionResult> GetJobSearchExposure([FromBody] JobSearchExposureRequest request)
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

            // First, let's analyze the structure of aifp_api_response events
            var analysisQuery = BuildJobSearchAnalysisQuery(tables);
            var client = _bigQueryClientService.GetClient()!;
            var queryJob = await client.CreateQueryJobAsync(analysisQuery, null);
            var results = await queryJob.GetQueryResultsAsync();
            
            // Return raw analysis for now to understand the data structure
            var analysisResults = new List<Dictionary<string, object>>();
            foreach (var row in results)
            {
                var rowData = new Dictionary<string, object>();
                foreach (var field in row.Schema.Fields)
                {
                    rowData[field.Name] = row[field.Name]?.ToString() ?? "null";
                }
                analysisResults.Add(rowData);
            }

            return Ok(new 
            {
                Success = true,
                Analysis = analysisResults,
                DateRange = new DateRangeInfo
                {
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    TotalDays = (request.EndDate - request.StartDate).Days + 1
                },
                TablesUsed = tables.Count,
                Message = "Analysis of aifp_api_response events"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing job search exposure");
            return StatusCode(500, new { Error = "Internal server error", Details = ex.Message });
        }
    }

    [HttpPost("time-investment")]
    public async Task<IActionResult> GetTimeInvestment([FromBody] TimeInvestmentRequest request)
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

            var query = BuildTimeInvestmentQuery(tables, request);
            var client = _bigQueryClientService.GetClient()!;
            var queryJob = await client.CreateQueryJobAsync(query, null);
            var results = await queryJob.GetQueryResultsAsync();
            
            var timeMetrics = ProcessTimeInvestmentResults(results);

            return Ok(new TimeInvestmentResponse
            {
                Success = true,
                DateRange = new DateRangeInfo
                {
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    TotalDays = (request.EndDate - request.StartDate).Days + 1
                },
                TablesUsed = tables.Select(t => new TableUsedInfo 
                { 
                    TableName = t.TableId, 
                    TableId = t.TableId,
                    RowCount = t.RowCount ?? 0 
                }).ToList(),
                TimeMetrics = timeMetrics,
                Message = $"Time investment analysis for {timeMetrics.TotalSessions:N0} sessions from {tables.Count} tables"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving time investment for date range {StartDate} to {EndDate}", request.StartDate, request.EndDate);
            return StatusCode(500, new { Error = "Internal server error", Details = ex.Message });
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

    private string BuildDeviceAnalyticsQuery(List<TableInfo> tables, DeviceAnalyticsRequest request)
    {
        var selectClause = @"
            user_pseudo_id,
            device.category as device_category,
            device.mobile_brand_name as mobile_brand,
            device.mobile_model_name as mobile_model,
            device.operating_system as os,
            device.operating_system_version as os_version,
            device.web_info.browser as browser,
            COUNT(*) as event_count,
            COUNT(DISTINCT event_name) as unique_events,
            MIN(event_timestamp) as first_event,
            MAX(event_timestamp) as last_event
        ";

        var whereClause = "user_pseudo_id IS NOT NULL AND device.category IS NOT NULL";

        var baseQuery = tables.Count == 1 
            ? $"SELECT {selectClause} FROM `{tables.First().FullyQualifiedId}` WHERE {whereClause} GROUP BY user_pseudo_id, device.category, device.mobile_brand_name, device.mobile_model_name, device.operating_system, device.operating_system_version, device.web_info.browser"
            : BuildUnionQueryWithGroupBy(tables, selectClause, whereClause, "user_pseudo_id, device.category, device.mobile_brand_name, device.mobile_model_name, device.operating_system, device.operating_system_version, device.web_info.browser");

        return $@"
            WITH device_sessions AS (
                {baseQuery}
            ),
            device_summary AS (
                SELECT
                    device_category,
                    COUNT(DISTINCT user_pseudo_id) as unique_users,
                    COUNT(*) as total_sessions,
                    SUM(event_count) as total_events,
                    AVG(event_count) as avg_events_per_session,
                    AVG((last_event - first_event) / 1000000) as avg_session_duration_seconds
                FROM device_sessions
                GROUP BY device_category
            ),
            os_summary AS (
                SELECT
                    os,
                    COUNT(DISTINCT user_pseudo_id) as unique_users,
                    SUM(event_count) as total_events
                FROM device_sessions
                WHERE os IS NOT NULL
                GROUP BY os
            ),
            browser_summary AS (
                SELECT
                    browser,
                    COUNT(DISTINCT user_pseudo_id) as unique_users,
                    SUM(event_count) as total_events
                FROM device_sessions
                WHERE browser IS NOT NULL
                GROUP BY browser
            )
            SELECT 
                'device' as metric_type,
                device_category as category,
                unique_users,
                total_sessions,
                total_events,
                avg_events_per_session,
                avg_session_duration_seconds,
                NULL as subcategory
            FROM device_summary
            UNION ALL
            SELECT 
                'os' as metric_type,
                os as category,
                unique_users,
                NULL as total_sessions,
                total_events,
                NULL as avg_events_per_session,
                NULL as avg_session_duration_seconds,
                NULL as subcategory
            FROM os_summary
            UNION ALL
            SELECT 
                'browser' as metric_type,
                browser as category,
                unique_users,
                NULL as total_sessions,
                total_events,
                NULL as avg_events_per_session,
                NULL as avg_session_duration_seconds,
                NULL as subcategory
            FROM browser_summary
            ORDER BY metric_type, unique_users DESC
        ";
    }

    private string BuildStageProgressionQuery(List<TableInfo> tables, StageProgressionRequest request)
    {
        // Simplified approach - get basic stage progression data first
        var selectClause = @"
            user_pseudo_id,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'screenName') as screenName,
            event_timestamp
        ";

        var whereClause = @"
            user_pseudo_id IS NOT NULL 
            AND event_name = 'aifp_screen_view'
            AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'screenName') IS NOT NULL
        ";

        var baseQuery = tables.Count == 1 
            ? $"SELECT {selectClause} FROM `{tables.First().FullyQualifiedId}` WHERE {whereClause}"
            : string.Join("\nUNION ALL\n", tables.Select(table => 
                $"SELECT {selectClause} FROM `{table.FullyQualifiedId}` WHERE {whereClause}"));

        return $@"
            WITH screen_events AS (
                {baseQuery}
            ),
            stage_mapping AS (
                SELECT 
                    user_pseudo_id,
                    screenName,
                    event_timestamp,
                    CASE 
                        WHEN screenName = 'welcome' THEN 1
                        WHEN screenName = 'dy-quiz/1' THEN 2
                        WHEN screenName = 'dy-quiz/2' THEN 3
                        WHEN screenName = 'step/1' THEN 4
                        WHEN screenName = 'step/2' THEN 5
                        WHEN screenName = 'step/3' THEN 6
                        WHEN screenName = 'job-suggestions/1' THEN 7
                        WHEN screenName = 'job-suggestions/2' THEN 8
                        WHEN screenName = 'outro' THEN 9
                        ELSE 0
                    END as stage_number,
                    CASE 
                        WHEN screenName = 'welcome' THEN 'Welcome Screen'
                        WHEN screenName = 'dy-quiz/1' THEN 'DY Quiz Step 1'
                        WHEN screenName = 'dy-quiz/2' THEN 'DY Quiz Step 2'
                        WHEN screenName = 'step/1' THEN 'Job Desires Step 1'
                        WHEN screenName = 'step/2' THEN 'Job Desires Step 2'
                        WHEN screenName = 'step/3' THEN 'Job Desires Step 3'
                        WHEN screenName = 'job-suggestions/1' THEN 'Job Suggestions Step 1'
                        WHEN screenName = 'job-suggestions/2' THEN 'Job Suggestions Step 2'
                        WHEN screenName = 'outro' THEN 'Outro/Complete'
                        ELSE 'Unknown'
                    END as stage_display_name
                FROM screen_events
                WHERE screenName IN ('welcome', 'dy-quiz/1', 'dy-quiz/2', 'step/1', 'step/2', 'step/3', 'job-suggestions/1', 'job-suggestions/2', 'outro')
            ),
            user_max_stages AS (
                SELECT 
                    user_pseudo_id,
                    MAX(stage_number) as furthest_stage_reached,
                    COUNT(DISTINCT stage_number) as stages_visited
                FROM stage_mapping
                GROUP BY user_pseudo_id
            ),
            stage_summary AS (
                SELECT 
                    stage_number,
                    stage_display_name,
                    COUNT(DISTINCT user_pseudo_id) as users_reached,
                    COUNT(*) as total_visits,
                    0.0 as avg_time_spent_seconds  -- Simplified for now
                FROM stage_mapping
                GROUP BY stage_number, stage_display_name
            ),
            completion_stats AS (
                SELECT
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN furthest_stage_reached >= 9 THEN 1 END) as completed_users,
                    AVG(CAST(stages_visited AS FLOAT64)) as avg_stages_visited,
                    0.0 as avg_journey_duration_seconds  -- Simplified for now
                FROM user_max_stages
            )
            SELECT 
                'stage_summary' as metric_type,
                stage_number,
                stage_display_name,
                users_reached,
                total_visits,
                avg_time_spent_seconds,
                NULL as users_dropped,
                NULL as total_users,
                NULL as completed_users,
                NULL as avg_stages_visited,
                NULL as avg_journey_duration_seconds
            FROM stage_summary
            UNION ALL
            SELECT 
                'completion_stats' as metric_type,
                NULL as stage_number,
                NULL as stage_display_name,
                NULL as users_reached,
                NULL as total_visits,
                NULL as avg_time_spent_seconds,
                NULL as users_dropped,
                total_users,
                completed_users,
                avg_stages_visited,
                avg_journey_duration_seconds
            FROM completion_stats
            ORDER BY metric_type, stage_number
        ";
    }

    private string BuildTimeInvestmentQuery(List<TableInfo> tables, TimeInvestmentRequest request)
    {
        // Simplified approach - basic session analysis
        var selectClause = @"
            user_pseudo_id,
            (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') as session_id,
            event_timestamp,
            COUNT(*) as event_count
        ";

        var whereClause = @"
            user_pseudo_id IS NOT NULL 
            AND (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') IS NOT NULL
        ";

        var baseQuery = tables.Count == 1 
            ? $"SELECT {selectClause} FROM `{tables.First().FullyQualifiedId}` WHERE {whereClause} GROUP BY user_pseudo_id, session_id, event_timestamp"
            : string.Join("\nUNION ALL\n", tables.Select(table => 
                $"SELECT {selectClause} FROM `{table.FullyQualifiedId}` WHERE {whereClause} GROUP BY user_pseudo_id, session_id, event_timestamp"));

        return $@"
            WITH session_events AS (
                {baseQuery}
            ),
            session_summary AS (
                SELECT 
                    user_pseudo_id,
                    session_id,
                    COUNT(*) as total_events,
                    MIN(event_timestamp) as session_start,
                    MAX(event_timestamp) as session_end
                FROM session_events
                GROUP BY user_pseudo_id, session_id
                HAVING session_id IS NOT NULL
            ),
            duration_buckets AS (
                SELECT 
                    '< 30 seconds' as duration_bucket,
                    COUNT(*) as session_count,
                    COUNT(DISTINCT user_pseudo_id) as unique_users,
                    30.0 as avg_duration_in_bucket,
                    AVG(total_events) as avg_events_in_bucket
                FROM session_summary
                WHERE TIMESTAMP_DIFF(session_end, session_start, SECOND) < 30
                UNION ALL
                SELECT 
                    '30-60 seconds' as duration_bucket,
                    COUNT(*) as session_count,
                    COUNT(DISTINCT user_pseudo_id) as unique_users,
                    45.0 as avg_duration_in_bucket,
                    AVG(total_events) as avg_events_in_bucket
                FROM session_summary
                WHERE TIMESTAMP_DIFF(session_end, session_start, SECOND) BETWEEN 30 AND 60
                UNION ALL
                SELECT 
                    '1-5 minutes' as duration_bucket,
                    COUNT(*) as session_count,
                    COUNT(DISTINCT user_pseudo_id) as unique_users,
                    180.0 as avg_duration_in_bucket,
                    AVG(total_events) as avg_events_in_bucket
                FROM session_summary
                WHERE TIMESTAMP_DIFF(session_end, session_start, SECOND) BETWEEN 61 AND 300
            ),
            overall_stats AS (
                SELECT
                    COUNT(*) as total_sessions,
                    COUNT(DISTINCT user_pseudo_id) as total_users,
                    AVG(TIMESTAMP_DIFF(session_end, session_start, SECOND)) as avg_session_duration,
                    AVG(TIMESTAMP_DIFF(session_end, session_start, SECOND)) as median_session_duration,
                    AVG(TIMESTAMP_DIFF(session_end, session_start, SECOND)) as p75_session_duration,
                    AVG(TIMESTAMP_DIFF(session_end, session_start, SECOND)) as p90_session_duration,
                    MIN(TIMESTAMP_DIFF(session_end, session_start, SECOND)) as min_duration,
                    MAX(TIMESTAMP_DIFF(session_end, session_start, SECOND)) as max_duration
                FROM session_summary
            )
            SELECT 
                'distribution' as metric_type,
                duration_bucket,
                session_count,
                unique_users,
                avg_duration_in_bucket,
                avg_events_in_bucket,
                NULL as total_sessions,
                NULL as total_users,
                NULL as avg_session_duration,
                NULL as median_session_duration,
                NULL as p75_session_duration,
                NULL as p90_session_duration,
                NULL as min_duration,
                NULL as max_duration
            FROM duration_buckets
            UNION ALL
            SELECT 
                'overall' as metric_type,
                NULL as duration_bucket,
                NULL as session_count,
                NULL as unique_users,
                NULL as avg_duration_in_bucket,
                NULL as avg_events_in_bucket,
                total_sessions,
                total_users,
                avg_session_duration,
                median_session_duration,
                p75_session_duration,
                p90_session_duration,
                min_duration,
                max_duration
            FROM overall_stats
        ";
    }

    private string BuildJobSearchAnalysisQuery(List<TableInfo> tables)
    {
        // Simplified query to avoid aggregation issues - focus on step 4 and search results
        var selectClause = @"
            user_pseudo_id,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'endpoint') as endpoint,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'path') as path,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'method') as method,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'response_body') as response_body,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'body') as body,
            (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'status_code') as status_code
        ";

        var whereClause = @"
            event_name = 'aifp_api_response'
            AND LOWER((SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'endpoint')) LIKE '%step%4%'
        ";

        var baseQuery = tables.Count == 1 
            ? $"SELECT {selectClause} FROM `{tables.First().FullyQualifiedId}` WHERE {whereClause}"
            : string.Join("\nUNION ALL\n", tables.Select(table => 
                $"SELECT {selectClause} FROM `{table.FullyQualifiedId}` WHERE {whereClause}"));

        return $@"
            WITH filtered_responses AS (
                {baseQuery}
            )
            SELECT 
                endpoint,
                path,
                method,
                status_code,
                COUNT(*) as total_responses,
                COUNT(DISTINCT user_pseudo_id) as unique_users,
                COUNT(CASE WHEN LOWER(COALESCE(response_body, body)) LIKE '%searchresult%' THEN 1 END) as contains_searchresult,
                COUNT(CASE WHEN LOWER(COALESCE(response_body, body)) LIKE '%job%' THEN 1 END) as contains_job,
                COUNT(CASE WHEN LOWER(COALESCE(response_body, body)) LIKE '%position%' THEN 1 END) as contains_position,
                COUNT(CASE WHEN LOWER(COALESCE(response_body, body)) LIKE '%title%' THEN 1 END) as contains_title,
                COUNT(CASE WHEN LOWER(COALESCE(response_body, body)) LIKE '%location%' THEN 1 END) as contains_location,
                COUNT(CASE WHEN LENGTH(COALESCE(response_body, body)) > 50 THEN 1 END) as has_substantial_response,
                CASE 
                    WHEN LOWER(endpoint) LIKE '%step%4%submit%' OR (LOWER(endpoint) LIKE '%step%4%' AND method = 'POST')
                    THEN 'Step_4_Submit'
                    WHEN LOWER(endpoint) LIKE '%step%4%'
                    THEN 'Step_4_Other'
                    ELSE 'Other'
                END as endpoint_category,
                -- Sample response (first 100 chars from any response with content)
                MIN(CASE WHEN LENGTH(COALESCE(response_body, body)) > 0 
                    THEN SUBSTR(COALESCE(response_body, body), 1, 100)
                    ELSE NULL
                END) as sample_response
            FROM filtered_responses
            GROUP BY endpoint, path, method, status_code
            ORDER BY 
                CASE 
                    WHEN LOWER(endpoint) LIKE '%step%4%submit%' OR (LOWER(endpoint) LIKE '%step%4%' AND method = 'POST') THEN 1
                    WHEN contains_searchresult > 0 THEN 2
                    ELSE 3
                END,
                total_responses DESC
            LIMIT 20
        ";
    }

    private string BuildWelcomeEngagementQuery(List<TableInfo> tables, WelcomeEngagementRequest request)
    {
        // Track welcome screen interactions and user paths based on screen view patterns
        var selectClause = @"
            user_pseudo_id,
            event_name,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'screenName') as screenName,
            event_timestamp
        ";

        var whereClause = @"
            user_pseudo_id IS NOT NULL 
            AND event_name = 'aifp_screen_view'
        ";

        var baseQuery = tables.Count == 1 
            ? $"SELECT {selectClause} FROM `{tables.First().FullyQualifiedId}` WHERE {whereClause}"
            : string.Join("\nUNION ALL\n", tables.Select(table => 
                $"SELECT {selectClause} FROM `{table.FullyQualifiedId}` WHERE {whereClause}"));

        return $@"
            WITH all_screen_views AS (
                {baseQuery}
            ),
            user_screen_patterns AS (
                SELECT 
                    user_pseudo_id,
                    COUNTIF(screenName = 'welcome') as welcome_views,
                    COUNTIF(screenName != 'welcome' AND screenName IS NOT NULL) as other_screen_views,
                    COUNT(*) as total_screen_views,
                    ARRAY_AGG(DISTINCT screenName IGNORE NULLS) as screens_visited
                FROM all_screen_views
                GROUP BY user_pseudo_id
                HAVING welcome_views > 0  -- Only users who viewed welcome screen
            ),
            user_actions AS (
                SELECT 
                    user_pseudo_id,
                    welcome_views,
                    other_screen_views,
                    total_screen_views,
                    screens_visited,
                    -- Determine user action based on screen view pattern
                    CASE 
                        WHEN other_screen_views > 0 THEN 'begin_profile_setup'  -- Has other screen views = clicked Begin
                        WHEN other_screen_views = 0 THEN 'skip_for_now'  -- Only welcome screen = clicked Skip
                        ELSE 'unknown'
                    END as user_action
                FROM user_screen_patterns
            ),
            summary_stats AS (
                SELECT
                    user_action,
                    COUNT(*) as user_count,
                    COUNT(CASE WHEN other_screen_views > 0 THEN 1 END) as users_progressed,
                    COUNT(CASE WHEN other_screen_views = 0 THEN 1 END) as users_exited,
                    AVG(total_screen_views) as avg_screen_views
                FROM user_actions
                GROUP BY user_action
            ),
            overall_stats AS (
                SELECT
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN user_action = 'begin_profile_setup' THEN 1 END) as total_progressed,
                    COUNT(CASE WHEN user_action = 'skip_for_now' THEN 1 END) as total_exited,
                    COUNT(CASE WHEN user_action = 'begin_profile_setup' THEN 1 END) as begin_profile_clicks,
                    COUNT(CASE WHEN user_action = 'skip_for_now' THEN 1 END) as skip_for_now_clicks,
                    AVG(total_screen_views) as avg_events_per_user
                FROM user_actions
            )
            SELECT 
                'action_summary' as metric_type,
                user_action,
                user_count,
                users_progressed,
                users_exited,
                avg_screen_views as avg_welcome_events,
                NULL as total_users,
                NULL as total_progressed,
                NULL as total_exited,
                NULL as begin_profile_clicks,
                NULL as skip_for_now_clicks,
                NULL as avg_events_per_user
            FROM summary_stats
            UNION ALL
            SELECT 
                'overall_stats' as metric_type,
                NULL as user_action,
                NULL as user_count,
                NULL as users_progressed,
                NULL as users_exited,
                NULL as avg_welcome_events,
                total_users,
                total_progressed,
                total_exited,
                begin_profile_clicks,
                skip_for_now_clicks,
                avg_events_per_user
            FROM overall_stats
            ORDER BY metric_type, user_action
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

    private DeviceMetrics ProcessDeviceAnalyticsResults(BigQueryResults results)
    {
        var deviceMetrics = new DeviceMetrics();
        var deviceBreakdown = new List<DeviceBreakdown>();
        var osBreakdown = new List<DeviceBreakdown>();
        var browserBreakdown = new List<DeviceBreakdown>();

        int totalUsers = 0;

        foreach (var row in results)
        {
            var metricType = row["metric_type"]?.ToString();
            var category = row["category"]?.ToString() ?? "Unknown";
            var uniqueUsers = Convert.ToInt32(row["unique_users"] ?? 0);

            if (metricType == "device")
            {
                totalUsers += uniqueUsers;
                deviceBreakdown.Add(new DeviceBreakdown
                {
                    Category = category,
                    UniqueUsers = uniqueUsers,
                    TotalSessions = Convert.ToInt32(row["total_sessions"] ?? 0),
                    TotalEvents = Convert.ToInt64(row["total_events"] ?? 0),
                    AverageEventsPerSession = Convert.ToDouble(row["avg_events_per_session"] ?? 0),
                    AverageSessionDurationSeconds = Convert.ToDouble(row["avg_session_duration_seconds"] ?? 0)
                });
            }
            else if (metricType == "os")
            {
                osBreakdown.Add(new DeviceBreakdown
                {
                    Category = category,
                    UniqueUsers = uniqueUsers,
                    TotalEvents = Convert.ToInt64(row["total_events"] ?? 0)
                });
            }
            else if (metricType == "browser")
            {
                browserBreakdown.Add(new DeviceBreakdown
                {
                    Category = category,
                    UniqueUsers = uniqueUsers,
                    TotalEvents = Convert.ToInt64(row["total_events"] ?? 0)
                });
            }
        }

        deviceMetrics.TotalUsers = totalUsers;
        
        // Set TotalUsers for percentage calculation
        foreach (var breakdown in deviceBreakdown)
            breakdown.TotalUsers = totalUsers;
        foreach (var breakdown in osBreakdown)
            breakdown.TotalUsers = totalUsers;
        foreach (var breakdown in browserBreakdown)
            breakdown.TotalUsers = totalUsers;

        deviceMetrics.DeviceBreakdown = deviceBreakdown.OrderByDescending(d => d.UniqueUsers).ToList();
        deviceMetrics.OperatingSystemBreakdown = osBreakdown.OrderByDescending(d => d.UniqueUsers).ToList();
        deviceMetrics.BrowserBreakdown = browserBreakdown.OrderByDescending(d => d.UniqueUsers).ToList();

        return deviceMetrics;
    }

    private StageMetrics ProcessStageProgressionResults(BigQueryResults results)
    {
        var stageMetrics = new StageMetrics();
        var stageSummary = new List<StageInfo>();
        var dropOffPoints = new List<DropOffInfo>();

        foreach (var row in results)
        {
            var metricType = row["metric_type"]?.ToString();

            if (metricType == "stage_summary")
            {
                stageSummary.Add(new StageInfo
                {
                    StageNumber = Convert.ToInt32(row["stage_number"] ?? 0),
                    StageName = row["stage_display_name"]?.ToString() ?? "Unknown",
                    UsersReached = Convert.ToInt32(row["users_reached"] ?? 0),
                    TotalVisits = Convert.ToInt32(row["total_visits"] ?? 0),
                    AverageTimeSpentSeconds = Convert.ToDouble(row["avg_time_spent_seconds"] ?? 0)
                });
            }
            else if (metricType == "drop_off")
            {
                dropOffPoints.Add(new DropOffInfo
                {
                    StageNumber = Convert.ToInt32(row["stage_number"] ?? 0),
                    UsersDropped = Convert.ToInt32(row["users_dropped"] ?? 0)
                });
            }
            else if (metricType == "completion_stats")
            {
                stageMetrics.TotalUsers = Convert.ToInt32(row["total_users"] ?? 0);
                stageMetrics.CompletedUsers = Convert.ToInt32(row["completed_users"] ?? 0);
                stageMetrics.AverageStagesVisited = Convert.ToDouble(row["avg_stages_visited"] ?? 0);
                stageMetrics.AverageJourneyDurationSeconds = Convert.ToDouble(row["avg_journey_duration_seconds"] ?? 0);
            }
        }

        // Calculate completion rate and retention rates
        stageMetrics.CompletionRate = stageMetrics.TotalUsers > 0 
            ? (double)stageMetrics.CompletedUsers / stageMetrics.TotalUsers * 100 
            : 0;

        // Calculate retention rates for each stage
        foreach (var stage in stageSummary)
        {
            stage.RetentionRate = stageMetrics.TotalUsers > 0 
                ? (double)stage.UsersReached / stageMetrics.TotalUsers * 100 
                : 0;
        }

        stageMetrics.StagesSummary = stageSummary.OrderBy(s => s.StageNumber).ToList();
        stageMetrics.DropOffPoints = dropOffPoints.OrderBy(d => d.StageNumber).ToList();

        return stageMetrics;
    }

    private TimeInvestmentMetrics ProcessTimeInvestmentResults(BigQueryResults results)
    {
        var timeMetrics = new TimeInvestmentMetrics();
        var distribution = new List<TimeDistributionBucket>();

        foreach (var row in results)
        {
            var metricType = row["metric_type"]?.ToString();

            if (metricType == "distribution")
            {
                distribution.Add(new TimeDistributionBucket
                {
                    DurationBucket = row["duration_bucket"]?.ToString() ?? "Unknown",
                    SessionCount = Convert.ToInt32(row["session_count"] ?? 0),
                    UniqueUsers = Convert.ToInt32(row["unique_users"] ?? 0),
                    AverageDurationInBucket = Convert.ToDouble(row["avg_duration_in_bucket"] ?? 0),
                    AverageEventsInBucket = Convert.ToDouble(row["avg_events_in_bucket"] ?? 0)
                });
            }
            else if (metricType == "overall")
            {
                timeMetrics.TotalSessions = Convert.ToInt32(row["total_sessions"] ?? 0);
                timeMetrics.TotalUsers = Convert.ToInt32(row["total_users"] ?? 0);
                timeMetrics.AverageSessionDuration = Convert.ToDouble(row["avg_session_duration"] ?? 0);
                timeMetrics.MedianSessionDuration = Convert.ToDouble(row["median_session_duration"] ?? 0);
                timeMetrics.P75SessionDuration = Convert.ToDouble(row["p75_session_duration"] ?? 0);
                timeMetrics.P90SessionDuration = Convert.ToDouble(row["p90_session_duration"] ?? 0);
                timeMetrics.MinDuration = Convert.ToDouble(row["min_duration"] ?? 0);
                timeMetrics.MaxDuration = Convert.ToDouble(row["max_duration"] ?? 0);
            }
        }

        // Set TotalSessions for percentage calculation
        foreach (var bucket in distribution)
        {
            bucket.TotalSessions = timeMetrics.TotalSessions;
        }

        timeMetrics.Distribution = distribution;
        return timeMetrics;
    }

    private WelcomeMetrics ProcessWelcomeEngagementResults(BigQueryResults results)
    {
        var welcomeMetrics = new WelcomeMetrics();
        var actionBreakdown = new List<WelcomeActionBreakdown>();

        foreach (var row in results)
        {
            var metricType = row["metric_type"]?.ToString();

            if (metricType == "action_summary")
            {
                var userAction = row["user_action"]?.ToString() ?? "unknown";
                actionBreakdown.Add(new WelcomeActionBreakdown
                {
                    Action = userAction,
                    UserCount = Convert.ToInt32(row["user_count"] ?? 0),
                    UsersProgressed = Convert.ToInt32(row["users_progressed"] ?? 0),
                    UsersExited = Convert.ToInt32(row["users_exited"] ?? 0),
                    AverageWelcomeEvents = Convert.ToDouble(row["avg_welcome_events"] ?? 0)
                });
            }
            else if (metricType == "overall_stats")
            {
                welcomeMetrics.TotalUsers = Convert.ToInt32(row["total_users"] ?? 0);
                welcomeMetrics.TotalProgressed = Convert.ToInt32(row["total_progressed"] ?? 0);
                welcomeMetrics.TotalExited = Convert.ToInt32(row["total_exited"] ?? 0);
                welcomeMetrics.BeginProfileClicks = Convert.ToInt32(row["begin_profile_clicks"] ?? 0);
                welcomeMetrics.SkipForNowClicks = Convert.ToInt32(row["skip_for_now_clicks"] ?? 0);
                welcomeMetrics.AverageEventsPerUser = Convert.ToDouble(row["avg_events_per_user"] ?? 0);
            }
        }

        // Calculate conversion rates
        welcomeMetrics.ProgressionRate = welcomeMetrics.TotalUsers > 0 
            ? (double)welcomeMetrics.TotalProgressed / welcomeMetrics.TotalUsers * 100 
            : 0;

        welcomeMetrics.ExitRate = welcomeMetrics.TotalUsers > 0 
            ? (double)welcomeMetrics.TotalExited / welcomeMetrics.TotalUsers * 100 
            : 0;

        var totalClicks = welcomeMetrics.BeginProfileClicks + welcomeMetrics.SkipForNowClicks;
        welcomeMetrics.BeginProfileRate = totalClicks > 0 
            ? (double)welcomeMetrics.BeginProfileClicks / totalClicks * 100 
            : 0;

        welcomeMetrics.SkipForNowRate = totalClicks > 0 
            ? (double)welcomeMetrics.SkipForNowClicks / totalClicks * 100 
            : 0;

        // Calculate progression percentage for each action
        foreach (var action in actionBreakdown)
        {
            action.ProgressionRate = action.UserCount > 0 
                ? (double)action.UsersProgressed / action.UserCount * 100 
                : 0;
            action.ExitRate = action.UserCount > 0 
                ? (double)action.UsersExited / action.UserCount * 100 
                : 0;
        }

        welcomeMetrics.ActionBreakdown = actionBreakdown.OrderByDescending(a => a.UserCount).ToList();

        return welcomeMetrics;
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

// Device Analytics Models
public class DeviceAnalyticsRequest
{
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
}

public class DeviceAnalyticsResponse
{
    public bool Success { get; set; }
    public DateRangeInfo DateRange { get; set; } = new();
    public List<TableUsedInfo> TablesUsed { get; set; } = new();
    public DeviceMetrics DeviceMetrics { get; set; } = new();
    public string Message { get; set; } = "";
}

public class DeviceMetrics
{
    public int TotalUsers { get; set; }
    public List<DeviceBreakdown> DeviceBreakdown { get; set; } = new();
    public List<DeviceBreakdown> OperatingSystemBreakdown { get; set; } = new();
    public List<DeviceBreakdown> BrowserBreakdown { get; set; } = new();
}

public class DeviceBreakdown
{
    public string Category { get; set; } = "";
    public int UniqueUsers { get; set; }
    public int TotalSessions { get; set; }
    public long TotalEvents { get; set; }
    public double AverageEventsPerSession { get; set; }
    public double AverageSessionDurationSeconds { get; set; }
    public double Percentage => TotalUsers > 0 ? (double)UniqueUsers / TotalUsers * 100 : 0;
    
    // Computed property for total users (will be set after processing)
    public int TotalUsers { get; set; }
}

// Stage Progression Analytics Models
public class StageProgressionRequest
{
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
}

public class StageProgressionResponse
{
    public bool Success { get; set; }
    public DateRangeInfo DateRange { get; set; } = new();
    public List<TableUsedInfo> TablesUsed { get; set; } = new();
    public StageMetrics StageMetrics { get; set; } = new();
    public string Message { get; set; } = "";
}

public class StageMetrics
{
    public int TotalUsers { get; set; }
    public int CompletedUsers { get; set; }
    public double CompletionRate { get; set; }
    public double AverageStagesVisited { get; set; }
    public double AverageJourneyDurationSeconds { get; set; }
    public List<StageInfo> StagesSummary { get; set; } = new();
    public List<DropOffInfo> DropOffPoints { get; set; } = new();
}

public class StageInfo
{
    public int StageNumber { get; set; }
    public string StageName { get; set; } = "";
    public int UsersReached { get; set; }
    public int TotalVisits { get; set; }
    public double AverageTimeSpentSeconds { get; set; }
    public double RetentionRate { get; set; } // Percentage of total users who reached this stage
}

public class DropOffInfo
{
    public int StageNumber { get; set; }
    public int UsersDropped { get; set; }
    public string StageName => GetStageName(StageNumber);
    
    private string GetStageName(int stageNumber) => stageNumber switch
    {
        1 => "Welcome Screen",
        2 => "DY Quiz Step 1",
        3 => "DY Quiz Step 2",
        4 => "Job Desires Step 1",
        5 => "Job Desires Step 2",
        6 => "Job Desires Step 3",
        7 => "Job Suggestions Step 1",
        8 => "Job Suggestions Step 2",
        9 => "Outro/Complete",
        _ => "Unknown"
    };
}

// Time Investment Analytics Models
public class TimeInvestmentRequest
{
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
}

public class TimeInvestmentResponse
{
    public bool Success { get; set; }
    public DateRangeInfo DateRange { get; set; } = new();
    public List<TableUsedInfo> TablesUsed { get; set; } = new();
    public TimeInvestmentMetrics TimeMetrics { get; set; } = new();
    public string Message { get; set; } = "";
}

public class TimeInvestmentMetrics
{
    public int TotalSessions { get; set; }
    public int TotalUsers { get; set; }
    public double AverageSessionDuration { get; set; }
    public double MedianSessionDuration { get; set; }
    public double P75SessionDuration { get; set; }
    public double P90SessionDuration { get; set; }
    public double MinDuration { get; set; }
    public double MaxDuration { get; set; }
    public List<TimeDistributionBucket> Distribution { get; set; } = new();
}

public class TimeDistributionBucket
{
    public string DurationBucket { get; set; } = "";
    public int SessionCount { get; set; }
    public int UniqueUsers { get; set; }
    public double AverageDurationInBucket { get; set; }
    public double AverageEventsInBucket { get; set; }
    public double Percentage => TotalSessions > 0 ? (double)SessionCount / TotalSessions * 100 : 0;
    
    // Set by processing logic
    public int TotalSessions { get; set; }
}

// Welcome Engagement Analytics Models
public class WelcomeEngagementRequest
{
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
}

public class WelcomeEngagementResponse
{
    public bool Success { get; set; }
    public DateRangeInfo DateRange { get; set; } = new();
    public List<TableUsedInfo> TablesUsed { get; set; } = new();
    public WelcomeMetrics WelcomeMetrics { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}

public class WelcomeMetrics
{
    public int TotalUsers { get; set; }
    public int TotalProgressed { get; set; }
    public int TotalExited { get; set; }
    public int BeginProfileClicks { get; set; }
    public int SkipForNowClicks { get; set; }
    public double ProgressionRate { get; set; } // Percentage who progressed beyond welcome
    public double ExitRate { get; set; } // Percentage who exited during onboarding
    public double BeginProfileRate { get; set; } // Percentage who clicked "Begin profile setup"
    public double SkipForNowRate { get; set; } // Percentage who clicked "Skip for now"
    public double AverageEventsPerUser { get; set; }
    public List<WelcomeActionBreakdown> ActionBreakdown { get; set; } = new();
}

public class WelcomeActionBreakdown
{
    public string Action { get; set; } = string.Empty; // begin_profile_setup, skip_for_now, exit_onboarding, viewed_welcome_only, other
    public int UserCount { get; set; }
    public int UsersProgressed { get; set; }
    public int UsersExited { get; set; }
    public double ProgressionRate { get; set; }
    public double ExitRate { get; set; }
    public double AverageWelcomeEvents { get; set; }
}

// Job Search Exposure Analytics Models
public class JobSearchExposureRequest
{
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
}