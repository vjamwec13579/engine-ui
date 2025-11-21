using Microsoft.AspNetCore.Mvc;
using TradingEngine.API.Services;

namespace TradingEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly ITradeStatisticsService _statisticsService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        ITradeStatisticsService statisticsService,
        ILogger<OrdersController> logger)
    {
        _statisticsService = statisticsService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 100)
    {
        try
        {
            var orders = await _statisticsService.GetAllOrdersAsync(page, pageSize);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all orders");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveOrders()
    {
        try
        {
            var orders = await _statisticsService.GetOrdersByStateAsync("active");
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching active orders");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("completed")]
    public async Task<IActionResult> GetCompletedOrders()
    {
        try
        {
            var orders = await _statisticsService.GetOrdersByStateAsync("filled");
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching completed orders");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("rejected")]
    public async Task<IActionResult> GetRejectedOrders()
    {
        try
        {
            // Include both rejected and canceled orders
            var orders = await _statisticsService.GetOrdersByStatesAsync("rejected", "canceled");
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching rejected orders");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("outstanding")]
    public async Task<IActionResult> GetOutstandingOrders()
    {
        try
        {
            var orders = await _statisticsService.GetOrdersByStateAsync("pending");
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching outstanding orders");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics()
    {
        try
        {
            var statistics = await _statisticsService.GetOrderStatisticsAsync();
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching order statistics");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }
}
