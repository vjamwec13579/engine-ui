using Microsoft.AspNetCore.Mvc;
using TradingEngine.API.Services;

namespace TradingEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly IAlpacaService _alpacaService;
    private readonly ILogger<AccountController> _logger;

    public AccountController(
        IAlpacaService alpacaService,
        ILogger<AccountController> logger)
    {
        _alpacaService = alpacaService;
        _logger = logger;
    }

    [HttpGet("info")]
    public async Task<IActionResult> GetAccountInfo()
    {
        try
        {
            var accountInfo = await _alpacaService.GetAccountInfoAsync();
            return Ok(accountInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching account info");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("positions")]
    public async Task<IActionResult> GetPositions()
    {
        try
        {
            var positions = await _alpacaService.GetPositionsAsync();
            return Ok(positions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching positions");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("alpaca-orders")]
    public async Task<IActionResult> GetAlpacaOrders([FromQuery] int limit = 100)
    {
        try
        {
            var orders = await _alpacaService.GetOrdersAsync(limit);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Alpaca orders");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }
}
