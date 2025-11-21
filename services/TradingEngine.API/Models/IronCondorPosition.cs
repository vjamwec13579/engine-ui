using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TradingEngine.API.Models;

[Table("iron_condor_positions")]
public class IronCondorPosition
{
    [Key]
    [Column("position_id")]
    public Guid PositionId { get; set; }

    [Column("symbol")]
    public string Symbol { get; set; } = string.Empty;

    [Column("entry_date")]
    public DateTime EntryDate { get; set; }

    [Column("expiry_date")]
    public DateTime ExpiryDate { get; set; }

    [Column("dte")]
    public int Dte { get; set; }

    // Strikes (4 legs)
    [Column("long_put_strike")]
    public decimal LongPutStrike { get; set; }

    [Column("short_put_strike")]
    public decimal ShortPutStrike { get; set; }

    [Column("short_call_strike")]
    public decimal ShortCallStrike { get; set; }

    [Column("long_call_strike")]
    public decimal LongCallStrike { get; set; }

    // OPRA codes (option contract symbols)
    [Column("long_put_opra")]
    public string LongPutOpra { get; set; } = string.Empty;

    [Column("short_put_opra")]
    public string ShortPutOpra { get; set; } = string.Empty;

    [Column("short_call_opra")]
    public string ShortCallOpra { get; set; } = string.Empty;

    [Column("long_call_opra")]
    public string LongCallOpra { get; set; } = string.Empty;

    // Alpaca order IDs for each leg
    [Column("long_put_alpaca_id")]
    public string? LongPutAlpacaId { get; set; }

    [Column("short_put_alpaca_id")]
    public string? ShortPutAlpacaId { get; set; }

    [Column("short_call_alpaca_id")]
    public string? ShortCallAlpacaId { get; set; }

    [Column("long_call_alpaca_id")]
    public string? LongCallAlpacaId { get; set; }

    // Entry prices (what we paid/collected)
    [Column("long_put_entry_price")]
    public decimal LongPutEntryPrice { get; set; }

    [Column("short_put_entry_price")]
    public decimal ShortPutEntryPrice { get; set; }

    [Column("short_call_entry_price")]
    public decimal ShortCallEntryPrice { get; set; }

    [Column("long_call_entry_price")]
    public decimal LongCallEntryPrice { get; set; }

    // Current prices (for tracking)
    [Column("long_put_current_price")]
    public decimal? LongPutCurrentPrice { get; set; }

    [Column("short_put_current_price")]
    public decimal? ShortPutCurrentPrice { get; set; }

    [Column("short_call_current_price")]
    public decimal? ShortCallCurrentPrice { get; set; }

    [Column("long_call_current_price")]
    public decimal? LongCallCurrentPrice { get; set; }

    [Column("last_price_update")]
    public DateTime? LastPriceUpdate { get; set; }

    // P&L tracking
    [Column("total_credit")]
    public decimal TotalCredit { get; set; }

    [Column("current_value")]
    public decimal? CurrentValue { get; set; }

    [Column("unrealized_pnl")]
    public decimal? UnrealizedPnl { get; set; }

    [Column("realized_pnl")]
    public decimal? RealizedPnl { get; set; }

    // Greeks at entry
    [Column("entry_iv")]
    public decimal? EntryIv { get; set; }

    [Column("entry_stock_price")]
    public decimal? EntryStockPrice { get; set; }

    // Width and risk
    [Column("put_width")]
    public decimal PutWidth { get; set; }

    [Column("call_width")]
    public decimal CallWidth { get; set; }

    [Column("max_risk")]
    public decimal MaxRisk { get; set; }

    // SMB Playbook targets
    [Column("profit_target_min")]
    public decimal? ProfitTargetMin { get; set; }

    [Column("profit_target_max")]
    public decimal? ProfitTargetMax { get; set; }

    [Column("stop_loss_price")]
    public decimal? StopLossPrice { get; set; }

    // Status
    [Column("status")]
    public string Status { get; set; } = "open";

    [Column("legs_filled")]
    public int LegsFilled { get; set; }

    // Exit details
    [Column("exit_date")]
    public DateTime? ExitDate { get; set; }

    [Column("exit_reason")]
    public string? ExitReason { get; set; }

    [Column("days_held")]
    public int? DaysHeld { get; set; }

    // Metadata
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
