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
            // Get current time in Eastern Time for market calculations
            var easternZone = TimeZoneInfo.FindSystemTimeZoneById("America/New_York");
            var nowEastern = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, easternZone);

            switch (timeFrame.ToLower())
            {
                case "1d":
                    // Get today's trading day starting at market open (9:30 AM ET)
                    var todayMarketOpen = nowEastern.Date.AddHours(9).AddMinutes(30);

                    // If before market open, use previous trading day
                    if (nowEastern.Hour < 9 || (nowEastern.Hour == 9 && nowEastern.Minute < 30))
                    {
                        todayMarketOpen = todayMarketOpen.AddDays(-1);
                    }

                    // Skip weekends - go back to Friday
                    while (todayMarketOpen.DayOfWeek == DayOfWeek.Saturday || todayMarketOpen.DayOfWeek == DayOfWeek.Sunday)
                    {
                        todayMarketOpen = todayMarketOpen.AddDays(-1);
                    }

                    // Convert back to UTC for database query
                    startDate = TimeZoneInfo.ConvertTimeToUtc(todayMarketOpen, easternZone);
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

            var indicators = await _context.RealtimeOrderflow
                .Where(s => s.Symbol == symbol.ToUpper() && s.Timestamp >= startDate)
                .OrderBy(s => s.Timestamp)
                .Select(s => new SignalIndicatorDto
                {
                    Timestamp = s.Timestamp,
                    KfRegime = s.KfRegime,
                    KfVelocity = s.KfVelocity,
                    Delta15s2 = s.Delta15s2,
                    Delta1m = s.Delta1m,
                    Delta5m = s.Delta5m,
                    Cvd1m = s.Cvd1m,
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
