import { eq, and, desc, asc, gte, lte, sql, inArray, isNotNull } from "drizzle-orm";
import mysql2 from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  tradingAccounts, 
  InsertTradingAccount, 
  TradingAccount,
  trades,
  InsertTrade,
  Trade,
  balanceHistory,
  InsertBalanceHistory,
  transactions,
  InsertTransaction,
  Transaction,
  userSettings,
  InsertUserSettings,
  UserSettings,
  strategies,
  InsertStrategy,
  Strategy,
  tradeNotes,
  InsertTradeNote,
  TradeNote,
  economicEvents,
  InsertEconomicEvent,
  EconomicEvent,
  copyTradingConfigs,
  InsertCopyTradingConfig,
  CopyTradingConfig,
  alerts,
  InsertAlert,
  Alert,
  apiKeys,
  InsertApiKey,
  ApiKey,
  notifications,
  InsertNotification,
  Notification,
  telegramUsers
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _connection: mysql2.Connection | null = null;

let _migrationRun = false;

export async function getDb() {
  if (!_db) {
    // Priorizar AIVEN_DATABASE_URL se existir, senão usar DATABASE_URL (banco Manus)
    const dbUrl = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;
    
    if (dbUrl) {
      try {
        console.log("[Database] Connecting to:", dbUrl.includes('aiven') ? 'Aiven MySQL' : 'Manus TiDB');
        _connection = await mysql2.createConnection(dbUrl);
        _db = drizzle(_connection);
        
        // Executar migrations apenas uma vez
        if (!_migrationRun) {
          _migrationRun = true;
          // Importar e executar migrations
          import('./apply-balance-fix').then(({ applyBalanceFix }) => {
            applyBalanceFix().catch(err => {
              console.error('[Database] Balance fix failed:', err);
            });
          }).catch(err => {
            console.error('[Database] Failed to import balance fix:', err);
          });
          
          import('./migrations/create-notifications-table').then(({ createNotificationsTable }) => {
            createNotificationsTable().catch(err => {
              console.error('[Database] Migration failed:', err);
            });
          }).catch(err => {
            console.error('[Database] Failed to import migration:', err);
          });
          
          import('./migrations/create-admin-products-tables').then(({ createAdminProductsTables }) => {
            createAdminProductsTables().catch(err => {
              console.error('[Database] Admin products tables migration failed:', err);
            });
          }).catch(err => {
            console.error('[Database] Failed to import admin products migration:', err);
          });
          
          import('./migrations/create-landing-page-table').then(({ createLandingPageTable }) => {
            createLandingPageTable().catch(err => {
              console.error('[Database] Landing page table migration failed:', err);
            });
          }).catch(err => {
            console.error('[Database] Failed to import landing page migration:', err);
          });
          
          import('./migrations/add-price-column').then(({ addPriceColumn }) => {
            addPriceColumn().catch(err => {
              console.error('[Database] price column migration failed:', err);
            });
          }).catch(err => {
            console.error('[Database] Failed to import price column migration:', err);
          });
          
          import('./migrations/add-ntfy-fields').then(({ addNtfyFields }) => {
            addNtfyFields().catch(err => {
              console.error('[Database] ntfy fields migration failed:', err);
            });
          }).catch(err => {
            console.error('[Database] Failed to import ntfy migration:', err);
          });
          
          import('./migrations/add-notification-fields').then(({ addNotificationFields }) => {
            addNotificationFields().catch(err => {
              console.error('[Database] notification fields migration failed:', err);
            });
          }).catch(err => {
            console.error('[Database] Failed to import notification fields migration:', err);
          });
          
          import('./migrations/create-drawdown-alert-history-table').then(({ createDrawdownAlertHistoryTable }) => {
            createDrawdownAlertHistoryTable().catch(err => {
              console.error('[Database] drawdown_alert_history table migration failed:', err);
            });
          }).catch(err => {
            console.error('[Database] Failed to import drawdown_alert_history migration:', err);
          });
          
          import('./migrations/add-economic-news-fields').then(({ addEconomicNewsFields }) => {
            addEconomicNewsFields().catch(err => {
              console.error('[Database] economic news fields migration failed:', err);
            });
          }).catch(err => {
            console.error('[Database] Failed to import economic news fields migration:', err);
          });
        }
      } catch (error) {
        console.warn("[Database] Failed to connect:", error);
        _db = null;
      }
    }
  }
  return _db;
}

// ===== USER OPERATIONS =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== TRADING ACCOUNT OPERATIONS =====

/**
 * Detecta se uma conta é do tipo cent usando padrões universais.
 * Funciona para qualquer broker, não depende de lista fixa.
 * 
 * Critérios de detecção:
 * 1. Servidor contém "cent" no nome
 * 2. Tipo de conta é "CENT" (se informado)
 * 3. Análise de magnitude: balance > 1.000.000 cents sugere conta cent
 */
function isCentAccountByBroker(
  broker?: string | null, 
  server?: string | null,
  accountType?: string | null,
  balance?: number | null
): boolean {
  // 1. Verifica tipo de conta explícito
  if (accountType?.toUpperCase() === 'CENT') {
    return true;
  }
  
  // 2. Verifica se o servidor contém "cent" no nome
  const serverLower = (server || '').toLowerCase();
  if (serverLower.includes('cent')) {
    return true;
  }
  
  // 3. Análise de magnitude dos valores
  // Contas cent geralmente têm valores muito altos em cents
  // Ex: $2.955 = 29.551.541 cents (conta cent) vs $103.222 = 10.322.229 cents (conta dollar)
  // Threshold: 20.000.000 cents = $200.000 em conta dollar ou $2.000 em conta cent
  // Se balance > 20.000.000 cents, provavelmente é conta cent
  if (balance && balance > 20000000) {
    return true;
  }
  
  return false;
}

