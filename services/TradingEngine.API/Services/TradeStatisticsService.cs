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
    Task<List<OrderDto>> GetOrdersByStatesAsync(params string[] states);
    Task<List<OrderDto>> GetAllOrdersAsync(int pageNumber = 1, int pageSize = 100);
}

public class TradeStatisticsService : ITradeStatisticsService
{
    private readonly TradingEngineDbContext _context;
    private readonly ILogger<TradeStatisticsService> _logger;
    private readonly IAlpacaService _alpacaService;
    private readonly DateTime _startupTime;

    public TradeStatisticsService(
        TradingEngineDbContext context,
        ILogger<TradeStatisticsService> logger,
        IAlpacaService alpacaService)
    {
        _context = context;
        _logger = logger;
        _alpacaService = alpacaService;
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

            var allOrdersForHealth = await _context.RealtimeOrders.ToListAsync();

            // Group by OrderId and prioritize non-pending states
            var uniqueOrdersForHealth = allOrdersForHealth
                .Where(o => o.OrderId != Guid.Empty)
                .GroupBy(o => o.OrderId)
                .Select(g => {
                    // Prioritize any non-pending state over pending
                    var nonPending = g.FirstOrDefault(o => !string.Equals(o.State, "pending", StringComparison.OrdinalIgnoreCase));
                    return nonPending ?? g.First();
                })
                .ToList();

            var activeOrderCount = uniqueOrdersForHealth
                .Count(o => string.Equals(o.State, "active", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(o.State, "open", StringComparison.OrdinalIgnoreCase));

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
            var activeOrders = uniqueOrdersForHealth
                .Where(o => string.Equals(o.State, "active", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(o.State, "open", StringComparison.OrdinalIgnoreCase))
                .ToList();

            var grossPortfolio = activeOrders
                .Sum(o => (o.CurrentPrice ?? o.EntryPrice ?? 0) * (o.Qty ?? 0));

            var ytdUniqueOrders = uniqueOrdersForHealth
                .Where(o => o.Timestamp >= yearStart)
                .ToList();

            var ytdRealizedPnl = ytdUniqueOrders
                .Where(o => o.RealizedProfit.HasValue)
                .Sum(o => o.RealizedProfit ?? 0);

            var ytdUnrealizedPnl = activeOrders
                .Where(o => o.Timestamp >= yearStart)
                .Sum(o => ((o.CurrentPrice ?? 0) - (o.EntryPrice ?? 0)) * (o.Qty ?? 0));

            var ytdTotalPnl = ytdRealizedPnl + ytdUnrealizedPnl;

            // Estimate starting capital (simplified - you may want to track this properly)
            var ytdInvestedCapital = ytdUniqueOrders
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

            // Group by OrderId and prioritize non-pending states
            var uniqueOrders = allOrders
                .Where(o => o.OrderId != Guid.Empty)
                .GroupBy(o => o.OrderId)
                .Select(g => {
                    // Prioritize any non-pending state over pending
                    var nonPending = g.FirstOrDefault(o => !string.Equals(o.State, "pending", StringComparison.OrdinalIgnoreCase));
                    return nonPending ?? g.First();
                })
                .ToList();

            var totalOrders = uniqueOrders.Count;
            var activeOrders = uniqueOrders.Count(o => string.Equals(o.State, "active", StringComparison.OrdinalIgnoreCase) ||
                                                        string.Equals(o.State, "open", StringComparison.OrdinalIgnoreCase));
            var completedOrders = uniqueOrders.Count(o => string.Equals(o.State, "filled", StringComparison.OrdinalIgnoreCase) ||
                                                           string.Equals(o.State, "closed", StringComparison.OrdinalIgnoreCase) ||
                                                           string.Equals(o.State, "pending-closed", StringComparison.OrdinalIgnoreCase));
            var rejectedOrders = uniqueOrders.Count(o => string.Equals(o.State, "rejected", StringComparison.OrdinalIgnoreCase) ||
                                                          string.Equals(o.State, "canceled", StringComparison.OrdinalIgnoreCase));
            var outstandingOrders = uniqueOrders.Count(o => string.Equals(o.State, "pending", StringComparison.OrdinalIgnoreCase) ||
                                                             string.Equals(o.State, "new", StringComparison.OrdinalIgnoreCase));

            var totalRealizedPnl = uniqueOrders
                .Where(o => o.RealizedProfit.HasValue)
                .Sum(o => o.RealizedProfit ?? 0);

            var activeOrdersList = uniqueOrders.Where(o => string.Equals(o.State, "active", StringComparison.OrdinalIgnoreCase) ||
                                                            string.Equals(o.State, "open", StringComparison.OrdinalIgnoreCase));
            var totalUnrealizedPnl = activeOrdersList
                .Sum(o => ((o.CurrentPrice ?? 0) - (o.EntryPrice ?? 0)) * (o.Qty ?? 0));

            var closedWithProfit = uniqueOrders
                .Where(o => (string.Equals(o.State, "filled", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(o.State, "closed", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(o.State, "pending-closed", StringComparison.OrdinalIgnoreCase)) &&
                            o.RealizedProfit.HasValue)
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
            var allOrders = await _context.RealtimeOrders.ToListAsync();

            // Group by OrderId and prioritize non-pending states, then filter by requested state
            var orders = allOrders
                .Where(o => o.OrderId != Guid.Empty)
                .GroupBy(o => o.OrderId)
                .Select(g => {
                    // Prioritize any non-pending state over pending
                    var nonPending = g.FirstOrDefault(o => !string.Equals(o.State, "pending", StringComparison.OrdinalIgnoreCase));
                    return nonPending ?? g.First();
                })
                .Where(o => string.Equals(o.State, state, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(o => o.Timestamp)
                .ToList();

            return await MapToOrderDtosAsync(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching orders by state: {State}", state);
            throw;
        }
    }

    public async Task<List<OrderDto>> GetOrdersByStatesAsync(params string[] states)
    {
        try
        {
            var allOrders = await _context.RealtimeOrders.ToListAsync();

            // Group by OrderId and prioritize non-pending states, then filter by requested states
            var orders = allOrders
                .Where(o => o.OrderId != Guid.Empty)
                .GroupBy(o => o.OrderId)
                .Select(g => {
                    // Prioritize any non-pending state over pending
                    var nonPending = g.FirstOrDefault(o => !string.Equals(o.State, "pending", StringComparison.OrdinalIgnoreCase));
                    return nonPending ?? g.First();
                })
                .Where(o => states.Any(state => string.Equals(o.State, state, StringComparison.OrdinalIgnoreCase)))
                .OrderByDescending(o => o.Timestamp)
                .ToList();

            return await MapToOrderDtosAsync(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching orders by states: {States}", string.Join(", ", states));
            throw;
        }
    }

    public async Task<List<OrderDto>> GetAllOrdersAsync(int pageNumber = 1, int pageSize = 100)
    {
        try
        {
            var allOrders = await _context.RealtimeOrders.ToListAsync();

            var skip = (pageNumber - 1) * pageSize;

            // Group by OrderId and prioritize non-pending states
            var orders = allOrders
                .Where(o => o.OrderId != Guid.Empty)
                .GroupBy(o => o.OrderId)
                .Select(g => {
                    // Prioritize any non-pending state over pending
                    var nonPending = g.FirstOrDefault(o => !string.Equals(o.State, "pending", StringComparison.OrdinalIgnoreCase));
                    return nonPending ?? g.First();
                })
                .OrderByDescending(o => o.Timestamp)
                .Skip(skip)
                .Take(pageSize)
                .ToList();

            return await MapToOrderDtosAsync(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all orders");
            throw;
        }
    }

    private async Task<List<OrderDto>> MapToOrderDtosAsync(List<RealtimeOrders> orders)
    {
        List<AlpacaOrderInfo> alpacaOrders;
        try
        {
            alpacaOrders = await _alpacaService.GetOrdersAsync(500);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch Alpaca orders, falling back to DB data");
            alpacaOrders = new List<AlpacaOrderInfo>();
        }

        var alpacaOrderDict = alpacaOrders.ToDictionary(a => a.OrderId, a => a);

        return orders.Select(o =>
        {
            // Try to find matching Alpaca order
            AlpacaOrderInfo? alpacaOrder = null;
            if (!string.IsNullOrEmpty(o.AlpacaOrderId) && alpacaOrderDict.ContainsKey(o.AlpacaOrderId))
            {
                alpacaOrder = alpacaOrderDict[o.AlpacaOrderId];
            }

            // Use Alpaca status if available
            var state = alpacaOrder?.Status ?? o.State;

            // Calculate P&L from Alpaca data if available
            double? pnl = null;
            if (alpacaOrder != null && alpacaOrder.FilledAveragePrice.HasValue && o.EntryPrice.HasValue)
            {
                pnl = (double)((alpacaOrder.FilledAveragePrice.Value - (decimal)o.EntryPrice.Value) * alpacaOrder.FilledQuantity);
            }
            else if (o.RealizedProfit.HasValue)
            {
                pnl = o.RealizedProfit;
            }
            else
            {
                pnl = ((o.CurrentPrice ?? 0) - (o.EntryPrice ?? 0)) * (o.Qty ?? 0);
            }

            return new OrderDto
            {
                OrderId = o.OrderId.ToString(),
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
                Score = o.Score,
                State = state,
                BarsHeld = o.BarsHeld,
                RealizedProfit = o.RealizedProfit,
                UnrealizedPnl = pnl,
                Timestamp = o.Timestamp
            };
        }).ToList();
    }
}
