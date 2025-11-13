import { getDb } from "../db";
import { trades, tradingAccounts } from "../../drizzle/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";

export interface CustomReportParams {
  userId: number;
  days: number; // 7, 30, 90, etc
}

export interface AccountStats {
  accountNumber: string;
  broker: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  bestTrade: number;
  worstTrade: number;
  averageProfit: number;
}

export interface CustomReportResult {
  period: string;
  totalStats: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalProfit: number;
    bestTrade: number;
    worstTrade: number;
    averageProfit: number;
  };
  accountsStats: AccountStats[];
}

/**
 * Gera relatório personalizado por período
 */
export async function generateCustomReport(params: CustomReportParams): Promise<CustomReportResult> {
  const db = await getDb();
  if (!db) throw new Error("Database não disponível");

  const { userId, days } = params;

  // Calcular período
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  console.log(`[Custom Report] Gerando relatório de ${days} dias para usuário ${userId}`);
  console.log(`[Custom Report] Período: ${startDate.toISOString()} até ${endDate.toISOString()}`);

  // Buscar todos os trades do período
  const userTrades = await db
    .select({
      trade: trades,
      account: tradingAccounts,
    })
    .from(trades)
    .leftJoin(tradingAccounts, eq(trades.accountId, tradingAccounts.id))
    .where(
      and(
        eq(trades.userId, userId),
        gte(trades.openTime, startDate),
        lt(trades.openTime, endDate)
      )
    )
    .orderBy(desc(trades.openTime));

  console.log(`[Custom Report] Encontrados ${userTrades.length} trades no período`);

  if (userTrades.length === 0) {
    return {
      period: `${days} dias`,
      totalStats: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfit: 0,
        bestTrade: 0,
        worstTrade: 0,
        averageProfit: 0,
      },
      accountsStats: [],
    };
  }

  // Agrupar por conta
  const accountsMap = new Map<number, {
    accountNumber: string;
    broker: string;
    trades: typeof userTrades;
  }>();

  for (const item of userTrades) {
    const { trade, account } = item;
    
    if (!account) continue;

    if (!accountsMap.has(account.id)) {
      accountsMap.set(account.id, {
        accountNumber: account.accountNumber,
        broker: account.broker || "Unknown",
        trades: [],
      });
    }

    accountsMap.get(account.id)!.trades.push(item);
  }

  // Calcular estatísticas por conta
  const accountsStats: AccountStats[] = [];

  for (const [accountId, accountData] of accountsMap) {
    const accountTrades = accountData.trades.map(t => t.trade);
    
    const totalTrades = accountTrades.length;
    const winningTrades = accountTrades.filter(t => t.profit && t.profit > 0).length;
    const losingTrades = accountTrades.filter(t => t.profit && t.profit < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const profits = accountTrades.map(t => (t.profit || 0) / 100); // Converter de centavos
    const totalProfit = profits.reduce((sum, p) => sum + p, 0);
    const bestTrade = Math.max(...profits, 0);
    const worstTrade = Math.min(...profits, 0);
    const averageProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;

    accountsStats.push({
      accountNumber: accountData.accountNumber,
      broker: accountData.broker,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalProfit,
      bestTrade,
      worstTrade,
      averageProfit,
    });
  }

  // Calcular estatísticas totais
  const allTrades = userTrades.map(t => t.trade);
  const totalTrades = allTrades.length;
  const winningTrades = allTrades.filter(t => t.profit && t.profit > 0).length;
  const losingTrades = allTrades.filter(t => t.profit && t.profit < 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  const allProfits = allTrades.map(t => (t.profit || 0) / 100);
  const totalProfit = allProfits.reduce((sum, p) => sum + p, 0);
  const bestTrade = Math.max(...allProfits, 0);
  const worstTrade = Math.min(...allProfits, 0);
  const averageProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;

  return {
    period: `${days} dias`,
    totalStats: {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalProfit,
      bestTrade,
      worstTrade,
      averageProfit,
    },
    accountsStats,
  };
}
