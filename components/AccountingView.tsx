import React from 'react';
import type { RealizedGainLoss } from '../types';
import Card from './ui/Card';
import { formatCurrency } from '../utils/formatter';

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
  
  const sortedGains = [...realizedGains].sort((a, b) => new Date(b.sellDate).getTime() - new Date(a.sellDate).getTime());

  const headers = isUsd
    ? ['Sell Date', 'Ticker', 'Quantity', 'Net Proceeds', 'Cost Basis', 'Realized P/L']
    : ['Sell Date', 'Ticker', 'Quantity', 'Sell Price', 'Net Proceeds', 'Cost Basis', 'Realized P/L'];

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
            {sortedGains.length > 0 ? (
                sortedGains.map(g => <RealizedGainCard key={g.id} gain={g} displayCurrency={displayCurrency} />)
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
                  <th key={h} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedGains.length > 0 ? sortedGains.map(g => {
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
      </Card>
    </div>
  );
};

export default AccountingView;