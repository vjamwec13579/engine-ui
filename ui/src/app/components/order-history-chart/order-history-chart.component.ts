import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { OrderDto } from '../../models/models';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface OrderDataPoint {
  time: Date;
  price: number;
  pnl: number;
  count: number;
}

@Component({
  selector: 'app-order-history-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-history-chart.component.html',
  styleUrls: ['./order-history-chart.component.css']
})
export class OrderHistoryChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('orderChart') orderChartRef!: ElementRef<HTMLCanvasElement>;

  allOrders: OrderDto[] = [];
  filteredOrders: OrderDto[] = [];
  symbols: string[] = [];
  selectedSymbol: string = 'All';
  selectedTimeRange: string = '7d';

  timeRanges = [
    { value: '1d', label: '1 Day' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'all', label: 'All Time' }
  ];

  chartData: OrderDataPoint[] = [];
  loading = true;
  error: string | null = null;

  private chart?: Chart;
  private refreshSubscription?: Subscription;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngAfterViewInit(): void {
    // Chart will be created after data is loaded
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    this.apiService.getAllOrders(1, 1000).subscribe({
      next: (orders) => {
        this.allOrders = orders.filter(o => o.timestamp && o.symbol);
        this.extractSymbols();
        this.filterAndProcessOrders();
        this.loading = false;
        setTimeout(() => this.updateChart(), 100);
      },
      error: (err) => {
        this.error = 'Failed to load order history';
        this.loading = false;
        console.error('Error loading orders:', err);
      }
    });
  }

  extractSymbols(): void {
    const symbolSet = new Set<string>();
    this.allOrders.forEach(order => {
      if (order.symbol) {
        symbolSet.add(order.symbol);
      }
    });
    this.symbols = Array.from(symbolSet).sort();

    // Set default symbol if not set
    if (this.selectedSymbol === 'All' && this.symbols.length > 0) {
      // Keep 'All' as default
    }
  }

  changeSymbol(symbol: string): void {
    this.selectedSymbol = symbol;
    this.filterAndProcessOrders();
    this.updateChart();
  }

  changeTimeRange(range: string): void {
    this.selectedTimeRange = range;
    this.filterAndProcessOrders();
    this.updateChart();
  }

  filterAndProcessOrders(): void {
    // Filter by symbol
    let orders = this.selectedSymbol === 'All'
      ? this.allOrders
      : this.allOrders.filter(o => o.symbol === this.selectedSymbol);

    // Filter by time range
    const now = new Date();
    let cutoffDate: Date | null = null;

    if (this.selectedTimeRange === '1d') {
      cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (this.selectedTimeRange === '7d') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (this.selectedTimeRange === '30d') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (cutoffDate) {
      orders = orders.filter(o => o.timestamp && new Date(o.timestamp) >= cutoffDate!);
    }

    this.filteredOrders = orders.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return aTime - bTime;
    });

    // Group orders by hour
    this.chartData = this.groupOrdersByHour(this.filteredOrders);
  }

  groupOrdersByHour(orders: OrderDto[]): OrderDataPoint[] {
    const grouped = new Map<string, OrderDataPoint>();

    orders.forEach(order => {
      if (!order.timestamp) return;

      const date = new Date(order.timestamp);
      // Round to nearest hour
      date.setMinutes(0, 0, 0);
      const key = date.toISOString();

      if (!grouped.has(key)) {
        grouped.set(key, {
          time: new Date(date),
          price: 0,
          pnl: 0,
          count: 0
        });
      }

      const dataPoint = grouped.get(key)!;
      dataPoint.count++;

      if (order.entryPrice) {
        dataPoint.price += order.entryPrice;
      }

      const pnl = (order.realizedProfit || 0) + (order.unrealizedPnl || 0);
      dataPoint.pnl += pnl;
    });

    // Calculate average prices
    const result = Array.from(grouped.values()).map(dp => ({
      ...dp,
      price: dp.count > 0 ? dp.price / dp.count : 0
    }));

    return result.sort((a, b) => a.time.getTime() - b.time.getTime());
  }

  updateChart(): void {
    if (!this.orderChartRef?.nativeElement || this.chartData.length === 0) {
      return;
    }

    const ctx = this.orderChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.chartData.map(dp => {
      const date = dp.time;
      if (this.selectedTimeRange === '1d') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit'
        });
      }
    });

    const orderCounts = this.chartData.map(dp => dp.count);
    const pnlData = this.chartData.map(dp => dp.pnl);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Order Count',
            data: orderCounts,
            backgroundColor: 'rgba(33, 150, 243, 0.6)',
            borderColor: 'rgba(33, 150, 243, 1)',
            borderWidth: 1,
            yAxisID: 'y',
          },
          {
            label: 'P&L',
            data: pnlData,
            type: 'line',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderColor: 'rgba(76, 175, 80, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: `Order History - ${this.selectedSymbol}`,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                if (context.dataset.label === 'P&L') {
                  return value !== null ? `P&L: $${value.toFixed(2)}` : 'P&L: N/A';
                }
                return value !== null ? `Orders: ${value}` : 'Orders: N/A';
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Order Count'
            },
            ticks: {
              stepSize: 1
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'P&L ($)'
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              callback: (value) => {
                return '$' + value;
              }
            }
          }
        }
      }
    });
  }

  getTotalOrders(): number {
    return this.filteredOrders.length;
  }

  getTotalPnL(): number {
    return this.filteredOrders.reduce((sum, order) => {
      return sum + (order.realizedProfit || 0) + (order.unrealizedPnl || 0);
    }, 0);
  }

  getAverageEntryPrice(): number {
    const ordersWithPrice = this.filteredOrders.filter(o => o.entryPrice);
    if (ordersWithPrice.length === 0) return 0;

    const sum = ordersWithPrice.reduce((s, o) => s + (o.entryPrice || 0), 0);
    return sum / ordersWithPrice.length;
  }
}