export async function createOrUpdateAccount(account: InsertTradingAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Detecta automaticamente se é conta cent usando padrões universais
  const isCent = isCentAccountByBroker(
    account.broker, 
    account.server, 
    account.accountType,
    account.balance
  );
  const accountWithCentFlag = {
    ...account,
    isCentAccount: isCent,
    terminalId: account.terminalId || `${account.userId}_${account.accountNumber}`,
  };

  // Busca por terminalId OU por accountNumber + userId
  let existing;
  if (account.terminalId) {
    existing = await db.select().from(tradingAccounts)
      .where(eq(tradingAccounts.terminalId, account.terminalId))
      .limit(1);
  } else {
    existing = await db.select().from(tradingAccounts)
      .where(
        and(
          eq(tradingAccounts.accountNumber, account.accountNumber),
          eq(tradingAccounts.userId, account.userId)
        )
      )
      .limit(1);
  }

  if (existing && existing.length > 0) {
    await db.update(tradingAccounts)
      .set({
        ...accountWithCentFlag,
        updatedAt: new Date(),
      })
      .where(eq(tradingAccounts.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(tradingAccounts).values(accountWithCentFlag);
    const accountId = Number(result[0].insertId);
    
    // Enviar notificação de conta conectada (sem bloquear)
    sendAccountConnectedNotification({
      userId: account.userId,
      accountNumber: account.accountNumber,
      broker: account.broker || "Desconhecida",
      accountType: isCent ? "CENT" : "STANDARD",
    }).catch(err => {
      console.error("[DB] Erro ao enviar notificação de conta conectada:", err);
    });
    
    return accountId;
  }
}

/**
 * Envia notificação de conta conectada (executado de forma assíncrona)
 */
async function sendAccountConnectedNotification(params: {
  userId: number;
  accountNumber: string;
  broker: string;
  accountType: string;
}) {
  try {
    // Buscar configurações do usuário
    const db = await getDb();
    if (!db) return;

    const [settings] = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, params.userId))
      .limit(1);

    if (!settings || !settings.ntfyConnectionEnabled) {
      return; // Notificações de conexão desabilitadas
    }

    const { sendAccountConnected } = await import("./services/telegram-helper");

    await sendAccountConnected(params.userId, {
      accountNumber: params.accountNumber,
      broker: params.broker,
      platform: params.accountType === "CENT" ? "MT5 (CENT)" : "MT5",
    });
  } catch (error) {
    console.error("[DB] Erro em sendAccountConnectedNotification:", error);
  }
}

export async function getAccountByTerminalId(terminalId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tradingAccounts)
    .where(eq(tradingAccounts.terminalId, terminalId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAccountByNumber(accountNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tradingAccounts)
    .where(eq(tradingAccounts.accountNumber, accountNumber))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tradingAccounts)
    .where(eq(tradingAccounts.userId, userId))
    .orderBy(desc(tradingAccounts.updatedAt));
}

export async function getActiveAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Retorna valores em cents sem conversão - frontend fará a exibição
  return await db.select().from(tradingAccounts)
    .where(and(
      eq(tradingAccounts.userId, userId),
      eq(tradingAccounts.isActive, true)
    ))
    .orderBy(desc(tradingAccounts.updatedAt));
}

export async function updateAccountStatus(terminalId: string, status: "connected" | "disconnected" | "error") {
  const db = await getDb();
  if (!db) return;
  await db.update(tradingAccounts)
    .set({ status, lastHeartbeat: new Date(), updatedAt: new Date() })
    .where(eq(tradingAccounts.terminalId, terminalId));
}

// ===== TRADE OPERATIONS =====

/**
 * Aplica conversão de valores para trades de contas cent
 */
async function applyTradeConversion(trades: Trade[]): Promise<Trade[]> {
  const db = await getDb();
  if (!db || trades.length === 0) return trades;
  
  // Buscar informações das contas para saber quais são cent
  const accountIds = Array.from(new Set(trades.map(t => t.accountId)));
  const accounts = await db.select().from(tradingAccounts)
    .where(inArray(tradingAccounts.id, accountIds));
  
  const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
  
  // Retorna trades sem conversão - frontend fará a divisão por 100
  return trades.map(trade => {
    const account = accountMap.get(trade.accountId);
    return {
      ...trade,
      isCentAccount: account?.isCentAccount || false,
    };
  });
}

export async function createOrUpdateTrade(trade: InsertTrade) {
  const db = await getDb();
  if (!db) {
    console.error("[DB] Database not available for createOrUpdateTrade");
    throw new Error("Database not available");
  }

  // Detectar automaticamente se o trade está aberto ou fechado
  // CRITÉRIO DEFINITIVO: closeTime
  // - Se closeTime é null ou undefined → ABERTO (posição flutuante)
  // - Se closeTime existe → FECHADO (histórico)
  let actualStatus: "open" | "closed" = "closed";
  
  if (!trade.closeTime || trade.closeTime === null || trade.closeTime === undefined) {
    actualStatus = "open";
  } else {
    actualStatus = "closed";
  }

  const tradeWithStatus = {
    ...trade,
    status: actualStatus
  };

  try {
    const existing = await db.select().from(trades)
      .where(and(
        eq(trades.accountId, trade.accountId),
        eq(trades.ticket, trade.ticket)
      ))
      .limit(1);

    let isNewTrade = false;
    let wasOpen = false;
    let tradeId: number;

    if (existing.length > 0) {
      wasOpen = existing[0].status === "open";
      console.log(`[DB] Updating trade ticket=${trade.ticket}, status=${actualStatus}`);
      await db.update(trades)
        .set({
          ...tradeWithStatus,
          updatedAt: new Date(),
        })
        .where(eq(trades.id, existing[0].id));
      tradeId = existing[0].id;
    } else {
      isNewTrade = true;
      console.log(`[DB] Inserting new trade ticket=${trade.ticket}, symbol=${trade.symbol}, status=${actualStatus}`);
      const result = await db.insert(trades).values(tradeWithStatus);
      tradeId = Number(result[0].insertId);
      console.log(`[DB] Trade inserted with ID=${tradeId}`);
    }

    // Enviar notificações (sem bloquear a operação principal)
    sendTradeNotifications({
      isNewTrade,
      wasOpen,
      actualStatus,
      trade: tradeWithStatus,
      tradeId,
    }).catch(err => {
      console.error("[DB] Erro ao enviar notificação de trade:", err);
    });

    return tradeId;
  } catch (error) {
    console.error("[DB] Error in createOrUpdateTrade:", error);
    console.error("[DB] Trade data:", JSON.stringify(trade, null, 2));
    throw error;
  }
}

// CACHE EM MEMÓRIA REMOVIDO - Usando apenas banco de dados permanente
// Sistema agora verifica notificações diretamente no banco de dados
// Notificações são lembradas para sempre (até limpeza automática)

/**
 * Envia notificações de trades (executado de forma assíncrona)
 */
