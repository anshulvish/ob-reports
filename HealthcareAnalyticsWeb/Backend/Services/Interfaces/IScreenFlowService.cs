using HealthcareAnalyticsWeb.Models.BigQuery;

namespace HealthcareAnalyticsWeb.Services.Interfaces;

public interface IScreenFlowService
{
    Task<ScreenFlowAnalysis> AnalyzeScreenFlowAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null);
    Task<List<FlowPattern>> GetFlowPatternsAsync(DateTime startDate, DateTime endDate, int minOccurrences = 5);
    Task<DropOffAnalysis> GetDropOffAnalysisAsync(DateTime startDate, DateTime endDate, FilterCriteria? filters = null);
    Task<NavigationInsights> GetNavigationInsightsAsync(DateTime startDate, DateTime endDate);
}

public class FlowPattern
{
    public string PatternId { get; set; } = string.Empty;
    public List<string> ScreenSequence { get; set; } = new();
    public int OccurrenceCount { get; set; }
    public double Percentage { get; set; }
    public TimeSpan AverageDuration { get; set; }
    public double CompletionRate { get; set; }
    public List<string> CommonExitPoints { get; set; } = new();
}

public class DropOffAnalysis
{
    public Dictionary<string, DropOffMetrics> ScreenDropOffs { get; set; } = new();
    public List<DropOffInsight> TopDropOffPoints { get; set; } = new();
    public Dictionary<string, double> StageRetentionRates { get; set; } = new();
    public TimeSpan AverageTimeBeforeDropOff { get; set; }
}

public class DropOffMetrics
{
    public string ScreenName { get; set; } = string.Empty;
    public int TotalArrivals { get; set; }
    public int DropOffs { get; set; }
    public double DropOffRate { get; set; }
    public List<string> CommonNextScreens { get; set; } = new();
    public Dictionary<string, int> DropOffReasons { get; set; } = new(); // If available from exit surveys
}

public class DropOffInsight
{
    public string ScreenName { get; set; } = string.Empty;
    public string InsightType { get; set; } = string.Empty; // "High Drop-off", "Long Dwell Time", etc.
    public string Description { get; set; } = string.Empty;
    public double ImpactScore { get; set; } // 0-100 indicating severity
    public string RecommendedAction { get; set; } = string.Empty;
}

public class NavigationInsights
{
    public List<BackwardNavigation> FrequentBackwardPaths { get; set; } = new();
    public List<LoopPattern> DetectedLoops { get; set; } = new();
    public Dictionary<string, double> ScreenRevisitRates { get; set; } = new();
    public List<NavigationAnomaly> Anomalies { get; set; } = new();
}

public class BackwardNavigation
{
    public string FromScreen { get; set; } = string.Empty;
    public string ToScreen { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
    public string PossibleReason { get; set; } = string.Empty;
}

public class LoopPattern
{
    public List<string> LoopScreens { get; set; } = new();
    public int OccurrenceCount { get; set; }
    public double AverageLoopIterations { get; set; }
    public string LoopType { get; set; } = string.Empty; // "Confusion Loop", "Validation Loop", etc.
}

public class NavigationAnomaly
{
    public string AnomalyType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> AffectedScreens { get; set; } = new();
    public int AffectedUsers { get; set; }
}