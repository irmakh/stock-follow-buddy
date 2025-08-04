

import React, { useState, useEffect } from 'react';

interface TickerSelectProps {
  value: string;
  onChange: (value: string) => void;
  knownTickers: string[];
  id: string;
  label?: string;
}

const TickerSelect: React.FC<TickerSelectProps> = ({ value, onChange, knownTickers, id, label = "Ticker" }) => {
  const [isOther, setIsOther] = useState(false);

  useEffect(() => {
    // This effect ensures the component's mode is always in sync with the value.
    // If the parent component clears the value (e.g., after form submission),
    // ensure we switch out of "other" mode. This fixes the bug.
    if (!value) {
      setIsOther(false);
    } else if (!knownTickers.includes(value)) {
      // If we have a value and it's not a known ticker (i.e., it's a new one),
      // ensure we are in "other" mode.
      setIsOther(true);
    } else {
      // If the value is a known ticker, we should not be in "other" mode.
      setIsOther(false);
    }
  }, [value, knownTickers]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === 'other') {
      // Set the mode directly and clear the value to prepare for user input.
      setIsOther(true);
      onChange('');
    } else {
      // When selecting a known ticker, ensure we are not in "other" mode.
      setIsOther(false);
      onChange(selectedValue);
    }
  };
  
  const commonInputStyle = "mt-1 block w-full bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white p-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <select
        id={id}
        value={isOther ? 'other' : value}
        onChange={handleSelectChange}
        className={commonInputStyle}
        style={{ display: isOther ? 'none' : 'block' }}
      >
        <option value="">Select a ticker...</option>
        {knownTickers.map(ticker => (
          <option key={ticker} value={ticker}>{ticker}</option>
        ))}
        <option value="other">Other (New Ticker)...</option>
      </select>
      {isOther && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          placeholder="Enter new ticker symbol"
          className={commonInputStyle}
          autoFocus
        />
      )}
    </div>
  );
};

export default TickerSelect;