async function sendTradeNotifications(params: {
  isNewTrade: boolean;
  wasOpen: boolean;
  actualStatus: "open" | "closed";
  trade: InsertTrade & { status: "open" | "closed" };
  tradeId: number;
}) {
  const { isNewTrade, wasOpen, actualStatus, trade } = params;

  console.log(`[sendTradeNotifications] Iniciando - userId: ${trade.userId}, ticket: ${trade.ticket}, isNew: ${isNewTrade}, wasOpen: ${wasOpen}, status: ${actualStatus}`);

  try {
    // Buscar configurações do usuário
    const db = await getDb();
    if (!db) return;

    // Buscar settings apenas para pegar idioma e moeda
    // NÃO bloquear notificações baseado em ntfyTradesEnabled
    // pois isso é para ntfy, não para Telegram
    const [settings] = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, trade.userId))
      .limit(1);

    if (!settings) {
      console.log(`[sendTradeNotifications] Settings não encontrado para userId: ${trade.userId}`);
      return;
    }
    
    console.log(`[sendTradeNotifications] ✅ Settings encontrado - userId: ${trade.userId}`);
    // REMOVIDO: Verificação de ntfyTradesEnabled
    // As notificações do Telegram são controladas apenas por telegram.isActive

    // Buscar idioma e moeda do usuário
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, trade.userId))
      .limit(1);
    
    const userLanguage = user?.language || 'pt-BR';
    const userCurrency = settings.displayCurrency || user?.currency || 'USD';

    // Buscar dados da conta
    const [account] = await db.select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, trade.accountId))
      .limit(1);

    if (!account) return;

    const { telegramService } = await import("./services/telegram-notifications");

    // Buscar chat ID do Telegram
    const [telegramUser] = await db.select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, trade.userId))
      .limit(1);

    if (!telegramUser) {
      console.log(`[sendTradeNotifications] TelegramUser não encontrado para userId: ${trade.userId}`);
      return;
    }
    
    if (!telegramUser.chatId) {
      console.log(`[sendTradeNotifications] ChatId não encontrado para userId: ${trade.userId}`);
      return;
    }
    
    if (!telegramUser.isActive) {
      console.log(`[sendTradeNotifications] Telegram não está ativo para userId: ${trade.userId}`);
      return;
    }
    
    console.log(`[sendTradeNotifications] ✅ Telegram configurado - userId: ${trade.userId}, chatId: ${telegramUser.chatId}`);

    // Trade aberto: enviar notificação sempre que estiver aberto
    // SIMPLIFICADO: Sem restrições de origem ou estado anterior
    const shouldNotifyOpen = actualStatus === "open" && !wasOpen;
    
    console.log(`[sendTradeNotifications] Verificação de abertura:`, {
      actualStatus,
      wasOpen,
      shouldNotifyOpen
    });
    
    if (shouldNotifyOpen) {
      // Verificar no BANCO DE DADOS (MEMÓRIA PERMANENTE)
      const { notificationHistory } = await import("../drizzle/schema");
      const { and, eq } = await import("drizzle-orm");
      
      const [existingNotification] = await db.select()
        .from(notificationHistory)
        .where(and(
          eq(notificationHistory.userId, trade.userId),
          eq(notificationHistory.accountNumber, account.accountNumber),
          eq(notificationHistory.ticket, trade.ticket.toString()),
          eq(notificationHistory.type, "trade_opened")
        ))
        .limit(1);
      
      if (existingNotification) {
        console.log(`[sendTradeNotifications] ⚠️ Notificação de abertura JÁ ENVIADA - ticket: ${trade.ticket} (banco de dados)`);
        return;
      }
      
      console.log(`[sendTradeNotifications] 🔵🔵🔵 ENVIANDO NOTIFICAÇÃO DE TRADE ABERTO - ticket: ${trade.ticket} 🔵🔵🔵`);
      
      await telegramService.sendTradeOpened(
        telegramUser.chatId,
        account.accountNumber,
        {
          ticket: trade.ticket,
          symbol: trade.symbol,
          type: trade.type,
          volume: trade.volume / 100, // Converter de centésimos para lotes
          openPrice: trade.openPrice / 100000, // Converter de inteiro para preço
          sl: trade.closePrice ? trade.closePrice / 100000 : undefined,
          tp: undefined,
        },
        userLanguage
      );
      
      // Salvar no banco de dados (MEMÓRIA PERMANENTE)
      await db.insert(notificationHistory).values({
        userId: trade.userId,
        type: "trade_opened",
        title: `Trade Aberto: ${trade.symbol}`,
        message: `Ticket: ${trade.ticket}`,
        status: "sent",
        sentAt: new Date(),
        accountNumber: account.accountNumber,
        ticket: trade.ticket.toString(),
        eventType: "opened"
      });
      
      console.log(`[sendTradeNotifications] ✅ Notificação salva no banco de dados - ticket: ${trade.ticket}`);
    }

    // Trade fechado (de aberto para fechado)
    // Condições para enviar notificação de fechamento:
    // 1. Estava aberto antes e agora está fechado (wasOpen && actualStatus === "closed")
    // 2. OU é um trade novo já fechado (isNewTrade && actualStatus === "closed")
    const shouldNotifyClose = (wasOpen && actualStatus === "closed") || (isNewTrade && actualStatus === "closed");
    
    console.log(`[sendTradeNotifications] Verificando notificação de fechamento:`, {
      isNewTrade,
      wasOpen,
      actualStatus,
      shouldNotifyClose,
      version: 'v2.0-fixed'
    });
    
    if (shouldNotifyClose) {
      // Verificar no BANCO DE DADOS (MEMÓRIA PERMANENTE)
      const { notificationHistory } = await import("../drizzle/schema");
      const { and, eq } = await import("drizzle-orm");
      
      const profit = trade.profit || 0;
      const isCentAccount = account.isCentAccount || false;
      const adjustedProfit = isCentAccount ? profit / 100 : profit / 100;
      const notificationType = adjustedProfit > 0 ? "trade_closed_tp" : "trade_closed_sl";
      
      const [existingNotification] = await db.select()
        .from(notificationHistory)
        .where(and(
          eq(notificationHistory.userId, trade.userId),
          eq(notificationHistory.accountNumber, account.accountNumber),
          eq(notificationHistory.ticket, trade.ticket.toString()),
          eq(notificationHistory.type, notificationType)
        ))
        .limit(1);
      
      if (existingNotification) {
        console.log(`[sendTradeNotifications] ⚠️ Notificação de fechamento JÁ ENVIADA - ticket: ${trade.ticket} (banco de dados)`);
        return;
      }
      
      console.log(`[sendTradeNotifications] 💰 Enviando notificação de trade FECHADO - ticket: ${trade.ticket}, profit: ${trade.profit}`);
      
      // Ajustar profit para contas CENT (já calculado acima)

      // Calcular conversão de moeda se necessário
      let profitConverted: number | undefined;
      let exchangeRate: number | undefined;
      
      if (userCurrency !== "USD" && userCurrency !== (account.currency || "USD")) {
        try {
          const { convertCurrency } = await import("./services/currency-converter");
          profitConverted = await convertCurrency(adjustedProfit, "USD", userCurrency as any);
          exchangeRate = profitConverted / adjustedProfit;
          console.log(`[sendTradeNotifications] Conversão: ${adjustedProfit} USD -> ${profitConverted} ${userCurrency} (taxa: ${exchangeRate})`);
        } catch (error) {
          console.error(`[sendTradeNotifications] Erro ao converter moeda:`, error);
        }
      }

      await telegramService.sendTradeClosed(
        telegramUser.chatId,
        account.accountNumber,
        {
          ticket: trade.ticket,
          symbol: trade.symbol,
          type: trade.type,
          openPrice: trade.openPrice / 100000,
          closePrice: trade.closePrice ? trade.closePrice / 100000 : 0,
          profit: adjustedProfit,
          profitConverted,
          currency: userCurrency,
          exchangeRate,
        },
        account.currency || "USD",
        userLanguage
      );
      
      // Salvar no banco de dados (MEMÓRIA PERMANENTE)
      await db.insert(notificationHistory).values({
        userId: trade.userId,
        type: notificationType,
        title: `Trade Fechado: ${trade.symbol}`,
        message: `Ticket: ${trade.ticket} | Lucro: ${adjustedProfit}`,
        status: "sent",
        sentAt: new Date(),
        accountNumber: account.accountNumber,
        ticket: trade.ticket.toString(),
        eventType: "closed"
      });
      
      console.log(`[sendTradeNotifications] ✅ Notificação salva no banco de dados - ticket: ${trade.ticket}`);
    }
  } catch (error) {
    console.error("[sendTradeNotifications] ❌ ERRO:", error);
    console.error("[sendTradeNotifications] Trade data:", JSON.stringify(trade, null, 2));
  }
}

