namespace HealthcareAnalyticsWeb.Models.BigQuery;

public class UserSession
{
    public string SessionId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }     // UTC
    public DateTime EndTime { get; set; }       // UTC
    public TimeSpan Duration => EndTime - StartTime;
    
    public List<OnboardingEvent> Events { get; set; } = new();
    public List<string> ScreensViewed { get; set; } = new();
    public Dictionary<string, int> ScreenVisitCounts { get; set; } = new();
    
    public DeviceType DeviceType { get; set; }
    public string Country { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    
    // ENGAGEMENT METRICS - FINAL DECISION
    public int FurthestStageReached => CalculateFurthestStage();
    public bool Completed => ScreensViewed.Contains("outro");
    public string ExitPoint => !Completed ? (ScreensViewed.LastOrDefault() ?? "unknown") : "completed";
    public TimeSpan TimeInvested => Duration; // Total time user spent
    public int TotalScreenRevisits => ScreenVisitCounts.Values.Sum() - ScreensViewed.Count; // How many times they went back
    public EngagementLevel EngagementLevel => CalculateEngagementLevel();
    
    // Activity patterns in user's local timezone
    public List<int> LocalActivityHours => Events
        .Select(e => e.GetLocalHourOfDay())
        .Distinct()
        .OrderBy(h => h)
        .ToList();
    
    // Screen flow analysis
    public List<ScreenTransition> ScreenFlow => CalculateScreenFlow();
    public bool HasNonLinearFlow => ScreenFlow.Any(t => t.IsBackward);
    
    private int CalculateFurthestStage()
    {
        var stageOrder = new Dictionary<string, int>
        {
            ["welcome"] = 1,
            ["dy-quiz/1"] = 2,
            ["dy-quiz/2"] = 3,
            ["step/1"] = 4,
            ["step/2"] = 5,
            ["step/3"] = 6,
            ["job-suggestions/1"] = 7,
            ["job-suggestions/2"] = 8,
            ["outro"] = 9
        };
        
        return ScreensViewed
            .Where(screen => stageOrder.ContainsKey(screen))
            .Select(screen => stageOrder[screen])
            .DefaultIfEmpty(0)
            .Max();
    }
    
    private EngagementLevel CalculateEngagementLevel()
    {
        // ENGAGEMENT SCORING ALGORITHM
        var score = 0;
        
        // Stage progress (0-50 points)
        score += FurthestStageReached * 5;
        
        // Time invested (0-30 points)
        var minutes = Duration.TotalMinutes;
        score += Math.Min((int)(minutes / 2), 30); // 2 minutes = 1 point, max 30
        
        // Revisits show engagement (0-20 points)
        score += Math.Min(TotalScreenRevisits * 3, 20); // 3 points per revisit, max 20
        
        // Completion bonus (20 points)
        if (Completed) score += 20;
        
        return score switch
        {
            >= 80 => EngagementLevel.HighlyEngaged,
            >= 50 => EngagementLevel.ModeratelyEngaged,
            >= 20 => EngagementLevel.LightlyEngaged,
            _ => EngagementLevel.MinimalEngagement
        };
    }
    
    private List<ScreenTransition> CalculateScreenFlow()
    {
        var transitions = new List<ScreenTransition>();
        var screenEvents = Events
            .Where(e => e.EventName == "aifp_screen_view")
            .OrderBy(e => e.EventTimestamp)
            .ToList();
            
        for (int i = 1; i < screenEvents.Count; i++)
        {
            var from = screenEvents[i - 1];
            var to = screenEvents[i];
            
            transitions.Add(new ScreenTransition
            {
                From = from.ScreenName,
                To = to.ScreenName,
                Timestamp = to.EventTimestamp,
                Duration = to.EventTimestamp - from.EventTimestamp,
                IsBackward = IsBackwardTransition(from.ScreenName, to.ScreenName)
            });
        }
        
        return transitions;
    }
    
    private bool IsBackwardTransition(string from, string to)
    {
        var stageOrder = new Dictionary<string, int>
        {
            ["welcome"] = 1, ["dy-quiz/1"] = 2, ["dy-quiz/2"] = 3,
            ["step/1"] = 4, ["step/2"] = 5, ["step/3"] = 6,
            ["job-suggestions/1"] = 7, ["job-suggestions/2"] = 8, ["outro"] = 9
        };
        
        var fromStage = stageOrder.GetValueOrDefault(from, 0);
        var toStage = stageOrder.GetValueOrDefault(to, 0);
        
        return fromStage > toStage;
    }
}

public class ScreenTransition
{
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public TimeSpan Duration { get; set; }
    public bool IsBackward { get; set; }
}

public enum EngagementLevel
{
    MinimalEngagement,    // 0-19 points: Bounced early, minimal time
    LightlyEngaged,       // 20-49 points: Some progress, moderate time
    ModeratelyEngaged,    // 50-79 points: Good progress, revisits
    HighlyEngaged         // 80+ points: Deep engagement, completion or near-completion
}