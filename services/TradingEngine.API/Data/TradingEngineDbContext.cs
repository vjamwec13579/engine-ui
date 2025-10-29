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
    public DbSet<RealtimeOrders> RealtimeOrders { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Composite key for RealtimeSignalStore
        modelBuilder.Entity<RealtimeSignalStore>()
            .HasKey(r => new { r.Timestamp, r.Symbol });

        // Indexes for better query performance
        modelBuilder.Entity<RealtimeOrders>()
            .HasIndex(o => o.State);

        modelBuilder.Entity<RealtimeOrders>()
            .HasIndex(o => o.Timestamp);

        modelBuilder.Entity<RealtimeOrders>()
            .HasIndex(o => o.Symbol);
    }
}
