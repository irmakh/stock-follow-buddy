import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportDataAsCsv, importDataFromCsv } from '../../services/fileService';
import type { Transaction, StockPrices } from '../../types';
import { TransactionType } from '../../types';

describe('fileService CSV handling', () => {
  describe('exportDataAsCsv', () => {
    // Hold mock functions in a scope accessible to all tests in this block
    const createObjectURL = vi.fn(() => 'mock-url');
    const revokeObjectURL = vi.fn();
    const mockBlob = vi.fn();
    const mockLink = { click: vi.fn(), download: '', href: '' };

    beforeEach(() => {
      // Mock global objects and document methods before each test
      vi.stubGlobal('URL', {
        createObjectURL: createObjectURL,
        revokeObjectURL: revokeObjectURL,
      });
      vi.stubGlobal('Blob', mockBlob);
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(node => node as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(node => node as any);
    });

    afterEach(() => {
      // Clear all mocks and restore original implementations after each test
      vi.clearAllMocks();
      vi.unstubAllGlobals();
    });

    it('should convert an array of transactions to a CSV string', () => {
      const transactions: Partial<Transaction>[] = [
        { id: '1', ticker: 'TSLA', type: TransactionType.Buy, quantity: 10, price: 200.5, date: '2023-01-01' },
        { id: '2', ticker: 'AAPL', type: TransactionType.Sell, quantity: 5, price: 150.75, date: '2023-01-02', usdTryRate: 30.1 },
      ];

      exportDataAsCsv(transactions, 'test.csv', 'transactions');

      // Check that Blob was called correctly
      expect(mockBlob).toHaveBeenCalledTimes(1);
      const csvContent = (mockBlob.mock.calls[0][0] as string[]).join('');
      
      // Since `arrayToCsv` now creates a deterministic header, we can assert the exact output.
      const expectedHeader = 'id,ticker,type,quantity,price,date,usdTryRate';
      const expectedRow1 = '1,TSLA,BUY,10,200.5,2023-01-01,'; // Note the trailing comma for the undefined usdTryRate
      const expectedRow2 = '2,AAPL,SELL,5,150.75,2023-01-02,30.1';
      
      const csvRows = csvContent.split('\r\n');
      expect(csvRows[0]).toBe(expectedHeader);
      expect(csvRows[1]).toBe(expectedRow1);
      expect(csvRows[2]).toBe(expectedRow2);
    });

    it('should convert a StockPrices object to a CSV string', () => {
      const prices: StockPrices = {
        'GOOG': [{ date: '2023-10-01', price: 130 }, { date: '2023-10-02', price: 132 }],
        'META': [{ date: '2023-10-01', price: 300 }],
      };

      exportDataAsCsv(prices, 'prices.csv', 'prices');
      
      // Check that Blob was called correctly
      expect(mockBlob).toHaveBeenCalledTimes(1);
      const csvContent = (mockBlob.mock.calls[0][0] as string[]).join('');
      
      // The output is sorted by ticker due to fixes in `pricesObjectToCsv`
      const expectedCsv = 'ticker,date,price\r\n"GOOG","2023-10-01",130\r\n"GOOG","2023-10-02",132\r\n"META","2023-10-01",300';
      expect(csvContent).toBe(expectedCsv);
    });
  });

  describe('importDataFromCsv', () => {
    it('should parse a CSV file into transaction objects', async () => {
      const csvContent = 'ticker,type,quantity,price,date,usdTryRate\nMSFT,BUY,15,300,2023-05-10,28.5';
      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });
      const onError = vi.fn();

      const data = await new Promise<Partial<Transaction>[]>(resolve => {
        importDataFromCsv<Partial<Transaction>[]>(file, resolve, onError, 'transactions');
      });
      
      expect(onError).not.toHaveBeenCalled();
      expect(data).toEqual([
        {
          ticker: 'MSFT',
          type: TransactionType.Buy,
          quantity: 15,
          price: 300,
          date: '2023-05-10',
          usdTryRate: 28.5,
        },
      ]);
    });

    it('should parse a CSV file into a StockPrices object', async () => {
      const csvContent = 'ticker,date,price\n"AMZN","2023-11-01",140\n"AMZN","2023-11-02",142.5';
      const file = new File([csvContent], 'prices.csv', { type: 'text/csv' });
      const onError = vi.fn();

      const data = await new Promise<StockPrices>(resolve => {
        importDataFromCsv<StockPrices>(file, resolve, onError, 'prices');
      });

      expect(onError).not.toHaveBeenCalled();
      expect(data).toEqual({
        'AMZN': [
          { date: '2023-11-01', price: 140 },
          { date: '2023-11-02', price: 142.5 },
        ]
      });
    });
    
    it('should call onError for a malformed prices CSV', async () => {
      const csvContent = 'stock,day,value\n"BAD","2023-11-01",140'; // Wrong headers
      const file = new File([csvContent], 'prices.csv', { type: 'text/csv' });
      const onDataLoaded = vi.fn();

      const errorMessage = await new Promise<string>(resolve => {
        importDataFromCsv<StockPrices>(file, onDataLoaded, resolve, 'prices');
      });

      expect(onDataLoaded).not.toHaveBeenCalled();
      expect(errorMessage).toContain('Invalid CSV headers for prices');
    });
  });
});