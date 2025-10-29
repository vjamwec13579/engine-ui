using Microsoft.EntityFrameworkCore;
using TradingEngine.API.Data;
using TradingEngine.API.DTOs;
using TradingEngine.API.Models;

namespace TradingEngine.API.Services;

public interface ITradeStatisticsService
{
    Task<DashboardMetrics> GetDashboardMetricsAsync();
    Task<OrderStatistics> GetOrderStatisticsAsync();
    Task<List<OrderDto>> GetOrdersByStateAsync(string state);
    Task<List<OrderDto>> GetAllOrdersAsync(int pageNumber = 1, int pageSize = 100);
}

public class TradeStatisticsService : ITradeStatisticsService
{
    private readonly TradingEngineDbContext _context;
    private readonly ILogger<TradeStatisticsService> _logger;
    private readonly DateTime _startupTime;

    public TradeStatisticsService(
        TradingEngineDbContext context,
        ILogger<TradeStatisticsService> logger)
    {
        _context = context;
        _logger = logger;
        _startupTime = DateTime.UtcNow;
    }

    public async Task<DashboardMetrics> GetDashboardMetricsAsync()
    {
        try
        {
            var now = DateTime.UtcNow;
            var fiveMinutesAgo = now.AddMinutes(-5);
            var yearStart = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            // Engine Health
            var lastSignal = await _context.RealtimeSignalStore
                .OrderByDescending(s => s.Timestamp)
                .FirstOrDefaultAsync();

            var lastOrder = await _context.RealtimeOrders
                .OrderByDescending(o => o.Timestamp)
                .FirstOrDefaultAsync();

            var activeOrderCount = await _context.RealtimeOrders
                .CountAsync(o => o.State == "active" || o.State == "open");

            var signalCountLast5Min = await _context.RealtimeSignalStore
                .CountAsync(s => s.Timestamp >= fiveMinutesAgo);

            var healthIssues = new List<string>();
            var healthStatus = "Healthy";

            if (lastSignal == null || (now - lastSignal.Timestamp).TotalMinutes > 10)
            {
                healthIssues.Add("No recent signals received");
                healthStatus = "Warning";
            }

            if (lastOrder == null || (now - (lastOrder.Timestamp ?? now)).TotalMinutes > 30)
            {
                healthIssues.Add("No recent order activity");
                if (healthStatus != "Critical") healthStatus = "Warning";
            }

            var engineHealth = new EngineHealthStatus
            {
                Status = healthStatus,
                LastSignalTimestamp = lastSignal?.Timestamp,
                LastOrderTimestamp = lastOrder?.Timestamp,
                ActiveOrderCount = activeOrderCount,
                SignalCountLast5Minutes = signalCountLast5Min,
                HealthIssues = healthIssues
            };

            // Trades per minute (last 5 minutes)
            var tradesPerMinute = signalCountLast5Min / 5.0;

            // Portfolio and P&L calculations
            var activeOrders = await _context.RealtimeOrders
                .Where(o => o.State == "active" || o.State == "open")
                .ToListAsync();

            var grossPortfolio = activeOrders
                .Sum(o => (o.CurrentPrice ?? o.EntryPrice ?? 0) * (o.Qty ?? 0));

            var ytdOrders = await _context.RealtimeOrders
                .Where(o => o.Timestamp >= yearStart)
                .ToListAsync();

            var ytdRealizedPnl = ytdOrders
                .Where(o => o.RealizedProfit.HasValue)
                .Sum(o => o.RealizedProfit ?? 0);

            var ytdUnrealizedPnl = activeOrders
                .Sum(o => ((o.CurrentPrice ?? 0) - (o.EntryPrice ?? 0)) * (o.Qty ?? 0));

            var ytdTotalPnl = ytdRealizedPnl + ytdUnrealizedPnl;

            // Estimate starting capital (simplified - you may want to track this properly)
            var ytdInvestedCapital = ytdOrders
                .Sum(o => (o.EntryPrice ?? 0) * (o.Qty ?? 0));

            var ytdReturnPercent = ytdInvestedCapital > 0
                ? (ytdTotalPnl / ytdInvestedCapital) * 100
                : 0;

            var clusterUptime = now - _startupTime;

            return new DashboardMetrics
            {
                EngineHealth = engineHealth,
                GrossPortfolio = grossPortfolio,
                YtdPnl = ytdTotalPnl,
                YtdReturnPercent = ytdReturnPercent,
                TradesPerMinute = tradesPerMinute,
                ClusterUptime = clusterUptime,
                LastUpdated = now
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating dashboard metrics");
            throw;
        }
    }

    public async Task<OrderStatistics> GetOrderStatisticsAsync()
    {
        try
        {
            var allOrders = await _context.RealtimeOrders.ToListAsync();

            var totalOrders = allOrders.Count;
            var activeOrders = allOrders.Count(o => o.State == "active" || o.State == "open");
            var completedOrders = allOrders.Count(o => o.State == "filled" || o.State == "closed");
            var rejectedOrders = allOrders.Count(o => o.State == "rejected" || o.State == "canceled");
            var outstandingOrders = allOrders.Count(o => o.State == "pending" || o.State == "new");

            var totalRealizedPnl = allOrders
                .Where(o => o.RealizedProfit.HasValue)
                .Sum(o => o.RealizedProfit ?? 0);

            var activeOrdersList = allOrders.Where(o => o.State == "active" || o.State == "open");
            var totalUnrealizedPnl = activeOrdersList
                .Sum(o => ((o.CurrentPrice ?? 0) - (o.EntryPrice ?? 0)) * (o.Qty ?? 0));

            var closedWithProfit = allOrders
                .Where(o => (o.State == "filled" || o.State == "closed") && o.RealizedProfit.HasValue)
                .ToList();

            var winningTrades = closedWithProfit.Count(o => o.RealizedProfit > 0);
            var winRate = closedWithProfit.Count > 0
                ? (double)winningTrades / closedWithProfit.Count * 100
                : 0;

            var avgProfitPerTrade = completedOrders > 0
                ? totalRealizedPnl / completedOrders
                : 0;

            return new OrderStatistics
            {
                TotalOrders = totalOrders,
                ActiveOrders = activeOrders,
                CompletedOrders = completedOrders,
                RejectedOrders = rejectedOrders,
                OutstandingOrders = outstandingOrders,
                TotalRealizedPnl = totalRealizedPnl,
                TotalUnrealizedPnl = totalUnrealizedPnl,
                WinRate = winRate,
                AverageProfitPerTrade = avgProfitPerTrade
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating order statistics");
            throw;
        }
    }

    public async Task<List<OrderDto>> GetOrdersByStateAsync(string state)
    {
        try
        {
            var orders = await _context.RealtimeOrders
                .Where(o => o.State == state.ToLower())
                .OrderByDescending(o => o.Timestamp)
                .ToListAsync();

            return MapToOrderDtos(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching orders by state: {State}", state);
            throw;
        }
    }

    public async Task<List<OrderDto>> GetAllOrdersAsync(int pageNumber = 1, int pageSize = 100)
    {
        try
        {
            var skip = (pageNumber - 1) * pageSize;

            var orders = await _context.RealtimeOrders
                .OrderByDescending(o => o.Timestamp)
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();

            return MapToOrderDtos(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all orders");
            throw;
        }
    }

    private List<OrderDto> MapToOrderDtos(List<RealtimeOrders> orders)
    {
        return orders.Select(o => new OrderDto
        {
            Index = o.Index,
            OrderId = o.OrderId,
            AlpacaOrderId = o.AlpacaOrderId,
            OptionType = o.OptionType,
            Symbol = o.Symbol,
            Opra = o.Opra,
            Expiry = o.Expiry,
            Strike = o.Strike,
            Action = o.Action,
            Qty = o.Qty,
            EntryPrice = o.EntryPrice,
            CurrentPrice = o.CurrentPrice,
            EquityPriceAtEntry = o.EquityPriceAtEntry,
            EquityPriceCurrent = o.EquityPriceCurrent,
            Delta = o.Delta,
            Gamma = o.Gamma,
            Theta = o.Theta,
            Vega = o.Vega,
            Score = o.Score,
            State = o.State,
            BarsHeld = o.BarsHeld,
            RealizedProfit = o.RealizedProfit,
            UnrealizedPnl = ((o.CurrentPrice ?? 0) - (o.EntryPrice ?? 0)) * (o.Qty ?? 0),
            Timestamp = o.Timestamp
        }).ToList();
    }
}
