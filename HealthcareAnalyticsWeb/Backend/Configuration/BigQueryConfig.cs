namespace HealthcareAnalyticsWeb.Configuration;

public class BigQueryConfig
{
    public string ProjectId { get; set; } = string.Empty;
    public string DatasetId { get; set; } = string.Empty;
    public string Location { get; set; } = "US";
    public string ServiceAccountKeyPath { get; set; } = string.Empty;
    public int QueryTimeoutMinutes { get; set; } = 5;
    public int MaxResults { get; set; } = 100000;
    public bool EnableQueryCache { get; set; } = true;
    
    // Table names
    public string EventsTablePrefix { get; set; } = "events_";
    public string EventsIntradayTablePrefix { get; set; } = "events_intraday_";
    
    // Helper properties
    public string FullDatasetId => $"{ProjectId}.{DatasetId}";
    public TimeSpan QueryTimeout => TimeSpan.FromMinutes(QueryTimeoutMinutes);
}