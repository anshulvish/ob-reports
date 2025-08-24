using HealthcareAnalyticsWeb.Configuration;
using HealthcareAnalyticsWeb.Services;
using HealthcareAnalyticsWeb.Services.Interfaces;
using Google.Cloud.BigQuery.V2;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Options;

namespace HealthcareAnalyticsWeb.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configuration
        services.Configure<BigQueryConfig>(configuration.GetSection("BigQuery"));
        services.Configure<CacheConfig>(configuration.GetSection("Cache"));
        services.Configure<EngagementConfig>(configuration.GetSection("Engagement"));

        // BigQuery client service
        services.AddSingleton<IBigQueryClientService, BigQueryClientService>();

        // Caching
        services.AddMemoryCache();
        
        // Services
        services.AddScoped<IBigQueryService, BigQueryService>();
        services.AddScoped<IEngagementService, EngagementService>();
        services.AddScoped<IUserJourneyService, UserJourneyService>();
        services.AddScoped<IScreenFlowService, ScreenFlowService>();
        services.AddSingleton<ICacheService, CacheService>();

        // AutoMapper
        services.AddAutoMapper(typeof(Program).Assembly);

        return services;
    }
}