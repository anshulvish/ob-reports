using Google.Cloud.BigQuery.V2;
using HealthcareAnalyticsWeb.Configuration;
using HealthcareAnalyticsWeb.Models.BigQuery;
using HealthcareAnalyticsWeb.Services.Interfaces;
using HealthcareAnalyticsWeb.Extensions;
using HealthcareAnalyticsWeb.Utilities;
using Microsoft.Extensions.Options;

namespace HealthcareAnalyticsWeb.Services;

public class BigQueryService : IBigQueryService
{
    private readonly BigQueryClient _bigQueryClient;
    private readonly ILogger<BigQueryService> _logger;
    private readonly ICacheService _cache;
    private readonly BigQueryConfig _config;

    public BigQueryService(
        BigQueryClient bigQueryClient,
        ILogger<BigQueryService> logger,
        ICacheService cache,
        IOptions<BigQueryConfig> config)
    {
        _bigQueryClient = bigQueryClient;
        _logger = logger;
        _cache = cache;
        _config = config.Value;
    }

    public async Task<List<OnboardingEvent>> GetEventsAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null)
    {
        var cacheKey = _cache.GenerateCacheKey("events", startDate, endDate, filters ?? new FilterCriteria());
        var cachedResult = await _cache.GetAsync<List<OnboardingEvent>>(cacheKey);
        if (cachedResult != null) 
        {
            _logger.LogDebug("Returning cached events for date range: {StartDate} to {EndDate}", startDate, endDate);
            return cachedResult;
        }

        _logger.LogInformation("Fetching events from BigQuery for date range: {StartDate} to {EndDate}", startDate, endDate);
        
        try
        {
            var query = BigQueryQueryBuilder.BuildEventsQuery(_config, startDate, endDate, filters);
            var queryJob = await _bigQueryClient.CreateQueryJobAsync(query, null);
            var results = await queryJob.GetQueryResultsAsync();
            
            var events = new List<OnboardingEvent>();
            foreach (var row in results)
            {
                try
                {
                    var eventObj = row.MapRowToEvent();
                    events.Add(eventObj);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to map BigQuery row to OnboardingEvent");
                }
            }
            
            _logger.LogInformation("Retrieved {Count} events from BigQuery", events.Count);
            
            // Cache for 15 minutes
            await _cache.SetAsync(cacheKey, events, TimeSpan.FromMinutes(15));
            return events;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve events from BigQuery");
            return new List<OnboardingEvent>();
        }
    }

    public async Task<List<UserSession>> GetUserSessionsAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null)
    {
        var cacheKey = _cache.GenerateCacheKey("user_sessions", startDate, endDate, filters ?? new FilterCriteria());
        var cachedResult = await _cache.GetAsync<List<UserSession>>(cacheKey);
        if (cachedResult != null) return cachedResult;

        _logger.LogInformation("Fetching user sessions from BigQuery for date range: {StartDate} to {EndDate}", startDate, endDate);
        
        try
        {
            var query = BigQueryQueryBuilder.BuildUserSessionsQuery(_config, startDate, endDate, filters);
            var queryJob = await _bigQueryClient.CreateQueryJobAsync(query, null);
            var results = await queryJob.GetQueryResultsAsync();
            
            var sessions = new List<UserSession>();
            foreach (var row in results)
            {
                try
                {
                    var session = new UserSession
                    {
                        SessionId = row.SafeGetValue<string>("sessionId"),
                        UserId = row.SafeGetValue<string>("userId"),
                        UserEmail = row.SafeGetValue<string>("userEmail"),
                        StartTime = row.SafeGetValue<DateTime>("session_start"),
                        EndTime = row.SafeGetValue<DateTime>("session_end"),
                        Country = row.SafeGetValue<string>("country"),
                        Region = row.SafeGetValue<string>("region"),
                        City = row.SafeGetValue<string>("city"),
                        DeviceType = ParseDeviceType(row.SafeGetValue<string>("device_info"))
                    };
                    
                    // Parse screens viewed array
                    var screensViewedString = row.SafeGetValue<string>("screens_viewed");
                    if (!string.IsNullOrEmpty(screensViewedString))
                    {
                        // This would need proper JSON parsing in production
                        session.ScreensViewed = new List<string>(); // TODO: Parse JSON array
                    }
                    
                    sessions.Add(session);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to map BigQuery row to UserSession");
                }
            }
            
            _logger.LogInformation("Retrieved {Count} user sessions from BigQuery", sessions.Count);
            
            // Cache for 10 minutes
            await _cache.SetAsync(cacheKey, sessions, TimeSpan.FromMinutes(10));
            return sessions;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve user sessions from BigQuery");
            return new List<UserSession>();
        }
    }

    private DeviceType ParseDeviceType(string deviceInfo)
    {
        if (string.IsNullOrEmpty(deviceInfo)) return DeviceType.Unknown;
        var deviceLower = deviceInfo.ToLower();
        
        if (deviceLower.Contains("mobile") || deviceLower.Contains("android") || deviceLower.Contains("ios"))
            return DeviceType.Mobile;
        if (deviceLower.Contains("tablet") || deviceLower.Contains("ipad"))
            return DeviceType.Tablet;
        if (deviceLower.Contains("desktop") || deviceLower.Contains("windows") || deviceLower.Contains("mac"))
            return DeviceType.Desktop;
            
        return DeviceType.Unknown;
    }

    public async Task<ScreenFlowAnalysis> GetScreenFlowAnalysisAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null)
    {
        var cacheKey = _cache.GenerateCacheKey("screen_flow", startDate, endDate, filters ?? new FilterCriteria());
        var cachedResult = await _cache.GetAsync<ScreenFlowAnalysis>(cacheKey);
        if (cachedResult != null) return cachedResult;

        _logger.LogInformation("Analyzing screen flow from BigQuery for date range: {StartDate} to {EndDate}", startDate, endDate);
        
        try
        {
            var query = BigQueryQueryBuilder.BuildScreenFlowQuery(_config, startDate, endDate, filters);
            var queryJob = await _bigQueryClient.CreateQueryJobAsync(query, null);
            var results = await queryJob.GetQueryResultsAsync();
            
            var connections = new List<FlowConnection>();
            var screenCounts = new Dictionary<string, int>();
            
            foreach (var row in results)
            {
                try
                {
                    var from = row.SafeGetValue<string>("from_screen");
                    var to = row.SafeGetValue<string>("to_screen");
                    var count = row.SafeGetValue<int>("transition_count");
                    var isBackward = row.SafeGetValue<bool>("is_backward");
                    var percentage = row.SafeGetValue<double>("percentage");
                    
                    connections.Add(new FlowConnection
                    {
                        From = from,
                        To = to,
                        Count = count,
                        Percentage = percentage,
                        IsBackward = isBackward
                    });
                    
                    screenCounts[from] = screenCounts.GetValueOrDefault(from, 0) + count;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to map BigQuery row to FlowConnection");
                }
            }
            
            var analysis = new ScreenFlowAnalysis
            {
                Connections = connections,
                Screens = BuildScreenNodes(screenCounts),
                DropOffPoints = await GetDropOffPointsInternalAsync(startDate, endDate, filters),
                MostCommonPaths = ExtractCommonPaths(connections)
            };
            
            _logger.LogInformation("Analyzed screen flow with {ConnectionCount} connections and {ScreenCount} screens", 
                connections.Count, analysis.Screens.Count);
            
            // Cache for 15 minutes - screen flows change less frequently
            await _cache.SetAsync(cacheKey, analysis, TimeSpan.FromMinutes(15));
            return analysis;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to analyze screen flow from BigQuery");
            return new ScreenFlowAnalysis();
        }
    }

    private List<ScreenNode> BuildScreenNodes(Dictionary<string, int> screenCounts)
    {
        return screenCounts.Select(kvp => new ScreenNode
        {
            ScreenName = kvp.Key,
            DisplayName = GetDisplayName(kvp.Key),
            VisitCount = kvp.Value,
            UniqueUsers = kvp.Value, // Simplified - would need separate query for accurate unique users
            AverageTimeSpent = TimeSpan.Zero, // TODO: Calculate from time spent data
            DropOffRate = 0.0 // TODO: Calculate drop-off rate
        }).ToList();
    }

    private string GetDisplayName(string screenName)
    {
        return screenName switch
        {
            "welcome" => "Welcome Screen",
            "dy-quiz/1" => "DY Quiz Step 1",
            "dy-quiz/2" => "DY Quiz Step 2", 
            "step/1" => "Job Desires Step 1",
            "step/2" => "Job Desires Step 2",
            "step/3" => "Job Desires Step 3",
            "job-suggestions/1" => "Job Suggestions Step 1",
            "job-suggestions/2" => "Job Suggestions Step 2",
            "outro" => "Outro",
            _ => screenName
        };
    }

    private List<string> ExtractCommonPaths(List<FlowConnection> connections)
    {
        // Simplified implementation - in production would build actual paths
        return connections
            .Where(c => !c.IsBackward && c.Count > 10)
            .OrderByDescending(c => c.Count)
            .Take(5)
            .Select(c => $"{c.From} → {c.To}")
            .ToList();
    }

    private Task<Dictionary<string, int>> GetDropOffPointsInternalAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters)
    {
        // Simplified implementation - would need separate query for accurate drop-off analysis
        return Task.FromResult(new Dictionary<string, int>());
    }

    public async Task<Dictionary<string, int>> GetDropOffPointsAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null)
    {
        return await GetDropOffPointsInternalAsync(startDate, endDate, filters);
    }

    public async Task<List<CommonPath>> GetCommonPathsAsync(DateTime startDate, DateTime endDate, int minOccurrences = 10)
    {
        _logger.LogInformation("Analyzing common paths from screen flow data");
        
        try
        {
            var screenFlowAnalysis = await GetScreenFlowAnalysisAsync(startDate, endDate, filters: null);
            
            var commonPaths = screenFlowAnalysis.Connections
                .Where(c => !c.IsBackward && c.Count >= minOccurrences)
                .OrderByDescending(c => c.Count)
                .Take(20) // Get top 20 common transitions
                .Select(c => new CommonPath
                {
                    Path = $"{c.From} → {c.To}",
                    Count = c.Count,
                    Percentage = c.Percentage
                })
                .ToList();
                
            _logger.LogInformation("Found {Count} common paths with minimum {MinOccurrences} occurrences", 
                commonPaths.Count, minOccurrences);
                
            return commonPaths;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to analyze common paths");
            return new List<CommonPath>();
        }
    }

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            var datasetsEnum = _bigQueryClient.ListDatasetsAsync(_config.ProjectId);
            var datasets = new List<BigQueryDataset>();
            await foreach (var dataset in datasetsEnum)
            {
                datasets.Add(dataset);
            }
            _logger.LogInformation("Successfully connected to BigQuery. Found {Count} datasets", datasets.Count);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to BigQuery");
            return false;
        }
    }
}