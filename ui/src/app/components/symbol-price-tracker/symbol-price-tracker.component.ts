import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
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
    showDelta15s2: false,
    showDelta1m: false,
    showDelta5m: false,
    showCvd1m: false
  };

  // Context menu for right-click data display
  contextMenu = {
    show: false,
    x: 0,
    y: 0,
    data: null as {
      timestamp: string;
      price?: { open: number; high: number; low: number; close: number };
      volume?: number;
      kfRegime?: number | null;
      kfVelocity?: number | null;
      delta15s2?: number | null;
      delta1m?: number | null;
      delta5m?: number | null;
      cvd1m?: number | null;
    } | null
  };

  private chart?: Chart;
  private refreshSubscription?: Subscription;
  private lastChartConfig: string = '';  // Track config to detect structural changes

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadAvailableSymbols();
    // Refresh every 10 seconds for near real-time updates
    this.refreshSubscription = interval(10000).subscribe(() => {
      this.loadSymbolData(true);  // Silent refresh - no loading spinner
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

  loadSymbolData(silentRefresh: boolean = false): void {
    if (!silentRefresh) {
      this.loading = true;
      // Reset chart config since canvas will be removed from DOM
      this.lastChartConfig = '';
      if (this.chart) {
        this.chart.destroy();
        this.chart = undefined;
      }
    }
    this.error = null;

    const hasAdvancedOptions = this.advancedOptions.showKfRegime ||
                                this.advancedOptions.showKfVelocity ||
                                this.advancedOptions.showDelta15s2 ||
                                this.advancedOptions.showDelta1m ||
                                this.advancedOptions.showDelta5m ||
                                this.advancedOptions.showCvd1m;

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

    // Build a config key to detect structural changes
    const currentConfig = JSON.stringify({
      symbol: this.selectedSymbol,
      timeFrame: this.selectedTimeFrame,
      advancedOptions: this.advancedOptions
    });

    // If chart exists and config unchanged, update data in place
    if (this.chart && this.lastChartConfig === currentConfig) {
      this.refreshChartData(candlestickData, volumes, lastPrice, changePercent, isPositive);
      return;
    }

    // Config changed or no chart exists - recreate
    this.lastChartConfig = currentConfig;
    if (this.chart) {
      this.chart.destroy();
    }

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

      // Delta 15s (2nd bucket)
      if (this.advancedOptions.showDelta15s2) {
        const deltaData = indicators
          .filter(i => i.delta15s2 !== null && i.delta15s2 !== undefined)
          .map(i => ({
            x: new Date(i.timestamp).getTime(),
            y: i.delta15s2
          }));

        if (deltaData.length > 0) {
          let axisId = 'y2';
          if (this.advancedOptions.showKfRegime && this.advancedOptions.showKfVelocity) {
            axisId = 'y4';
          } else if (this.advancedOptions.showKfRegime || this.advancedOptions.showKfVelocity) {
            axisId = 'y3';
          }

          datasets.push({
            label: 'Delta 15s',
            data: deltaData,
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
              text: 'Delta 15s'
            },
            grid: {
              drawOnChartArea: false
            }
          };
        }
      }

      // Delta 1m
      if (this.advancedOptions.showDelta1m) {
        const deltaData = indicators
          .filter(i => i.delta1m !== null && i.delta1m !== undefined)
          .map(i => ({
            x: new Date(i.timestamp).getTime(),
            y: i.delta1m
          }));

        if (deltaData.length > 0) {
          let axisId = 'y2';
          const activeAxes = [
            this.advancedOptions.showKfRegime,
            this.advancedOptions.showKfVelocity,
            this.advancedOptions.showDelta15s2
          ].filter(Boolean).length;

          if (activeAxes === 3) axisId = 'y5';
          else if (activeAxes === 2) axisId = 'y4';
          else if (activeAxes === 1) axisId = 'y3';

          datasets.push({
            label: 'Delta 1m',
            data: deltaData,
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
              text: 'Delta 1m'
            },
            grid: {
              drawOnChartArea: false
            }
          };
        }
      }

      // Delta 5m
      if (this.advancedOptions.showDelta5m) {
        const deltaData = indicators
          .filter(i => i.delta5m !== null && i.delta5m !== undefined)
          .map(i => ({
            x: new Date(i.timestamp).getTime(),
            y: i.delta5m
          }));

        if (deltaData.length > 0) {
          let axisId = 'y2';
          const activeAxes = [
            this.advancedOptions.showKfRegime,
            this.advancedOptions.showKfVelocity,
            this.advancedOptions.showDelta15s2,
            this.advancedOptions.showDelta1m
          ].filter(Boolean).length;

          if (activeAxes >= 4) axisId = 'y6';
          else if (activeAxes === 3) axisId = 'y5';
          else if (activeAxes === 2) axisId = 'y4';
          else if (activeAxes === 1) axisId = 'y3';

          datasets.push({
            label: 'Delta 5m',
            data: deltaData,
            type: 'line',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderColor: 'rgba(76, 175, 80, 1)',
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
              text: 'Delta 5m'
            },
            grid: {
              drawOnChartArea: false
            }
          };
        }
      }

      // CVD 1m
      if (this.advancedOptions.showCvd1m) {
        const cvdData = indicators
          .filter(i => i.cvd1m !== null && i.cvd1m !== undefined)
          .map(i => ({
            x: new Date(i.timestamp).getTime(),
            y: i.cvd1m
          }));

        if (cvdData.length > 0) {
          let axisId = 'y2';
          const activeAxes = [
            this.advancedOptions.showKfRegime,
            this.advancedOptions.showKfVelocity,
            this.advancedOptions.showDelta15s2,
            this.advancedOptions.showDelta1m,
            this.advancedOptions.showDelta5m
          ].filter(Boolean).length;

          if (activeAxes >= 5) axisId = 'y7';
          else if (activeAxes === 4) axisId = 'y6';
          else if (activeAxes === 3) axisId = 'y5';
          else if (activeAxes === 2) axisId = 'y4';
          else if (activeAxes === 1) axisId = 'y3';

          datasets.push({
            label: 'CVD 1m',
            data: cvdData,
            type: 'line',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderColor: 'rgba(255, 193, 7, 1)',
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
              text: 'CVD 1m'
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

  private refreshChartData(
    candlestickData: any[],
    volumes: any[],
    lastPrice: number,
    changePercent: number,
    isPositive: boolean
  ): void {
    if (!this.chart) return;

    // Update candlestick data (dataset 0)
    this.chart.data.datasets[0].data = candlestickData;

    // Update volume data (dataset 1)
    this.chart.data.datasets[1].data = volumes;

    // Update advanced indicator datasets if present
    if (this.signalIndicators && this.signalIndicators.indicators.length > 0) {
      const indicators = this.signalIndicators.indicators;
      let datasetIndex = 2;

      if (this.advancedOptions.showKfRegime && this.chart.data.datasets[datasetIndex]) {
        this.chart.data.datasets[datasetIndex].data = indicators
          .filter(i => i.kfRegime !== null && i.kfRegime !== undefined)
          .map(i => ({ x: new Date(i.timestamp).getTime(), y: i.kfRegime! })) as any;
        datasetIndex++;
      }

      if (this.advancedOptions.showKfVelocity && this.chart.data.datasets[datasetIndex]) {
        this.chart.data.datasets[datasetIndex].data = indicators
          .filter(i => i.kfVelocity !== null && i.kfVelocity !== undefined)
          .map(i => ({ x: new Date(i.timestamp).getTime(), y: i.kfVelocity! })) as any;
        datasetIndex++;
      }

      if (this.advancedOptions.showDelta15s2 && this.chart.data.datasets[datasetIndex]) {
        this.chart.data.datasets[datasetIndex].data = indicators
          .filter(i => i.delta15s2 !== null && i.delta15s2 !== undefined)
          .map(i => ({ x: new Date(i.timestamp).getTime(), y: i.delta15s2! })) as any;
        datasetIndex++;
      }

      if (this.advancedOptions.showDelta1m && this.chart.data.datasets[datasetIndex]) {
        this.chart.data.datasets[datasetIndex].data = indicators
          .filter(i => i.delta1m !== null && i.delta1m !== undefined)
          .map(i => ({ x: new Date(i.timestamp).getTime(), y: i.delta1m! })) as any;
        datasetIndex++;
      }

      if (this.advancedOptions.showDelta5m && this.chart.data.datasets[datasetIndex]) {
        this.chart.data.datasets[datasetIndex].data = indicators
          .filter(i => i.delta5m !== null && i.delta5m !== undefined)
          .map(i => ({ x: new Date(i.timestamp).getTime(), y: i.delta5m! })) as any;
        datasetIndex++;
      }

      if (this.advancedOptions.showCvd1m && this.chart.data.datasets[datasetIndex]) {
        this.chart.data.datasets[datasetIndex].data = indicators
          .filter(i => i.cvd1m !== null && i.cvd1m !== undefined)
          .map(i => ({ x: new Date(i.timestamp).getTime(), y: i.cvd1m! })) as any;
      }
    }

    // Update title with new price
    if (this.chart.options.plugins?.title) {
      this.chart.options.plugins.title.text = `${this.selectedSymbol} - $${lastPrice.toFixed(2)} (${isPositive ? '+' : ''}${changePercent.toFixed(2)}%)`;
      this.chart.options.plugins.title.color = isPositive ? '#4CAF50' : '#F44336';
    }

    // Smooth update without animation reset
    this.chart.update('none');
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

  // Close context menu when clicking elsewhere
  @HostListener('document:click')
  onDocumentClick(): void {
    this.contextMenu.show = false;
  }

  onChartRightClick(event: MouseEvent): void {
    event.preventDefault();

    if (!this.chart || !this.symbolData) return;

    // Get the chart area and calculate the clicked position
    const rect = this.priceChartRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Get the nearest data point using Chart.js's getElementsAtEventForMode
    const elements = this.chart.getElementsAtEventForMode(
      event as unknown as Event,
      'nearest',
      { intersect: false, axis: 'x' },
      false
    );

    if (elements.length > 0) {
      const element = elements[0];
      const dataIndex = element.index;

      // Get the bar data at this index
      const bar = this.symbolData.bars[dataIndex];
      if (bar) {
        // Build context menu data
        const menuData: typeof this.contextMenu.data = {
          timestamp: new Date(bar.timestamp).toLocaleString(),
          price: {
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close
          },
          volume: bar.volume
        };

        // Add indicator data if available
        if (this.signalIndicators?.indicators) {
          const indicator = this.signalIndicators.indicators[dataIndex];
          if (indicator) {
            menuData.kfRegime = indicator.kfRegime;
            menuData.kfVelocity = indicator.kfVelocity;
            menuData.delta15s2 = indicator.delta15s2;
            menuData.delta1m = indicator.delta1m;
            menuData.delta5m = indicator.delta5m;
            menuData.cvd1m = indicator.cvd1m;
          }
        }

        this.contextMenu = {
          show: true,
          x: event.clientX,
          y: event.clientY,
          data: menuData
        };
      }
    }
  }

  getRegimeLabel(regime: number | null | undefined): string {
    if (regime === null || regime === undefined) return 'N/A';
    switch (regime) {
      case 0: return 'Bull';
      case 1: return 'Bear';
      case 2: return 'Chop';
      default: return `Unknown (${regime})`;
    }
  }
}
