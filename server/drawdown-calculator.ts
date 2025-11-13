import { getDb } from "./db";
import { tradingAccounts, balanceHistory, accountDrawdown, consolidatedDrawdown, userSettings, drawdownAlertHistory } from "../drizzle/schema";
import { eq, and, gte, lte, inArray, desc, sql } from "drizzle-orm";
import { sendDrawdownAlert } from "./services/telegram-helper";

/**
 * Verifica se pode enviar alerta de drawdown (máximo 2 por dia, espaçados 12h)
 */
async function canSendDrawdownAlert(
  userId: number,
  accountNumber: string | null,
  alertType: 'individual' | 'consolidated'
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Buscar alertas enviados nas últimas 24 horas
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentAlerts = await db.select()
    .from(drawdownAlertHistory)
    .where(
      and(
        eq(drawdownAlertHistory.userId, userId),
        accountNumber 
          ? eq(drawdownAlertHistory.accountNumber, accountNumber)
          : sql`${drawdownAlertHistory.accountNumber} IS NULL`,
        eq(drawdownAlertHistory.alertType, alertType),
        gte(drawdownAlertHistory.sentAt, twentyFourHoursAgo)
      )
    )
    .orderBy(desc(drawdownAlertHistory.sentAt));

  // Se já enviou 2 ou mais alertas nas últimas 24h, não enviar
  if (recentAlerts.length >= 2) {
    console.log(`[Drawdown] Limite de alertas atingido para userId=${userId}, account=${accountNumber}, type=${alertType}`);
    return false;
  }

  // Se enviou 1 alerta, verificar se passou 12h
  if (recentAlerts.length === 1) {
    const lastAlertTime = recentAlerts[0].sentAt.getTime();
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    
    if (lastAlertTime > twelveHoursAgo) {
      console.log(`[Drawdown] Aguardando 12h desde último alerta para userId=${userId}, account=${accountNumber}`);
      return false;
    }
  }

  return true;
}

/**
 * Registra alerta de drawdown enviado
 */
async function logDrawdownAlert(
  userId: number,
  accountNumber: string | null,
  alertType: 'individual' | 'consolidated',
  drawdownPercent: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(drawdownAlertHistory).values({
      userId,
      accountNumber,
      alertType,
      drawdownPercent: Math.round(drawdownPercent * 100), // Converter para inteiro (15.50% → 1550)
      sentAt: new Date(),
    });
    console.log(`[Drawdown] Alerta registrado: userId=${userId}, account=${accountNumber}, type=${alertType}`);
  } catch (error) {
    console.error('[Drawdown] Erro ao registrar alerta:', error);
  }
}

/**
 * Calcula o drawdown individual de uma conta em um período (apenas o máximo)
 * LÓGICA SIMPLIFICADA:
 * - Salvar apenas o drawdown MÁXIMO do período
 * - Se um novo drawdown mais ALTO ocorrer, substituir o valor anterior
 */
