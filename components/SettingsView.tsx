

import React, { useState } from 'react';
import type { Transaction, StockPrices, Theme } from '../types';
import ImportExport from './ImportExport';
import Card from './ui/Card';
import { useModal } from '../contexts/ModalContext';

type DisplayCurrency = 'TRY' | 'USD';

interface SettingsViewProps {
    displayCurrency: DisplayCurrency;
    setDisplayCurrency: (currency: DisplayCurrency) => void;
    currentUsdTryRate: number;
    setCurrentUsdTryRate: (rate: number) => void;
    transactions: Transaction[];
    stockPrices: StockPrices;
    onTransactionsImport: (data: Transaction[]) => void;
    onPricesImport: (data: StockPrices) => void;
    onBackupImport: (data: { transactions: Transaction[]; stockPrices: StockPrices }) => void;
    onReset: () => void;
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeSwitcher: React.FC<{ theme: Theme; toggleTheme: () => void; }> = ({ theme, toggleTheme }) => {
    return (
        <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Switch Theme
            </span>
            <button
                onClick={toggleTheme}
                className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-gray-300 dark:bg-gray-600"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                <span className={`${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                />
            </button>
        </div>
    );
}

const CurrencySwitcher: React.FC<{
    displayCurrency: DisplayCurrency;
    setDisplayCurrency: (c: DisplayCurrency) => void;
}> = ({ displayCurrency, setDisplayCurrency }) => {
    return (
        <div className="flex items-center bg-gray-200 dark:bg-gray-900 p-1 rounded-lg">
            <button 
                onClick={() => setDisplayCurrency('TRY')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors w-1/2 ${displayCurrency === 'TRY' ? 'bg-blue-600 text-white' : 'text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
            >
                TRY
            </button>
            <button 
                onClick={() => setDisplayCurrency('USD')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors w-1/2 ${displayCurrency === 'USD' ? 'bg-blue-600 text-white' : 'text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
            >
                USD
            </button>
        </div>
    )
}

const RateEditor: React.FC<{
    currentRate: number;
    setCurrentRate: (rate: number) => void;
}> = ({ currentRate, setCurrentRate }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { showAlert } = useModal();

    const handleFetchRate = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            if (!response.ok) {
                throw new Error(`API request failed with status: ${response.status}`);
            }
            const data = await response.json();
            if (data.result === 'success' && data.rates && typeof data.rates.TRY === 'number') {
                setCurrentRate(data.rates.TRY);
            } else {
                throw new Error(data['error-type'] || 'Invalid API response format.');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            showAlert('Fetch Error', `Could not fetch the currency rate. Reason: ${errorMessage}`);
            console.error("Failed to fetch currency rate:", err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-2">
            <label htmlFor="header-usd-try" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current USD/TRY Rate
            </label>
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-md shadow-sm">
                <input
                    type="number"
                    id="header-usd-try"
                    value={currentRate}
                    onChange={e => setCurrentRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent border-none rounded-l-md text-gray-900 dark:text-white py-2 px-3 text-sm focus:ring-0"
                    step="any"
                    aria-label="Current USD to TRY exchange rate"
                    disabled={isLoading}
                />
                <button
                    onClick={handleFetchRate}
                    disabled={isLoading}
                    className="px-3 py-2 text-sm font-semibold rounded-r-md transition-colors bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-blue-600 disabled:opacity-75 disabled:cursor-wait flex items-center justify-center h-full"
                    style={{ minWidth: '60px' }}
                    title="Get latest rate from API"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        'Get'
                    )}
                </button>
            </div>
        </div>
    );
};


const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const { displayCurrency, setDisplayCurrency, currentUsdTryRate, setCurrentUsdTryRate, theme, toggleTheme, ...importExportProps } = props;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>

            <Card>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Display Options</h3>
                <div className="space-y-4">
                    <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Currency</label>
                        <CurrencySwitcher displayCurrency={displayCurrency} setDisplayCurrency={setDisplayCurrency} />
                    </div>
                    <RateEditor currentRate={currentUsdTryRate} setCurrentRate={setCurrentUsdTryRate} />
                </div>
            </Card>

            <Card>
                 <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Data Management</h3>
                 <ImportExport {...importExportProps} />
            </Card>
        </div>
    );
};

export default SettingsView;