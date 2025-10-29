namespace TradingEngine.API.DTOs;

public class AlpacaAccountInfo
{
    public string AccountId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Currency { get; set; } = string.Empty;
    public decimal Cash { get; set; }
    public decimal PortfolioValue { get; set; }
    public decimal BuyingPower { get; set; }
    public int? DaytradeCount { get; set; }
    public bool PatternDayTrader { get; set; }
    public bool TradingBlocked { get; set; }
    public bool TransfersBlocked { get; set; }
    public bool AccountBlocked { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AlpacaPosition
{
    public string Symbol { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal AvailableQuantity { get; set; }
    public decimal MarketValue { get; set; }
    public decimal CostBasis { get; set; }
    public decimal UnrealizedPnl { get; set; }
    public decimal UnrealizedPnlPercent { get; set; }
    public decimal? CurrentPrice { get; set; }
    public decimal AverageEntryPrice { get; set; }
    public string Side { get; set; } = string.Empty;
    public string AssetClass { get; set; } = string.Empty;
}

public class AlpacaOrderInfo
{
    public string OrderId { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal FilledQuantity { get; set; }
    public string OrderType { get; set; } = string.Empty;
    public string Side { get; set; } = string.Empty;
    public string TimeInForce { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal? LimitPrice { get; set; }
    public decimal? StopPrice { get; set; }
    public decimal? FilledAveragePrice { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? FilledAt { get; set; }
    public DateTime? ExpiredAt { get; set; }
    public DateTime? CanceledAt { get; set; }
}