export async function getUserTrades(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    trade: trades,
    account: tradingAccounts
  }).from(trades)
    .leftJoin(tradingAccounts, eq(trades.accountId, tradingAccounts.id))
    .where(eq(trades.userId, userId))
    .orderBy(desc(trades.openTime))
    .limit(limit);
  
  const tradesWithAccount = result.map(r => ({
    ...r.trade,
    accountNumber: r.account?.accountNumber,
    broker: r.account?.broker,
    accountType: r.account?.accountType,
    isCentAccount: r.account?.isCentAccount || false
  }));
  
  return await applyTradeConversion(tradesWithAccount);
}

export async function getAccountTrades(accountId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    trade: trades,
    account: tradingAccounts
  }).from(trades)
    .leftJoin(tradingAccounts, eq(trades.accountId, tradingAccounts.id))
    .where(eq(trades.accountId, accountId))
    .orderBy(desc(trades.openTime))
    .limit(limit);
  
  const tradesWithAccount = result.map(r => ({
    ...r.trade,
    accountNumber: r.account?.accountNumber,
    broker: r.account?.broker,
    accountType: r.account?.accountType,
    isCentAccount: r.account?.isCentAccount || false
  }));
  
  return await applyTradeConversion(tradesWithAccount);
}

export async function getOpenTrades(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(trades)
    .where(and(
      eq(trades.userId, userId),
      eq(trades.status, "open")
    ))
    .orderBy(desc(trades.openTime));
  return await applyTradeConversion(result);
}

export async function getTradesByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    trade: trades,
    account: tradingAccounts
  }).from(trades)
    .leftJoin(tradingAccounts, eq(trades.accountId, tradingAccounts.id))
    .where(and(
      eq(trades.userId, userId),
      eq(trades.status, 'closed'),
      gte(trades.closeTime, startDate),
      lte(trades.closeTime, endDate)
    ))
    .orderBy(desc(trades.closeTime));
  
  const tradesWithAccount = result.map(r => ({
    ...r.trade,
    accountNumber: r.account?.accountNumber,
    broker: r.account?.broker,
    accountType: r.account?.accountType,
    isCentAccount: r.account?.isCentAccount || false
  }));
  
  return await applyTradeConversion(tradesWithAccount);
}

export async function closeTrade(tradeId: number, closePrice: number, closeTime: Date, profit: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(trades)
    .set({
      closePrice,
      closeTime,
      profit,
      status: "closed",
      updatedAt: new Date()
    })
    .where(eq(trades.id, tradeId));
}

// ===== BALANCE HISTORY OPERATIONS =====

export async function recordBalanceSnapshot(snapshot: InsertBalanceHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(balanceHistory).values(snapshot);
}

export async function getBalanceHistory(accountId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(balanceHistory)
    .where(and(
      eq(balanceHistory.accountId, accountId),
      gte(balanceHistory.timestamp, startDate),
      lte(balanceHistory.timestamp, endDate)
    ))
    .orderBy(asc(balanceHistory.timestamp));
}

export async function getUserBalanceHistory(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(balanceHistory)
    .where(and(
      eq(balanceHistory.userId, userId),
      gte(balanceHistory.timestamp, startDate),
      lte(balanceHistory.timestamp, endDate)
    ))
    .orderBy(asc(balanceHistory.timestamp));
}

