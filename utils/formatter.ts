export const formatCurrency = (value: number, signDisplay: 'auto' | 'always' | 'never' | 'exceptZero' = 'auto', currency: 'TRY' | 'USD' = 'TRY'): string => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    signDisplay,
    minimumFractionDigits: 2,
    maximumFractionDigits: currency === 'USD' ? 4 : 6,
  };
    
  if (currency === 'USD') {
    options.currencyDisplay = 'symbol';
  }

  return new Intl.NumberFormat(currency === 'TRY' ? 'tr-TR' : 'en-US', options).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(4)}%`;
};