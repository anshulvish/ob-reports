using Microsoft.AspNetCore.Mvc;

namespace HealthcareAnalyticsWeb.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            Status = "Healthy",
            Service = "Aya Healthcare Analytics API",
            Version = "1.0.0",
            Timestamp = DateTime.UtcNow,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"
        });
    }

    [HttpGet("ready")]
    public IActionResult Ready()
    {
        // TODO: Add actual readiness checks (BigQuery connection, etc.)
        return Ok(new
        {
            Status = "Ready",
            Checks = new
            {
                BigQuery = "Not configured yet",
                Cache = "Memory cache available"
            }
        });
    }
}