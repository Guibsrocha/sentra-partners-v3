import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Currency, ExchangeRates, useCurrencyRates, convertCurrency } from '@/hooks/useCurrency';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rates: ExchangeRates;
  loading: boolean;
  lastUpdate: Date | null;
  refresh: () => void;
  formatCurrency: (value: number, sourceCurrency?: Currency) => string;
  convertAmount: (amount: number, from: Currency, to: Currency) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('selected_currency');
    return (saved as Currency) || 'USD';
  });

  const { rates, loading, lastUpdate, refresh } = useCurrencyRates();

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('selected_currency', newCurrency);
  };

  const formatCurrency = (value: number, sourceCurrency: Currency = 'USD'): string => {
    const convertedValue = convertCurrency(value, sourceCurrency, currency, rates);
    
    const currencySymbols: Record<Currency, string> = {
      USD: '$',
      BRL: 'R$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'CHF',
      CNY: '¥',
      INR: '₹',
      MXN: 'MX$',
      ARS: 'AR$',
      CLP: 'CL$',
      COP: 'CO$',
      PEN: 'S/',
      UYU: 'UY$',
    };

    const symbol = currencySymbols[currency];
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedValue);

    return `${symbol}${formatted}`;
  };

  const convertAmount = (amount: number, from: Currency, to: Currency): number => {
    return convertCurrency(amount, from, to, rates);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: handleSetCurrency,
        rates,
        loading,
        lastUpdate,
        refresh,
        formatCurrency,
        convertAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}

