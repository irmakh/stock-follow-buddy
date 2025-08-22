import React from 'react';
import type { RealizedGainLoss } from '../types';
import Card from './ui/Card';
import { formatCurrency } from '../utils/formatter';
import { usePagination } from '../hooks/usePagination';
import PaginationControls from './ui/PaginationControls';
import { useSort } from '../hooks/useSort';

type DisplayCurrency = 'TRY' | 'USD';

interface AccountingViewProps {
  realizedGains: RealizedGainLoss[];
  displayCurrency: DisplayCurrency;
}

const RealizedGainCard: React.FC<{ gain: RealizedGainLoss; displayCurrency: DisplayCurrency }> = ({ gain: g, displayCurrency }) => {
    const isUsd = displayCurrency === 'USD';
    const realizedGainValue = isUsd ? g.realizedGainUsd : g.realizedGain;
    const gainColor = realizedGainValue === undefined ? 'text-gray-500 dark:text-gray-300'
                                  : realizedGainValue >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
    
    return (
        <Card className="flex flex-col gap-4 animate-fade-in-up">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">{g.ticker}</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{g.sellDate}</span>
                </div>
                <div className={`text-lg font-semibold ${gainColor}`}>
                    {realizedGainValue !== undefined ? formatCurrency(realizedGainValue, 'exceptZero', displayCurrency) : 'N/A'}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
                 <div>
                    <div className="text-gray-500 dark:text-gray-400">Net Proceeds</div>
                    <div className="text-gray-800 dark:text-white font-medium">{isUsd ? (g.netSellProceedsUsd !== undefined ? formatCurrency(g.netSellProceedsUsd, 'auto', 'USD') : 'N/A') : formatCurrency(g.netSellProceeds, 'auto', 'TRY')}</div>
                </div>
                <div>
                    <div className="text-gray-500 dark:text-gray-400">Cost Basis</div>
                    <div className="text-gray-800 dark:text-white font-medium">{isUsd ? (g.costBasisUsd !== undefined ? formatCurrency(g.costBasisUsd, 'auto', 'USD') : 'N/A') : formatCurrency(g.costBasis, 'auto', 'TRY')}</div>
                </div>
                <div>
                    <div className="text-gray-500 dark:text-gray-400">Quantity</div>
                    <div className="text-gray-800 dark:text-white font-medium">{g.quantity.toFixed(4)}</div>
                </div>
                {!isUsd && (
                    <div>
                        <div className="text-gray-500 dark:text-gray-400">Sell Price</div>
                        <div className="text-gray-800 dark:text-white font-medium">{formatCurrency(g.sellPrice, 'auto', 'TRY')}</div>
                    </div>
                )}
            </div>
        </Card>
    );
};


const AccountingView: React.FC<AccountingViewProps> = ({ realizedGains, displayCurrency }) => {
  const isUsd = displayCurrency === 'USD';
  
  const totalRealizedGain = realizedGains.reduce((sum, gain) => sum + (isUsd ? gain.realizedGainUsd || 0 : gain.realizedGain), 0);
  const gainLossColor = totalRealizedGain >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  
  const { sortedItems, requestSort, getSortIndicator } = useSort<RealizedGainLoss>(realizedGains, { key: 'sellDate', direction: 'descending' });

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
  
  const headers: { label: string; key: keyof RealizedGainLoss }[] = isUsd
    ? [
        { label: 'Sell Date', key: 'sellDate' },
        { label: 'Ticker', key: 'ticker' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Net Proceeds', key: 'netSellProceedsUsd' },
        { label: 'Cost Basis', key: 'costBasisUsd' },
        { label: 'Realized P/L', key: 'realizedGainUsd' }
      ]
    : [
        { label: 'Sell Date', key: 'sellDate' },
        { label: 'Ticker', key: 'ticker' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Sell Price', key: 'sellPrice' },
        { label: 'Net Proceeds', key: 'netSellProceeds' },
        { label: 'Cost Basis', key: 'costBasis' },
        { label: 'Realized P/L', key: 'realizedGain' }
      ];

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Realized P/L Summary ({displayCurrency})</h3>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          Total Realized Gain/Loss:
          <span className={`ml-4 ${gainLossColor}`}>
            {formatCurrency(totalRealizedGain, 'exceptZero', displayCurrency)}
          </span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Note: The total USD gain only includes sales where both buy and sell transactions had an exchange rate.
        </p>
      </Card>
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Realized Gain/Loss History (FIFO) - {displayCurrency}</h3>
        
        {/* Mobile Card View */}
        <div className="space-y-4 md:hidden">
            {currentData.length > 0 ? (
                currentData.map(g => <RealizedGainCard key={g.id} gain={g} displayCurrency={displayCurrency} />)
            ) : (
                <p className="text-center py-10 text-gray-500 dark:text-gray-400">No sell transactions recorded yet.</p>
            )}
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
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
              {currentData.length > 0 ? currentData.map(g => {
                const realizedGainValue = isUsd ? g.realizedGainUsd : g.realizedGain;
                const gainColor = realizedGainValue === undefined ? 'text-gray-500 dark:text-gray-300'
                                  : realizedGainValue >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
                
                return (
                <tr key={g.id} className="animate-fade-in">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{g.sellDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{g.ticker}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{g.quantity.toFixed(4)}</td>
                  
                  {!isUsd && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatCurrency(g.sellPrice, 'auto', 'TRY')}</td>}
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {isUsd 
                      ? (g.netSellProceedsUsd !== undefined ? formatCurrency(g.netSellProceedsUsd, 'auto', 'USD') : 'N/A') 
                      : formatCurrency(g.netSellProceeds, 'auto', 'TRY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {isUsd 
                      ? (g.costBasisUsd !== undefined ? formatCurrency(g.costBasisUsd, 'auto', 'USD') : 'N/A')
                      : formatCurrency(g.costBasis, 'auto', 'TRY')}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${gainColor}`}>
                    {realizedGainValue !== undefined
                      ? formatCurrency(realizedGainValue, 'exceptZero', displayCurrency)
                      : 'N/A'
                    }
                  </td>
                </tr>
                )
              }) : (
                 <tr>
                    <td colSpan={headers.length} className="text-center py-10 text-gray-500 dark:text-gray-400">No sell transactions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {realizedGains.length > 0 && (
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
    </div>
  );
};

export default AccountingView;