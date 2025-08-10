export enum TransactionType {
  Buy = 'BUY',
  Sell = 'SELL',
}

export interface Transaction {
  id: string;
  ticker: string;
  type: TransactionType;
  quantity: number;
  price: number; // Price in TRY
  date: string; // ISO 8601 format
  usdTryRate?: number; // USD/TRY exchange rate at transaction time
  commissionRate?: number; // e.g., 0.002 for 0.2%
}

export interface PriceHistoryItem {
  date: string; // ISO 8601 format
  price: number;
}

export type StockPrices = Record<string, PriceHistoryItem[]>;

export interface StockHolding {
  ticker: string;
  quantity: number;
  
  // TRY values
  averageCost: number;
  totalCost: number;
  currentPrice?: number;
  marketValue?: number;
  unrealizedGainLoss?: number;
  unrealizedGainLossPercent?: number;

  // USD values
  averageCostUsd?: number;
  totalCostUsd?: number;
  marketValueUsd?: number;
  unrealizedGainLossUsd?: number;
}

export interface Portfolio {
  holdings: StockHolding[];

  // TRY totals
  totalMarketValue: number;
  totalCost: number;
  totalUnrealizedGainLoss: number;
  totalUnrealizedGainLossPercent: number;

  // USD totals
  totalMarketValueUsd: number;
  totalCostUsd: number;
  totalUnrealizedGainLossUsd: number;
}

export interface RealizedGainLoss {
    id: string;
    ticker: string;
    quantity: number;
    sellDate: string;

    // TRY values
    sellPrice: number;
    costBasis: number;
    realizedGain: number;
    netSellProceeds: number;

    // USD values
    costBasisUsd?: number;
    netSellProceedsUsd?: number;
    realizedGainUsd?: number;
}

export type Theme = 'light' | 'dark';
export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}