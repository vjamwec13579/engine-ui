using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TradingEngine.API.Models;

[Table("audit_order_executions")]
public class AuditOrderExecution
{
    [Key]
    [Column("execution_id")]
    public Guid ExecutionId { get; set; }

    [Column("symbol")]
    public string? Symbol { get; set; }

    [Column("contract")]
    public string? Contract { get; set; }

    [Column("side")]
    public string? Side { get; set; }

    [Column("qty")]
    public int? Qty { get; set; }

    [Column("order_type")]
    public string? OrderType { get; set; }

    [Column("broker_order_id")]
    public string? BrokerOrderId { get; set; }

    [Column("status")]
    public string? Status { get; set; }

    [Column("filled_qty")]
    public int? FilledQty { get; set; }

    [Column("filled_avg_price")]
    public decimal? FilledAvgPrice { get; set; }

    [Column("error_message")]
    public string? ErrorMessage { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
