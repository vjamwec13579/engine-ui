import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardMetrics,
  OrderDto,
  OrderStatistics,
  AlpacaAccountInfo,
  AlpacaPosition,
  AlpacaOrderInfo,
  SchedulerStatusResponse,
  MultiSymbolMarketDataResponse
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }

  // Dashboard endpoints
  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.baseUrl}/dashboard/metrics`);
  }

  // Orders endpoints
  getAllOrders(page: number = 1, pageSize: number = 100): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.baseUrl}/orders?page=${page}&pageSize=${pageSize}`);
  }

  getActiveOrders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.baseUrl}/orders/active`);
  }

  getCompletedOrders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.baseUrl}/orders/completed`);
  }

  getRejectedOrders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.baseUrl}/orders/rejected`);
  }

  getOutstandingOrders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.baseUrl}/orders/outstanding`);
  }

  getOrderStatistics(): Observable<OrderStatistics> {
    return this.http.get<OrderStatistics>(`${this.baseUrl}/orders/statistics`);
  }

  // Account endpoints
  getAccountInfo(): Observable<AlpacaAccountInfo> {
    return this.http.get<AlpacaAccountInfo>(`${this.baseUrl}/account/info`);
  }

  getPositions(): Observable<AlpacaPosition[]> {
    return this.http.get<AlpacaPosition[]>(`${this.baseUrl}/account/positions`);
  }

  getAlpacaOrders(limit: number = 100): Observable<AlpacaOrderInfo[]> {
    return this.http.get<AlpacaOrderInfo[]>(`${this.baseUrl}/account/alpaca-orders?limit=${limit}`);
  }

  // Scheduler monitoring endpoints
  getSchedulerStatus(): Observable<SchedulerStatusResponse> {
    // The scheduler dashboard runs on port 5001 to avoid conflicts with the main API
    return this.http.get<SchedulerStatusResponse>('http://localhost:5001/api/status');
  }

  getSchedulerHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>('http://localhost:5001/api/health');
  }

  // Market data endpoints
  getMarketIndices(timeFrame: string = '1d'): Observable<MultiSymbolMarketDataResponse> {
    return this.http.get<MultiSymbolMarketDataResponse>(`http://localhost:5002/api/market/indices?timeFrame=${timeFrame}`);
  }

  getMarketSymbols(symbols: string[], timeFrame: string = '1d'): Observable<MultiSymbolMarketDataResponse> {
    const symbolsParam = symbols.join(',');
    return this.http.get<MultiSymbolMarketDataResponse>(`http://localhost:5002/api/market/symbols?symbols=${symbolsParam}&timeFrame=${timeFrame}`);
  }

  getAvailableSymbols(): Observable<{ symbols: string[] }> {
    return this.http.get<{ symbols: string[] }>('http://localhost:5002/api/symbols');
  }
}
