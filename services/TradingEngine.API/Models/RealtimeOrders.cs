using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TradingEngine.API.Models;

[Table("realtime_orders")]
public class RealtimeOrders
{
    [Key]
    [Column("index")]
    public int Index { get; set; }

    [Column("order_id")]
    public string? OrderId { get; set; }

    [Column("alpaca_order_id")]
    public string? AlpacaOrderId { get; set; }

    [Column("option_type")]
    public string? OptionType { get; set; }

    [Column("symbol")]
    public string? Symbol { get; set; }

    [Column("opra")]
    public string? Opra { get; set; }

    [Column("expiry")]
    public DateTime? Expiry { get; set; }

    [Column("strike")]
    public decimal? Strike { get; set; }

    [Column("action")]
    public string? Action { get; set; }

    [Column("qty")]
    public int? Qty { get; set; }

    [Column("entry_price")]
    public decimal? EntryPrice { get; set; }

    [Column("current_price")]
    public decimal? CurrentPrice { get; set; }

    [Column("equity_price_at_entry")]
    public decimal? EquityPriceAtEntry { get; set; }

    [Column("equity_price_current")]
    public decimal? EquityPriceCurrent { get; set; }

    [Column("orats_iv")]
    public decimal? OratsIv { get; set; }

    [Column("calculated_iv")]
    public decimal? CalculatedIv { get; set; }

    [Column("delta")]
    public decimal? Delta { get; set; }

    [Column("gamma")]
    public decimal? Gamma { get; set; }

    [Column("theta")]
    public decimal? Theta { get; set; }

    [Column("vega")]
    public decimal? Vega { get; set; }

    [Column("score")]
    public decimal? Score { get; set; }

    [Column("state")]
    public string? State { get; set; }

    [Column("bars_held")]
    public int? BarsHeld { get; set; }

    [Column("realized_profit")]
    public decimal? RealizedProfit { get; set; }

    [Column("timestamp")]
    public DateTime? Timestamp { get; set; }
}
