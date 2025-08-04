import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercentage } from '../../utils/formatter';

describe('formatter utils', () => {
  describe('formatCurrency', () => {
    it('formats TRY currency correctly', () => {
      expect(formatCurrency(1234.56, 'auto', 'TRY')).toContain('1.234,56');
    });

    it('formats USD currency correctly', () => {
      // The implementation uses minimumFractionDigits: 2, so it won't pad with zeros.
      expect(formatCurrency(1234.56, 'auto', 'USD')).toBe('$1,234.56');
    });

    it('handles negative numbers correctly', () => {
      // Using a regex to be robust against non-breaking spaces and currency symbols that Intl.NumberFormat might add.
      expect(formatCurrency(-500, 'auto', 'TRY')).toMatch(/-\s?₺?\s?500,00/);
    });

    it('applies signDisplay "always"', () => {
      expect(formatCurrency(100, 'always', 'USD')).toBe('+$100.00');
      expect(formatCurrency(-100, 'always', 'USD')).toBe('-$100.00');
    });

    it('applies signDisplay "exceptZero"', () => {
      // Using a regex to be robust against non-breaking spaces and currency symbols.
      expect(formatCurrency(100, 'exceptZero', 'TRY')).toMatch(/\+\s?₺?\s?100,00/);
      expect(formatCurrency(-100, 'exceptZero', 'TRY')).toMatch(/-\s?₺?\s?100,00/);
      expect(formatCurrency(0, 'exceptZero', 'TRY')).toContain('0,00');
    });

    it('formats zero correctly', () => {
      expect(formatCurrency(0, 'auto', 'TRY')).toContain('0,00');
      // Should not have a sign
      expect(formatCurrency(0, 'auto', 'USD')).toBe('$0.00');
    });

    it('respects maximum fraction digits for each currency', () => {
      // USD rounds to 4 decimal places
      expect(formatCurrency(12.12345, 'auto', 'USD')).toBe('$12.1235');
      // TRY rounds to 6 decimal places
      expect(formatCurrency(12.1234567, 'auto', 'TRY')).toContain('12,123457');
    });
  });

  describe('formatPercentage', () => {
    it('formats a positive percentage with four decimal places', () => {
      expect(formatPercentage(12.34567)).toBe('12.3457%');
    });

    it('formats a negative percentage', () => {
      expect(formatPercentage(-5.5)).toBe('-5.5000%');
    });

    it('formats zero correctly', () => {
      expect(formatPercentage(0)).toBe('0.0000%');
    });

    it('correctly rounds the value to four decimal places', () => {
      expect(formatPercentage(12.34567)).toBe('12.3457%'); // Rounds up
      expect(formatPercentage(9.87654)).toBe('9.8765%');   // No rounding needed
      expect(formatPercentage(1.99999)).toBe('2.0000%');  // Rounds up and carries over
    });
  });
});
