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
    public decimal? Open { get; set; }

    [Column("high")]
    public decimal? High { get; set; }

    [Column("low")]
    public decimal? Low { get; set; }

    [Column("close")]
    public decimal? Close { get; set; }

    [Column("volume")]
    public long? Volume { get; set; }

    [Column("trade_count")]
    public int? TradeCount { get; set; }

    [Column("vwap")]
    public decimal? Vwap { get; set; }

    [Column("tradedate_idx")]
    public int? TradeDateIdx { get; set; }

    [Column("rsi")]
    public decimal? Rsi { get; set; }

    [Column("mfi")]
    public decimal? Mfi { get; set; }

    [Column("adx")]
    public decimal? Adx { get; set; }

    [Column("plus_di")]
    public decimal? PlusDi { get; set; }

    [Column("minus_di")]
    public decimal? MinusDi { get; set; }

    [Column("kama_slope")]
    public decimal? KamaSlope { get; set; }

    [Column("vol_eff")]
    public decimal? VolEff { get; set; }

    [Column("direction_sign")]
    public int? DirectionSign { get; set; }

    [Column("signed_vol_eff")]
    public decimal? SignedVolEff { get; set; }

    [Column("reg_slope")]
    public decimal? RegSlope { get; set; }

    [Column("vwap_slope")]
    public decimal? VwapSlope { get; set; }

    [Column("trade_date_idx")]
    public int? TradeDateIdxDup { get; set; }

    [Column("kf_regime")]
    public string? KfRegime { get; set; }

    [Column("kf_signal")]
    public string? KfSignal { get; set; }

    [Column("kf_velocity_pct")]
    public decimal? KfVelocityPct { get; set; }

    [Column("kf_p_up")]
    public decimal? KfPUp { get; set; }

    [Column("kf_p_down")]
    public decimal? KfPDown { get; set; }

    [Column("kf_p_chop")]
    public decimal? KfPChop { get; set; }

    [Column("kf_velocity")]
    public decimal? KfVelocity { get; set; }
}
