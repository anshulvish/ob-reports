using HealthcareAnalyticsWeb.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using HealthcareAnalyticsWeb.Configuration;
using System.Text.Json;

namespace HealthcareAnalyticsWeb.Services;

public class CacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly CacheConfig _config;
    private readonly ILogger<CacheService> _logger;

    public CacheService(
        IMemoryCache memoryCache,
        IOptions<CacheConfig> config,
        ILogger<CacheService> logger)
    {
        _memoryCache = memoryCache;
        _config = config.Value;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        return await Task.FromResult(_memoryCache.Get<T>(key));
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class
    {
        var cacheExpiration = expiration ?? _config.DefaultExpiration;
        
        var cacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = cacheExpiration
        };

        _memoryCache.Set(key, value, cacheOptions);
        _logger.LogDebug("Cached item with key: {Key}, Expiration: {Expiration}", key, cacheExpiration);
        
        await Task.CompletedTask;
    }

    public async Task RemoveAsync(string key)
    {
        _memoryCache.Remove(key);
        _logger.LogDebug("Removed cached item with key: {Key}", key);
        await Task.CompletedTask;
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        // Note: IMemoryCache doesn't support prefix removal out of the box
        // In production, you might want to track keys or use a different caching solution
        _logger.LogWarning("RemoveByPrefixAsync not fully implemented for IMemoryCache");
        await Task.CompletedTask;
    }

    public async Task<bool> ExistsAsync(string key)
    {
        return await Task.FromResult(_memoryCache.TryGetValue(key, out _));
    }

    public string GenerateCacheKey(params object[] parts)
    {
        return string.Join(":", parts.Select(p => p?.ToString() ?? "null"));
    }
}