// ===== USER SETTINGS OPERATIONS =====

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) {
    // Retorna configurações padrão se banco não disponível
    return {
      userId,
      theme: "light" as const,
      displayCurrency: "USD",
      dateFormat: "DD/MM/YYYY",
      timezone: "America/Sao_Paulo",
      decimalPrecision: 2,
      heartbeatInterval: 60,
      alertsEnabled: true,
      alertBalance: true,
      alertDrawdown: true,
      alertTrades: true,
      alertConnection: true,
      drawdownThreshold: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  const result = await db.select().from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  
  // Se não existir, retorna configurações padrão
  if (result.length === 0) {
    return {
      userId,
      theme: "light" as const,
      displayCurrency: "USD",
      dateFormat: "DD/MM/YYYY",
      timezone: "America/Sao_Paulo",
      decimalPrecision: 2,
      heartbeatInterval: 60,
      alertsEnabled: true,
      alertBalance: true,
      alertDrawdown: true,
      alertTrades: true,
      alertConnection: true,
      drawdownThreshold: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  return result[0];
}

export async function createOrUpdateUserSettings(settings: InsertUserSettings) {
  console.log('[createOrUpdateUserSettings] START');
  console.log('[createOrUpdateUserSettings] Input settings:', JSON.stringify(settings, null, 2));
  
  const db = await getDb();
  if (!db) {
    console.error('[createOrUpdateUserSettings] Database not available!');
    throw new Error("Database not available");
  }
  console.log('[createOrUpdateUserSettings] Database connected');

  const existing = await getUserSettings(settings.userId);
  console.log('[createOrUpdateUserSettings] Existing settings:', existing ? 'FOUND' : 'NOT FOUND');
  
  try {
    if (existing) {
      console.log('[createOrUpdateUserSettings] Updating existing settings for userId:', settings.userId);
      const updateData = { ...settings, updatedAt: new Date() };
      console.log('[createOrUpdateUserSettings] Update data:', JSON.stringify(updateData, null, 2));
      
      const result = await db.update(userSettings)
        .set(updateData)
        .where(eq(userSettings.userId, settings.userId));
      
      console.log('[createOrUpdateUserSettings] Update result:', result);
    } else {
      console.log('[createOrUpdateUserSettings] Inserting new settings for userId:', settings.userId);
      console.log('[createOrUpdateUserSettings] Insert data:', JSON.stringify(settings, null, 2));
      
      const result = await db.insert(userSettings).values(settings);
      console.log('[createOrUpdateUserSettings] Insert result:', result);
    }
    console.log('[createOrUpdateUserSettings] SUCCESS');
  } catch (error) {
    console.error('[createOrUpdateUserSettings] ERROR:', error);
    throw error;
  }
}

// ===== STRATEGY OPERATIONS =====

export async function createStrategy(strategy: InsertStrategy) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(strategies).values(strategy);
  return Number(result[0].insertId);
}

export async function getUserStrategies(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(strategies)
    .where(eq(strategies.userId, userId))
    .orderBy(desc(strategies.createdAt));
}

export async function updateStrategy(id: number, strategy: Partial<InsertStrategy>) {
  const db = await getDb();
  if (!db) return;
  await db.update(strategies)
    .set({ ...strategy, updatedAt: new Date() })
    .where(eq(strategies.id, id));
}

export async function deleteStrategy(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(strategies).where(eq(strategies.id, id));
}

// ===== TRADE NOTES OPERATIONS =====

export async function createTradeNote(note: InsertTradeNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tradeNotes).values(note);
  return Number(result[0].insertId);
}

export async function getTradeNotes(tradeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tradeNotes)
    .where(eq(tradeNotes.tradeId, tradeId))
    .orderBy(desc(tradeNotes.createdAt));
}

export async function updateTradeNote(id: number, note: Partial<InsertTradeNote>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tradeNotes)
    .set({ ...note, updatedAt: new Date() })
    .where(eq(tradeNotes.id, id));
}

// ===== ECONOMIC EVENTS OPERATIONS =====

export async function createEconomicEvent(event: InsertEconomicEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(economicEvents).values(event);
  return Number(result[0].insertId);
}

export async function getEconomicEvents(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(economicEvents)
    .where(and(
      gte(economicEvents.eventTime, startDate),
      lte(economicEvents.eventTime, endDate)
    ))
    .orderBy(asc(economicEvents.eventTime));
}

export async function getUpcomingEvents(hours: number = 24) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
  return await db.select().from(economicEvents)
    .where(and(
      gte(economicEvents.eventTime, now),
      lte(economicEvents.eventTime, future)
    ))
    .orderBy(asc(economicEvents.eventTime));
}

// ===== COPY TRADING OPERATIONS =====

export async function createCopyTradingConfig(config: InsertCopyTradingConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(copyTradingConfigs).values(config);
  return Number(result[0].insertId);
}

export async function getUserCopyConfigs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(copyTradingConfigs)
    .where(eq(copyTradingConfigs.userId, userId))
    .orderBy(desc(copyTradingConfigs.createdAt));
}

export async function getActiveCopyConfigs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(copyTradingConfigs)
    .where(and(
      eq(copyTradingConfigs.userId, userId),
      eq(copyTradingConfigs.isActive, true)
    ));
}

export async function updateCopyConfig(id: number, config: Partial<InsertCopyTradingConfig>) {
  const db = await getDb();
  if (!db) return;
  await db.update(copyTradingConfigs)
    .set({ ...config, updatedAt: new Date() })
    .where(eq(copyTradingConfigs.id, id));
}

export async function deleteCopyConfig(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(copyTradingConfigs).where(eq(copyTradingConfigs.id, id));
}

// ===== ALERTS OPERATIONS =====

export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(alerts).values(alert);
  
  // Enviar notificação ntfy se habilitado
  try {
    const { NtfyService } = await import("./services/ntfy-notifications");
    const ntfyService = new NtfyService();
    await ntfyService.sendAlertNotification(alert.userId, alert.type, alert.message);
  } catch (error) {
    console.error("[createAlert] Erro ao enviar notificação ntfy:", error);
  }
  
  return Number(result[0].insertId);
}

export async function getUserAlerts(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(alerts)
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt))
    .limit(limit);
}

export async function getUnreadAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(alerts)
    .where(and(
      eq(alerts.userId, userId),
      eq(alerts.isRead, false)
    ))
    .orderBy(desc(alerts.createdAt));
}

export async function markAlertAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alerts)
    .set({ isRead: true })
    .where(eq(alerts.id, id));
}

export async function markAllAlertsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alerts)
    .set({ isRead: true })
    .where(eq(alerts.userId, userId));
}

// ===== ANALYTICS OPERATIONS =====

