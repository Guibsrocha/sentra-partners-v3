import { useState, useEffect } from 'react';

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  BRL: 5.50,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CNY: 7.24,
  INR: 83.12,
  KRW: 1320.50,
  CAD: 1.36,
  MXN: 17.05,
  ARS: 350.00,
  CLP: 920.00,
  COP: 3950.00,
  PEN: 3.75,
  UYU: 39.50,
  AUD: 1.52,
  CHF: 0.88,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  BRL: 'R$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  KRW: '₩',
  CAD: 'C$',
  MXN: 'MX$',
  ARS: 'AR$',
  CLP: 'CL$',
  COP: 'CO$',
  PEN: 'S/',
  UYU: 'UY$',
  AUD: 'A$',
  CHF: 'CHF',
};

export function useCurrencyConversion(currency: string) {
  const convertPrice = (usdPrice: number): string => {
    // Preços já chegam em dólares da API
    const rate = EXCHANGE_RATES[currency] || 1;
    const converted = usdPrice * rate;
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    
    return `${symbol}${converted.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatWithConversion = (usdPrice: number): { primary: string; conversion: string | null } => {
    // Preços já chegam em dólares da API
    const usdFormatted = `$${usdPrice.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} USD`;

    if (currency === 'USD') {
      return { primary: usdFormatted, conversion: null };
    }

    const converted = convertPrice(usdPrice);
    return {
      primary: usdFormatted,
      conversion: `${converted} ${currency}`
    };
  };

  return { convertPrice, formatWithConversion };
}
