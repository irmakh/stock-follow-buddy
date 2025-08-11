import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../components/Dashboard';
import type { Portfolio, StockPrices } from '../../types';
import { formatCurrency } from '../../utils/formatter';

// Mock chart components as they are complex and not the focus of this test
vi.mock('../../components/charts/PortfolioPieChart', () => ({ default: () => <div>PortfolioPieChart</div> }));
vi.mock('../../components/charts/CostVsMarketValueChart', () => ({ default: () => <div>CostVsMarketValueChart</div> }));
vi.mock('../../components/charts/PriceHistoryLineChart', () => ({ default: () => <div>PriceHistoryLineChart</div> }));

describe('Dashboard Component', () => {

  const mockPortfolio: Portfolio = {
    holdings: [{
      ticker: 'TEST',
      quantity: 10,
      averageCost: 100,
      totalCost: 1000,
      currentPrice: 120,
      marketValue: 1200,
      unrealizedGainLoss: 200,
      unrealizedGainLossPercent: 20,
      averageCostUsd: 30,
      totalCostUsd: 300,
      marketValueUsd: 360,
      unrealizedGainLossUsd: 60,
    }],
    totalMarketValue: 1200,
    totalCost: 1000,
    totalUnrealizedGainLoss: 200,
    totalUnrealizedGainLossPercent: 20,
    totalMarketValueUsd: 360,
    totalCostUsd: 300,
    totalUnrealizedGainLossUsd: 60,
  };

  const mockStockPrices: StockPrices = {
    'TEST': [{ date: '2023-01-01', price: 120 }]
  };

  it('renders stat cards with correct TRY values', () => {
    render(
        <Dashboard 
            portfolio={mockPortfolio} 
            stockPrices={mockStockPrices} 
            displayCurrency="TRY" 
        />
    );
    
    const valueCard = screen.getByText('Total Portfolio Value (TRY)').closest('div');
    const pnlCard = screen.getByText('Unrealized P/L (TRY)').closest('div');
    const holdingsCard = screen.getByText('Total Holdings').closest('div');
    
    expect(valueCard).toHaveTextContent(formatCurrency(1200, 'auto', 'TRY'));
    expect(pnlCard).toHaveTextContent(formatCurrency(200, 'exceptZero', 'TRY'));
    expect(pnlCard).toHaveTextContent('20.0000%');
    expect(holdingsCard).toHaveTextContent('1');
  });
  
  it('renders stat cards with correct USD values', () => {
    render(
        <Dashboard 
            portfolio={mockPortfolio} 
            stockPrices={mockStockPrices} 
            displayCurrency="USD" 
        />
    );

    const valueCard = screen.getByText('Total Portfolio Value (USD)').closest('div');
    const pnlCard = screen.getByText('Unrealized P/L (USD)').closest('div');
    
    expect(valueCard).toHaveTextContent(formatCurrency(360, 'auto', 'USD'));
    expect(pnlCard).toHaveTextContent(formatCurrency(60, 'exceptZero', 'USD'));
    // Checks the "from" text for USD
    expect(pnlCard).toHaveTextContent(`from ${formatCurrency(300, 'auto', 'USD')}`);
  });

  it('renders the charts', () => {
    render(
        <Dashboard 
            portfolio={mockPortfolio} 
            stockPrices={mockStockPrices} 
            displayCurrency="TRY" 
        />
    );

    expect(screen.getByText('PortfolioPieChart')).toBeInTheDocument();
    expect(screen.getByText('CostVsMarketValueChart')).toBeInTheDocument();
    expect(screen.getByText('PriceHistoryLineChart')).toBeInTheDocument();
  });
});