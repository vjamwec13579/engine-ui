export interface DashboardMetrics {
  engineHealth: EngineHealthStatus;
  grossPortfolio: number;
  ytdPnl: number;
  ytdReturnPercent: number;
  tradesPerMinute: number;
  clusterUptime: string;
  lastUpdated: Date;
}

export interface EngineHealthStatus {
  status: string;
  lastSignalTimestamp?: Date;
  lastOrderTimestamp?: Date;
  activeOrderCount: number;
  signalCountLast5Minutes: number;
  healthIssues: string[];
}

export interface OrderDto {
  index: number;
  orderId?: string;
  alpacaOrderId?: string;
  optionType?: string;
  symbol?: string;
  opra?: string;
  expiry?: Date;
  strike?: number;
  action?: string;
  qty?: number;
  entryPrice?: number;
  currentPrice?: number;
  equityPriceAtEntry?: number;
  equityPriceCurrent?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  score?: number;
  state?: string;
  barsHeld?: number;
  realizedProfit?: number;
  unrealizedPnl?: number;
  timestamp?: Date;
}

export interface OrderStatistics {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  outstandingOrders: number;
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  winRate: number;
  averageProfitPerTrade: number;
}

export interface AlpacaAccountInfo {
  accountId: string;
  status: string;
  currency: string;
  cash: number;
  portfolioValue: number;
  buyingPower: number;
  daytradeCount?: number;
  patternDayTrader: boolean;
  tradingBlocked: boolean;
  transfersBlocked: boolean;
  accountBlocked: boolean;
  createdAt: Date;
}

export interface AlpacaPosition {
  symbol: string;
  quantity: number;
  availableQuantity: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  currentPrice?: number;
  averageEntryPrice: number;
  side: string;
  assetClass: string;
}

export interface AlpacaOrderInfo {
  orderId: string;
  symbol: string;
  quantity: number;
  filledQuantity: number;
  orderType: string;
  side: string;
  timeInForce: string;
  status: string;
  limitPrice?: number;
  stopPrice?: number;
  filledAveragePrice?: number;
  submittedAt?: Date;
  filledAt?: Date;
  expiredAt?: Date;
  canceledAt?: Date;
}
