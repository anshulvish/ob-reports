namespace HealthcareAnalyticsWeb.Configuration;

public class CacheConfig
{
    public int DefaultExpirationMinutes { get; set; } = 15;
    public int UserJourneyCacheMinutes { get; set; } = 2;
    public int ScreenFlowCacheMinutes { get; set; } = 10;
    public string ConnectionString { get; set; } = "localhost:6379";
    public bool UseRedis { get; set; } = false;
    
    // Helper properties
    public TimeSpan DefaultExpiration => TimeSpan.FromMinutes(DefaultExpirationMinutes);
    public TimeSpan UserJourneyExpiration => TimeSpan.FromMinutes(UserJourneyCacheMinutes);
    public TimeSpan ScreenFlowExpiration => TimeSpan.FromMinutes(ScreenFlowCacheMinutes);
}