export async function calculateAccountDrawdown(
  accountId: number,
  userId: number,
  date: Date,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Buscar conta
  const [account] = await db.select()
    .from(tradingAccounts)
    .where(eq(tradingAccounts.id, accountId))
    .limit(1);

  if (!account) throw new Error('Account not found');

  // Definir período de busca
  const periodStart = getPeriodStart(date, period);
  const periodEnd = getPeriodEnd(date, period);

  // Buscar todo o histórico de balance no período
  const history = await db.select()
    .from(balanceHistory)
    .where(
      and(
        eq(balanceHistory.accountId, accountId),
        gte(balanceHistory.timestamp, periodStart),
        lte(balanceHistory.timestamp, periodEnd)
      )
    )
    .orderBy(balanceHistory.timestamp);

  if (history.length === 0) {
    // Sem dados, usar valores atuais da conta
    const currentBalance = account.balance || 0;
    return {
      accountId,
      peakBalance: currentBalance,
      currentBalance,
      drawdownAmount: 0,
      drawdownPercent: 0,
      isCentAccount: account.accountType === 'CENT',
    };
  }

  // Encontrar o maior balance (pico) no período
  let maxBalance = Math.max(...history.map(h => h.balance));
  if (maxBalance < (account.balance || 0)) {
    maxBalance = account.balance || 0;
  }

  const currentBalance = account.balance || 0;
  
  // Calcular drawdown atual (pico - atual)
  const currentDrawdownAmount = Math.max(0, maxBalance - currentBalance);
  const currentDrawdownPercent = maxBalance > 0 ? Math.round((currentDrawdownAmount / maxBalance) * 10000) : 0;
  const currentDrawdownPercentDecimal = currentDrawdownPercent / 100;

  // Buscar drawdown já salvo para este período (se existir)
  const dateStr = date.toISOString().split('T')[0];
  const [existingDrawdown] = await db.select()
    .from(accountDrawdown)
    .where(
      and(
        eq(accountDrawdown.accountId, accountId),
        eq(accountDrawdown.date, dateStr),
        eq(accountDrawdown.period, period)
      )
    )
    .limit(1);

  // LÓGICA SIMPLIFICADA: Manter apenas o DRAWDOWN MÁXIMO
  let maxDrawdownAmount = currentDrawdownAmount;
  let maxDrawdownPercent = currentDrawdownPercent;
  let maxDrawdownPercentDecimal = currentDrawdownPercentDecimal;

  // Se já existe um drawdown salvo e ele é maior que o atual, manter o anterior
  if (existingDrawdown && existingDrawdown.drawdownPercent > currentDrawdownPercent) {
    maxDrawdownAmount = existingDrawdown.drawdownAmount;
    maxDrawdownPercent = existingDrawdown.drawdownPercent;
    maxDrawdownPercentDecimal = existingDrawdown.drawdownPercent / 100;
    console.log(`[Drawdown] Mantendo drawdown máximo anterior: ${maxDrawdownPercentDecimal.toFixed(2)}%`);
  } else {
    console.log(`[Drawdown] Novo drawdown máximo: ${currentDrawdownPercentDecimal.toFixed(2)}%`);
  }

  // Verificar se drawdown ultrapassou o limite configurado
  const [settings] = await db.select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  
  const drawdownLimit = settings?.ntfyDrawdownLimit || 1000; // Default: 1000% (sem limite)
  
  // Enviar notificação individual se ultrapassou o limite E pode enviar (deduplicação)
  if (maxDrawdownPercentDecimal >= drawdownLimit) {
    console.log(`[Drawdown] Conta ${account.accountNumber} ultrapassou limite: ${maxDrawdownPercentDecimal.toFixed(2)}% >= ${drawdownLimit}%`);
    
    // Verificar se pode enviar alerta (máximo 2 por dia, espaçados 12h)
    const canSend = await canSendDrawdownAlert(userId, account.accountNumber, 'individual');
    
    if (canSend) {
      // Normalizar valores (CENT: dividir por 100, STANDARD: manter)
      const normalizedMax = account.accountType === 'CENT' ? maxBalance / 100 : maxBalance;
      const normalizedCurrent = account.accountType === 'CENT' ? currentBalance / 100 : currentBalance;
      
      const sent = await sendDrawdownAlert(userId, {
        accountNumber: account.accountNumber,
        drawdownPercent: maxDrawdownPercentDecimal,
        currentBalance: normalizedCurrent,
        initialBalance: normalizedMax
      }, "USD", 'individual');

      // Registrar alerta enviado
      if (sent) {
        await logDrawdownAlert(userId, account.accountNumber, 'individual', maxDrawdownPercentDecimal);
      }
    }
  }

  // Salvar apenas o DRAWDOWN MÁXIMO no banco
  try {
    await db.insert(accountDrawdown).values({
      accountId,
      userId,
      date: dateStr,
      peakBalance: maxBalance,
      currentBalance,
      drawdownAmount: maxDrawdownAmount,
      drawdownPercent: maxDrawdownPercent,
      isCentAccount: account.accountType === 'CENT',
      period,
    }).onDuplicateKeyUpdate({
      set: {
        peakBalance: maxBalance,
        currentBalance,
        drawdownAmount: maxDrawdownAmount,
        drawdownPercent: maxDrawdownPercent,
        updatedAt: new Date(),
      }
    });
  } catch (error) {
    console.error('[Drawdown] Error saving account drawdown:', error);
  }

  return {
    accountId,
    peakBalance: maxBalance,
    currentBalance,
    drawdownAmount: maxDrawdownAmount,
    drawdownPercent: maxDrawdownPercentDecimal,
    isCentAccount: account.accountType === 'CENT',
  };
}

