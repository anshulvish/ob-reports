using HealthcareAnalyticsWeb.Models.BigQuery;

namespace HealthcareAnalyticsWeb.Services.Interfaces;

public interface IBigQueryService
{
    Task<List<OnboardingEvent>> GetEventsAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null);
    Task<List<UserSession>> GetUserSessionsAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null);
    Task<ScreenFlowAnalysis> GetScreenFlowAnalysisAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null);
    Task<Dictionary<string, int>> GetDropOffPointsAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null);
    Task<List<CommonPath>> GetCommonPathsAsync(DateTime startDate, DateTime endDate, int minOccurrences = 10);
    Task<bool> TestConnectionAsync();
}

public class FilterCriteria
{
    public bool ExcludeTestUsers { get; set; } = true;
    public string? SchemaVersion { get; set; }
    public string? Country { get; set; }
    public string? DeviceType { get; set; }
    public List<string>? UserIds { get; set; }
    public List<string>? SessionIds { get; set; }
}