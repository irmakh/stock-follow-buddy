

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { StockHolding } from '../../types';
import { formatCurrency } from '../../utils/formatter';
import Card from '../ui/Card';
import { useTheme } from '../../contexts/ThemeContext';

type DisplayCurrency = 'TRY' | 'USD';

interface PortfolioPieChartProps {
  holdings: StockHolding[];
  displayCurrency: DisplayCurrency;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const CustomTooltip = ({ active, payload, currency, theme }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = data.value;
    const percentNum = payload[0].percent * 100;
    const percentDisplay = !isNaN(percentNum) ? `${percentNum.toFixed(4)}%` : 'N/A';
    
    const style = theme === 'dark' 
        ? { backgroundColor: 'rgba(31, 41, 55, 0.8)', color: '#f9fafb', border: '1px solid #4b5563' } 
        : { backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#111827', border: '1px solid #e5e7eb' };

    return (
      <div className="p-3 rounded-md shadow-lg backdrop-blur-sm" style={style}>
        <p className="font-bold">{`${data.ticker}: ${formatCurrency(value, 'auto', currency)}`}</p>
        <p className="text-sm">{`Allocation: ${percentDisplay}`}</p>
        <p className="text-sm">{`Quantity: ${data.quantity.toFixed(4)}`}</p>
      </div>
    );
  }
  return null;
};


const PortfolioPieChart: React.FC<PortfolioPieChartProps> = ({ holdings, displayCurrency }) => {
  const { theme } = useTheme();

  const chartData = holdings
    .map(h => ({ 
        ticker: h.ticker, 
        value: displayCurrency === 'TRY' ? h.marketValue : h.marketValueUsd,
        quantity: h.quantity 
    }))
    .filter(h => h.value && h.value > 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Portfolio Allocation</h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available for chart. Add transactions and prices.
        </div>
      </Card>
    );
  }

  return (
    <Card>
       <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Portfolio Allocation ({displayCurrency})</h3>
       <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="ticker"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip currency={displayCurrency} theme={theme} />} />
            <Legend wrapperStyle={{ color: theme === 'dark' ? '#A0AEC0' : '#4A5568' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default PortfolioPieChart;