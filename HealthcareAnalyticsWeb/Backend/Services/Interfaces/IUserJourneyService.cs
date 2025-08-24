using HealthcareAnalyticsWeb.Models.BigQuery;

namespace HealthcareAnalyticsWeb.Services.Interfaces;

public interface IUserJourneyService
{
    Task<UserJourney> GetUserJourneyAsync(string userIdentifier); // Email or UserId
    Task<List<UserJourney>> SearchUserJourneysAsync(string searchTerm, int limit = 50);
    Task<ScreenFlowAnalysis> GetScreenFlowAnalysisAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null);
    Task<List<CommonPath>> GetCommonPathsAsync(DateTime startDate, DateTime endDate, int minOccurrences = 10);
}

public class UserJourney
{
    public string UserId { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public List<UserSession> Sessions { get; set; } = new();
    public DateTime FirstVisit { get; set; }
    public DateTime LastActivity { get; set; }
    public TimeSpan TotalTimeInvested { get; set; }
    public int TotalSessions { get; set; }
    public bool EverCompleted { get; set; }
    public EngagementLevel OverallEngagement { get; set; }
    
    // Journey visualization data
    public List<JourneyStep> Steps { get; set; } = new();
    public List<ScreenTransition> AllTransitions { get; set; } = new();
    
    // Insights
    public string DropOffPoint { get; set; } = string.Empty;
    public List<string> ProblematicScreens { get; set; } = new(); // Screens where user got stuck
    public List<string> RevisitedScreens { get; set; } = new(); // Screens they went back to
}

public class JourneyStep
{
    public string ScreenName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime FirstVisit { get; set; }
    public DateTime LastVisit { get; set; }
    public int VisitCount { get; set; }
    public TimeSpan TotalTimeSpent { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public bool IsDropOffPoint { get; set; }
}