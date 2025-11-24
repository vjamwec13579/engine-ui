using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TradingEngine.API.Data;
using TradingEngine.API.DTOs;

namespace TradingEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MarketDataController : ControllerBase
{
    private readonly TradingEngineDbContext _context;
    private readonly ILogger<MarketDataController> _logger;

    public MarketDataController(
        TradingEngineDbContext context,
        ILogger<MarketDataController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("signal-indicators/{symbol}")]
    public async Task<IActionResult> GetSignalIndicators(string symbol, [FromQuery] string timeFrame = "1d")
    {
        try
        {
            DateTime startDate;
            switch (timeFrame.ToLower())
            {
                case "1d":
                    startDate = DateTime.UtcNow.AddDays(-1);
                    break;
                case "5d":
                    startDate = DateTime.UtcNow.AddDays(-5);
                    break;
                case "30d":
                    startDate = DateTime.UtcNow.AddDays(-30);
                    break;
                default:
                    startDate = DateTime.UtcNow.AddDays(-1);
                    break;
            }

            var indicators = await _context.RealtimeSignalStore
                .Where(s => s.Symbol == symbol.ToUpper() && s.Timestamp >= startDate)
                .OrderBy(s => s.Timestamp)
                .Select(s => new SignalIndicatorDto
                {
                    Timestamp = s.Timestamp,
                    KfRegime = s.KfRegime,
                    KfVelocity = s.KfVelocity,
                    Adx = s.Adx,
                    Volume = s.Volume
                })
                .ToListAsync();

            var response = new SignalIndicatorsResponse
            {
                Symbol = symbol.ToUpper(),
                Indicators = indicators
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching signal indicators for symbol {Symbol}", symbol);
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }
}
