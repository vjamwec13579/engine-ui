namespace TradingEngine.API.DTOs;

public class MarketDataBar
{
    public DateTime Timestamp { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public long Volume { get; set; }
}

public class MarketDataResponse
{
    public string Symbol { get; set; } = string.Empty;
    public string TimeFrame { get; set; } = string.Empty;
    public List<MarketDataBar> Bars { get; set; } = new();
}

public class MultiSymbolMarketDataResponse
{
    public Dictionary<string, MarketDataResponse> Data { get; set; } = new();
}
