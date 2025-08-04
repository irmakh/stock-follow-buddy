import React from 'react';
import type { Transaction, StockPrices } from '../types';
import { exportData } from '../services/fileService';
import Button from './ui/Button';
import Card from './ui/Card';

interface BackupAndResetProps {
  transactions: Transaction[];
  stockPrices: StockPrices;
  onReset: () => void;
}

const BackupAndReset: React.FC<BackupAndResetProps> = ({ transactions, stockPrices, onReset }) => {
  const handleDownloadBackup = () => {
    const backupData = {
      transactions,
      stockPrices,
    };
    exportData(backupData, 'stock_follow_buddy_backup.json');
    alert("Backup data downloaded successfully as 'stock_follow_buddy_backup.json'.");
  };

  const handleReset = () => {
    const confirmation = window.confirm(
      "Are you sure you want to permanently reset the application?\n\n" +
      "All data will be deleted. This action cannot be undone.\n\n" +
      "Consider using the 'Download All Data' button to create a backup first."
    );

    if (confirmation) {
      onReset();
      alert("Application has been reset.");
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-2 text-red-400">Danger Zone</h3>
      <p className="text-gray-400 mb-4 text-sm">
        You can download a backup of all your data or reset the application to its initial state. Resetting will permanently delete all data stored in your browser.
      </p>
      <div className="flex flex-wrap gap-4">
        <Button variant="secondary" onClick={handleDownloadBackup}>
          Download All Data
        </Button>
        <Button variant="danger" onClick={handleReset}>
          Reset Application
        </Button>
      </div>
    </Card>
  );
};

export default BackupAndReset;
