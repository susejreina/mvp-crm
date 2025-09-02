import { useState, useEffect } from 'react';

export function useUsdFieldLogic(currency: string, saleValue: string) {
  const [usdAmount, setUsdAmount] = useState<string>('');

  // Update USD amount when currency is USD or sale value changes
  useEffect(() => {
    if (currency === 'USD' && saleValue) {
      setUsdAmount(saleValue);
    } else if (currency !== 'USD') {
      // Keep the current usdAmount value when currency is not USD
    } else {
      setUsdAmount('');
    }
  }, [currency, saleValue]);

  const isUsdDisabled = currency === 'USD';

  const handleUsdAmountChange = (value: string) => {
    if (!isUsdDisabled) {
      // Only allow numbers, dots, and commas
      if (/^[\d.,]*$/.test(value)) {
        setUsdAmount(value);
      }
    }
  };

  return {
    usdAmount,
    setUsdAmount,
    isUsdDisabled,
    handleUsdAmountChange,
  };
}