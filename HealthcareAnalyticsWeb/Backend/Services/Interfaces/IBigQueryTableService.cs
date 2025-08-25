using Google.Cloud.BigQuery.V2;

namespace HealthcareAnalyticsWeb.Services.Interfaces;

public interface IBigQueryTableService
{
    Task InitializeAsync();
    List<TableInfo> GetAvailableTables();
    List<TableInfo> GetEventTables();
    List<TableInfo> GetUserTables();
    TableInfo? GetLatestEventTable();
    TableInfo? GetLatestUserTable();
    List<TableInfo> GetTablesForDateRange(DateTime startDate, DateTime endDate, TableType tableType);
    string BuildUnionQuery(List<TableInfo> tables, string selectClause, string whereClause = "");
}

public class TableInfo
{
    public string TableId { get; set; } = string.Empty;
    public string FullyQualifiedId { get; set; } = string.Empty;
    public TableType Type { get; set; }
    public DateTime? Date { get; set; }
    public bool IsIntraday { get; set; }
    public long? RowCount { get; set; }
    public long? SizeBytes { get; set; }
    public DateTimeOffset? CreationTime { get; set; }
    public DateTimeOffset? LastModifiedTime { get; set; }
}

public enum TableType
{
    Unknown,
    Events,
    EventsIntraday,
    PseudonymousUsers,
    Other
}