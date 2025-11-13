import { telegramService } from "./telegram-notifications";
import { getDb } from "../db";
import { userSettings, telegramUsers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { convertCurrency, type SupportedCurrency } from "./currency-converter";

interface CopyTradeEvent {
  userId: number;
  accountNumber: string;
  providerName: string;
  symbol: string;
  type: string;
  volume: number;
  profit?: number;
  language: string;
  timestamp: number;
}

interface CopyTradeBuffer {
  open: Map<string, CopyTradeEvent[]>;
  close: Map<string, CopyTradeEvent[]>;
  timers: Map<string, NodeJS.Timeout>;
}

// Buffer global para agrupar notificações
const buffer: CopyTradeBuffer = {
  open: new Map(),
  close: new Map(),
  timers: new Map(),
};

const BUFFER_DELAY = 3000; // 3 segundos para agrupar

/**
 * Gera chave única para agrupar trades do mesmo provider/símbolo/tipo
 */
function getTradeKey(userId: number, providerName: string, symbol: string, type: string, eventType: 'open' | 'close'): string {
  return `${userId}:${providerName}:${symbol}:${type}:${eventType}`;
}

/**
 * Adiciona evento de abertura de copy trade ao buffer
 */
export async function bufferCopyTradeOpened(
  userId: number,
  accountNumber: string,
  tradeData: {
    providerName: string;
    symbol: string;
    type: string;
    volume: number;
  },
  language: string
) {
  const key = getTradeKey(userId, tradeData.providerName, tradeData.symbol, tradeData.type, 'open');
  
  const event: CopyTradeEvent = {
    userId,
    accountNumber,
    providerName: tradeData.providerName,
    symbol: tradeData.symbol,
    type: tradeData.type,
    volume: tradeData.volume,
    language,
    timestamp: Date.now(),
  };

  // Adicionar ao buffer
  if (!buffer.open.has(key)) {
    buffer.open.set(key, []);
  }
  buffer.open.get(key)!.push(event);

  console.log(`[Copy Trade Buffer] Adicionado ao buffer OPEN: ${key} - Total: ${buffer.open.get(key)!.length} contas`);

  // Cancelar timer anterior se existir
  if (buffer.timers.has(key)) {
    clearTimeout(buffer.timers.get(key)!);
  }

  // Criar novo timer para enviar notificação agrupada
  const timer = setTimeout(async () => {
    await flushOpenBuffer(key);
  }, BUFFER_DELAY);

  buffer.timers.set(key, timer);
}

/**
 * Adiciona evento de fechamento de copy trade ao buffer
 */
export async function bufferCopyTradeClosed(
  userId: number,
  accountNumber: string,
  tradeData: {
    providerName: string;
    symbol: string;
    type: string;
    profit: number;
  },
  language: string
) {
  const key = getTradeKey(userId, tradeData.providerName, tradeData.symbol, tradeData.type, 'close');
  
  const event: CopyTradeEvent = {
    userId,
    accountNumber,
    providerName: tradeData.providerName,
    symbol: tradeData.symbol,
    type: tradeData.type,
    volume: 0,
    profit: tradeData.profit,
    language,
    timestamp: Date.now(),
  };

  // Adicionar ao buffer
  if (!buffer.close.has(key)) {
    buffer.close.set(key, []);
  }
  buffer.close.get(key)!.push(event);

  console.log(`[Copy Trade Buffer] Adicionado ao buffer CLOSE: ${key} - Total: ${buffer.close.get(key)!.length} contas`);

  // Cancelar timer anterior se existir
  if (buffer.timers.has(key)) {
    clearTimeout(buffer.timers.get(key)!);
  }

  // Criar novo timer para enviar notificação agrupada
  const timer = setTimeout(async () => {
    await flushCloseBuffer(key);
  }, BUFFER_DELAY);

  buffer.timers.set(key, timer);
}

/**
 * Envia notificação agrupada de abertura
 */
async function flushOpenBuffer(key: string) {
  const events = buffer.open.get(key);
  if (!events || events.length === 0) return;

  const firstEvent = events[0];
  const accounts = events.map(e => e.accountNumber);

  console.log(`[Copy Trade Buffer] Enviando notificação OPEN agrupada: ${accounts.length} contas`);

  // Buscar chatId do Telegram
  const db = await getDb();
  if (!db) {
    console.log(`[Copy Trade Buffer] Database não disponível`);
    buffer.open.delete(key);
    buffer.timers.delete(key);
    return;
  }

  const [telegramUser] = await db
    .select()
    .from(telegramUsers)
    .where(eq(telegramUsers.userId, firstEvent.userId))
    .limit(1);

  if (!telegramUser || !telegramUser.chatId || !telegramUser.isActive) {
    console.log(`[Copy Trade Buffer] Usuário ${firstEvent.userId} não tem Telegram ativo`);
    buffer.open.delete(key);
    buffer.timers.delete(key);
    return;
  }

  await telegramService.sendCopyTradeExecuted(
    telegramUser.chatId,
    firstEvent.accountNumber,
    {
      providerName: firstEvent.providerName,
      symbol: firstEvent.symbol,
      type: firstEvent.type,
      volume: firstEvent.volume,
      accounts, // Lista de contas agrupadas
    },
    firstEvent.language
  );

  // Limpar buffer
  buffer.open.delete(key);
  buffer.timers.delete(key);
}

/**
 * Envia notificação agrupada de fechamento
 */
async function flushCloseBuffer(key: string) {
  const events = buffer.close.get(key);
  if (!events || events.length === 0) return;

  const firstEvent = events[0];
  
  // Buscar moeda do usuário
  const db = await getDb();
  let currency: SupportedCurrency = "USD";
  let exchangeRate = 1;
  
  if (db) {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, firstEvent.userId))
      .limit(1);
    
    if (settings?.displayCurrency && settings.displayCurrency !== "USD") {
      currency = settings.displayCurrency as SupportedCurrency;
      // Buscar taxa de câmbio real da API
      try {
        const sampleAmount = 1; // 1 USD
        const converted = await convertCurrency(sampleAmount, "USD", currency);
        exchangeRate = converted;
        console.log(`[Copy Trade Buffer] Taxa de câmbio USD -> ${currency}: ${exchangeRate}`);
      } catch (error) {
        console.error(`[Copy Trade Buffer] Erro ao buscar taxa de câmbio:`, error);
        exchangeRate = 1;
      }
    }
  }

  // Criar array de lucros por conta
  const accountsProfits = events.map(e => ({
    account: e.accountNumber,
    profit: e.profit || 0,
    profitConverted: currency !== "USD" ? (e.profit || 0) * exchangeRate : undefined,
  }));

  const totalProfit = accountsProfits.reduce((sum, ap) => sum + ap.profit, 0);

  console.log(`[Copy Trade Buffer] Enviando notificação CLOSE agrupada: ${accountsProfits.length} contas, Total: $${totalProfit.toFixed(2)}`);

  // Buscar chatId do Telegram
  const [telegramUser] = await db
    .select()
    .from(telegramUsers)
    .where(eq(telegramUsers.userId, firstEvent.userId))
    .limit(1);

  if (!telegramUser || !telegramUser.chatId || !telegramUser.isActive) {
    console.log(`[Copy Trade Buffer] Usuário ${firstEvent.userId} não tem Telegram ativo`);
    buffer.close.delete(key);
    buffer.timers.delete(key);
    return;
  }

  await telegramService.sendCopyTradeClosed(
    telegramUser.chatId,
    firstEvent.accountNumber,
    {
      providerName: firstEvent.providerName,
      symbol: firstEvent.symbol,
      type: firstEvent.type,
      profit: totalProfit,
      accountsProfits: accountsProfits.map(ap => ({
        account: ap.account,
        profit: ap.profit,
        profitConverted: ap.profitConverted,
      })),
      currency,
      exchangeRate,
    },
    firstEvent.language
  );

  // Limpar buffer
  buffer.close.delete(key);
  buffer.timers.delete(key);
}
