import { useState, useEffect } from 'react';

export type Currency = 'USD' | 'BRL' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'INR' | 'MXN' | 'ARS' | 'CLP' | 'COP' | 'PEN' | 'UYU';

export interface ExchangeRates {
  USD: number;
  BRL: number;
  EUR: number;
  GBP: number;
  JPY: number;
  CAD: number;
  AUD: number;
  CHF: number;
  CNY: number;  // Yuan Chinês
  INR: number;  // Rúpia Indiana
  MXN: number;  // Peso Mexicano
  ARS: number;  // Peso Argentino
  CLP: number;  // Peso Chileno
  COP: number;  // Peso Colombiano
  PEN: number;  // Sol Peruano
  UYU: number;  // Peso Uruguaio
}

const CACHE_KEY = 'exchange_rates';
const CACHE_DURATION = 60000; // 1 minuto

export function useCurrencyRates() {
  const [rates, setRates] = useState<ExchangeRates>({
    USD: 1.0,
    BRL: 5.0,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.0,
    CAD: 1.36,
    AUD: 1.52,
    CHF: 0.88,
    CNY: 7.24,
    INR: 83.12,
    MXN: 17.0,
    ARS: 350.0,
    CLP: 900.0,
    COP: 3900.0,
    PEN: 3.7,
    UYU: 39.0,
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchRates = async () => {
    try {
      setLoading(true);

      // Busca todas as moedas da exchangerate-api (gratuita e suporta todas as moedas)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();

      const newRates: ExchangeRates = {
        USD: 1.0,
        BRL: parseFloat(data.rates?.BRL || '5.0'),
        EUR: parseFloat(data.rates?.EUR || '0.92'),
        GBP: parseFloat(data.rates?.GBP || '0.79'),
        JPY: parseFloat(data.rates?.JPY || '149.0'),
        CAD: parseFloat(data.rates?.CAD || '1.36'),
        AUD: parseFloat(data.rates?.AUD || '1.52'),
        CHF: parseFloat(data.rates?.CHF || '0.88'),
        CNY: parseFloat(data.rates?.CNY || '7.24'),
        INR: parseFloat(data.rates?.INR || '83.12'),
        MXN: parseFloat(data.rates?.MXN || '17.0'),
        ARS: parseFloat(data.rates?.ARS || '350.0'),
        CLP: parseFloat(data.rates?.CLP || '900.0'),
        COP: parseFloat(data.rates?.COP || '3900.0'),
        PEN: parseFloat(data.rates?.PEN || '3.7'),
        UYU: parseFloat(data.rates?.UYU || '39.0'),
      };

      setRates(newRates);
      setLastUpdate(new Date());

      // Salva no cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates: newRates,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      
      // Tenta carregar do cache em caso de erro
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rates: cachedRates } = JSON.parse(cached);
        setRates(cachedRates);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verifica cache primeiro
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rates: cachedRates, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age < CACHE_DURATION) {
        setRates(cachedRates);
        setLastUpdate(new Date(timestamp));
        return;
      }
    }

    // Busca cotações
    fetchRates();

    // Atualiza a cada 1 minuto
    const interval = setInterval(fetchRates, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  return { rates, loading, lastUpdate, refresh: fetchRates };
}

export function convertCurrency(amount: number, from: Currency, to: Currency, rates: ExchangeRates): number {
  if (from === to) return amount;
  
  // Converte para USD primeiro, depois para moeda de destino
  const amountInUSD = amount / rates[from];
  return amountInUSD * rates[to];
}

