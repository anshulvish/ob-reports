using Microsoft.AspNetCore.Mvc;
using HealthcareAnalyticsWeb.Services.Interfaces;

namespace HealthcareAnalyticsWeb.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BigQueryTablesController : ControllerBase
{
    private readonly IBigQueryTableService _tableService;
    private readonly ILogger<BigQueryTablesController> _logger;

    public BigQueryTablesController(
        IBigQueryTableService tableService,
        ILogger<BigQueryTablesController> logger)
    {
        _tableService = tableService;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult GetTables()
    {
        try
        {
            var tables = _tableService.GetAvailableTables();
            var eventTables = _tableService.GetEventTables();
            var userTables = _tableService.GetUserTables();
            var latestEventTable = _tableService.GetLatestEventTable();
            var latestUserTable = _tableService.GetLatestUserTable();

            return Ok(new
            {
                TotalTables = tables.Count,
                EventTables = eventTables.Count,
                UserTables = userTables.Count,
                LatestEventTable = latestEventTable != null ? new
                {
                    latestEventTable.TableId,
                    latestEventTable.Date,
                    latestEventTable.IsIntraday,
                    latestEventTable.RowCount,
                    SizeMB = latestEventTable.SizeBytes.HasValue ? (double?)(latestEventTable.SizeBytes.Value / 1024.0 / 1024.0) : null
                } : null,
                LatestUserTable = latestUserTable != null ? new
                {
                    latestUserTable.TableId,
                    latestUserTable.Date,
                    latestUserTable.RowCount,
                    SizeMB = latestUserTable.SizeBytes.HasValue ? (double?)(latestUserTable.SizeBytes.Value / 1024.0 / 1024.0) : null
                } : null,
                DateRange = eventTables.Any() ? new
                {
                    Earliest = eventTables.Last().Date,
                    Latest = eventTables.First().Date
                } : null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get table information");
            return StatusCode(500, new { Error = "Failed to retrieve table information", Message = ex.Message });
        }
    }

    [HttpGet("details")]
    public IActionResult GetTableDetails()
    {
        try
        {
            var tables = _tableService.GetAvailableTables();
            
            return Ok(new
            {
                Tables = tables.Select(t => new
                {
                    t.TableId,
                    t.Type,
                    t.Date,
                    t.IsIntraday,
                    t.RowCount,
                    SizeMB = t.SizeBytes.HasValue ? (double?)Math.Round(t.SizeBytes.Value / 1024.0 / 1024.0, 2) : null,
                    t.CreationTime,
                    t.LastModifiedTime
                }).OrderByDescending(t => t.Date)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get detailed table information");
            return StatusCode(500, new { Error = "Failed to retrieve table details", Message = ex.Message });
        }
    }

    [HttpGet("date-range")]
    public IActionResult GetTablesForDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string tableType = "Events")
    {
        try
        {
            if (!Enum.TryParse<TableType>(tableType, out var type))
            {
                type = TableType.Events;
            }

            var tables = _tableService.GetTablesForDateRange(startDate, endDate, type);
            
            return Ok(new
            {
                StartDate = startDate,
                EndDate = endDate,
                TableType = type.ToString(),
                TableCount = tables.Count,
                Tables = tables.Select(t => new
                {
                    t.TableId,
                    t.Date,
                    t.IsIntraday,
                    t.RowCount
                })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get tables for date range");
            return StatusCode(500, new { Error = "Failed to retrieve tables for date range", Message = ex.Message });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshTables()
    {
        try
        {
            await _tableService.InitializeAsync();
            
            var tables = _tableService.GetAvailableTables();
            
            return Ok(new
            {
                Success = true,
                Message = "Table list refreshed successfully",
                TableCount = tables.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refresh table list");
            return StatusCode(500, new { Error = "Failed to refresh table list", Message = ex.Message });
        }
    }
}