namespace TradingEngine.API.DTOs;

public class SignalIndicatorDto
{
    public DateTime Timestamp { get; set; }
    public double? KfRegime { get; set; }
    public double? KfVelocity { get; set; }
    public double? Adx { get; set; }
    public double? Volume { get; set; }
}

public class SignalIndicatorsResponse
{
    public string Symbol { get; set; } = string.Empty;
    public List<SignalIndicatorDto> Indicators { get; set; } = new();
}
