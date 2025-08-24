namespace HealthcareAnalyticsWeb.Models.BigQuery;

public class OnboardingEvent
{
    // Primary timestamps - FINAL DECISION
    public DateTime EventTimestamp { get; set; }        // UTC - for sequencing, duration calculations
    public DateTime LocalTimestamp { get; set; }        // User timezone - for activity pattern analysis
    
    public string EventName { get; set; } = string.Empty;
    
    // Core tracking fields
    public string SessionId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string EventId { get; set; } = string.Empty;
    public string SchemaVersion { get; set; } = string.Empty;
    public string AppVersion { get; set; } = string.Empty;
    public string AppName { get; set; } = string.Empty;
    
    // Screen/navigation
    public string ScreenName { get; set; } = string.Empty;
    
    // Timing fields
    public string TimeSpent { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string TotalTimeSpent { get; set; } = string.Empty;
    public string SessionStartTime { get; set; } = string.Empty;
    
    // API tracking
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string StatusCode { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
    
    // Exit tracking
    public string ExitLocation { get; set; } = string.Empty;
    public string CurrentStep { get; set; } = string.Empty;
    
    // Large data fields (reconstructed from chunks)
    public string ResponseData { get; set; } = string.Empty;
    public string DeviceInfo { get; set; } = string.Empty;
    public string JobPreferences { get; set; } = string.Empty;
    
    // Geographic data
    public string Country { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    
    // Feature flags (gracefully handle missing - TO BE ADDED LATER)
    public Dictionary<string, string> FeatureFlags { get; set; } = new();
    public bool HasFeatureFlagData => FeatureFlags.Any();
    
    // Computed properties
    public bool IsValidEvent => !IsTestUser && IsValidSchema;
    public bool IsTestUser => UserId?.ToLower().Contains("test") == true || 
                             UserId?.ToLower().Contains("qa") == true || 
                             UserEmail?.ToLower().Contains("test") == true;
    public bool IsValidSchema => SchemaVersion == "1.1";
    
    public DeviceType GetDeviceType()
    {
        if (string.IsNullOrEmpty(DeviceInfo)) return DeviceType.Unknown;
        var deviceLower = DeviceInfo.ToLower();
        
        if (deviceLower.Contains("mobile") || deviceLower.Contains("android") || deviceLower.Contains("ios"))
            return DeviceType.Mobile;
        if (deviceLower.Contains("tablet") || deviceLower.Contains("ipad"))
            return DeviceType.Tablet;
        if (deviceLower.Contains("desktop") || deviceLower.Contains("windows") || deviceLower.Contains("mac"))
            return DeviceType.Desktop;
            
        return DeviceType.Unknown;
    }
    
    // Helper for time zone analysis
    public int GetLocalHourOfDay() => LocalTimestamp.Hour;
    public DayOfWeek GetLocalDayOfWeek() => LocalTimestamp.DayOfWeek;
}

public enum DeviceType
{
    Unknown,
    Mobile,
    Desktop,
    Tablet
}