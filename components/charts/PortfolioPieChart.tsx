import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import type { StockHolding } from '../../types';
import { formatCurrency } from '../../utils/formatter';
import Card from '../ui/Card';
import { useTheme } from '../../contexts/ThemeContext';

type DisplayCurrency = 'TRY' | 'USD';

interface PortfolioPieChartProps {
  holdings: StockHolding[];
  displayCurrency: DisplayCurrency;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8442ff', '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1'];

const CustomTooltip = ({ active, payload, currency, theme }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = data.value;
    const percentNum = payload[0].percent * 100;
    const percentDisplay = !isNaN(percentNum) ? `${percentNum.toFixed(2)}%` : 'N/A';
    
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

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-transform duration-300"
      />
    </g>
  );
};

const PortfolioPieChart: React.FC<PortfolioPieChartProps> = ({ holdings, displayCurrency }) => {
  const { theme } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  const totalValue = holdings.reduce((sum, h) => sum + (displayCurrency === 'TRY' ? h.marketValue || 0 : h.marketValueUsd || 0), 0);

  const data = holdings
    .map(h => ({ 
        ticker: h.ticker, 
        value: displayCurrency === 'TRY' ? h.marketValue : h.marketValueUsd,
        quantity: h.quantity 
    }))
    .filter(h => h.value && h.value > 0)
    .sort((a, b) => b.value! - a.value!);

  const smallSliceThreshold = 0.02; // 2%
  let otherValue = 0;
  let otherQuantity = 0;
  const mainData = [];
  const otherItems: string[] = [];

  for (const item of data) {
    if (item.value! / totalValue < smallSliceThreshold) {
        otherValue += item.value!;
        otherQuantity += item.quantity;
        otherItems.push(item.ticker);
    } else {
        mainData.push(item);
    }
  }
  
  const chartData = [...mainData];
  if (otherItems.length > 0) {
      chartData.push({
          ticker: `Other (${otherItems.length})`,
          value: otherValue,
          quantity: otherQuantity
      });
  }

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

  const handleSelection = (index: number) => {
    setClickedIndex(prevIndex => (prevIndex === index ? null : index));
  };
  
  const activeIndex = clickedIndex ?? hoveredIndex;

  return (
    <Card>
       <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Portfolio Allocation ({displayCurrency})</h3>
       <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:h-[300px]">
        <div className="relative w-full h-[250px] md:h-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="ticker"
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={(_, index) => handleSelection(index)}
                    // @ts-expect-error Recharts types are incorrect and do not include the activeIndex prop.
                    activeIndex={activeIndex ?? undefined}
                    activeShape={renderActiveShape}
                    stroke="none"
                >
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                </Pie>
                <Tooltip content={<CustomTooltip currency={displayCurrency} theme={theme} />} />
            </PieChart>
            </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Value</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(totalValue, 'auto', displayCurrency)}
                </span>
            </div>
        </div>
        <div className="w-full md:w-56 self-stretch md:max-h-[280px] overflow-y-auto pr-2">
            <ul className="space-y-2">
                {chartData.map((entry, index) => (
                    <li key={`legend-${index}`}
                        className={`flex items-center text-sm p-2 rounded-md transition-all duration-200 cursor-pointer ${activeIndex === index ? 'bg-gray-200 dark:bg-gray-700 shadow-sm' : 'bg-transparent'}`}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() => handleSelection(index)}
                    >
                        <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="flex-1 font-medium text-gray-700 dark:text-gray-300 truncate">{entry.ticker}</span>
                        <span className="ml-2 text-gray-500 dark:text-gray-400 text-xs">
                            {((entry.value! / totalValue) * 100).toFixed(1)}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
       </div>
    </Card>
  );
};

export default PortfolioPieChart;