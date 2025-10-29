using Microsoft.AspNetCore.Mvc;
using TradingEngine.API.Services;

namespace TradingEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly ITradeStatisticsService _statisticsService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(
        ITradeStatisticsService statisticsService,
        ILogger<DashboardController> logger)
    {
        _statisticsService = statisticsService;
        _logger = logger;
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        try
        {
            var metrics = await _statisticsService.GetDashboardMetricsAsync();
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard metrics");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("health")]
    public IActionResult GetHealth()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }
}
