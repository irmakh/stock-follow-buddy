import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { StockHolding } from '../../types';
import { formatCurrency } from '../../utils/formatter';
import Card from '../ui/Card';
import { useTheme } from '../../contexts/ThemeContext';

type DisplayCurrency = 'TRY' | 'USD';

interface CostVsMarketValueChartProps {
  holdings: StockHolding[];
  displayCurrency: DisplayCurrency;
}

const CustomTooltip = ({ active, payload, label, currency, theme }: any) => {
  if (active && payload && payload.length) {
    const style = theme === 'dark' 
        ? { backgroundColor: 'rgba(31, 41, 55, 0.8)', color: '#f9fafb', border: '1px solid #4b5563' } 
        : { backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#111827', border: '1px solid #e5e7eb' };
    
    return (
      <div className="p-3 rounded-md shadow-lg backdrop-blur-sm" style={style}>
        <p className="font-bold text-lg mb-2">{label}</p>
        <p style={{ color: '#8884d8' }}>{`Total Cost: ${formatCurrency(payload[0].value, 'auto', currency)}`}</p>
        <p style={{ color: '#82ca9d' }}>{`Market Value: ${formatCurrency(payload[1].value, 'auto', currency)}`}</p>
      </div>
    );
  }
  return null;
};

const CostVsMarketValueChart: React.FC<CostVsMarketValueChartProps> = ({ holdings, displayCurrency }) => {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
  const gridColor = theme === 'dark' ? '#4A5568' : '#E2E8F0';

  const chartData = holdings
    .map(h => ({
        ticker: h.ticker,
        totalCost: displayCurrency === 'TRY' ? h.totalCost : h.totalCostUsd,
        marketValue: displayCurrency === 'TRY' ? h.marketValue : h.marketValueUsd,
    }))
    .filter(h => h.marketValue !== undefined && h.marketValue !== null && h.totalCost !== undefined && h.totalCost !== null);
  
  if (chartData.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Cost vs. Market Value</h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available for chart.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Cost vs. Market Value ({displayCurrency})</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: 30,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="ticker" stroke={tickColor} />
            <YAxis
                stroke={tickColor}
                tickFormatter={(value) => {
                    const currencySymbol = displayCurrency === 'USD' ? '$' : '';
                    const formattedValue = new Intl.NumberFormat('tr-TR', { notation: 'compact', compactDisplay: 'short' }).format(value as number);
                    return `${currencySymbol}${formattedValue}`;
                }}
            />
            <Tooltip content={<CustomTooltip currency={displayCurrency} theme={theme} />}/>
            <Legend wrapperStyle={{ color: tickColor }}/>
            <Bar dataKey="totalCost" fill="#8884d8" name="Total Cost" />
            <Bar dataKey="marketValue" fill="#82ca9d" name="Market Value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default CostVsMarketValueChart;