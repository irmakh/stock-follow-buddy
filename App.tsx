

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Transaction, StockPrices, PriceHistoryItem } from './types';
import { TransactionType } from './types';
import { usePortfolio } from './hooks/usePortfolio';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PortfolioView from './components/PortfolioView';
import AccountingView from './components/AccountingView';
import ActionsView from './components/ActionsView';
import SettingsView from './components/SettingsView';
import BottomNavBar from './components/BottomNavBar';
import DevWarningBanner from './components/DevWarningBanner';
import { useModal } from './contexts/ModalContext';
import { useTheme } from './contexts/ThemeContext';
import { useNotification } from './contexts/NotificationContext';

type View = 'dashboard' | 'transactions' | 'actions' | 'accounting' | 'settings';
type DisplayCurrency = 'TRY' | 'USD';

// --- Validation Helpers ---

const validateTransactions = (data: any[]): { isValid: boolean, transformedData: Transaction[] | null } => {
    if (!Array.isArray(data)) return { isValid: false, transformedData: null };
    
    const transformedData = data.map((t, index) => ({
        id: t.id || `${new Date().toISOString()}-${index}`,
        ticker: t.ticker,
        type: (t.type || '').toUpperCase() === 'SELL' ? TransactionType.Sell : TransactionType.Buy,
        quantity: parseFloat(t.quantity),
        price: parseFloat(t.price),
        date: t.date,
        usdTryRate: t.usdTryRate ? parseFloat(t.usdTryRate) : undefined,
    }));

    const isValid = transformedData.every(t =>
      t.ticker && t.type && !isNaN(t.quantity) && !isNaN(t.price) && t.date && !isNaN(Date.parse(t.date))
    );

    return { isValid, transformedData: isValid ? transformedData as Transaction[] : null };
};

