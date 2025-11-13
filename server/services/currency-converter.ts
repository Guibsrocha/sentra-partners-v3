/**
 * Serviço de conversão de moeda com API real
 * Usa AwesomeAPI para taxas de câmbio atualizadas
 */

interface ExchangeRate {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}

interface CachedRate {
  rate: number;
  timestamp: number;
}

// Cache de taxas de câmbio (válido por 1 hora)
const rateCache: Map<string, CachedRate> = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora em milissegundos

/**
 * Moedas suportadas
 */
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: "$", name: "Dólar Americano" },
  BRL: { symbol: "R$", name: "Real Brasileiro" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "Libra Esterlina" },
  JPY: { symbol: "¥", name: "Iene Japonês" },
  CAD: { symbol: "C$", name: "Dólar Canadense" },
  AUD: { symbol: "A$", name: "Dólar Australiano" },
  CHF: { symbol: "CHF", name: "Franco Suíço" },
  CNY: { symbol: "¥", name: "Yuan Chinês" },
  INR: { symbol: "₹", name: "Rúpia Indiana" },
  MXN: { symbol: "MX$", name: "Peso Mexicano" },
  ARS: { symbol: "AR$", name: "Peso Argentino" },
  CLP: { symbol: "CL$", name: "Peso Chileno" },
  COP: { symbol: "CO$", name: "Peso Colombiano" },
  PEN: { symbol: "S/", name: "Sol Peruano" },
  UYU: { symbol: "UY$", name: "Peso Uruguaio" },
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

/**
 * Busca taxa de câmbio da AwesomeAPI
 */
async function fetchExchangeRate(from: string, to: string): Promise<number> {
  const cacheKey = `${from}-${to}`;
  
  // Verificar cache
  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[Currency] Usando taxa em cache: ${from}/${to} = ${cached.rate}`);
    return cached.rate;
  }

  try {
    // Buscar taxa atualizada
    const url = `https://economia.awesomeapi.com.br/last/${from}-${to}`;
    console.log(`[Currency] Buscando taxa: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    const pair = `${from}${to}`;
    
    if (!data[pair]) {
      throw new Error(`Par ${from}/${to} não encontrado na resposta`);
    }

    const rate = parseFloat(data[pair].bid);
    
    // Salvar no cache
    rateCache.set(cacheKey, {
      rate,
      timestamp: Date.now(),
    });

    console.log(`[Currency] Taxa obtida: ${from}/${to} = ${rate}`);
    return rate;
  } catch (error) {
    console.error(`[Currency] Erro ao buscar taxa ${from}/${to}:`, error);
    
    // Fallback: taxas fixas aproximadas
    const fallbackRates: Record<string, number> = {
      "USD-BRL": 5.60,
      "USD-EUR": 0.92,
      "USD-GBP": 0.79,
      "USD-JPY": 149.50,
      "USD-CAD": 1.36,
      "USD-AUD": 1.53,
      "USD-CHF": 0.88,
      "USD-CNY": 7.24,
      "USD-INR": 83.12,
      "USD-MXN": 17.05,
      "USD-ARS": 350.00,
      "USD-CLP": 890.00,
      "USD-COP": 3900.00,
      "USD-PEN": 3.75,
      "USD-UYU": 39.50,
      "EUR-USD": 1.09,
      "GBP-USD": 1.27,
      "BRL-USD": 0.18,
    };

    const fallbackRate = fallbackRates[cacheKey];
    if (fallbackRate) {
      console.log(`[Currency] Usando taxa fallback: ${from}/${to} = ${fallbackRate}`);
      return fallbackRate;
    }

    // Se não houver fallback, retornar 1 (sem conversão)
    console.warn(`[Currency] Sem fallback para ${from}/${to}, usando 1.0`);
    return 1.0;
  }
}

/**
 * Converte valor de uma moeda para outra
 */
export async function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency
): Promise<number> {
  // Se for a mesma moeda, retornar valor original
  if (from === to) {
    return amount;
  }

  // Se converter de/para USD, buscar taxa direta
  if (from === "USD") {
    const rate = await fetchExchangeRate(from, to);
    return amount * rate;
  }

  if (to === "USD") {
    const rate = await fetchExchangeRate(from, to);
    return amount * rate;
  }

  // Para outras conversões, passar por USD
  // Exemplo: BRL -> EUR = BRL -> USD -> EUR
  const rateToUSD = await fetchExchangeRate(from, "USD");
  const amountInUSD = amount * rateToUSD;
  const rateFromUSD = await fetchExchangeRate("USD", to);
  return amountInUSD * rateFromUSD;
}

/**
 * Formata valor com símbolo da moeda
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  showSign: boolean = true
): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  const symbol = currencyInfo.symbol;
  const absAmount = Math.abs(amount);
  
  let formatted = `${symbol}${absAmount.toFixed(2)}`;
  
  if (showSign) {
    if (amount > 0) {
      formatted = `+${formatted}`;
    } else if (amount < 0) {
      formatted = `-${formatted}`;
    }
  }
  
  return formatted;
}

/**
 * Obtém símbolo da moeda
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
  return SUPPORTED_CURRENCIES[currency].symbol;
}

/**
 * Limpa cache de taxas (útil para testes)
 */
export function clearRateCache() {
  rateCache.clear();
  console.log("[Currency] Cache de taxas limpo");
}
