
import type { Transaction, StockPrices, PriceHistoryItem } from '../types';
import { TransactionType } from '../types';


export const exportData = (data: unknown, fileName: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importData = <T,>(
  file: File,
  onDataLoaded: (data: T) => void,
  onError: (message: string) => void
): void => {
  if (!file) {
    onError('No file selected.');
    return;
  }

  if (file.type !== 'application/json') {
    onError('Invalid file type. Please select a JSON file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const data = JSON.parse(content) as T;
        onDataLoaded(data);
      } else {
        onError('Failed to read file content.');
      }
    } catch (e) {
      onError('Failed to parse JSON file. Please ensure it has the correct format.');
    }
  };
  reader.onerror = () => {
    onError('Error reading file.');
  };
  reader.readAsText(file);
};

// --- CSV ---

const arrayToCsv = (data: Record<string, any>[]): string => {
  if (data.length === 0) return '';
  // Collect all unique keys from all objects to create a complete and consistent header row.
  const headersSet = new Set<string>();
  data.forEach(row => Object.keys(row).forEach(key => headersSet.add(key)));
  
  // A consistent header order is better for readability and testing.
  const preferredOrder = ['id', 'ticker', 'type', 'quantity', 'price', 'date', 'usdTryRate', 'commissionRate'];
  const headers = Array.from(headersSet).sort((a, b) => {
      const indexA = preferredOrder.indexOf(a);
      const indexB = preferredOrder.indexOf(b);
      if (indexA > -1 && indexB > -1) return indexA - indexB; // Both in preferred, sort by it
      if (indexA > -1) return -1; // a is preferred, b is not
      if (indexB > -1) return 1;  // b is preferred, a is not
      return a.localeCompare(b); // a and b are both not preferred, sort alphabetically
  });

  const csvRows = [
    headers.join(','), // header row
    ...data.map(row => 
      headers.map(fieldName => {
        const value = row[fieldName];
        if (value === undefined || value === null) {
            return '';
        }
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ];
  return csvRows.join('\r\n');
};

const pricesObjectToCsv = (data: StockPrices): string => {
    const headers = ['ticker', 'date', 'price'];
    const csvRows = [headers.join(',')];
    Object.entries(data)
        .sort((a, b) => a[0].localeCompare(b[0])) // Sort by ticker for deterministic output
        .forEach(([ticker, history]) => {
            history.forEach(pricePoint => {
                csvRows.push([`"${ticker}"`, `"${pricePoint.date}"`, pricePoint.price].join(','));
            });
    });
    return csvRows.join('\r\n');
}

export const exportDataAsCsv = (data: unknown, fileName: string, type: 'transactions' | 'prices'): void => {
  let csvString = '';
  // Empty data check is now handled by the caller.
  if (type === 'transactions' && Array.isArray(data)) {
      csvString = arrayToCsv(data as Record<string, any>[]);
  } else if (type === 'prices' && typeof data === 'object' && data !== null && !Array.isArray(data)) {
      csvString = pricesObjectToCsv(data as StockPrices);
  } else {
      throw new Error('Unsupported data type for CSV export.');
  }

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const parseCsvLine = (line: string): string[] => {
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    return line.split(regex).map(field => {
        let value = field.trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
        }
        return value;
    });
};

const csvToTransactions = (csv: string): Partial<Transaction>[] => {
  const lines = csv.split(/\r\n|\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const transaction: { [key: string]: any } = {};
    headers.forEach((header, index) => {
      let value: any = values[index];
      if (header === 'quantity' || header === 'price' || header === 'usdTryRate' || header === 'commissionRate') {
        value = value ? parseFloat(value) : undefined;
      } else if (header === 'type' && value) {
        const upperValue = value.toUpperCase();
        if (upperValue === TransactionType.Buy || upperValue === TransactionType.Sell) {
             value = upperValue;
        }
      }
      transaction[header.trim()] = value;
    });
    return transaction as Partial<Transaction>;
  });
};

const csvToPrices = (csv: string): StockPrices => {
  const lines = csv.split(/\r\n|\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return {};

  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  if (headers[0] !== 'ticker' || headers[1] !== 'date' || headers[2] !== 'price') {
    throw new Error('Invalid CSV headers for prices. Expected "ticker,date,price".');
  }

  const prices: StockPrices = {};
  lines.slice(1).forEach(line => {
    const [ticker, date, priceStr] = parseCsvLine(line);
    const price = parseFloat(priceStr);
    if (ticker && date && !isNaN(price)) {
      const trimmedTicker = ticker.trim();
      if (!prices[trimmedTicker]) {
          prices[trimmedTicker] = [];
      }
      prices[trimmedTicker].push({ date: date.trim(), price });
    }
  });

  return prices;
};

export const importDataFromCsv = <T,>(
  file: File,
  onDataLoaded: (data: T) => void,
  onError: (message: string) => void,
  type: 'transactions' | 'prices'
): void => {
  if (!file) {
    onError('No file selected.');
    return;
  }

  if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
    onError('Invalid file type. Please select a CSV file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const content = event.target?.result;
      if (typeof content === 'string') {
        let data;
        if (type === 'transactions') {
            data = csvToTransactions(content);
        } else if (type === 'prices') {
            data = csvToPrices(content);
        } else {
            throw new Error('Unsupported import type');
        }
        onDataLoaded(data as T);
      } else {
        onError('Failed to read file content.');
      }
    } catch (e: any) {
      onError(`Failed to parse CSV file. ${e.message || 'Please ensure it has the correct format.'}`);
    }
  };
  reader.onerror = () => {
    onError('Error reading file.');
  };
  reader.readAsText(file);
};