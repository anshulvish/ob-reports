using System.Text.RegularExpressions;
using Google.Cloud.BigQuery.V2;
using HealthcareAnalyticsWeb.Configuration;
using HealthcareAnalyticsWeb.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace HealthcareAnalyticsWeb.Services;

public class BigQueryTableService : IBigQueryTableService
{
    private readonly IBigQueryClientService _bigQueryClientService;
    private readonly ILogger<BigQueryTableService> _logger;
    private readonly BigQueryConfig _config;
    private List<TableInfo> _tables = new();
    private DateTime _lastRefresh = DateTime.MinValue;
    private readonly TimeSpan _refreshInterval = TimeSpan.FromMinutes(30);

    // Regex patterns for table name parsing
    private static readonly Regex EventsTableRegex = new(@"^events_(\d{8})$", RegexOptions.Compiled);
    private static readonly Regex EventsIntradayTableRegex = new(@"^events_intraday_(\d{8})$", RegexOptions.Compiled);
    private static readonly Regex UsersTableRegex = new(@"^pseudonymous_users_(\d{8})$", RegexOptions.Compiled);

    public BigQueryTableService(
        IBigQueryClientService bigQueryClientService,
        ILogger<BigQueryTableService> logger,
        IOptions<BigQueryConfig> config)
    {
        _bigQueryClientService = bigQueryClientService;
        _logger = logger;
        _config = config.Value;
    }

    public async Task InitializeAsync()
    {
        await RefreshTableListAsync();
    }

    private async Task RefreshTableListAsync(bool force = false)
    {
        if (!force && DateTime.UtcNow - _lastRefresh < _refreshInterval)
        {
            return; // Use cached data
        }

        if (!_bigQueryClientService.IsAvailable)
        {
            _logger.LogWarning("BigQuery client not available, cannot refresh table list");
            return;
        }

        try
        {
            _logger.LogInformation("Refreshing BigQuery table list for dataset: {DatasetId}", _config.DatasetId);
            
            var client = _bigQueryClientService.GetClient()!;
            var dataset = client.GetDataset(_config.DatasetId);
            var tables = new List<TableInfo>();

            await foreach (var table in dataset.ListTablesAsync())
            {
                var tableInfo = ParseTableInfo(table);
                if (tableInfo != null)
                {
                    tables.Add(tableInfo);
                }
            }

            _tables = tables.OrderByDescending(t => t.Date ?? DateTime.MinValue).ToList();
            _lastRefresh = DateTime.UtcNow;

            LogTableDiscoveryResults();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refresh BigQuery table list");
        }
    }

    private TableInfo? ParseTableInfo(BigQueryTable table)
    {
        try
        {
            var tableInfo = new TableInfo
            {
                TableId = table.Reference.TableId,
                FullyQualifiedId = table.FullyQualifiedId,
                CreationTime = DateTimeOffset.FromUnixTimeMilliseconds((long)(table.Resource.CreationTime ?? 0)),
                LastModifiedTime = table.Resource.LastModifiedTime.HasValue 
                    ? DateTimeOffset.FromUnixTimeMilliseconds((long)table.Resource.LastModifiedTime.Value) 
                    : null,
                RowCount = (long?)table.Resource.NumRows,
                SizeBytes = (long?)table.Resource.NumBytes
            };

            // Parse events tables
            var eventsMatch = EventsTableRegex.Match(tableInfo.TableId);
            if (eventsMatch.Success)
            {
                tableInfo.Type = TableType.Events;
                tableInfo.Date = ParseDateFromTableName(eventsMatch.Groups[1].Value);
                tableInfo.IsIntraday = false;
                return tableInfo;
            }

            // Parse intraday events tables
            var intradayMatch = EventsIntradayTableRegex.Match(tableInfo.TableId);
            if (intradayMatch.Success)
            {
                tableInfo.Type = TableType.EventsIntraday;
                tableInfo.Date = ParseDateFromTableName(intradayMatch.Groups[1].Value);
                tableInfo.IsIntraday = true;
                return tableInfo;
            }

            // Parse pseudonymous users tables
            var usersMatch = UsersTableRegex.Match(tableInfo.TableId);
            if (usersMatch.Success)
            {
                tableInfo.Type = TableType.PseudonymousUsers;
                tableInfo.Date = ParseDateFromTableName(usersMatch.Groups[1].Value);
                tableInfo.IsIntraday = false;
                return tableInfo;
            }

            // Unknown table type
            tableInfo.Type = TableType.Other;
            return tableInfo;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse table info for table: {TableId}", table.Reference.TableId);
            return null;
        }
    }

