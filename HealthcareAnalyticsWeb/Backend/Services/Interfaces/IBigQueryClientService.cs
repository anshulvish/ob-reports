using Google.Cloud.BigQuery.V2;

namespace HealthcareAnalyticsWeb.Services.Interfaces;

public interface IBigQueryClientService
{
    BigQueryClient? GetClient();
    bool IsAvailable { get; }
    string StatusMessage { get; }
}