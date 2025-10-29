import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { OrderDto, OrderStatistics } from '../../models/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  activeTab: 'active' | 'completed' | 'rejected' | 'outstanding' | 'all' = 'active';
  orders: OrderDto[] = [];
  statistics: OrderStatistics | null = null;
  loading = true;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadStatistics();
    this.loadOrders();
  }

  loadStatistics(): void {
    this.apiService.getOrderStatistics().subscribe({
      next: (data) => {
        this.statistics = data;
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
      }
    });
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    let observable;
    switch (this.activeTab) {
      case 'active':
        observable = this.apiService.getActiveOrders();
        break;
      case 'completed':
        observable = this.apiService.getCompletedOrders();
        break;
      case 'rejected':
        observable = this.apiService.getRejectedOrders();
        break;
      case 'outstanding':
        observable = this.apiService.getOutstandingOrders();
        break;
      case 'all':
      default:
        observable = this.apiService.getAllOrders();
        break;
    }

    observable.subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load orders';
        this.loading = false;
        console.error('Error loading orders:', err);
      }
    });
  }

  setActiveTab(tab: 'active' | 'completed' | 'rejected' | 'outstanding' | 'all'): void {
    this.activeTab = tab;
    this.loadOrders();
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatPercent(value: number | undefined): string {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(2) + '%';
  }

  getStateClass(state: string | undefined): string {
    if (!state) return 'badge-info';
    const lowerState = state.toLowerCase();
    if (lowerState === 'active' || lowerState === 'open' || lowerState === 'filled') {
      return 'badge-success';
    }
    if (lowerState === 'pending' || lowerState === 'new') {
      return 'badge-warning';
    }
    if (lowerState === 'rejected' || lowerState === 'canceled') {
      return 'badge-danger';
    }
    return 'badge-info';
  }

  getPnlClass(value: number | undefined): string {
    if (value === undefined || value === null) return 'neutral';
    return value >= 0 ? 'positive' : 'negative';
  }
}
