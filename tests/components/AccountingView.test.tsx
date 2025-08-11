import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccountingView from '../../components/AccountingView';
import type { RealizedGainLoss } from '../../types';
import { formatCurrency } from '../../utils/formatter';

describe('AccountingView Component', () => {
  it('should display a message when there are no realized gains', () => {
    render(<AccountingView realizedGains={[]} displayCurrency="TRY" />);
    // The message appears in both mobile and desktop views, so we check that at least one exists.
    const messages = screen.getAllByText(/No sell transactions recorded yet/i);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toBeInTheDocument();
  });

  it('should calculate and display the total realized gain in TRY', () => {
    const mockGains: RealizedGainLoss[] = [
      { id: '1', ticker: 'G1', quantity: 1, sellDate: '2023-01-01', sellPrice: 100, costBasis: 80, realizedGain: 20, netSellProceeds: 100 },
      { id: '2', ticker: 'G2', quantity: 1, sellDate: '2023-01-02', sellPrice: 100, costBasis: 130, realizedGain: -30, netSellProceeds: 100 },
    ];
    render(<AccountingView realizedGains={mockGains} displayCurrency="TRY" />);

    const totalGainElement = screen.getByText(/Total Realized Gain\/Loss/i, { selector: 'p' });
    // Total gain is 20 + (-30) = -10
    const expectedTotal = formatCurrency(-10, 'exceptZero', 'TRY');
    expect(totalGainElement).toHaveTextContent(expectedTotal);
  });

  it('should calculate and display the total realized gain in USD', () => {
    const mockGains: RealizedGainLoss[] = [
      { id: '1', ticker: 'G1', quantity: 1, sellDate: '2023-01-01', sellPrice: 100, costBasis: 80, realizedGain: 20, netSellProceeds: 100, costBasisUsd: 10, netSellProceedsUsd: 15, realizedGainUsd: 5 },
      { id: '2', ticker: 'G2', quantity: 1, sellDate: '2023-01-02', sellPrice: 100, costBasis: 130, realizedGain: -30, netSellProceeds: 100, costBasisUsd: 25, netSellProceedsUsd: 15, realizedGainUsd: -10 },
    ];
    render(<AccountingView realizedGains={mockGains} displayCurrency="USD" />);

    const totalGainElement = screen.getByText(/Total Realized Gain\/Loss/i, { selector: 'p' });
    // Total gain is 5 + (-10) = -5
    const expectedTotal = formatCurrency(-5, 'exceptZero', 'USD');
    expect(totalGainElement).toHaveTextContent(expectedTotal);
  });
  
  it('should correctly sum total USD gain ignoring entries where it is undefined', () => {
    const mockGains: RealizedGainLoss[] = [
      { id: '1', ticker: 'G1', quantity: 1, sellDate: '2023-01-01', sellPrice: 100, costBasis: 80, realizedGain: 20, netSellProceeds: 100, costBasisUsd: 10, netSellProceedsUsd: 15, realizedGainUsd: 5 },
      { id: '2', ticker: 'G2', quantity: 1, sellDate: '2023-01-02', sellPrice: 100, costBasis: 130, realizedGain: -30, netSellProceeds: 100, costBasisUsd: undefined, netSellProceedsUsd: undefined, realizedGainUsd: undefined }, // No USD gain
      { id: '3', ticker: 'G3', quantity: 1, sellDate: '2023-01-03', sellPrice: 150, costBasis: 100, realizedGain: 50, netSellProceeds: 150, costBasisUsd: 10, netSellProceedsUsd: 25, realizedGainUsd: 15 },
    ];
    render(<AccountingView realizedGains={mockGains} displayCurrency="USD" />);
    
    const totalGainElement = screen.getByText(/Total Realized Gain\/Loss/i, { selector: 'p' });
    // Total should be 5 + 15 = 20
    const expectedTotal = formatCurrency(20, 'exceptZero', 'USD');
    expect(totalGainElement).toHaveTextContent(expectedTotal);
  });

  it('should display individual gain/loss rows with correct data and styling cues', () => {
    const mockGains: RealizedGainLoss[] = [
      { id: 'gain', ticker: 'GAIN', quantity: 10, sellDate: '2023-01-01', sellPrice: 12, costBasis: 100, realizedGain: 20, netSellProceeds: 120, costBasisUsd: 4, netSellProceedsUsd: 5, realizedGainUsd: 1 },
      { id: 'loss', ticker: 'LOSS', quantity: 5, sellDate: '2023-01-02', sellPrice: 15, costBasis: 100, realizedGain: -25, netSellProceeds: 75, costBasisUsd: 5, netSellProceedsUsd: 3, realizedGainUsd: -2 },
    ];
    render(<AccountingView realizedGains={mockGains} displayCurrency="TRY" />);
    
    // The value might appear in both mobile and desktop views.
    // We get all and check the properties of the first one.
    const gainRows = screen.getAllByText(formatCurrency(20, 'exceptZero', 'TRY'));
    expect(gainRows[0]).toBeInTheDocument();
    expect(gainRows[0]).toHaveClass('text-green-500'); // Check for green text (light mode class)
    
    const lossRows = screen.getAllByText(formatCurrency(-25, 'exceptZero', 'TRY'));
    expect(lossRows[0]).toBeInTheDocument();
    expect(lossRows[0]).toHaveClass('text-red-500'); // Check for red text (light mode class)
  });
});