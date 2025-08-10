import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePortfolio } from '../../hooks/usePortfolio';
import type { Transaction, StockPrices } from '../../types';
import { TransactionType } from '../../types';

describe('usePortfolio hook', () => {
  const mockPrices: StockPrices = {
    'STOCKA': [{ date: '2023-01-05', price: 110 }],
    'STOCKB': [{ date: '2023-01-10', price: 220 }],
  };
  const usdTryRate = 32.5;

  it('should return an empty portfolio for no transactions', () => {
    const { result } = renderHook(() => usePortfolio([], {}, usdTryRate));
    expect(result.current.portfolio.holdings).toEqual([]);
    expect(result.current.portfolio.totalMarketValue).toBe(0);
    expect(result.current.realizedGains).toEqual([]);
  });

  it('should calculate holdings correctly for a single buy transaction', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 10, price: 100, date: '2023-01-01', usdTryRate: 30.0 },
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));
    
    const holding = result.current.portfolio.holdings[0];
    expect(holding.ticker).toBe('STOCKA');
    expect(holding.quantity).toBe(10);
    expect(holding.averageCost).toBe(100);
    expect(holding.totalCost).toBe(1000);
    expect(holding.currentPrice).toBe(110);
    expect(holding.marketValue).toBe(1100);
    expect(holding.unrealizedGainLoss).toBe(100);
    expect(holding.unrealizedGainLossPercent).toBeCloseTo(10);
    
    // USD check
    expect(holding.totalCostUsd).toBeCloseTo(1000 / 30.0);
    expect(holding.marketValueUsd).toBeCloseTo(1100 / 32.5);
  });

  it('should calculate average cost correctly for multiple buys', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 10, price: 100, date: '2023-01-01' },
      { id: '2', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 10, price: 120, date: '2023-01-02' },
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));
    
    const holding = result.current.portfolio.holdings[0];
    expect(holding.quantity).toBe(20);
    expect(holding.totalCost).toBe(2200); // (10 * 100) + (10 * 120)
    expect(holding.averageCost).toBe(110);
  });

  it('should handle a sell transaction using FIFO logic and calculate realized gains', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'STOCKB', type: TransactionType.Buy, quantity: 10, price: 200, date: '2023-01-01', usdTryRate: 30 },
      { id: '2', ticker: 'STOCKB', type: TransactionType.Buy, quantity: 5, price: 210, date: '2023-01-02', usdTryRate: 31 },
      { id: '3', ticker: 'STOCKB', type: TransactionType.Sell, quantity: 12, price: 250, date: '2023-01-03', usdTryRate: 32 },
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));

    // Check remaining holding
    const holding = result.current.portfolio.holdings[0];
    expect(holding.ticker).toBe('STOCKB');
    expect(holding.quantity).toBe(3); // 10 + 5 - 12 = 3
    expect(holding.totalCost).toBe(630); // 3 * 210
    expect(holding.averageCost).toBe(210);

    // Check realized gain
    const gain = result.current.realizedGains[0];
    const costOfSoldShares = (10 * 200) + (2 * 210); // 2000 + 420 = 2420
    const proceeds = 12 * 250; // 3000
    
    expect(gain.ticker).toBe('STOCKB');
    expect(gain.realizedGain).toBe(proceeds - costOfSoldShares); // 3000 - 2420 = 580
    
    // Check realized gain in USD
    const costOfSoldSharesUsd = (10 * 200 / 30) + (2 * 210 / 31);
    const proceedsUsd = (12 * 250 / 32);
    expect(gain.costBasisUsd).toBeCloseTo(costOfSoldSharesUsd);
    expect(gain.netSellProceedsUsd).toBeCloseTo(proceedsUsd);
    expect(gain.realizedGainUsd).toBeCloseTo(proceedsUsd - costOfSoldSharesUsd);
  });
  
  it('should not calculate USD gain if any rate is missing', () => {
    const transactions: Transaction[] = [
      // One lot has rate, the other doesn't
      { id: '1', ticker: 'STOCKB', type: TransactionType.Buy, quantity: 10, price: 200, date: '2023-01-01', usdTryRate: 30 },
      { id: '2', ticker: 'STOCKB', type: TransactionType.Buy, quantity: 5, price: 210, date: '2023-01-02' },
      // Sell has a rate, but because one buy lot is missing it, the gain should be undefined
      { id: '3', ticker: 'STOCKB', type: TransactionType.Sell, quantity: 12, price: 250, date: '2023-01-03', usdTryRate: 32 },
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));
    
    const gain = result.current.realizedGains[0];
    expect(gain.realizedGainUsd).toBeUndefined();
    expect(gain.costBasisUsd).toBeUndefined();
    expect(gain.netSellProceedsUsd).toBeUndefined();
  });

  it('should remove a holding when its quantity becomes zero', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 10, price: 100, date: '2023-01-01' },
      { id: '2', ticker: 'STOCKA', type: TransactionType.Sell, quantity: 10, price: 120, date: '2023-01-02' },
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));
    
    expect(result.current.portfolio.holdings.find(h => h.ticker === 'STOCKA')).toBeUndefined();
    expect(result.current.realizedGains.length).toBe(1);
    expect(result.current.realizedGains[0].realizedGain).toBe(200); // (10 * 120) - (10 * 100)
  });
  
  it('should correctly calculate portfolio totals', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 10, price: 100, date: '2023-01-01', usdTryRate: 30 }, // MV: 1100, Cost: 1000
      { id: '2', ticker: 'STOCKB', type: TransactionType.Buy, quantity: 5, price: 200, date: '2023-01-02', usdTryRate: 31 },  // MV: 1100, Cost: 1000
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));

    const portfolio = result.current.portfolio;
    expect(portfolio.totalCost).toBe(2000);
    expect(portfolio.totalMarketValue).toBe(2200); // 1100 + 1100
    expect(portfolio.totalUnrealizedGainLoss).toBe(200);
    expect(portfolio.totalUnrealizedGainLossPercent).toBeCloseTo(10);
    
    // USD Totals
    const totalCostUsd = (1000 / 30) + (1000 / 31);
    const totalMarketValueUsd = (1100 / 32.5) + (1100 / 32.5);
    expect(portfolio.totalCostUsd).toBeCloseTo(totalCostUsd);
    expect(portfolio.totalMarketValueUsd).toBeCloseTo(totalMarketValueUsd);
    expect(portfolio.totalUnrealizedGainLossUsd).toBeCloseTo(totalMarketValueUsd - totalCostUsd);
  });

  it('should process transactions chronologically regardless of array order', () => {
    const transactions: Transaction[] = [
      { id: '2', ticker: 'STOCKA', type: TransactionType.Sell, quantity: 5, price: 150, date: '2023-01-05' },
      { id: '1', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 10, price: 100, date: '2023-01-01' },
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));
    
    // After sorting, the buy happens first, then the sell.
    const holding = result.current.portfolio.holdings[0];
    expect(holding.quantity).toBe(5);
    expect(holding.averageCost).toBe(100);
    
    const gain = result.current.realizedGains[0];
    expect(gain.realizedGain).toBe(250); // (5 * 150) - (5 * 100)
  });

  it('should handle holdings with no available price data', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'NOLATESTPRICE', type: TransactionType.Buy, quantity: 10, price: 100, date: '2023-01-01' },
    ];
    // mockPrices does not contain 'NOLATESTPRICE'
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));
    
    const holding = result.current.portfolio.holdings[0];
    expect(holding.ticker).toBe('NOLATESTPRICE');
    expect(holding.quantity).toBe(10);
    expect(holding.totalCost).toBe(1000);
    // Values that depend on the latest price should be undefined
    expect(holding.currentPrice).toBeUndefined();
    expect(holding.marketValue).toBeUndefined();
    expect(holding.unrealizedGainLoss).toBeUndefined();
    expect(holding.unrealizedGainLossPercent).toBeUndefined();
    expect(holding.marketValueUsd).toBeUndefined();
    expect(holding.unrealizedGainLossUsd).toBeUndefined();
  });

  it('should handle multiple sells correctly against various buy lots', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 10, price: 100, date: '2023-01-01' },
      { id: '2', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 10, price: 120, date: '2023-01-02' },
      { id: '3', ticker: 'STOCKA', type: TransactionType.Sell, quantity: 5, price: 150, date: '2023-01-03' }, // Sells from first lot
      { id: '4', ticker: 'STOCKA', type: TransactionType.Sell, quantity: 10, price: 160, date: '2023-01-04' }, // Sells remaining 5 from first lot and 5 from second
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));
    
    // Remaining holding should be 5 shares from the second lot
    const holding = result.current.portfolio.holdings[0];
    expect(holding.quantity).toBe(5);
    expect(holding.averageCost).toBe(120);
    expect(holding.totalCost).toBe(600);
    
    // Check realized gains
    expect(result.current.realizedGains.length).toBe(2);
    const firstGain = result.current.realizedGains.find(g => g.id === '3');
    const secondGain = result.current.realizedGains.find(g => g.id === '4');
    expect(firstGain?.realizedGain).toBe((5 * 150) - (5 * 100)); // 250
    const secondGainCostBasis = (5 * 100) + (5 * 120); // 500 + 600 = 1100
    expect(secondGain?.realizedGain).toBe((10 * 160) - secondGainCostBasis); // 1600 - 1100 = 500
  });

  it('should return undefined for realized USD gain if the sell transaction is missing a usdTryRate', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'STOCKB', type: TransactionType.Buy, quantity: 10, price: 200, date: '2023-01-01', usdTryRate: 30 },
      { id: '2', ticker: 'STOCKB', type: TransactionType.Sell, quantity: 10, price: 250, date: '2023-01-03' }, // No usdTryRate on sell
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));
    
    const gain = result.current.realizedGains[0];
    expect(gain.realizedGain).toBe(500); // (10 * 250) - (10 * 200)
    expect(gain.realizedGainUsd).toBeUndefined();
    expect(gain.costBasisUsd).toBeUndefined();
    expect(gain.netSellProceedsUsd).toBeUndefined();
  });
  
  it('should handle floating point quantities correctly', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 0.1, price: 100, date: '2023-01-01' },
      { id: '2', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 0.2, price: 100, date: '2023-01-02' },
      { id: '3', ticker: 'STOCKA', type: TransactionType.Sell, quantity: 0.15, price: 120, date: '2023-01-03' },
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));
    
    const holding = result.current.portfolio.holdings[0];
    expect(holding.quantity).toBeCloseTo(0.15);
    expect(holding.averageCost).toBe(100);
    
    const gain = result.current.realizedGains[0];
    expect(gain.realizedGain).toBeCloseTo((0.15 * 120) - (0.15 * 100)); // 18 - 15 = 3
  });

  it('should not generate realized gains for a sell transaction of a stock never owned', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 10, price: 100, date: '2023-01-01' },
      { id: '2', ticker: 'NONEXISTENT', type: TransactionType.Sell, quantity: 5, price: 150, date: '2023-01-05' },
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));
    
    expect(result.current.realizedGains.length).toBe(0);
  });

  it('should not generate a realized gain for a sell transaction with zero quantity', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 10, price: 100, date: '2023-01-01' },
      { id: '2', ticker: 'STOCKA', type: TransactionType.Sell, quantity: 0, price: 150, date: '2023-01-05' },
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));
    expect(result.current.realizedGains.length).toBe(0);
  });

  it('should correctly calculate realized P/L after a buy-sell-buy sequence', () => {
    const transactions: Transaction[] = [
      { id: '1', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 10, price: 100, date: '2023-01-01' },
      { id: '2', ticker: 'STOCKA', type: TransactionType.Sell, quantity: 10, price: 80, date: '2023-01-02' }, // Sell at a loss
      { id: '3', ticker: 'STOCKA', type: TransactionType.Buy, quantity: 5, price: 90, date: '2023-01-03' },
    ];
    const { result } = renderHook(() => usePortfolio(transactions, mockPrices, usdTryRate));
    
    // Check realized loss
    expect(result.current.realizedGains.length).toBe(1);
    const loss = result.current.realizedGains[0];
    expect(loss.realizedGain).toBe((10 * 80) - (10 * 100)); // 800 - 1000 = -200
    
    // Check remaining holding
    const holding = result.current.portfolio.holdings[0];
    expect(holding.ticker).toBe('STOCKA');
    expect(holding.quantity).toBe(5);
    expect(holding.averageCost).toBe(90);
  });
});