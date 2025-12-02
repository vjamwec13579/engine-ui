using Microsoft.EntityFrameworkCore;
using TradingEngine.API.Models;

namespace TradingEngine.API.Data;

public class TradingEngineDbContext : DbContext
{
    public TradingEngineDbContext(DbContextOptions<TradingEngineDbContext> options)
        : base(options)
    {
    }

    public DbSet<RealtimeSignalStore> RealtimeSignalStore { get; set; }
    public DbSet<RealtimeOrderflow> RealtimeOrderflow { get; set; }
    public DbSet<RealtimeOrders> RealtimeOrders { get; set; }
    public DbSet<IronCondorPosition> IronCondorPositions { get; set; }
    public DbSet<AuditOrderExecution> AuditOrderExecutions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Composite key for RealtimeSignalStore
        modelBuilder.Entity<RealtimeSignalStore>()
            .HasKey(r => new { r.Timestamp, r.Symbol });

        // Composite key for RealtimeOrderflow
        modelBuilder.Entity<RealtimeOrderflow>()
            .HasKey(r => new { r.Timestamp, r.Symbol });

        // Indexes for better query performance
        modelBuilder.Entity<RealtimeOrders>()
            .HasIndex(o => o.State);

        modelBuilder.Entity<RealtimeOrders>()
            .HasIndex(o => o.Timestamp);

        modelBuilder.Entity<RealtimeOrders>()
            .HasIndex(o => o.Symbol);

        // Iron Condor Position indexes
        modelBuilder.Entity<IronCondorPosition>()
            .HasIndex(p => p.Symbol);

        modelBuilder.Entity<IronCondorPosition>()
            .HasIndex(p => p.Status);

        modelBuilder.Entity<IronCondorPosition>()
            .HasIndex(p => p.EntryDate);

        modelBuilder.Entity<IronCondorPosition>()
            .HasIndex(p => p.ExpiryDate);

        // Audit Order Execution indexes
        modelBuilder.Entity<AuditOrderExecution>()
            .HasIndex(a => a.Symbol);

        modelBuilder.Entity<AuditOrderExecution>()
            .HasIndex(a => a.BrokerOrderId);

        modelBuilder.Entity<AuditOrderExecution>()
            .HasIndex(a => a.CreatedAt);
    }
}
