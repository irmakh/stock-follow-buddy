import React, { useState, useEffect, useMemo } from 'react';
import type { Portfolio, StockPrices } from '../types';
import Card from './ui/Card';
import PortfolioPieChart from './charts/PortfolioPieChart';
import CostVsMarketValueChart from './charts/CostVsMarketValueChart';
import PriceHistoryLineChart from './charts/PriceHistoryLineChart';
import { formatCurrency, formatPercentage } from '../utils/formatter';

type DisplayCurrency = 'TRY' | 'USD';

interface DashboardProps {
  portfolio: Portfolio;
  stockPrices: StockPrices;
  displayCurrency: DisplayCurrency;
}

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeColor }) => (
  <Card className="animate-fade-in-up">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
    {change && <p className={`mt-1 text-sm font-medium ${changeColor}`}>{change}</p>}
  </Card>
);

const Dashboard: React.FC<DashboardProps> = ({ portfolio, stockPrices, displayCurrency }) => {
  const {
    totalMarketValue,
    totalUnrealizedGainLoss,
    totalUnrealizedGainLossPercent,
    totalMarketValueUsd,
    totalUnrealizedGainLossUsd,
    holdings,
  } = portfolio;
  
  const gainLoss = displayCurrency === 'TRY' ? totalUnrealizedGainLoss : totalUnrealizedGainLossUsd;
  const gainLossColor = gainLoss >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  const [selectedTickerForChart, setSelectedTickerForChart] = useState<string>('');

  const allAvailableTickers = useMemo(() => 
      Array.from(new Set([...holdings.map(h => h.ticker), ...Object.keys(stockPrices)])).sort()
  , [holdings, stockPrices]);

  useEffect(() => {
    // Set a default ticker for the chart if one isn't selected and tickers are available
    if (!selectedTickerForChart && allAvailableTickers.length > 0) {
      setSelectedTickerForChart(allAvailableTickers[0]);
    }
    // If the selected ticker is no longer available (e.g. bad import), reset it
    if(selectedTickerForChart && !allAvailableTickers.includes(selectedTickerForChart)) {
      setSelectedTickerForChart(allAvailableTickers.length > 0 ? allAvailableTickers[0] : '');
    }
  }, [allAvailableTickers, selectedTickerForChart]);

  const unrealizedGainLossDisplay = displayCurrency === 'TRY'
    ? `${formatPercentage(totalUnrealizedGainLossPercent)}`
    : `from ${formatCurrency(portfolio.totalCostUsd, 'auto', 'USD')}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title={`Total Portfolio Value (${displayCurrency})`}
          value={formatCurrency(displayCurrency === 'TRY' ? totalMarketValue : totalMarketValueUsd, 'auto', displayCurrency)}
        />
        <StatCard
          title={`Unrealized P/L (${displayCurrency})`}
          value={formatCurrency(gainLoss, 'exceptZero', displayCurrency)}
          change={unrealizedGainLossDisplay}
          changeColor={gainLossColor}
        />
        <StatCard
          title="Total Holdings"
          value={holdings.length.toString()}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioPieChart holdings={holdings} displayCurrency={displayCurrency} />
        <CostVsMarketValueChart holdings={holdings} displayCurrency={displayCurrency} />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Price History (TRY)</h3>
            <select
                value={selectedTickerForChart}
                onChange={(e) => setSelectedTickerForChart(e.target.value)}
                className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white p-2"
                aria-label="Select stock for price history chart"
                disabled={allAvailableTickers.length === 0}
            >
                {allAvailableTickers.length > 0 ? (
                    allAvailableTickers.map(ticker => <option key={ticker} value={ticker}>{ticker}</option>)
                ) : (
                    <option value="">No price data available</option>
                )}
            </select>
        </div>
        <PriceHistoryLineChart stockPrices={stockPrices} selectedTicker={selectedTickerForChart} />
      </Card>
    </div>
  );
};

export default Dashboard;