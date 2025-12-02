namespace TradingEngine.API.DTOs;

public class SignalIndicatorDto
{
    public DateTime Timestamp { get; set; }
    public double? KfRegime { get; set; }
    public double? KfVelocity { get; set; }
    public double? Delta15s2 { get; set; }
    public double? Delta1m { get; set; }
    public double? Delta5m { get; set; }
    public double? Cvd1m { get; set; }
    public double? Volume { get; set; }
}

public class SignalIndicatorsResponse
{
    public string Symbol { get; set; } = string.Empty;
    public List<SignalIndicatorDto> Indicators { get; set; } = new();
}
