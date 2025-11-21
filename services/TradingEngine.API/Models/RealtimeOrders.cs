using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TradingEngine.API.Models;

[Table("realtime_orders")]
public class RealtimeOrders
{
    [Key]
    [Column("order_id")]
    public Guid OrderId { get; set; }

    [Column("alpaca_order_id")]
    public string? AlpacaOrderId { get; set; }

    [Column("stop_loss_order_id")]
    public string? StopLossOrderId { get; set; }

    [Column("stop_loss_price")]
    public double? StopLossPrice { get; set; }

    [Column("option_type")]
    public string? OptionType { get; set; }

    [Column("symbol")]
    public string? Symbol { get; set; }

    [Column("opra")]
    public string? Opra { get; set; }

    [Column("expiry")]
    public DateTime? Expiry { get; set; }

    [Column("strike")]
    public double? Strike { get; set; }

    [Column("action")]
    public string? Action { get; set; }

    [Column("qty")]
    public long? Qty { get; set; }

    [Column("entry_price")]
    public double? EntryPrice { get; set; }

    [Column("current_price")]
    public double? CurrentPrice { get; set; }

    [Column("equity_price_at_entry")]
    public double? EquityPriceAtEntry { get; set; }

    [Column("equity_price_current")]
    public double? EquityPriceCurrent { get; set; }

    [Column("score")]
    public double? Score { get; set; }

    [Column("state")]
    public string? State { get; set; }

    [Column("bars_held")]
    public long? BarsHeld { get; set; }

    [Column("realized_profit")]
    public double? RealizedProfit { get; set; }

    [Column("timestamp")]
    public DateTime? Timestamp { get; set; }
}
