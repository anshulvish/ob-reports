namespace HealthcareAnalyticsWeb.Configuration;

public class EngagementConfig
{
    public List<EngagementStage> PredefinedStages { get; set; } = new();
    public EngagementScoringConfig EngagementScoring { get; set; } = new();
}

public class EngagementStage
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int Order { get; set; }
    public List<string> Patterns { get; set; } = new();
}

public class EngagementScoringConfig
{
    public int StageProgressWeight { get; set; } = 5;
    public double TimeInvestedWeight { get; set; } = 0.5;
    public int RevisitWeight { get; set; } = 3;
    public int CompletionBonus { get; set; } = 20;
    public EngagementThresholds Thresholds { get; set; } = new();
}

public class EngagementThresholds
{
    public int HighlyEngaged { get; set; } = 80;
    public int ModeratelyEngaged { get; set; } = 50;
    public int LightlyEngaged { get; set; } = 20;
}