    private DateTime? ParseDateFromTableName(string dateString)
    {
        if (DateTime.TryParseExact(dateString, "yyyyMMdd", null, 
            System.Globalization.DateTimeStyles.None, out var date))
        {
            return date;
        }
        return null;
    }

    private void LogTableDiscoveryResults()
    {
        var eventTables = _tables.Count(t => t.Type == TableType.Events);
        var intradayTables = _tables.Count(t => t.Type == TableType.EventsIntraday);
        var userTables = _tables.Count(t => t.Type == TableType.PseudonymousUsers);
        var otherTables = _tables.Count(t => t.Type == TableType.Other);

        _logger.LogInformation(
            "Table discovery complete. Found {TotalTables} tables: " +
            "{EventTables} event tables, {IntradayTables} intraday tables, " +
            "{UserTables} user tables, {OtherTables} other tables",
            _tables.Count, eventTables, intradayTables, userTables, otherTables);

        if (eventTables > 0)
        {
            var latestEvent = GetLatestEventTable();
            var oldestEvent = _tables.Where(t => t.Type == TableType.Events && t.Date.HasValue)
                                     .OrderBy(t => t.Date)
                                     .FirstOrDefault();
            
            if (latestEvent?.Date != null && oldestEvent?.Date != null)
            {
                _logger.LogInformation(
                    "Event data available from {OldestDate:yyyy-MM-dd} to {LatestDate:yyyy-MM-dd}",
                    oldestEvent.Date, latestEvent.Date);
            }
        }
    }

    public List<TableInfo> GetAvailableTables()
    {
        return _tables.ToList();
    }

    public List<TableInfo> GetEventTables()
    {
        return _tables.Where(t => t.Type == TableType.Events || t.Type == TableType.EventsIntraday)
                      .OrderByDescending(t => t.Date)
                      .ToList();
    }

    public List<TableInfo> GetUserTables()
    {
        return _tables.Where(t => t.Type == TableType.PseudonymousUsers)
                      .OrderByDescending(t => t.Date)
                      .ToList();
    }

    public TableInfo? GetLatestEventTable()
    {
        // Prefer completed daily tables over intraday
        var latestDaily = _tables.Where(t => t.Type == TableType.Events && t.Date.HasValue)
                                 .OrderByDescending(t => t.Date)
                                 .FirstOrDefault();
        
        var latestIntraday = _tables.Where(t => t.Type == TableType.EventsIntraday && t.Date.HasValue)
                                    .OrderByDescending(t => t.Date)
                                    .FirstOrDefault();

        // If intraday is more recent, use it
        if (latestIntraday?.Date > latestDaily?.Date)
        {
            return latestIntraday;
        }

        return latestDaily;
    }

    public TableInfo? GetLatestUserTable()
    {
        return _tables.Where(t => t.Type == TableType.PseudonymousUsers && t.Date.HasValue)
                      .OrderByDescending(t => t.Date)
                      .FirstOrDefault();
    }

    public List<TableInfo> GetTablesForDateRange(DateTime startDate, DateTime endDate, TableType tableType)
    {
        var tables = _tables.Where(t => 
            t.Date.HasValue && 
            t.Date.Value.Date >= startDate.Date && 
            t.Date.Value.Date <= endDate.Date);

        switch (tableType)
        {
            case TableType.Events:
                // Include both daily and intraday tables
                tables = tables.Where(t => t.Type == TableType.Events || t.Type == TableType.EventsIntraday);
                break;
            case TableType.PseudonymousUsers:
                tables = tables.Where(t => t.Type == TableType.PseudonymousUsers);
                break;
            default:
                tables = tables.Where(t => t.Type == tableType);
                break;
        }

        return tables.OrderBy(t => t.Date).ToList();
    }

    public string BuildUnionQuery(List<TableInfo> tables, string selectClause, string whereClause = "")
    {
        if (!tables.Any())
        {
            throw new ArgumentException("No tables provided for union query");
        }

        var tableQueries = tables.Select(table =>
        {
            var query = $"SELECT {selectClause} FROM `{table.FullyQualifiedId}`";
            if (!string.IsNullOrWhiteSpace(whereClause))
            {
                query += $" WHERE {whereClause}";
            }
            return query;
        });

        return string.Join("\nUNION ALL\n", tableQueries);
    }
}