/**
 * Calcula o drawdown consolidado de todas as contas do usuário
 * LÓGICA SIMPLIFICADA:
 * - Somar os drawdowns MÁXIMOS de todas as contas
 * - Salvar apenas o drawdown consolidado MÁXIMO do período
 * - Se um novo drawdown consolidado mais ALTO ocorrer, substituir o valor anterior
 */
export async function calculateConsolidatedDrawdown(
  userId: number,
  date: Date,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Buscar todas as contas ativas do usuário
  const accounts = await db.select()
    .from(tradingAccounts)
    .where(
      and(
        eq(tradingAccounts.userId, userId),
        eq(tradingAccounts.isActive, true)
      )
    );

  if (accounts.length === 0) {
    return {
      totalPeakBalance: 0,
      totalCurrentBalance: 0,
      totalDrawdownAmount: 0,
      totalDrawdownPercent: 0,
      accountCount: 0,
    };
  }

  // Definir período de busca
  const periodStart = getPeriodStart(date, period);
  const periodEnd = getPeriodEnd(date, period);

  let totalPeakBalance = 0;
  let totalCurrentBalance = 0;
  let totalDrawdownAmount = 0;

  // Calcular para cada conta - SOMAR os drawdowns individuais
  for (const account of accounts) {
    // Buscar histórico de balance no período
    const history = await db.select()
      .from(balanceHistory)
      .where(
        and(
          eq(balanceHistory.accountId, account.id),
          gte(balanceHistory.timestamp, periodStart),
          lte(balanceHistory.timestamp, periodEnd)
        )
      )
      .orderBy(balanceHistory.timestamp);

    // Determinar pico de balance desta conta
    let peakBalance = account.balance || 0;
    if (history.length > 0) {
      peakBalance = Math.max(...history.map(h => h.balance));
      if (peakBalance < (account.balance || 0)) {
        peakBalance = account.balance || 0;
      }
    }

    const currentBalance = account.balance || 0;

    // Normalizar valores (CENT: dividir por 100, STANDARD: manter)
    const normalizedPeak = account.accountType === 'CENT' ? peakBalance / 100 : peakBalance;
    const normalizedCurrent = account.accountType === 'CENT' ? currentBalance / 100 : currentBalance;

    totalPeakBalance += normalizedPeak;
    totalCurrentBalance += normalizedCurrent;

    // Calcular drawdown desta conta e somar ao total
    const accountDrawdownAmount = Math.max(0, normalizedPeak - normalizedCurrent);
    totalDrawdownAmount += accountDrawdownAmount;
  }

  // Calcular drawdown consolidado (usando os valores totais)
  const totalDrawdownPercent = totalPeakBalance > 0 
    ? Math.round((totalDrawdownAmount / totalPeakBalance) * 10000) 
    : 0;
  const totalDrawdownPercentDecimal = totalDrawdownPercent / 100;

  // Buscar drawdown consolidado já salvo para este período (se existir)
  const dateStr = date.toISOString().split('T')[0];
  const [existingConsolidatedDrawdown] = await db.select()
    .from(consolidatedDrawdown)
    .where(
      and(
        eq(consolidatedDrawdown.userId, userId),
        eq(consolidatedDrawdown.date, dateStr),
        eq(consolidatedDrawdown.period, period)
      )
    )
    .limit(1);

  // LÓGICA SIMPLIFICADA: Manter apenas o DRAWDOWN CONSOLIDADO MÁXIMO
  let finalTotalDrawdownAmount = Math.round(totalDrawdownAmount);
  let finalTotalDrawdownPercent = totalDrawdownPercent;
  let finalTotalDrawdownPercentDecimal = totalDrawdownPercentDecimal;

  // Se já existe um drawdown consolidado salvo e ele é maior que o atual, manter o anterior
  if (existingConsolidatedDrawdown && existingConsolidatedDrawdown.totalDrawdownPercent > totalDrawdownPercent) {
    finalTotalDrawdownAmount = existingConsolidatedDrawdown.totalDrawdownAmount;
    finalTotalDrawdownPercent = existingConsolidatedDrawdown.totalDrawdownPercent;
    finalTotalDrawdownPercentDecimal = existingConsolidatedDrawdown.totalDrawdownPercent / 100;
    console.log(`[Drawdown] Mantendo drawdown consolidado máximo anterior: ${finalTotalDrawdownPercentDecimal.toFixed(2)}%`);
  } else {
    console.log(`[Drawdown] Novo drawdown consolidado máximo: ${totalDrawdownPercentDecimal.toFixed(2)}%`);
  }

  // Verificar se drawdown consolidated ultrapassou o limite configurado
  const [settings] = await db.select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  
  const drawdownLimit = settings?.ntfyDrawdownLimit || 1000; // Default: 1000% (sem limite)
  
  // Enviar notificação se ultrapassou o limite E pode enviar (deduplicação)
  if (finalTotalDrawdownPercentDecimal >= drawdownLimit) {
    console.log(`[Drawdown] Usuário ${userId} ultrapassou limite de drawdown consolidado: ${finalTotalDrawdownPercentDecimal.toFixed(2)}% >= ${drawdownLimit}%`);
    
    // Verificar se pode enviar alerta (máximo 2 por dia, espaçados 12h)
    const canSend = await canSendDrawdownAlert(userId, null, 'consolidated');
    
    if (canSend) {
      // Usar "CONSOLIDATED" como accountNumber para alertas consolidados
      const sent = await sendDrawdownAlert(userId, {
        accountNumber: "CONSOLIDATED",
        drawdownPercent: finalTotalDrawdownPercentDecimal,
        currentBalance: totalCurrentBalance,
        initialBalance: totalPeakBalance
      }, "USD", 'consolidated');

      // Registrar alerta enviado
      if (sent) {
        await logDrawdownAlert(userId, null, 'consolidated', finalTotalDrawdownPercentDecimal);
      }
    }
  }
  
  // Salvar apenas o DRAWDOWN CONSOLIDADO MÁXIMO no banco
  try {
    await db.insert(consolidatedDrawdown).values({
      userId,
      date: dateStr,
      totalPeakBalance: Math.round(totalPeakBalance),
      totalCurrentBalance: Math.round(totalCurrentBalance),
      totalDrawdownAmount: finalTotalDrawdownAmount,
      totalDrawdownPercent: finalTotalDrawdownPercent,
      accountCount: accounts.length,
      period,
    }).onDuplicateKeyUpdate({
      set: {
        totalPeakBalance: Math.round(totalPeakBalance),
        totalCurrentBalance: Math.round(totalCurrentBalance),
        totalDrawdownAmount: finalTotalDrawdownAmount,
        totalDrawdownPercent: finalTotalDrawdownPercent,
        accountCount: accounts.length,
        updatedAt: new Date(),
      }
    });
  } catch (error) {
    console.error('[Drawdown] Error saving consolidated drawdown:', error);
  }

  return {
    totalPeakBalance: Math.round(totalPeakBalance),
    totalCurrentBalance: Math.round(totalCurrentBalance),
    totalDrawdownAmount: finalTotalDrawdownAmount,
    totalDrawdownPercent: finalTotalDrawdownPercentDecimal, // Retornar como decimal
    accountCount: accounts.length,
  };
}

