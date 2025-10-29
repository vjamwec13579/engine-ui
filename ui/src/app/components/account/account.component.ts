import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AlpacaAccountInfo, AlpacaPosition } from '../../models/models';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  accountInfo: AlpacaAccountInfo | null = null;
  positions: AlpacaPosition[] = [];
  loading = true;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAccountData();
  }

  loadAccountData(): void {
    this.loading = true;
    this.error = null;

    // Load account info
    this.apiService.getAccountInfo().subscribe({
      next: (data) => {
        this.accountInfo = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load account information';
        this.loading = false;
        console.error('Error loading account info:', err);
      }
    });

    // Load positions
    this.apiService.getPositions().subscribe({
      next: (data) => {
        this.positions = data;
      },
      error: (err) => {
        console.error('Error loading positions:', err);
      }
    });
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

  getStatusClass(status: string | undefined): string {
    if (!status) return 'badge-info';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'active') return 'badge-success';
    if (lowerStatus === 'inactive') return 'badge-warning';
    return 'badge-info';
  }

  getPnlClass(value: number | undefined): string {
    if (value === undefined || value === null) return 'neutral';
    return value >= 0 ? 'positive' : 'negative';
  }

  refresh(): void {
    this.loadAccountData();
  }
}
