namespace TradingEngine.API.DTOs;

public class OrderDto
{
    public int Index { get; set; }
    public string? OrderId { get; set; }
    public string? AlpacaOrderId { get; set; }
    public string? OptionType { get; set; }
    public string? Symbol { get; set; }
    public string? Opra { get; set; }
    public DateTime? Expiry { get; set; }
    public decimal? Strike { get; set; }
    public string? Action { get; set; }
    public int? Qty { get; set; }
    public decimal? EntryPrice { get; set; }
    public decimal? CurrentPrice { get; set; }
    public decimal? EquityPriceAtEntry { get; set; }
    public decimal? EquityPriceCurrent { get; set; }
    public decimal? Delta { get; set; }
    public decimal? Gamma { get; set; }
    public decimal? Theta { get; set; }
    public decimal? Vega { get; set; }
    public decimal? Score { get; set; }
    public string? State { get; set; }
    public int? BarsHeld { get; set; }
    public decimal? RealizedProfit { get; set; }
    public decimal? UnrealizedPnl { get; set; }
    public DateTime? Timestamp { get; set; }
}

public class OrderStatistics
{
    public int TotalOrders { get; set; }
    public int ActiveOrders { get; set; }
    public int CompletedOrders { get; set; }
    public int RejectedOrders { get; set; }
    public int OutstandingOrders { get; set; }
    public decimal TotalRealizedPnl { get; set; }
    public decimal TotalUnrealizedPnl { get; set; }
    public decimal WinRate { get; set; }
    public decimal AverageProfitPerTrade { get; set; }
}
