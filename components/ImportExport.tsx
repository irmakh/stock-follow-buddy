
import React, { useRef } from 'react';
import type { Transaction, StockPrices } from '../types';
import { exportData, importData, exportDataAsCsv, importDataFromCsv } from '../services/fileService';
import Button from './ui/Button';
import { useModal } from '../contexts/ModalContext';

interface ImportExportProps {
  transactions: Transaction[];
  stockPrices: StockPrices;
  onTransactionsImport: (data: Transaction[]) => void;
  onPricesImport: (data: StockPrices) => void;
  onBackupImport: (data: { transactions: Transaction[]; stockPrices: StockPrices }) => void;
  onReset: () => void;
}

const ImportExport: React.FC<ImportExportProps> = ({ transactions, stockPrices, onTransactionsImport, onPricesImport, onBackupImport, onReset }) => {
  const { showAlert, showConfirm } = useModal();
  const transactionJsonInputRef = useRef<HTMLInputElement>(null);
  const pricesJsonInputRef = useRef<HTMLInputElement>(null);
  const transactionCsvInputRef = useRef<HTMLInputElement>(null);
  const pricesCsvInputRef = useRef<HTMLInputElement>(null);
  const backupJsonInputRef = useRef<HTMLInputElement>(null);

  // JSON handlers
  const handleExportTransactionsJson = () => {
    if (transactions.length === 0) {
      showAlert('No Data', 'There are no transactions to export.');
      return;
    }
    try {
      exportData(transactions, 'transactions.json');
    } catch (e) {
      console.error(e);
      showAlert('Export Failed', 'An error occurred while exporting transactions.');
    }
  };
  const handleExportPricesJson = () => {
    if (Object.keys(stockPrices).length === 0) {
      showAlert('No Data', 'There is no price data to export.');
      return;
    }
    try {
      exportData(stockPrices, 'stock_prices.json');
    } catch (e) {
      console.error(e);
      showAlert('Export Failed', 'An error occurred while exporting stock prices.');
    }
  };
  
  // CSV handlers
  const handleExportTransactionsCsv = () => {
    if (transactions.length === 0) {
      showAlert('No Data', 'There are no transactions to export.');
      return;
    }
    try {
      exportDataAsCsv(transactions, 'transactions.csv', 'transactions');
    } catch (e) {
      console.error(e);
      showAlert('Export Failed', 'An error occurred while exporting transactions as CSV.');
    }
  };
  const handleExportPricesCsv = () => {
    if (Object.keys(stockPrices).length === 0) {
      showAlert('No Data', 'There is no price data to export.');
      return;
    }
    try {
      exportDataAsCsv(stockPrices, 'stock_prices.csv', 'prices');
    } catch (e) {
      console.error(e);
      showAlert('Export Failed', 'An error occurred while exporting stock prices as CSV.');
    }
  };

  const handleImportClick = (ref: React.RefObject<HTMLInputElement>) => ref.current?.click();

  const handleJsonFileImport = <T,>(event: React.ChangeEvent<HTMLInputElement>, onSuccess: (data: T) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      importData<T>(file, onSuccess, (message) => showAlert('Import Failed', message));
    }
    event.target.value = '';
  };
  
  const handleCsvFileImport = <T,>(event: React.ChangeEvent<HTMLInputElement>, onSuccess: (data: T) => void, type: 'transactions' | 'prices') => {
    const file = event.target.files?.[0];
    if (file) {
      importDataFromCsv<T>(file, onSuccess, (message) => showAlert('Import Failed', message), type);
    }
    event.target.value = '';
  };

  const handleDownloadBackup = () => {
    const backupData = {
      transactions,
      stockPrices,
    };
    try {
      exportData(backupData, 'stock_follow_buddy_backup.json');
      showAlert("Success", "Full backup downloaded successfully as 'stock_follow_buddy_backup.json'.");
    } catch(e) {
        console.error(e);
        showAlert('Backup Failed', 'An error occurred while downloading the backup.');
    }
  };

  const handleReset = () => {
    showConfirm(
      "Confirm Application Reset",
      <>
        <p className="mb-2">Are you sure you want to permanently reset the application?</p>
        <p className="font-semibold text-yellow-600 dark:text-yellow-400">All data will be deleted. This action cannot be undone.</p>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Consider creating a backup first.</p>
      </>,
      () => {
        onReset();
        showAlert('Reset Complete', 'The application has been reset to its initial state.');
      },
      "Yes, Reset Application",
      'danger'
    );
  };

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input type="file" ref={transactionJsonInputRef} className="hidden" accept=".json" onChange={(e) => handleJsonFileImport<Transaction[]>(e, onTransactionsImport)} />
      <input type="file" ref={pricesJsonInputRef} className="hidden" accept=".json" onChange={(e) => handleJsonFileImport<StockPrices>(e, onPricesImport)} />
      <input type="file" ref={transactionCsvInputRef} className="hidden" accept=".csv,text/csv" onChange={(e) => handleCsvFileImport<Transaction[]>(e, onTransactionsImport, 'transactions')} />
      <input type="file" ref={pricesCsvInputRef} className="hidden" accept=".csv,text/csv" onChange={(e) => handleCsvFileImport<StockPrices>(e, onPricesImport, 'prices')} />
      <input type="file" ref={backupJsonInputRef} className="hidden" accept=".json" onChange={(e) => handleJsonFileImport<{ transactions: Transaction[], stockPrices: StockPrices }>(e, onBackupImport)} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">Import Data</h4>
            <div className="space-y-2">
                <Button variant="secondary" onClick={() => handleImportClick(transactionJsonInputRef)} className="w-full justify-start">Import Transactions (.json)</Button>
                <Button variant="secondary" onClick={() => handleImportClick(transactionCsvInputRef)} className="w-full justify-start">Import Transactions (.csv)</Button>
            </div>
             <div className="space-y-2">
                <Button variant="secondary" onClick={() => handleImportClick(pricesJsonInputRef)} className="w-full justify-start">Import Prices (.json)</Button>
                <Button variant="secondary" onClick={() => handleImportClick(pricesCsvInputRef)} className="w-full justify-start">Import Prices (.csv)</Button>
            </div>
             <div className="space-y-2">
                <Button variant="secondary" onClick={() => handleImportClick(backupJsonInputRef)} className="w-full justify-start">Import Full Backup (.json)</Button>
            </div>
        </div>
        
        {/* Export Section */}
        <div className="space-y-4">
             <h4 className="font-semibold text-gray-800 dark:text-gray-200">Export Data</h4>
            <div className="space-y-2">
                <Button variant="secondary" onClick={handleExportTransactionsJson} className="w-full justify-start">Export Transactions (.json)</Button>
                <Button variant="secondary" onClick={handleExportTransactionsCsv} className="w-full justify-start">Export Transactions (.csv)</Button>
            </div>
             <div className="space-y-2">
                <Button variant="secondary" onClick={handleExportPricesJson} className="w-full justify-start">Export Prices (.json)</Button>
                <Button variant="secondary" onClick={handleExportPricesCsv} className="w-full justify-start">Export Prices (.csv)</Button>
            </div>
             <div className="space-y-2">
                <Button variant="secondary" onClick={handleDownloadBackup} className="w-full justify-start">Export Full Backup (.json)</Button>
            </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700/50 my-6"></div>

      {/* Danger Zone Section */}
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h4>
          <p className="text-sm text-red-800 dark:text-gray-300 mt-1 mb-4 max-w-prose">This will permanently delete all your data stored in this browser. This action cannot be undone. Please create a backup first.</p>
          <Button variant="danger" onClick={handleReset}>Reset Application</Button>
      </div>
    </div>
  );
};

export default ImportExport;
