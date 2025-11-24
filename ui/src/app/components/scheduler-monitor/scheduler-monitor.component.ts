import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { SchedulerStatusResponse } from '../../models/models';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-scheduler-monitor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scheduler-monitor.component.html',
  styleUrls: ['./scheduler-monitor.component.css']
})
export class SchedulerMonitorComponent implements OnInit, OnDestroy {
  schedulerStatus: SchedulerStatusResponse | null = null;
  loading = true;
  error: string | null = null;
  private refreshSubscription?: Subscription;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSchedulerStatus();
    // Refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadSchedulerStatus();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadSchedulerStatus(): void {
    this.apiService.getSchedulerStatus().subscribe({
      next: (data) => {
        this.schedulerStatus = data;
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        this.error = 'Failed to load scheduler status. Make sure the scheduler dashboard is running on port 5001.';
        this.loading = false;
        console.error('Error loading scheduler status:', err);
      }
    });
  }

  getHealthStatusClass(): string {
    if (!this.schedulerStatus) return 'status-unknown';
    return this.schedulerStatus.is_healthy ? 'status-healthy' : 'status-unhealthy';
  }

  getProcessStatusClass(): string {
    if (!this.schedulerStatus) return 'status-unknown';
    return this.schedulerStatus.status.is_alive ? 'status-running' : 'status-stopped';
  }

  formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  }

  getTimeSinceLastExecution(): string {
    if (!this.schedulerStatus?.status.last_execution) {
      return 'Never executed';
    }

    try {
      const lastExec = new Date(this.schedulerStatus.status.last_execution);
      const now = new Date();
      const diffMs = now.getTime() - lastExec.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    } catch {
      return 'Unknown';
    }
  }

  getErrorClass(): string {
    if (!this.schedulerStatus) return '';
    const errorCount = this.schedulerStatus.status.error_count;
    if (errorCount === 0) return 'error-none';
    if (errorCount < 5) return 'error-low';
    if (errorCount < 10) return 'error-medium';
    return 'error-high';
  }
}