const validatePrices = (data: any): { isValid: boolean, transformedData: StockPrices | null } => {
    if(typeof data !== 'object' || data === null || Array.isArray(data)) return { isValid: false, transformedData: null };
    
    const isValid = Object.entries(data).every(([, history]) => 
        Array.isArray(history) &&
        (history as any[]).every(p => 
            typeof p === 'object' && p !== null &&
            typeof p.date === 'string' && !isNaN(Date.parse(p.date)) &&
            typeof p.price === 'number' && !isNaN(p.price)
        )
    );

    if (!isValid) return { isValid: false, transformedData: null };

    // Create a new object to avoid mutating the original data from the import
    const sortedData = JSON.parse(JSON.stringify(data));
    Object.keys(sortedData).forEach(ticker => {
        if (Array.isArray(sortedData[ticker])) {
            sortedData[ticker].sort((a: PriceHistoryItem, b: PriceHistoryItem) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
    });
    return { isValid: true, transformedData: sortedData as StockPrices };
}


const App: React.FC = () => {
  const { showAlert, showConfirm } = useModal();
  const { showNotification } = useNotification();
  const { theme, toggleTheme } = useTheme();

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [stockPrices, setStockPrices] = useState<StockPrices>(() => {
    const saved = localStorage.getItem('stockPrices');
    try {
      const parsed = saved ? JSON.parse(saved) : {};
      // Ensure prices are sorted by date on load for consistency
      Object.keys(parsed).forEach(ticker => {
          if (Array.isArray(parsed[ticker])) {
            parsed[ticker].sort((a: PriceHistoryItem, b: PriceHistoryItem) => new Date(a.date).getTime() - new Date(b.date).getTime());
          }
      });
      return parsed;
    } catch {
      return {};
    }
  });

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [previousView, setPreviousView] = useState<View>('dashboard');
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('TRY');
  const [currentUsdTryRate, setCurrentUsdTryRate] = useState<number>(() => {
    const saved = localStorage.getItem('currentUsdTryRate');
    return saved ? parseFloat(saved) : 32.5; // Default rate
  });

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('stockPrices', JSON.stringify(stockPrices));
  }, [stockPrices]);

  useEffect(() => {
    localStorage.setItem('currentUsdTryRate', currentUsdTryRate.toString());
  }, [currentUsdTryRate]);

  const showOfflineRateModal = useCallback(() => {
    let newRate = currentUsdTryRate;

    const RateInputComponent = () => {
        const [rateInput, setRateInput] = useState(String(currentUsdTryRate));

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setRateInput(val);
            const parsed = parseFloat(val);
            if (!isNaN(parsed) && parsed > 0) {
                newRate = parsed;
            }
        };

        return (
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    We couldn't fetch the latest USD/TRY exchange rate, likely due to being offline.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    The application will use the last known rate of <strong>{currentUsdTryRate.toFixed(4)}</strong>. If this is incorrect, you can update it manually below.
                </p>
                <div>
                    <label htmlFor="offline-rate-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Manual USD/TRY Rate
                    </label>
                    <input
                        id="offline-rate-input"
                        type="number"
                        step="any"
                        value={rateInput}
                        onChange={handleInputChange}
                        className="mt-1 block w-full bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white p-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 32.5"
                    />
                </div>
            </div>
        );
    };

    showConfirm(
        "Currency Rate Update",
        <RateInputComponent />,
        () => { // onConfirm
            setCurrentUsdTryRate(newRate);
            showNotification(`Rate manually set to ${newRate.toFixed(4)}.`, 'info');
        },
        "Use This Rate",
        'primary'
    );
  }, [currentUsdTryRate, showConfirm, showNotification, setCurrentUsdTryRate]);
  
  // Auto-fetch currency rate on app load
  useEffect(() => {
    const fetchRate = async () => {
        try {
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            if (data.result === 'success' && data.rates?.TRY) {
                setCurrentUsdTryRate(data.rates.TRY);
                showNotification('USD/TRY rate updated automatically.', 'info');
            } else {
                throw new Error('Invalid API response');
            }
        } catch (err) {
            console.error("Failed to auto-fetch currency rate:", err);
            showOfflineRateModal();
        }
    };
    fetchRate();
  }, [showNotification, showOfflineRateModal]);

  const { portfolio, realizedGains } = usePortfolio(transactions, stockPrices, currentUsdTryRate);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...transaction, id: new Date().toISOString() + Math.random() }]);
    showNotification(`Transaction for ${transaction.ticker} added successfully!`, 'success');
  };

  const addStockPrice = (ticker: string, price: number, date: string) => {
    setStockPrices(prev => {
        const newPrices = { ...prev };
        const history = newPrices[ticker] ? [...newPrices[ticker]] : [];
        
        const existingIndex = history.findIndex(p => p.date === date);
        if (existingIndex > -1) {
            history[existingIndex] = { date, price };
        } else {
            history.push({ date, price });
        }

        history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        newPrices[ticker] = history;
        return newPrices;
    });
    showNotification(`Price for ${ticker} on ${date} updated!`, 'success');
  };

  const handleTransactionsImport = (data: any[]) => {
    const { isValid, transformedData } = validateTransactions(data);
    if (isValid && transformedData) {
        setTransactions(transformedData);
        showAlert('Success', 'Transactions imported successfully!');
    } else {
        showAlert('Import Failed', 'Invalid transaction file content. Please check data types and required fields (ticker, type, quantity, price, date).');
    }
  };

  const handlePricesImport = (data: any) => {
    const { isValid, transformedData } = validatePrices(data);
    if(isValid && transformedData) {
        setStockPrices(transformedData);
        showAlert('Success', 'Stock prices imported successfully!');
    } else {
        showAlert('Import Failed', 'Invalid stock prices file format or content. Should be an object where keys are tickers and values are arrays of {date, price} objects.');
    }
  };
  
  const handleBackupImport = (data: any) => {
    const isBackupShapeValid = data && typeof data === 'object' && !Array.isArray(data) && 'transactions' in data && 'stockPrices' in data;
    if (!isBackupShapeValid) {
        showAlert('Import Failed', 'Invalid backup file format. Expected a JSON file with "transactions" and "stockPrices" properties.');
        return;
    }

    const { transactions: importedTransactions, stockPrices: importedPrices } = data;
    
    const transactionsValidation = validateTransactions(importedTransactions);
    const pricesValidation = validatePrices(importedPrices);

    if (transactionsValidation.isValid && pricesValidation.isValid) {
        setTransactions(transactionsValidation.transformedData!);
        setStockPrices(pricesValidation.transformedData!);
        showAlert('Success', 'Backup data imported successfully!');
    } else {
        let errorMessages = [];
        if (!transactionsValidation.isValid) errorMessages.push("Transactions data is invalid.");
        if (!pricesValidation.isValid) errorMessages.push("Stock prices data is invalid.");
        showAlert('Import Failed', `The backup file contains invalid data. ${errorMessages.join(' ')}`);
    }
  };

  const handleResetApplication = () => {
    localStorage.clear(); // Clear all app-related storage
    setTransactions([]);
    setStockPrices({});
    setCurrentUsdTryRate(32.5);
    setDisplayCurrency('TRY');
    setActiveView('dashboard');
    // We don't reset theme to allow user preference to persist.
  };

  const changeView = (newView: View) => {
    setActiveView(newView);
  };

  const toggleSettingsView = () => {
    if (activeView === 'settings') {
      setActiveView(previousView);
    } else {
      setPreviousView(activeView);
      setActiveView('settings');
    }
  };

  const renderActiveView = () => {
    switch(activeView) {
      case 'dashboard':
        return <Dashboard portfolio={portfolio} stockPrices={stockPrices} displayCurrency={displayCurrency} />;
      case 'transactions':
        return <PortfolioView 
            portfolio={portfolio}
            transactions={transactions}
            stockPrices={stockPrices}
            displayCurrency={displayCurrency}
          />;
      case 'actions':
        return <ActionsView 
            transactions={transactions}
            stockPrices={stockPrices}
            addTransaction={addTransaction}
            addStockPrice={addStockPrice}
            currentUsdTryRate={currentUsdTryRate}
        />;
      case 'accounting':
        return <AccountingView realizedGains={realizedGains} displayCurrency={displayCurrency} />;
      case 'settings':
          return <SettingsView 
            displayCurrency={displayCurrency}
            setDisplayCurrency={setDisplayCurrency}
            currentUsdTryRate={currentUsdTryRate}
            setCurrentUsdTryRate={setCurrentUsdTryRate}
            transactions={transactions}
            stockPrices={stockPrices}
            onTransactionsImport={handleTransactionsImport}
            onPricesImport={handlePricesImport}
            onBackupImport={handleBackupImport}
            onReset={handleResetApplication}
            theme={theme}
            toggleTheme={toggleTheme}
          />
      default:
        return <Dashboard portfolio={portfolio} stockPrices={stockPrices} displayCurrency={displayCurrency} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="sticky top-0 z-20">
        <DevWarningBanner />
        <Header
          activeView={activeView}
          setActiveView={changeView}
          toggleSettingsView={toggleSettingsView}
        />
      </div>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        <div key={activeView} className="animate-fade-in">
          {renderActiveView()}
        </div>
      </main>
      <BottomNavBar activeView={activeView} setActiveView={changeView} />
    </div>
  );
};

export default App;