export async function getTradeStatistics(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;

  let conditions = [eq(trades.userId, userId), eq(trades.status, "closed")];
  if (startDate) conditions.push(gte(trades.openTime, startDate));
  if (endDate) conditions.push(lte(trades.openTime, endDate));

  const rawTrades = await db.select().from(trades)
    .where(and(...conditions));
  
  const allTrades = await applyTradeConversion(rawTrades);

  if (allTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
    };
  }

  // Converter profits para dólares antes de calcular estatísticas
  const tradesWithConvertedProfit = allTrades.map(t => ({
    ...t,
    profitDollars: (t.profit || 0) / ((t as any).isCentAccount ? 10000 : 100)
  }));
  
  const winningTrades = tradesWithConvertedProfit.filter(t => t.profitDollars > 0);
  const losingTrades = tradesWithConvertedProfit.filter(t => t.profitDollars < 0);
  
  const totalProfit = winningTrades.reduce((sum, t) => sum + t.profitDollars, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitDollars, 0));
  const netProfit = tradesWithConvertedProfit.reduce((sum, t) => sum + t.profitDollars, 0);

  return {
    totalTrades: allTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: (winningTrades.length / allTrades.length) * 100,
    totalProfit,
    totalLoss,
    netProfit,
    profitFactor: totalLoss > 0 ? totalProfit / totalLoss : 0,
    averageWin: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
    averageLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
    largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profitDollars)) : 0,
    largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profitDollars)) : 0,
  };
}

export async function getAccountSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const accounts = await getActiveAccounts(userId);
  
  // Retorna valores em cents sem conversão - frontend fará a exibição
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalEquity = accounts.reduce((sum, acc) => sum + (acc.equity || 0), 0);
  const totalOpenPositions = accounts.reduce((sum, acc) => sum + (acc.openPositions || 0), 0);
  const connectedAccounts = accounts.filter(acc => acc.status === "connected").length;

  // Calcular drawdown do mês
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Normalizar balance e equity (CENT: dividir por 100, STANDARD: manter)
  const normalizedBalance = accounts.reduce((sum, acc) => {
    const balance = acc.balance || 0;
    return sum + (acc.accountType === 'CENT' ? balance / 100 : balance);
  }, 0);
  
  const normalizedEquity = accounts.reduce((sum, acc) => {
    const equity = acc.equity || 0;
    return sum + (acc.accountType === 'CENT' ? equity / 100 : equity);
  }, 0);
  
  // Buscar pico de balance do mês (normalizado)
  const monthBalanceHistory = await db.select()
    .from(balanceHistory)
    .where(
      and(
        inArray(balanceHistory.accountId, accounts.map(a => a.id)),
        gte(balanceHistory.timestamp, monthStart)
      )
    )
    .orderBy(desc(balanceHistory.balance))
    .limit(1);
  
  // Se não houver histórico, usar balance atual como pico
  let peakBalance = normalizedBalance;
  if (monthBalanceHistory.length > 0) {
    const historyAccount = accounts.find(a => a.id === monthBalanceHistory[0].accountId);
    peakBalance = historyAccount?.accountType === 'CENT' 
      ? monthBalanceHistory[0].balance / 100 
      : monthBalanceHistory[0].balance;
  }
  
  const monthlyDrawdown = peakBalance > 0 ? ((peakBalance - normalizedEquity) / peakBalance) * 100 : 0;

  return {
    totalAccounts: accounts.length,
    connectedAccounts,
    totalBalance,
    totalEquity,
    totalOpenPositions,
    monthlyDrawdown: Number(monthlyDrawdown.toFixed(2)),
    accounts,
  };
}



// ============================================================================
// TRANSACTIONS
// ============================================================================

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(transactions).values(transaction);
  return Number(result[0].insertId);
}

export async function getAccountTransactions(accountId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(transactions)
    .where(eq(transactions.accountId, accountId))
    .orderBy(desc(transactions.timestamp))
    .limit(limit);
  
  return result;
}

export async function getUserTransactions(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.timestamp))
    .limit(limit);
  
  return result;
}

export async function getTransactionsByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      gte(transactions.timestamp, startDate),
      lte(transactions.timestamp, endDate)
    ))
    .orderBy(desc(transactions.timestamp));
  
  return result;
}

export async function getTransactionStatistics(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;
  
  let conditions = [eq(transactions.userId, userId)];
  if (startDate) conditions.push(gte(transactions.timestamp, startDate));
  if (endDate) conditions.push(lte(transactions.timestamp, endDate));
  
  const allTransactions = await db.select().from(transactions)
    .where(and(...conditions));
  
  const deposits = allTransactions.filter(t => t.type === "deposit");
  const withdrawals = allTransactions.filter(t => t.type === "withdrawal");
  
  const totalDeposits = deposits.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalWithdrawals = withdrawals.reduce((sum, t) => sum + (t.amount || 0), 0);
  
  return {
    totalDeposits,
    totalWithdrawals,
    netFlow: totalDeposits - totalWithdrawals,
    depositCount: deposits.length,
    withdrawalCount: withdrawals.length,
    totalTransactions: allTransactions.length,
  };
}



// ===== ADMIN FUNCTIONS =====

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users).orderBy(users.createdAt);
}

export async function getAllAccounts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tradingAccounts).orderBy(tradingAccounts.createdAt);
}

export async function getSystemStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalUsers: 0,
      totalAccounts: 0,
      totalTrades: 0,
      connectedAccounts: 0,
    };
  }
  
  const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [accountsCount] = await db.select({ count: sql<number>`count(*)` }).from(tradingAccounts);
  const [tradesCount] = await db.select({ count: sql<number>`count(*)` }).from(trades);
  const [connectedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tradingAccounts)
    .where(eq(tradingAccounts.status, "connected"));
  
  return {
    totalUsers: Number(usersCount.count) || 0,
    totalAccounts: Number(accountsCount.count) || 0,
    totalTrades: Number(tradesCount.count) || 0,
    connectedAccounts: Number(connectedCount.count) || 0,
  };
}

export async function updateUserStatus(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}



