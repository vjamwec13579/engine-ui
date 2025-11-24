import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MarketDataResponse, SignalIndicatorsResponse } from '../../models/models';
import { Subscription, interval, forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-luxon';

Chart.register(...registerables, CandlestickController, CandlestickElement, zoomPlugin);

@Component({
  selector: 'app-symbol-price-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './symbol-price-tracker.component.html',
  styleUrls: ['./symbol-price-tracker.component.css']
})
export class SymbolPriceTrackerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('priceChart') priceChartRef!: ElementRef<HTMLCanvasElement>;

  // Symbols loaded from daily_bars table
  availableSymbols: string[] = [];

  selectedSymbol: string = '';
  selectedTimeFrame: string = '1d';

  timeFrames = [
    { value: '1d', label: '1 Day' },
    { value: '5d', label: '5 Days' },
    { value: '30d', label: '30 Days' }
  ];

  symbolData: MarketDataResponse | null = null;
  signalIndicators: SignalIndicatorsResponse | null = null;
  loading = true;
  error: string | null = null;
  currentTime = new Date();

  showAdvancedOptions = false;
  advancedOptions = {
    showKfRegime: false,
    showKfVelocity: false,
    showVolumeSpike: false,
    showAdx: false
  };

  private chart?: Chart;
  private refreshSubscription?: Subscription;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAvailableSymbols();
    // Refresh every 2 minutes for near real-time updates
    this.refreshSubscription = interval(120000).subscribe(() => {
      this.loadSymbolData();
    });
  }

  loadAvailableSymbols(): void {
    this.apiService.getAvailableSymbols().subscribe({
      next: (data) => {
        this.availableSymbols = data.symbols;
        if (this.availableSymbols.length > 0 && !this.selectedSymbol) {
          // Select first symbol by default
          this.selectedSymbol = this.availableSymbols[0];
          this.loadSymbolData();
        }
      },
      error: (err) => {
        console.error('Error loading available symbols:', err);
        // Fallback to default symbols if API fails
        this.availableSymbols = ['SPY', 'QQQ', 'DIA', 'IWM'].sort();
        this.selectedSymbol = 'SPY';
        this.loadSymbolData();
      }
    });
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

  loadSymbolData(): void {
    this.loading = true;
    this.error = null;

    const hasAdvancedOptions = this.advancedOptions.showKfRegime ||
                                this.advancedOptions.showKfVelocity ||
                                this.advancedOptions.showVolumeSpike ||
                                this.advancedOptions.showAdx;

    if (hasAdvancedOptions) {
      // Load both market data and signal indicators
      forkJoin({
        marketData: this.apiService.getMarketSymbols([this.selectedSymbol], this.selectedTimeFrame),
        signalData: this.apiService.getSignalIndicators(this.selectedSymbol, this.selectedTimeFrame)
      }).subscribe({
        next: (result) => {
          this.symbolData = result.marketData.data[this.selectedSymbol] || null;
          this.signalIndicators = result.signalData;
          this.loading = false;
          this.error = null;
          this.currentTime = new Date();
          setTimeout(() => this.updateChart(), 100);
        },
        error: (err) => {
          this.error = 'Failed to load data. Make sure both APIs are running.';
          this.loading = false;
          console.error('Error loading data:', err);
        }
      });
    } else {
      // Load only market data
      this.apiService.getMarketSymbols([this.selectedSymbol], this.selectedTimeFrame).subscribe({
        next: (data) => {
          this.symbolData = data.data[this.selectedSymbol] || null;
          this.signalIndicators = null;
          this.loading = false;
          this.error = null;
          this.currentTime = new Date();
          setTimeout(() => this.updateChart(), 100);
        },
        error: (err) => {
          this.error = 'Failed to load symbol data. Make sure the market data API is running on port 5002.';
          this.loading = false;
          console.error('Error loading symbol data:', err);
        }
      });
    }
  }

  changeSymbol(symbol: string): void {
    this.selectedSymbol = symbol;
    this.loadSymbolData();
  }

  changeTimeFrame(timeFrame: string): void {
    this.selectedTimeFrame = timeFrame;
    this.loadSymbolData();
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  onAdvancedOptionChange(): void {
    this.loadSymbolData();
  }

  private updateChart(): void {
    if (!this.priceChartRef?.nativeElement || !this.symbolData || !this.symbolData.bars.length) {
      return;
    }

    const ctx = this.priceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const candlestickData = this.symbolData.bars.map(bar => ({
      x: new Date(bar.timestamp).getTime(),
      o: bar.open,
      h: bar.high,
      l: bar.low,
      c: bar.close
    }));

    const volumes = this.symbolData.bars.map(bar => ({
      x: new Date(bar.timestamp).getTime(),
      y: bar.volume
    }));

    const firstPrice = this.symbolData.bars[0].close;
    const lastPrice = this.symbolData.bars[this.symbolData.bars.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    const isPositive = change >= 0;

    // Build datasets array dynamically
    const datasets: any[] = [
      {
        label: 'Price',
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
        },
        yAxisID: 'y'
      },
      {
        label: 'Volume',
        data: volumes,
        type: 'bar',
        backgroundColor: 'rgba(33, 150, 243, 0.3)',
        borderColor: 'rgba(33, 150, 243, 0.5)',
        borderWidth: 1,
        yAxisID: 'y1'
      }
    ];

    // Build scales object dynamically
    const scales: any = {
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
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Price ($)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: (value: any) => {
            return '$' + value;
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Volume'
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          callback: (value: any) => {
            if (typeof value === 'number') {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
              }
              return value.toString();
            }
            return value;
          }
        }
      }
    };

    // Add advanced indicators if enabled and data is available
    if (this.signalIndicators && this.signalIndicators.indicators.length > 0) {
      const indicators = this.signalIndicators.indicators;

      // KF Regime (categorical: 0=Bull, 1=Bear, 2=Chop)
      if (this.advancedOptions.showKfRegime) {
        const regimeData = indicators
          .filter(i => i.kfRegime !== null && i.kfRegime !== undefined)
          .map(i => ({
            x: new Date(i.timestamp).getTime(),
            y: i.kfRegime
          }));

        if (regimeData.length > 0) {
          datasets.push({
            label: 'KF Regime',
            data: regimeData,
            type: 'line',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            borderColor: 'rgba(156, 39, 176, 1)',
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            yAxisID: 'y2',
            stepped: true
          });

          scales.y2 = {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Regime'
            },
            min: -0.5,
            max: 2.5,
            ticks: {
              stepSize: 1,
              callback: (value: any) => {
                if (value === 0) return 'Bull';
                if (value === 1) return 'Bear';
                if (value === 2) return 'Chop';
                return '';
              }
            },
            grid: {
              drawOnChartArea: false
            }
          };
        }
      }

      // KF Velocity
      if (this.advancedOptions.showKfVelocity) {
        const velocityData = indicators
          .filter(i => i.kfVelocity !== null && i.kfVelocity !== undefined)
          .map(i => ({
            x: new Date(i.timestamp).getTime(),
            y: i.kfVelocity
          }));

        if (velocityData.length > 0) {
          datasets.push({
            label: 'KF Velocity',
            data: velocityData,
            type: 'line',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderColor: 'rgba(255, 152, 0, 1)',
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
            yAxisID: this.advancedOptions.showKfRegime ? 'y3' : 'y2'
          });

          const axisId = this.advancedOptions.showKfRegime ? 'y3' : 'y2';
          scales[axisId] = {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Velocity'
            },
            grid: {
              drawOnChartArea: false
            }
          };
        }
      }

      // ADX (Trend Strength)
      if (this.advancedOptions.showAdx) {
        const adxData = indicators
          .filter(i => i.adx !== null && i.adx !== undefined)
          .map(i => ({
            x: new Date(i.timestamp).getTime(),
            y: i.adx
          }));

        if (adxData.length > 0) {
          let axisId = 'y2';
          if (this.advancedOptions.showKfRegime && this.advancedOptions.showKfVelocity) {
            axisId = 'y4';
          } else if (this.advancedOptions.showKfRegime || this.advancedOptions.showKfVelocity) {
            axisId = 'y3';
          }

          datasets.push({
            label: 'ADX',
            data: adxData,
            type: 'line',
            backgroundColor: 'rgba(0, 188, 212, 0.1)',
            borderColor: 'rgba(0, 188, 212, 1)',
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
            yAxisID: axisId
          });

          scales[axisId] = {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'ADX'
            },
            min: 0,
            max: 100,
            grid: {
              drawOnChartArea: false
            }
          };
        }
      }

      // Volume Spike (calculated as % above average volume)
      if (this.advancedOptions.showVolumeSpike) {
        const volumeData = indicators
          .filter(i => i.volume !== null && i.volume !== undefined)
          .map(i => i.volume as number);

        if (volumeData.length > 0) {
          const avgVolume = volumeData.reduce((sum, v) => sum + v, 0) / volumeData.length;

          const volumeSpikeData = indicators
            .filter(i => i.volume !== null && i.volume !== undefined)
            .map(i => ({
              x: new Date(i.timestamp).getTime(),
              y: ((i.volume! - avgVolume) / avgVolume) * 100
            }));

          let axisId = 'y2';
          const activeAxes = [
            this.advancedOptions.showKfRegime,
            this.advancedOptions.showKfVelocity,
            this.advancedOptions.showAdx
          ].filter(Boolean).length;

          if (activeAxes === 3) axisId = 'y5';
          else if (activeAxes === 2) axisId = 'y4';
          else if (activeAxes === 1) axisId = 'y3';

          datasets.push({
            label: 'Volume Spike %',
            data: volumeSpikeData,
            type: 'line',
            backgroundColor: 'rgba(233, 30, 99, 0.1)',
            borderColor: 'rgba(233, 30, 99, 1)',
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
            yAxisID: axisId
          });

          scales[axisId] = {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Vol Spike %'
            },
            grid: {
              drawOnChartArea: false
            }
          };
        }
      }
    }

    this.chart = new Chart(ctx, {
      type: 'candlestick' as any,
      data: {
        datasets: datasets
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
            text: `${this.selectedSymbol} - $${lastPrice.toFixed(2)} (${isPositive ? '+' : ''}${changePercent.toFixed(2)}%)`,
            color: isPositive ? '#4CAF50' : '#F44336',
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context: any) => {
                if (context.dataset.label === 'Price') {
                  const data = context.raw;
                  return [
                    `Open: $${data.o?.toFixed(2)}`,
                    `High: $${data.h?.toFixed(2)}`,
                    `Low: $${data.l?.toFixed(2)}`,
                    `Close: $${data.c?.toFixed(2)}`
                  ];
                } else {
                  const value = context.parsed.y;
                  return value !== null ? `Volume: ${value.toLocaleString()}` : 'Volume: N/A';
                }
              }
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x'
            },
            zoom: {
              wheel: {
                enabled: true
              },
              pinch: {
                enabled: true
              },
              mode: 'x'
            },
            limits: {
              x: {
                minRange: 60 * 1000 * 5 // Minimum 5 minutes visible
              }
            }
          }
        },
        scales: scales,
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  getCurrentPrice(): number | null {
    if (!this.symbolData || !this.symbolData.bars.length) return null;
    return this.symbolData.bars[this.symbolData.bars.length - 1].close;
  }

  getPriceChange(): { change: number, changePercent: number, isPositive: boolean } | null {
    if (!this.symbolData || !this.symbolData.bars.length) return null;

    const firstPrice = this.symbolData.bars[0].close;
    const lastPrice = this.symbolData.bars[this.symbolData.bars.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    return {
      change,
      changePercent,
      isPositive: change >= 0
    };
  }

  getHigh(): number | null {
    if (!this.symbolData || !this.symbolData.bars.length) return null;
    return Math.max(...this.symbolData.bars.map(b => b.high));
  }

  getLow(): number | null {
    if (!this.symbolData || !this.symbolData.bars.length) return null;
    return Math.min(...this.symbolData.bars.map(b => b.low));
  }

  getVolume(): number | null {
    if (!this.symbolData || !this.symbolData.bars.length) return null;
    return this.symbolData.bars.reduce((sum, bar) => sum + bar.volume, 0);
  }
}
