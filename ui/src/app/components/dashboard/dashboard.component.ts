import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { DashboardMetrics } from '../../models/models';
import { interval, Subscription } from 'rxjs';
import { MarketChartsComponent } from '../market-charts/market-charts.component';
import { OrderHistoryChartComponent } from '../order-history-chart/order-history-chart.component';
import { SymbolPriceTrackerComponent } from '../symbol-price-tracker/symbol-price-tracker.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MarketChartsComponent, OrderHistoryChartComponent, SymbolPriceTrackerComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  metrics: DashboardMetrics | null = null;
  loading = true;
  error: string | null = null;
  private refreshSubscription?: Subscription;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadMetrics();
    // Refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadMetrics();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadMetrics(): void {
    this.apiService.getDashboardMetrics().subscribe({
      next: (data) => {
        this.metrics = data;
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard metrics';
        this.loading = false;
        console.error('Error loading metrics:', err);
      }
    });
  }

  getHealthStatusClass(): string {
    if (!this.metrics) return 'badge-info';
    const status = this.metrics.engineHealth.status.toLowerCase();
    if (status === 'healthy') return 'badge-success';
    if (status === 'warning') return 'badge-warning';
    if (status === 'critical') return 'badge-danger';
    return 'badge-info';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatPercent(value: number): string {
    return value.toFixed(2) + '%';
  }

  formatUptime(uptime: string): string {
    // Parse the TimeSpan format from C# (e.g., "00:05:30.1234567")
    const parts = uptime.split(':');
    if (parts.length >= 3) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = Math.floor(parseFloat(parts[2]));

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    }
    return uptime;
  }

  getPnlClass(value: number): string {
    return value >= 0 ? 'positive' : 'negative';
  }
}