export async function updateUser(userId: number, data: { name?: string; email?: string; role?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return;
  
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  // Deletar todas as contas do usuário
  await db.delete(tradingAccounts).where(eq(tradingAccounts.userId, userId));
  
  // Deletar todos os trades do usuário
  await db.delete(trades).where(eq(trades.userId, userId));
  
  // Deletar histórico de balanço
  await db.delete(balanceHistory).where(eq(balanceHistory.userId, userId));
  
  // Deletar transações
  await db.delete(transactions).where(eq(transactions.userId, userId));
  
  // Deletar usuário
  await db.delete(users).where(eq(users.id, userId));
}

export async function updateAccount(accountId: number, data: { isActive?: boolean }) {
  const db = await getDb();
  if (!db) return;
  
  const updateData: any = {};
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  await db.update(tradingAccounts).set(updateData).where(eq(tradingAccounts.id, accountId));
}

export async function deleteAccount(accountId: number) {
  const db = await getDb();
  if (!db) return;
  
  // Deletar todos os trades da conta
  await db.delete(trades).where(eq(trades.accountId, accountId));
  
  // Deletar histórico de balanço
  await db.delete(balanceHistory).where(eq(balanceHistory.accountId, accountId));
  
  // Deletar conta
  await db.delete(tradingAccounts).where(eq(tradingAccounts.id, accountId));
}


// ===== DAILY JOURNAL =====
export async function getDailyJournal(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { dailyJournal } = await import("../drizzle/schema");
  
  const entries = await db
    .select()
    .from(dailyJournal)
    .where(eq(dailyJournal.userId, userId))
    .orderBy(desc(dailyJournal.date));
  
  return entries.map(entry => ({
    ...entry,
    date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
  }));
}

export async function saveDailyJournal(
  userId: number,
  data: {
    date: string;
    notes?: string;
    mood?: "excellent" | "good" | "neutral" | "bad" | "terrible";
    marketConditions?: string;
    lessonsLearned?: string;
  }
) {
  const db = await getDb();
  if (!db) return { success: false };
  
  const { dailyJournal } = await import("../drizzle/schema");
  
  // Verificar se já existe entrada para esta data
  const existing = await db
    .select()
    .from(dailyJournal)
    .where(
      and(
        eq(dailyJournal.userId, userId),
        eq(dailyJournal.date, data.date)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Atualizar entrada existente
    await db
      .update(dailyJournal)
      .set({
        notes: data.notes || null,
        mood: data.mood || null,
        marketConditions: data.marketConditions || null,
        lessonsLearned: data.lessonsLearned || null,
        updatedAt: new Date(),
      })
      .where(eq(dailyJournal.id, existing[0].id));
  } else {
    // Criar nova entrada
    await db.insert(dailyJournal).values({
      userId,
      date: data.date,
      notes: data.notes || null,
      mood: data.mood || null,
      marketConditions: data.marketConditions || null,
      lessonsLearned: data.lessonsLearned || null,
    });
  }
  
  return { success: true };
}


// ===== API KEYS =====

export async function createApiKey(data: InsertApiKey) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(apiKeys).values(data);
  return Number(result[0].insertId);
}

export async function getApiKeyByKey(key: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(apiKeys)
    .where(eq(apiKeys.key, key))
    .limit(1);
  
  return result[0] || null;
}

export async function getUserApiKeys(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

export async function updateApiKeyLastUsed(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, id));
}

export async function toggleApiKeyStatus(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(apiKeys)
    .set({ isActive })
    .where(eq(apiKeys.id, id));
}

export async function deleteApiKey(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(apiKeys)
    .where(eq(apiKeys.id, id));
}

export async function getAccountByNumberAndUser(accountNumber: string, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(tradingAccounts)
    .where(and(
      eq(tradingAccounts.accountNumber, accountNumber),
      eq(tradingAccounts.userId, userId)
    ))
    .limit(1);
  
  return result[0] || null;
}

// ==================== Funções para MT4 Router ====================

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return result[0] || null;
}

export async function getTradingAccount(accountId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(tradingAccounts)
    .where(eq(tradingAccounts.id, accountId))
    .limit(1);
  
  return result[0] || null;
}

export async function createTradingAccount(account: InsertTradingAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // === NOVA FUNCIONALIDADE: VERIFICAR LIMITE DE CONTAS ===
  const { checkAccountLimit } = await import('./middleware/subscription-check');
  const limitCheck = await checkAccountLimit(account.userId);
  
  if (!limitCheck.canAddAccount) {
    const errorMessage = limitCheck.message || `Você atingiu o limite de ${limitCheck.maxAccounts} conta(s). Faça upgrade do seu plano para conectar mais contas.`;
    console.log(`❌ [LIMIT CHECK FAILED] User ${account.userId}: ${errorMessage}`);
    throw new Error(errorMessage);
  }
  
  console.log(`✅ [LIMIT CHECK PASSED] User ${account.userId}: ${limitCheck.currentCount}/${limitCheck.maxAccounts} contas (pode adicionar)`);
  
  // Criar a conta se passou na verificação
  const result = await db.insert(tradingAccounts).values(account);
  return result[0].insertId;
}

export async function updateTradingAccount(accountId: number, data: Partial<InsertTradingAccount>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(tradingAccounts)
    .set(data)
    .where(eq(tradingAccounts.id, accountId));
}

export async function createBalanceHistory(history: InsertBalanceHistory) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(balanceHistory).values(history);
}

export async function updateAccountHeartbeat(accountId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(tradingAccounts)
    .set({ lastHeartbeat: new Date() })
    .where(eq(tradingAccounts.id, accountId));
}

// Função para obter a conexão MySQL2 raw (para queries que precisam de execute)
export async function getRawConnection(): Promise<mysql2.Connection | null> {
  await getDb(); // Garante que a conexão foi inicializada
  return _connection;
}

/**
 * Calcula estatísticas diárias de trades para um usuário
 */
export async function getDailyStats(userId: number, date?: Date) {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const trades = await getTradesByDateRange(userId, startOfDay, endOfDay);
  
  const closedTrades = trades.filter(t => t.closeTime !== null);
  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter(t => (t.profit || 0) > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  // Calcular lucro considerando tipo de conta
  let totalProfit = 0;
  const db = await getDb();
  if (db) {
    for (const trade of closedTrades) {
      let profit = trade.profit || 0;
      
      // Buscar tipo de conta do trade
      if (trade.accountId) {
        const account = await db.select()
          .from(tradingAccounts)
          .where(eq(tradingAccounts.id, trade.accountId))
          .limit(1);
        
        // Se for conta CENT, dividir por 100
        if (account[0]?.accountType === 'CENT') {
          profit = profit / 100;
        }
      }
      
      totalProfit += profit;
    }
  } else {
    // Fallback se não conseguir acessar DB
    totalProfit = closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
  }
  
  console.log('[Stats] Closed trades:', closedTrades.length, 'Total profit:', totalProfit);
  
  const losingTrades = closedTrades.filter(t => (t.profit || 0) < 0).length;
  
  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalProfit: totalProfit,
    date: targetDate.toISOString().split('T')[0],
  };
}

/**
 * Calcula estatísticas semanais de trades para um usuário
 */
