import React, { useMemo } from 'react';
import type { Portfolio, Transaction, StockPrices, StockHolding, PriceHistoryItem } from '../types';
import { TransactionType } from '../types';
import Card from './ui/Card';
import { formatCurrency, formatPercentage } from '../utils/formatter';
import { usePagination } from '../hooks/usePagination';
import PaginationControls from './ui/PaginationControls';
import { useSort } from '../hooks/useSort';

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

type AugmentedTransaction = Transaction & { commission: number; netValue: number; };

const TransactionsTable: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const augmentedTransactions = useMemo(() => {
        return transactions.map(t => {
            const grossValue = t.price * t.quantity;
            const commission = t.type === TransactionType.Sell ? grossValue * (t.commissionRate ?? 0) : 0;
            const netValue = t.type === TransactionType.Buy ? grossValue : grossValue - commission;
            return { ...t, commission, netValue };
        });
    }, [transactions]);

    const { sortedItems, requestSort, getSortIndicator } = useSort<AugmentedTransaction>(augmentedTransactions, { key: 'date', direction: 'descending' });
    
    const {
        currentData,
        currentPage,
        totalPages,
        itemsPerPage,
        setItemsPerPage,
        nextPage,
        prevPage,
        canNextPage,
        canPrevPage
    } = usePagination(sortedItems, 10);
    
    const headers: { label: string; key: keyof AugmentedTransaction }[] = [
        { label: 'Date', key: 'date' },
        { label: 'Ticker', key: 'ticker' },
        { label: 'Type', key: 'type' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Price (TRY)', key: 'price' },
        { label: 'Commission (TRY)', key: 'commission' },
        { label: 'Net Value (TRY)', key: 'netValue' },
        { label: 'USD/TRY Rate', key: 'usdTryRate' },
    ];

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Transaction History</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            {headers.map(h => 
                                <th key={h.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    <button onClick={() => requestSort(h.key)} className="w-full text-left font-medium uppercase tracking-wider focus:outline-none hover:text-gray-700 dark:hover:text-gray-100">
                                        {h.label}{getSortIndicator(h.key)}
                                    </button>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentData.length === 0 ? (
                            <tr>
                                <td colSpan={headers.length} className="text-center py-10 text-gray-500 dark:text-gray-400">No transactions recorded yet.</td>
                            </tr>
                        ) : currentData.map(t => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{t.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{t.ticker}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${t.type === TransactionType.Buy ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{t.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{t.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatCurrency(t.price, 'auto', 'TRY')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatCurrency(t.commission, 'auto', 'TRY')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatCurrency(t.netValue, 'auto', 'TRY')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{t.usdTryRate ? t.usdTryRate.toFixed(4) : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {transactions.length > 0 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    canNextPage={canNextPage}
                    canPrevPage={canPrevPage}
                    nextPage={nextPage}
                    prevPage={prevPage}
                />
            )}
        </Card>
    );
};

type PriceHistoryRow = PriceHistoryItem & { ticker: string };

const PriceHistoryTable: React.FC<{ prices: StockPrices }> = ({ prices }) => {
    const allPrices = useMemo(() => Object.entries(prices).flatMap(([ticker, history]) => 
        history.map(p => ({ ...p, ticker }))
    ), [prices]);
    
    const { sortedItems, requestSort, getSortIndicator } = useSort<PriceHistoryRow>(allPrices, { key: 'date', direction: 'descending' });

    const {
        currentData,
        currentPage,
        totalPages,
        itemsPerPage,
        setItemsPerPage,
        nextPage,
        prevPage,
        canNextPage,
        canPrevPage
    } = usePagination(sortedItems, 10);
    
    const headers: { label: string, key: keyof PriceHistoryRow }[] = [
        { label: 'Date', key: 'date' },
        { label: 'Ticker', key: 'ticker' },
        { label: 'Price', key: 'price' }
    ];

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Stock Price History (TRY)</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            {headers.map(h => 
                                <th key={h.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    <button onClick={() => requestSort(h.key)} className="w-full text-left font-medium uppercase tracking-wider focus:outline-none hover:text-gray-700 dark:hover:text-gray-100">
                                        {h.label}{getSortIndicator(h.key)}
                                    </button>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentData.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center py-10 text-gray-500 dark:text-gray-400">No price history recorded yet.</td>
                            </tr>
                        ) : currentData.map((p, index) => (
                            <tr key={`${p.ticker}-${p.date}-${index}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{p.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{p.ticker}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatCurrency(p.price, 'auto', 'TRY')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {allPrices.length > 0 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    canNextPage={canNextPage}
                    canPrevPage={canPrevPage}
                    nextPage={nextPage}
                    prevPage={prevPage}
                />
            )}
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