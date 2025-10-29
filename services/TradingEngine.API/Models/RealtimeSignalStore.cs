using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TradingEngine.API.Models;

[Table("realtime_signal_store")]
public class RealtimeSignalStore
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
    public double? Volume { get; set; }

    [Column("trade_count")]
    public double? TradeCount { get; set; }

    [Column("vwap")]
    public double? Vwap { get; set; }

    [Column("tradedate_idx")]
    public string? TradeDateIdx { get; set; }

    [Column("rsi")]
    public double? Rsi { get; set; }

    [Column("mfi")]
    public double? Mfi { get; set; }

    [Column("adx")]
    public double? Adx { get; set; }

    [Column("plus_di")]
    public double? PlusDi { get; set; }

    [Column("minus_di")]
    public double? MinusDi { get; set; }

    [Column("kama_slope")]
    public double? KamaSlope { get; set; }

    [Column("vol_eff")]
    public double? VolEff { get; set; }

    [Column("direction_sign")]
    public double? DirectionSign { get; set; }

    [Column("signed_vol_eff")]
    public double? SignedVolEff { get; set; }

    [Column("reg_slope")]
    public double? RegSlope { get; set; }

    [Column("vwap_slope")]
    public double? VwapSlope { get; set; }

    [Column("trade_date_idx")]
    public string? TradeDateIdxDup { get; set; }

    [Column("kf_regime")]
    public double? KfRegime { get; set; }

    [Column("kf_signal")]
    public string? KfSignal { get; set; }

    [Column("kf_velocity_pct")]
    public double? KfVelocityPct { get; set; }

    [Column("kf_p_up")]
    public double? KfPUp { get; set; }

    [Column("kf_p_down")]
    public double? KfPDown { get; set; }

    [Column("kf_p_chop")]
    public double? KfPChop { get; set; }

    [Column("kf_velocity")]
    public double? KfVelocity { get; set; }
}