export async function getWeeklyStats(userId: number, date?: Date) {
  const targetDate = date || new Date();
  
  // Início da semana (domingo)
  const startOfWeek = new Date(targetDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Fim da semana (sábado)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  console.log('[getWeeklyStats] User:', userId);
  console.log('[getWeeklyStats] Start:', startOfWeek.toISOString());
  console.log('[getWeeklyStats] End:', endOfWeek.toISOString());
  
  const trades = await getTradesByDateRange(userId, startOfWeek, endOfWeek);
  console.log('[getWeeklyStats] Total trades found:', trades.length);
  
  const closedTrades = trades.filter(t => t.closeTime !== null);
  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter(t => (t.profit || 0) > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  // Calcular lucro considerando tipo de conta
  let totalProfit = 0;
  const db = await getDb();
  if (db) {
    for (const trade of closedTrades) {
      let profit = trade.profit || 0;
      
      // Buscar tipo de conta do trade
      if (trade.accountId) {
        const account = await db.select()
          .from(tradingAccounts)
          .where(eq(tradingAccounts.id, trade.accountId))
          .limit(1);
        
        // Se for conta CENT, dividir por 100
        if (account[0]?.accountType === 'CENT') {
          profit = profit / 100;
        }
      }
      
      totalProfit += profit;
    }
  } else {
    // Fallback se não conseguir acessar DB
    totalProfit = closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
  }
  
  console.log('[Stats] Closed trades:', closedTrades.length, 'Total profit:', totalProfit);
  
  const losingTrades = closedTrades.filter(t => (t.profit || 0) < 0).length;
  
  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalProfit: totalProfit,
    weekStart: startOfWeek.toISOString().split('T')[0],
    weekEnd: endOfWeek.toISOString().split('T')[0],
  };
}

/**
 * Calcula estatísticas por conta individual (para notificações separadas)
 */
export async function getStatsByAccount(userId: number, startDate: Date, endDate: Date) {
  const trades = await getTradesByDateRange(userId, startDate, endDate);
  const closedTrades = trades.filter(t => t.closeTime !== null && t.accountId !== null);
  
  // Agrupar trades por conta
  const tradesByAccount = new Map<number, typeof closedTrades>();
  for (const trade of closedTrades) {
    if (!trade.accountId) continue;
    if (!tradesByAccount.has(trade.accountId)) {
      tradesByAccount.set(trade.accountId, []);
    }
    tradesByAccount.get(trade.accountId)!.push(trade);
  }
  
  // Calcular estatísticas para cada conta
  const db = await getDb();
  if (!db) return [];
  
  const results = [];
  for (const [accountId, accountTrades] of tradesByAccount.entries()) {
    // Buscar informações da conta
    const account = await db.select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, accountId))
      .limit(1);
    
    if (!account[0]) continue;
    
    // Calcular lucro considerando tipo de conta
    let totalProfit = 0;
    for (const trade of accountTrades) {
      let profit = trade.profit || 0;
      if (account[0].accountType === 'CENT') {
        profit = profit / 100;
      }
      totalProfit += profit;
    }
    
    const totalTrades = accountTrades.length;
    const winningTrades = accountTrades.filter(t => (t.profit || 0) > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    results.push({
      accountId,
      accountLogin: account[0].login,
      accountType: account[0].accountType,
      totalTrades,
      winRate,
      profit: totalProfit,
    });
  }
  
  return results;
}

/**
 * Busca um dia aleatório que tenha trades fechados (para testes)
 */
export async function getRandomDayWithTrades(userId: number): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Buscar todos os dias únicos que têm trades fechados
  const result = await db.select({
    closeTime: trades.closeTime,
  })
  .from(trades)
  .where(
    and(
      eq(trades.userId, userId),
      isNotNull(trades.closeTime)
    )
  )
  .orderBy(desc(trades.closeTime))
  .limit(1000); // Limitar para performance
  
  if (result.length === 0) return null;
  
  // Agrupar por dia
  const days = new Set<string>();
  for (const trade of result) {
    if (trade.closeTime) {
      const day = trade.closeTime.toISOString().split('T')[0];
      days.add(day);
    }
  }
  
  if (days.size === 0) return null;
  
  // Escolher um dia aleatório
  const daysArray = Array.from(days);
  const randomDay = daysArray[Math.floor(Math.random() * daysArray.length)];
  
  return new Date(randomDay);
}

/**
 * Encontra o último dia que teve trades fechados para um usuário
 */
export async function getLastDayWithTrades(userId: number): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({ closeTime: trades.closeTime })
    .from(trades)
    .where(and(
      eq(trades.userId, userId),
      eq(trades.status, 'closed'),
      isNotNull(trades.closeTime)
    ))
    .orderBy(desc(trades.closeTime))
    .limit(1);

  if (result.length === 0 || !result[0].closeTime) {
    return null;
  }

  return new Date(result[0].closeTime);
}

/**
 * Busca uma semana aleatória que tenha trades fechados (para testes)
 */
export async function getRandomWeekWithTrades(userId: number): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Buscar todos os trades fechados
  const result = await db.select({
    closeTime: trades.closeTime,
  })
  .from(trades)
  .where(
    and(
      eq(trades.userId, userId),
      isNotNull(trades.closeTime)
    )
  )
  .orderBy(desc(trades.closeTime))
  .limit(1000);
  
  if (result.length === 0) return null;
  
  // Agrupar por semana (domingo a sábado)
  const weeks = new Set<string>();
  for (const trade of result) {
    if (trade.closeTime) {
      const date = new Date(trade.closeTime);
      // Início da semana (domingo)
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const weekKey = startOfWeek.toISOString().split('T')[0];
      weeks.add(weekKey);
    }
  }
  
  if (weeks.size === 0) return null;
  
  // Escolher uma semana aleatória
  const weeksArray = Array.from(weeks);
  const randomWeek = weeksArray[Math.floor(Math.random() * weeksArray.length)];
  
  return new Date(randomWeek);
}

/**
 * Encontra a última semana que teve trades fechados para um usuário
 */
export async function getLastWeekWithTrades(userId: number): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({ closeTime: trades.closeTime })
    .from(trades)
    .where(and(
      eq(trades.userId, userId),
      eq(trades.status, 'closed'),
      isNotNull(trades.closeTime)
    ))
    .orderBy(desc(trades.closeTime))
    .limit(1);

  if (result.length === 0 || !result[0].closeTime) {
    return null;
  }

  // Retorna a data do último trade, que será usada para calcular a semana
  return new Date(result[0].closeTime);
}
