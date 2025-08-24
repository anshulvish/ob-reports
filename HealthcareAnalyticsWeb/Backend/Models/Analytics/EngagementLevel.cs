namespace HealthcareAnalyticsWeb.Models.Analytics;

public enum EngagementLevel
{
    MinimalEngagement,    // 0-19 points: Bounced early, minimal time
    LightlyEngaged,       // 20-49 points: Some progress, moderate time
    ModeratelyEngaged,    // 50-79 points: Good progress, revisits
    HighlyEngaged         // 80+ points: Deep engagement, completion or near-completion
}