using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TradingEngine.API.Models;

[Table("realtime_orderflow")]
public class RealtimeOrderflow
{
    [Key]
    [Column("timestamp")]
    public DateTime Timestamp { get; set; }

    [Key]
    [Column("symbol")]
    public string Symbol { get; set; } = string.Empty;

    [Column("open")]
    public double? Open { get; set; }

    [Column("high")]
    public double? High { get; set; }

    [Column("low")]
    public double? Low { get; set; }

    [Column("close")]
    public double? Close { get; set; }

    [Column("volume")]
    public long? Volume { get; set; }

    [Column("vwap")]
    public double? Vwap { get; set; }

    [Column("trade_count")]
    public long? TradeCount { get; set; }

    [Column("kf_regime")]
    public double? KfRegime { get; set; }

    [Column("kf_velocity")]
    public double? KfVelocity { get; set; }

    [Column("delta_15s_2")]
    public double? Delta15s2 { get; set; }

    [Column("delta_1m")]
    public double? Delta1m { get; set; }

    [Column("delta_5m")]
    public double? Delta5m { get; set; }

    [Column("cvd_1m")]
    public double? Cvd1m { get; set; }
}
