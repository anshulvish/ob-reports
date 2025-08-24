using HealthcareAnalyticsWeb.Models.Analytics;

namespace HealthcareAnalyticsWeb.Services.Interfaces;

public interface IEngagementService
{
    Task<EngagementAnalysisResult> GetEngagementAnalysisAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null);
    Task<EngagementBreakdownResult> GetEngagementBreakdownAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null);
    Task<ScreenEngagementResult> GetScreenEngagementAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null);
    Task<TimeInvestmentResult> GetTimeInvestmentAnalysisAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null);
}

public class EngagementAnalysisResult
{
    public int TotalUsers { get; set; }
    public int TotalSessions { get; set; }
    public double CompletionRate { get; set; }
    public double AverageEngagementScore { get; set; }
    public Dictionary<EngagementLevel, int> EngagementBreakdown { get; set; } = new();
    public Dictionary<int, int> FurthestStageReached { get; set; } = new(); // Stage -> Count
    public TimeSpan AverageTimeInvested { get; set; }
    public double AverageScreenRevisits { get; set; }
}

public class EngagementBreakdownResult
{
    public Dictionary<EngagementLevel, List<EngagementUserSummary>> UsersByEngagementLevel { get; set; } = new();
    public Dictionary<string, EngagementMetrics> MetricsBySegment { get; set; } = new();
}

public class ScreenEngagementResult
{
    public Dictionary<string, ScreenMetrics> ScreenMetrics { get; set; } = new();
    public List<string> MostEngagingScreens { get; set; } = new();
    public List<string> HighDropOffScreens { get; set; } = new();
}

public class TimeInvestmentResult
{
    public TimeSpan MedianTimeInvested { get; set; }
    public TimeSpan AverageTimeInvested { get; set; }
    public Dictionary<string, int> TimeDistribution { get; set; } = new(); // Time bucket -> User count
    public List<TimeInvestmentSegment> Segments { get; set; } = new();
}

public class EngagementUserSummary
{
    public string UserId { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public EngagementLevel EngagementLevel { get; set; }
    public int EngagementScore { get; set; }
    public TimeSpan TimeInvested { get; set; }
    public int FurthestStage { get; set; }
}

public class EngagementMetrics
{
    public int UserCount { get; set; }
    public double AverageScore { get; set; }
    public TimeSpan AverageTimeInvested { get; set; }
    public double CompletionRate { get; set; }
}

public class ScreenMetrics
{
    public string ScreenName { get; set; } = string.Empty;
    public int VisitCount { get; set; }
    public int UniqueUsers { get; set; }
    public TimeSpan AverageTimeSpent { get; set; }
    public double DropOffRate { get; set; }
    public int RevisitCount { get; set; }
}

public class TimeInvestmentSegment
{
    public string SegmentName { get; set; } = string.Empty;
    public TimeSpan MinTime { get; set; }
    public TimeSpan MaxTime { get; set; }
    public int UserCount { get; set; }
    public double Percentage { get; set; }
}