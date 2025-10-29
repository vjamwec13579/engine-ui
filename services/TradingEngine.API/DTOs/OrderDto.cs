namespace TradingEngine.API.DTOs;

public class OrderDto
{
    public long? Index { get; set; }
    public string? OrderId { get; set; }
    public string? AlpacaOrderId { get; set; }
    public string? OptionType { get; set; }
    public string? Symbol { get; set; }
    public string? Opra { get; set; }
    public DateTime? Expiry { get; set; }
    public double? Strike { get; set; }
    public string? Action { get; set; }
    public long? Qty { get; set; }
    public double? EntryPrice { get; set; }
    public double? CurrentPrice { get; set; }
    public double? EquityPriceAtEntry { get; set; }
    public double? EquityPriceCurrent { get; set; }
    public double? Delta { get; set; }
    public double? Gamma { get; set; }
    public double? Theta { get; set; }
    public double? Vega { get; set; }
    public double? Score { get; set; }
    public string? State { get; set; }
    public long? BarsHeld { get; set; }
    public double? RealizedProfit { get; set; }
    public double? UnrealizedPnl { get; set; }
    public DateTime? Timestamp { get; set; }
}

public class OrderStatistics
{
    public int TotalOrders { get; set; }
    public int ActiveOrders { get; set; }
    public int CompletedOrders { get; set; }
    public int RejectedOrders { get; set; }
    public int OutstandingOrders { get; set; }
    public double TotalRealizedPnl { get; set; }
    public double TotalUnrealizedPnl { get; set; }
    public double WinRate { get; set; }
    public double AverageProfitPerTrade { get; set; }
}
