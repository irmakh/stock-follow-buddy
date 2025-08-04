import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { StockPrices } from '../../types';
import { formatCurrency } from '../../utils/formatter';
import { useTheme } from '../../contexts/ThemeContext';

interface PriceHistoryLineChartProps {
  stockPrices: StockPrices;
  selectedTicker: string;
}

const CustomTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    const style = theme === 'dark' 
        ? { backgroundColor: 'rgba(31, 41, 55, 0.8)', color: '#f9fafb', border: '1px solid #4b5563' } 
        : { backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#111827', border: '1px solid #e5e7eb' };
    
    return (
      <div className="p-3 rounded-md shadow-lg backdrop-blur-sm" style={style}>
        <p className="font-bold text-lg mb-2">{`Date: ${label}`}</p>
        <p style={{ color: '#8884d8' }}>{`Price: ${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

const PriceHistoryLineChart: React.FC<PriceHistoryLineChartProps> = ({ stockPrices, selectedTicker }) => {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
  const gridColor = theme === 'dark' ? '#4A5568' : '#E2E8F0';
  const chartData = stockPrices[selectedTicker] || [];

  if (!selectedTicker) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        Select a stock from the dropdown to see its price history.
      </div>
    );
  }

  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        Not enough price data for {selectedTicker} to draw a chart. Add at least two price points.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 20,
            left: 30,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="date" stroke={tickColor} tick={{ fontSize: 12 }} minTickGap={20}/>
          <YAxis
              stroke={tickColor}
              tickFormatter={(value) => new Intl.NumberFormat('tr-TR', { notation: 'compact', compactDisplay: 'short' }).format(value as number)}
              domain={['auto', 'auto']}
              width={80}
          />
          <Tooltip content={<CustomTooltip theme={theme} />}/>
          <Legend wrapperStyle={{ color: tickColor }} />
          <Line type="monotone" dataKey="price" stroke="#8884d8" name="Price (TRY)" dot={true} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceHistoryLineChart;