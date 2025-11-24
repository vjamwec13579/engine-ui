import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { MultiSymbolMarketDataResponse } from '../../models/models';
import { Subscription, interval } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-luxon';

Chart.register(...registerables, CandlestickController, CandlestickElement);

interface IndexInfo {
  symbol: string;
  name: string;
  color: string;
}

@Component({
  selector: 'app-market-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './market-charts.component.html',
  styleUrls: ['./market-charts.component.css']
})
export class MarketChartsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('spyChart') spyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('qqqChart') qqqChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('diaChart') diaChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('iwmChart') iwmChartRef!: ElementRef<HTMLCanvasElement>;

  indices: IndexInfo[] = [
    { symbol: 'SPY', name: 'S&P 500', color: '#2196F3' },
    { symbol: 'QQQ', name: 'NASDAQ-100', color: '#4CAF50' },
    { symbol: 'DIA', name: 'Dow Jones', color: '#FF9800' },
    { symbol: 'IWM', name: 'Russell 2000', color: '#9C27B0' }
  ];

  selectedTimeFrame: string = '1d';
  timeFrames = [
    { value: '1d', label: '1 Day' },
    { value: '5d', label: '5 Days' },
    { value: '30d', label: '30 Days' }
  ];

  marketData: MultiSymbolMarketDataResponse | null = null;
  loading = true;
  error: string | null = null;
  currentTime = new Date();

  private charts: { [symbol: string]: Chart } = {};
  private refreshSubscription?: Subscription;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadMarketData();
    // Refresh every 5 minutes
    this.refreshSubscription = interval(300000).subscribe(() => {
      this.loadMarketData();
    });
  }

  ngAfterViewInit(): void {
    // Charts will be created after data is loaded
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    // Destroy all charts
    Object.values(this.charts).forEach(chart => chart.destroy());
  }

  loadMarketData(): void {
    this.loading = true;
    this.error = null;

    this.apiService.getMarketIndices(this.selectedTimeFrame).subscribe({
      next: (data) => {
        this.marketData = data;
        this.loading = false;
        this.error = null;
        this.currentTime = new Date();
        // Update charts after data is loaded
        setTimeout(() => this.updateCharts(), 100);
      },
      error: (err) => {
        this.error = 'Failed to load market data. Make sure the market data API is running on port 5002.';
        this.loading = false;
        console.error('Error loading market data:', err);
      }
    });
  }

  changeTimeFrame(timeFrame: string): void {
    this.selectedTimeFrame = timeFrame;
    this.loadMarketData();
  }

  private updateCharts(): void {
    if (!this.marketData) return;

    const chartRefs: { [key: string]: ElementRef<HTMLCanvasElement> } = {
      'SPY': this.spyChartRef,
      'QQQ': this.qqqChartRef,
      'DIA': this.diaChartRef,
      'IWM': this.iwmChartRef
    };

    this.indices.forEach(index => {
      const chartRef = chartRefs[index.symbol];
      if (chartRef && chartRef.nativeElement) {
        this.createOrUpdateChart(
          index.symbol,
          chartRef.nativeElement,
          index.name,
          index.color
        );
      }
    });
  }

  private createOrUpdateChart(
    symbol: string,
    canvas: HTMLCanvasElement,
    name: string,
    color: string
  ): void {
    const symbolData = this.marketData?.data[symbol];
    if (!symbolData || !symbolData.bars.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.charts[symbol]) {
      this.charts[symbol].destroy();
    }

    const candlestickData = symbolData.bars.map(bar => ({
      x: new Date(bar.timestamp).getTime(),
      o: bar.open,
      h: bar.high,
      l: bar.low,
      c: bar.close
    }));

    const firstPrice = symbolData.bars[0].close;
    const lastPrice = symbolData.bars[symbolData.bars.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    this.charts[symbol] = new Chart(ctx, {
      type: 'candlestick' as any,
      data: {
        datasets: [{
          label: `${name} (${symbol})`,
          data: candlestickData as any,
          color: {
            up: '#4CAF50',
            down: '#F44336',
            unchanged: '#999'
          },
          borderColor: {
            up: '#4CAF50',
            down: '#F44336',
            unchanged: '#999'
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: `${name} - ${lastPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`,
            color: changePercent >= 0 ? '#4CAF50' : '#F44336',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context: any) => {
                const data = context.raw;
                return [
                  `Open: $${data.o?.toFixed(2)}`,
                  `High: $${data.h?.toFixed(2)}`,
                  `Low: $${data.l?.toFixed(2)}`,
                  `Close: $${data.c?.toFixed(2)}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: this.selectedTimeFrame === '1d' ? 'hour' : 'day',
              displayFormats: {
                hour: 'HH:mm',
                day: 'MMM dd'
              }
            },
            display: true,
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            position: 'right',
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: (value: any) => {
                return '$' + value;
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  getIndexInfo(symbol: string): IndexInfo | undefined {
    return this.indices.find(i => i.symbol === symbol);
  }

  getChangeInfo(symbol: string): { change: number, changePercent: number, isPositive: boolean } | null {
    const symbolData = this.marketData?.data[symbol];
    if (!symbolData || !symbolData.bars.length) return null;

    const firstPrice = symbolData.bars[0].close;
    const lastPrice = symbolData.bars[symbolData.bars.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    return {
      change,
      changePercent,
      isPositive: change >= 0
    };
  }

  getCurrentPrice(symbol: string): number | null {
    const symbolData = this.marketData?.data[symbol];
    if (!symbolData || !symbolData.bars.length) return null;
    return symbolData.bars[symbolData.bars.length - 1].close;
  }
}