/**
 * Busca drawdown individual de uma conta
 */
export async function getAccountDrawdown(
  accountId: number,
  date: Date,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const db = await getDb();
  if (!db) return null;

  const dateStr = date.toISOString().split('T')[0];

  const [result] = await db.select()
    .from(accountDrawdown)
    .where(
      and(
        eq(accountDrawdown.accountId, accountId),
        eq(accountDrawdown.date, dateStr),
        eq(accountDrawdown.period, period)
      )
    )
    .limit(1);

  // Se não houver dados salvos, calcular em tempo real
  if (!result) {
    console.log(`[Drawdown] Nenhum dado salvo para conta ${accountId}, calculando em tempo real...`);
    
    // Buscar conta
    const { tradingAccounts } = await import("../drizzle/schema");
    const [account] = await db.select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, accountId))
      .limit(1);

    if (!account) return null;

    // Buscar userId da conta
    const userId = account.userId;
    
    // Calcular drawdown em tempo real
    const calculated = await calculateAccountDrawdown(accountId, userId, date, period);
    
    return {
      accountId: calculated.accountId,
      peakBalance: calculated.peakBalance,
      currentBalance: calculated.currentBalance,
      drawdownAmount: calculated.drawdownAmount,
      drawdownPercent: calculated.drawdownPercent,
      isCentAccount: calculated.isCentAccount,
    };
  }

  return {
    ...result,
    drawdownPercent: result.drawdownPercent / 100, // Converter para decimal
  };
}

