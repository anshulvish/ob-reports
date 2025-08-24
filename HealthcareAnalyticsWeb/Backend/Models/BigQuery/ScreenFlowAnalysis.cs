namespace HealthcareAnalyticsWeb.Models.BigQuery;

public class ScreenFlowAnalysis
{
    public List<ScreenNode> Screens { get; set; } = new();
    public List<FlowConnection> Connections { get; set; } = new();
    public Dictionary<string, int> DropOffPoints { get; set; } = new();
    public List<string> MostCommonPaths { get; set; } = new();
    public Dictionary<string, double> ScreenRetentionRates { get; set; } = new();
}

public class ScreenNode
{
    public string ScreenName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int VisitCount { get; set; }
    public int UniqueUsers { get; set; }
    public TimeSpan AverageTimeSpent { get; set; }
    public double DropOffRate { get; set; }
}

public class FlowConnection
{
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
    public bool IsBackward { get; set; }
}

public class CommonPath
{
    public string Path { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}