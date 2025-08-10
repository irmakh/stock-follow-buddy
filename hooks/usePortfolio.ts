import { useMemo } from 'react';
import type { Transaction, StockPrices, StockHolding, Portfolio, RealizedGainLoss } from '../types';
import { TransactionType } from '../types';

const getLatestPrice = (ticker: string, prices: StockPrices): number | undefined => {
    const history = prices[ticker];
    if (!history || history.length === 0) {
        return undefined;
    }
    // Assumes history is sorted by date, so the last item is the latest.
    return history[history.length - 1].price;
};

export const usePortfolio = (transactions: Transaction[], prices: StockPrices, currentUsdTryRate: number): { portfolio: Portfolio, realizedGains: RealizedGainLoss[] } => {
  const result = useMemo(() => {
    const realizedGains: RealizedGainLoss[] = [];
    const buyLots = new Map<string, { quantity: number; price: number; date: string; usdTryRate?: number; commissionRate?: number }[]>();

    // Sort transactions by date to process them chronologically for FIFO
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedTransactions.forEach(t => {
      const lots = buyLots.get(t.ticker) || [];
      if (t.type === TransactionType.Buy) {
        lots.push({ quantity: t.quantity, price: t.price, date: t.date, usdTryRate: t.usdTryRate, commissionRate: t.commissionRate });
        buyLots.set(t.ticker, lots);
      } else { // Sell transaction (FIFO logic)
        // Don't process sell transactions with zero quantity
        if (t.quantity <= 1e-9) {
          return;
        }
        
        if (lots.length === 0) {
            console.warn(`Attempted to sell ${t.ticker} but no buy lots were found. Skipping.`);
            return;
        }

        let quantityToSell = t.quantity;
        let totalCostOfSoldShares = 0;
        let totalCostOfSoldSharesUsd = 0;
        let isUsdCostBasisIncomplete = false; // Flag to check if any buy lot is missing a rate

        while (quantityToSell > 0 && lots.length > 0) {
          const firstLot = lots[0];
          const sellableFromLot = Math.min(quantityToSell, firstLot.quantity);
          
          const costOfLotPortion = (sellableFromLot * firstLot.price) * (1 + (firstLot.commissionRate || 0));
          totalCostOfSoldShares += costOfLotPortion;

          if (firstLot.usdTryRate) {
            totalCostOfSoldSharesUsd += costOfLotPortion / firstLot.usdTryRate;
          } else {
            isUsdCostBasisIncomplete = true;
          }
          
          firstLot.quantity -= sellableFromLot;
          quantityToSell -= sellableFromLot;

          if (firstLot.quantity <= 1e-9) { // Use a small epsilon for float comparison
            lots.shift();
          }
        }
        
        const grossProceeds = t.quantity * t.price;
        const netProceeds = grossProceeds * (1 - (t.commissionRate || 0));
        const realizedGain = netProceeds - totalCostOfSoldShares;
        
        const netProceedsUsd = t.usdTryRate ? netProceeds / t.usdTryRate : undefined;
        
        // A valid USD P/L requires the sell rate AND a complete buy rate history for the shares sold.
        const canCalculateUsdGain = netProceedsUsd !== undefined && !isUsdCostBasisIncomplete;

        realizedGains.push({
            id: t.id,
            ticker: t.ticker,
            quantity: t.quantity,
            sellDate: t.date,
            sellPrice: t.price,
            costBasis: totalCostOfSoldShares,
            realizedGain: realizedGain,
            netSellProceeds: netProceeds,
            // USD values are conditional
            costBasisUsd: canCalculateUsdGain ? totalCostOfSoldSharesUsd : undefined,
            netSellProceedsUsd: canCalculateUsdGain ? netProceedsUsd : undefined,
            realizedGainUsd: canCalculateUsdGain ? netProceedsUsd! - totalCostOfSoldSharesUsd : undefined
        });
      }
    });

    const holdings: StockHolding[] = [];
    for (const [ticker, lots] of buyLots.entries()) {
      const { totalQuantity, totalCost, totalCostUsd } = lots.reduce(
        (acc, lot) => {
          const lotCost = lot.quantity * lot.price * (1 + (lot.commissionRate || 0));
          acc.totalQuantity += lot.quantity;
          acc.totalCost += lotCost;
          if (lot.usdTryRate) {
            acc.totalCostUsd += lotCost / lot.usdTryRate;
          }
          return acc;
        },
        { totalQuantity: 0, totalCost: 0, totalCostUsd: 0 }
      );

      if (totalQuantity > 1e-9) {
        // TRY values
        const averageCost = totalCost / totalQuantity;
        const currentPrice = getLatestPrice(ticker, prices);
        const marketValue = currentPrice !== undefined ? totalQuantity * currentPrice : undefined;
        const unrealizedGainLoss = marketValue !== undefined ? marketValue - totalCost : undefined;
        const unrealizedGainLossPercent = unrealizedGainLoss !== undefined && totalCost > 0 ? (unrealizedGainLoss / totalCost) * 100 : undefined;

        // USD values
        const averageCostUsd = totalCostUsd > 0 ? totalCostUsd / totalQuantity : undefined;
        const marketValueUsd = marketValue !== undefined && currentUsdTryRate > 0 ? marketValue / currentUsdTryRate : undefined;
        const unrealizedGainLossUsd = marketValueUsd !== undefined && totalCostUsd > 0 ? marketValueUsd - totalCostUsd : undefined;

        holdings.push({
          ticker,
          quantity: totalQuantity,
          // TRY
          totalCost: totalCost,
          averageCost,
          currentPrice,
          marketValue,
          unrealizedGainLoss,
          unrealizedGainLossPercent,
          // USD
          totalCostUsd: totalCostUsd > 0 ? totalCostUsd : undefined,
          averageCostUsd,
          marketValueUsd,
          unrealizedGainLossUsd,
        });
      }
    }

    // TRY totals
    const totalMarketValue = holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
    const totalUnrealizedGainLoss = totalMarketValue - totalCost;
    const totalUnrealizedGainLossPercent = totalCost > 0 ? (totalUnrealizedGainLoss / totalCost) * 100 : 0;

    // USD totals
    const totalMarketValueUsd = holdings.reduce((sum, h) => sum + (h.marketValueUsd || 0), 0);
    const totalCostUsd = holdings.reduce((sum, h) => sum + (h.totalCostUsd || 0), 0);
    const totalUnrealizedGainLossUsd = totalMarketValueUsd - totalCostUsd;

    const portfolio: Portfolio = {
      holdings,
      totalMarketValue,
      totalCost,
      totalUnrealizedGainLoss,
      totalUnrealizedGainLossPercent,
      totalMarketValueUsd,
      totalCostUsd,
      totalUnrealizedGainLossUsd,
    };
    
    return { portfolio, realizedGains };
  }, [transactions, prices, currentUsdTryRate]);

  return result;
};