import React, { useState, useEffect } from 'react';
import type { Transaction, StockPrices } from '../types';
import { TransactionType } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';
import TickerSelect from './ui/TickerSelect';
import { useModal } from '../contexts/ModalContext';

interface ActionsViewProps {
  transactions: Transaction[];
  stockPrices: StockPrices;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addStockPrice: (ticker: string, price: number, date: string) => void;
  currentUsdTryRate: number;
}

const AddTransactionForm: React.FC<{
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  knownTickers: string[];
  currentUsdTryRate: number;
}> = ({ addTransaction, knownTickers, currentUsdTryRate }) => {
  const { showAlert } = useModal();
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.Buy);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [usdTryRate, setUsdTryRate] = useState('');
  
  const commonInputStyle = "mt-1 block w-full bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white p-2 focus:ring-blue-500 focus:border-blue-500";
  const labelStyle = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !quantity || !price || !date) {
      showAlert('Invalid Input', 'Please fill all required fields.');
      return;
    }
    addTransaction({
      ticker: ticker.toUpperCase(),
      type,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      date,
      usdTryRate: usdTryRate ? parseFloat(usdTryRate) : currentUsdTryRate,
    });
    setTicker('');
    setQuantity('');
    setPrice('');
    setUsdTryRate('');
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Transaction</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="md:col-span-2 lg:col-span-1">
          <TickerSelect id="transaction-ticker" value={ticker} onChange={setTicker} knownTickers={knownTickers} />
        </div>
        <div>
          <label htmlFor="type" className={labelStyle}>Type</label>
          <select id="type" value={type} onChange={e => setType(e.target.value as TransactionType)} className={commonInputStyle}>
            <option value={TransactionType.Buy}>Buy</option>
            <option value={TransactionType.Sell}>Sell</option>
          </select>
        </div>
        <div>
          <label htmlFor="quantity" className={labelStyle}>Quantity</label>
          <input type="number" step="any" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value)} className={commonInputStyle} required />
        </div>
        <div>
          <label htmlFor="price" className={labelStyle}>Price (TRY)</label>
          <input type="number" step="any" id="price" value={price} onChange={e => setPrice(e.target.value)} className={commonInputStyle} required />
        </div>
         <div>
          <label htmlFor="date" className={labelStyle}>Date</label>
          <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className={`${commonInputStyle} [color-scheme:dark] dark:[color-scheme:dark]`} required />
        </div>
        <div>
          <label htmlFor="usdTryRate" className={labelStyle}>USD/TRY Rate (Optional)</label>
          <input type="number" step="any" id="usdTryRate" placeholder={`Current: ${currentUsdTryRate}`} value={usdTryRate} onChange={e => setUsdTryRate(e.target.value)} className={commonInputStyle} />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <Button type="submit" className="w-full mt-2">Add Transaction</Button>
        </div>
      </form>
    </Card>
  );
};

const UpdatePricesForm: React.FC<{
  addStockPrice: (ticker: string, price: number, date: string) => void;
  knownTickers: string[];
}> = ({ addStockPrice, knownTickers }) => {
  const { showAlert } = useModal();
  const [ticker, setTicker] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const commonInputStyle = "mt-1 block w-full bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white p-2 focus:ring-blue-500 focus:border-blue-500";
  const labelStyle = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  useEffect(() => {
    if(!ticker && knownTickers.length > 0) {
        setTicker(knownTickers[0]);
    }
  }, [knownTickers, ticker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !price || !date) {
      showAlert('Invalid Input', 'Please fill all fields for updating price.');
      return;
    }
    addStockPrice(ticker.toUpperCase(), parseFloat(price), date);
    setPrice('');
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Update Stock Price (TRY)</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div className="sm:col-span-2 md:col-span-1">
            <TickerSelect id="price-ticker" value={ticker} onChange={setTicker} knownTickers={knownTickers} />
        </div>
        <div>
          <label htmlFor="price-date" className={labelStyle}>Date</label>
          <input type="date" id="price-date" value={date} onChange={e => setDate(e.target.value)} className={`${commonInputStyle} [color-scheme:dark] dark:[color-scheme:dark]`} required />
        </div>
        <div>
          <label htmlFor="price-value" className={labelStyle}>Price (TRY)</label>
          <input type="number" step="any" id="price-value" value={price} onChange={e => setPrice(e.target.value)} className={commonInputStyle} required />
        </div>
        <Button type="submit" className="w-full">Update Price</Button>
      </form>
    </Card>
  );
}

const ActionsView: React.FC<ActionsViewProps> = ({ transactions, stockPrices, addTransaction, addStockPrice, currentUsdTryRate }) => {
  const knownTickers = Array.from(new Set(transactions.map(t => t.ticker).concat(Object.keys(stockPrices)))).sort();

  return (
    <div className="space-y-6">
      <AddTransactionForm addTransaction={addTransaction} knownTickers={knownTickers} currentUsdTryRate={currentUsdTryRate} />
      <UpdatePricesForm addStockPrice={addStockPrice} knownTickers={knownTickers} />
    </div>
  );
};

export default ActionsView;