/**
 * Busca drawdown consolidado do usuário
 */
export async function getConsolidatedDrawdown(
  userId: number,
  date: Date,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const db = await getDb();
  if (!db) return null;

  const dateStr = date.toISOString().split('T')[0];

  const [result] = await db.select()
    .from(consolidatedDrawdown)
    .where(
      and(
        eq(consolidatedDrawdown.userId, userId),
        eq(consolidatedDrawdown.date, dateStr),
        eq(consolidatedDrawdown.period, period)
      )
    )
    .limit(1);

  if (!result) return null;

  return {
    ...result,
    totalDrawdownPercent: result.totalDrawdownPercent / 100, // Converter para decimal
  };
}

/**
 * Busca histórico de drawdown de uma conta
 */
export async function getAccountDrawdownHistory(
  accountId: number,
  startDate: Date,
  endDate: Date,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const db = await getDb();
  if (!db) return [];

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const results = await db.select()
    .from(accountDrawdown)
    .where(
      and(
        eq(accountDrawdown.accountId, accountId),
        gte(accountDrawdown.date, startStr),
        lte(accountDrawdown.date, endStr),
        eq(accountDrawdown.period, period)
      )
    )
    .orderBy(accountDrawdown.date);

  return results.map(r => ({
    ...r,
    drawdownPercent: r.drawdownPercent / 100,
  }));
}

/**
 * Busca histórico de drawdown consolidado do usuário
 */
export async function getConsolidatedDrawdownHistory(
  userId: number,
  startDate: Date,
  endDate: Date,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const db = await getDb();
  if (!db) return [];

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const results = await db.select()
    .from(consolidatedDrawdown)
    .where(
      and(
        eq(consolidatedDrawdown.userId, userId),
        gte(consolidatedDrawdown.date, startStr),
        lte(consolidatedDrawdown.date, endStr),
        eq(consolidatedDrawdown.period, period)
      )
    )
    .orderBy(consolidatedDrawdown.date);

  return results.map(r => ({
    ...r,
    totalDrawdownPercent: r.totalDrawdownPercent / 100,
  }));
}

// ===== HELPERS =====

function getPeriodStart(date: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (period === 'daily') {
    return d;
  } else if (period === 'weekly') {
    // Início da semana (domingo)
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  } else {
    // Início do mês
    d.setDate(1);
    return d;
  }
}

function getPeriodEnd(date: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);

  if (period === 'daily') {
    return d;
  } else if (period === 'weekly') {
    // Fim da semana (sábado)
    const day = d.getDay();
    d.setDate(d.getDate() + (6 - day));
    return d;
  } else {
    // Fim do mês
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d;
  }
}
