namespace TradingEngine.API.DTOs;

public class DashboardMetrics
{
    public EngineHealthStatus EngineHealth { get; set; } = new();
    public decimal GrossPortfolio { get; set; }
    public decimal YtdPnl { get; set; }
    public decimal YtdReturnPercent { get; set; }
    public double TradesPerMinute { get; set; }
    public TimeSpan ClusterUptime { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class EngineHealthStatus
{
    public string Status { get; set; } = "Unknown"; // Healthy, Warning, Critical, Unknown
    public DateTime? LastSignalTimestamp { get; set; }
    public DateTime? LastOrderTimestamp { get; set; }
    public int ActiveOrderCount { get; set; }
    public int SignalCountLast5Minutes { get; set; }
    public List<string> HealthIssues { get; set; } = new();
}
