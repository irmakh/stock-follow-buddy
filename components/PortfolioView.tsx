import React from 'react';
import type { Portfolio, Transaction, StockPrices, StockHolding } from '../types';
import { TransactionType } from '../types';
import Card from './ui/Card';
import { formatCurrency, formatPercentage } from '../utils/formatter';

type DisplayCurrency = 'TRY' | 'USD';

interface PortfolioViewProps {
  portfolio: Portfolio;
  transactions: Transaction[];
  stockPrices: StockPrices;
  displayCurrency: DisplayCurrency;
}

const HoldingCard: React.FC<{ holding: StockHolding; displayCurrency: DisplayCurrency }> = ({ holding: h, displayCurrency }) => {
    const isUsd = displayCurrency === 'USD';
    const gainLoss = isUsd ? h.unrealizedGainLossUsd : h.unrealizedGainLoss;
    const gainLossColor = gainLoss === undefined ? 'text-gray-500 dark:text-gray-300' : gainLoss >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
    
    return (
        <Card className="flex flex-col gap-4 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{h.ticker}</h4>
                <div className={`text-lg font-semibold ${gainLossColor}`}>
                    {gainLoss !== undefined ? formatCurrency(gainLoss, 'exceptZero', displayCurrency) : 'N/A'}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                    <div className="text-gray-500 dark:text-gray-400">Market Value</div>
                    <div className="text-gray-800 dark:text-white font-medium">{h[isUsd ? 'marketValueUsd' : 'marketValue'] !== undefined ? formatCurrency(h[isUsd ? 'marketValueUsd' : 'marketValue']!, 'auto', displayCurrency) : 'N/A'}</div>
                </div>
                <div>
                    <div className="text-gray-500 dark:text-gray-400">Quantity</div>
                    <div className="text-gray-800 dark:text-white font-medium">{h.quantity.toFixed(4)}</div>
                </div>
                <div>
                    <div className="text-gray-500 dark:text-gray-400">Total Cost</div>
                    <div className="text-gray-800 dark:text-white font-medium">{h[isUsd ? 'totalCostUsd' : 'totalCost'] !== undefined ? formatCurrency(h[isUsd ? 'totalCostUsd' : 'totalCost']!, 'auto', displayCurrency) : 'N/A'}</div>
                </div>
                <div>
                    <div className="text-gray-500 dark:text-gray-400">Avg. Cost</div>
                    <div className="text-gray-800 dark:text-white font-medium">{h[isUsd ? 'averageCostUsd' : 'averageCost'] !== undefined ? formatCurrency(h[isUsd ? 'averageCostUsd' : 'averageCost']!, 'auto', displayCurrency) : 'N/A'}</div>
                </div>
            </div>
        </Card>
    );
};

const HoldingsTable: React.FC<{ holdings: Portfolio['holdings'], displayCurrency: DisplayCurrency }> = ({ holdings, displayCurrency }) => {
    const isUsd = displayCurrency === 'USD';
    const headers = isUsd 
        ? ['Ticker', 'Quantity', 'Avg. Cost', 'Total Cost', 'Market Value', 'Unrealized P/L']
        : ['Ticker', 'Quantity', 'Avg. Cost', 'Total Cost', 'Latest Price', 'Market Value', 'Unrealized P/L', 'Unrealized P/L %'];

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Current Holdings ({displayCurrency})</h3>
      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {holdings.length > 0 ? (
          holdings.map(h => <HoldingCard key={h.ticker} holding={h} displayCurrency={displayCurrency} />)
        ) : (
          <p className="text-center py-10 text-gray-500 dark:text-gray-400">No holdings yet. Add a "Buy" transaction to get started.</p>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {headers.map(h => 
                <th key={h} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
             {holdings.length === 0 ? (
                <tr>
                    <td colSpan={headers.length} className="text-center py-10 text-gray-500 dark:text-gray-400">No holdings yet. Add a "Buy" transaction to get started.</td>
                </tr>
            ) : holdings.map(h => (
              <tr key={h.ticker} className="animate-fade-in">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{h.ticker}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{h.quantity.toFixed(4)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{h[isUsd ? 'averageCostUsd' : 'averageCost'] !== undefined ? formatCurrency(h[isUsd ? 'averageCostUsd' : 'averageCost']!, 'auto', displayCurrency) : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{h[isUsd ? 'totalCostUsd' : 'totalCost'] !== undefined ? formatCurrency(h[isUsd ? 'totalCostUsd' : 'totalCost']!, 'auto', displayCurrency) : 'N/A'}</td>
                {!isUsd && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{h.currentPrice ? formatCurrency(h.currentPrice, 'auto', 'TRY') : 'N/A'}</td>}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{h[isUsd ? 'marketValueUsd' : 'marketValue'] !== undefined ? formatCurrency(h[isUsd ? 'marketValueUsd' : 'marketValue']!, 'auto', displayCurrency) : 'N/A'}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${h[isUsd ? 'unrealizedGainLossUsd' : 'unrealizedGainLoss'] === undefined ? 'text-gray-500 dark:text-gray-300' : h[isUsd ? 'unrealizedGainLossUsd' : 'unrealizedGainLoss']! >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {h[isUsd ? 'unrealizedGainLossUsd' : 'unrealizedGainLoss'] !== undefined ? formatCurrency(h[isUsd ? 'unrealizedGainLossUsd' : 'unrealizedGainLoss']!, 'exceptZero', displayCurrency) : 'N/A'}
                </td>
                 {!isUsd && <td className={`px-6 py-4 whitespace-nowrap text-sm ${h.unrealizedGainLossPercent === undefined ? 'text-gray-500 dark:text-gray-300' : h.unrealizedGainLossPercent >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {h.unrealizedGainLossPercent !== undefined ? formatPercentage(h.unrealizedGainLossPercent) : 'N/A'}
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const TransactionsTable: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Transaction History</h3>
            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            {['Date', 'Ticker', 'Type', 'Quantity', 'Price (TRY)', 'USD/TRY Rate', 'Total Value (TRY)'].map(h => 
                                <th key={h} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">No transactions recorded yet.</td>
                            </tr>
                        ) : sortedTransactions.map(t => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{t.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{t.ticker}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${t.type === TransactionType.Buy ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{t.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{t.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatCurrency(t.price, 'auto', 'TRY')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{t.usdTryRate ? t.usdTryRate.toFixed(4) : 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatCurrency(t.price * t.quantity, 'auto', 'TRY')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const PriceHistoryTable: React.FC<{ prices: StockPrices }> = ({ prices }) => {
    const allPrices = Object.entries(prices).flatMap(([ticker, history]) => 
        history.map(p => ({ ...p, ticker }))
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Stock Price History (TRY)</h3>
            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            {['Date', 'Ticker', 'Price'].map(h => 
                                <th key={h} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {allPrices.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center py-10 text-gray-500 dark:text-gray-400">No price history recorded yet.</td>
                            </tr>
                        ) : allPrices.map((p, index) => (
                            <tr key={`${p.ticker}-${p.date}-${index}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{p.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{p.ticker}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatCurrency(p.price, 'auto', 'TRY')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

const PortfolioView: React.FC<PortfolioViewProps> = ({ portfolio, transactions, stockPrices, displayCurrency }) => {
  return (
    <div className="space-y-6">
      <HoldingsTable holdings={portfolio.holdings} displayCurrency={displayCurrency}/>
      <TransactionsTable transactions={transactions} />
      <PriceHistoryTable prices={stockPrices} />
    </div>
  );
};

export default PortfolioView;