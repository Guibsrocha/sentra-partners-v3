import cron from 'node-cron';
import { getDb } from './db';
import { users, trades, userSettings } from '../drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { NtfyService } from './services/ntfy-notifications';
import { calculateDailyDrawdown } from './jobs/calculate-drawdown';
import { checkExpirations } from './jobs/check-expirations';

/**
 * Calcula lucro e estatísticas de um período
 */
async function calculateProfitStats(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const userTrades = await db
    .select()
    .from(trades)
    .where(
      and(
        eq(trades.userId, userId),
        eq(trades.status, 'closed'),
        gte(trades.closeTime, startDate),
        lte(trades.closeTime, endDate)
      )
    );

  if (userTrades.length === 0) {
    return null;
  }

  const totalProfit = userTrades.reduce((sum, trade) => {
    const profit = (trade as any).isCentAccount ? (trade.profit || 0) / 100 : (trade.profit || 0);
    return sum + profit;
  }, 0);

  const winningTrades = userTrades.filter((t) => (t.profit || 0) > 0).length;
  const winRate = (winningTrades / userTrades.length) * 100;

  return {
    profit: totalProfit,
    tradesCount: userTrades.length,
    winRate,
  };
}

/**
 * Calcula melhor e pior dia da semana
 */
async function calculateBestWorstDays(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const userTrades = await db
    .select()
    .from(trades)
    .where(
      and(
        eq(trades.userId, userId),
        eq(trades.status, 'closed'),
        gte(trades.closeTime, startDate),
        lte(trades.closeTime, endDate)
      )
    );

  if (userTrades.length === 0) {
    return {
      bestDay: { date: '-', profit: 0 },
      worstDay: { date: '-', profit: 0 },
    };
  }

  // Agrupar por dia
  const dailyProfits = new Map<string, number>();
  
  userTrades.forEach((trade) => {
    const date = new Date(trade.closeTime!).toLocaleDateString('pt-BR');
    const profit = (trade as any).isCentAccount ? (trade.profit || 0) / 100 : (trade.profit || 0);
    dailyProfits.set(date, (dailyProfits.get(date) || 0) + profit);
  });

  let bestDay = { date: '', profit: -Infinity };
  let worstDay = { date: '', profit: Infinity };

  dailyProfits.forEach((profit, date) => {
    if (profit > bestDay.profit) {
      bestDay = { date, profit };
    }
    if (profit < worstDay.profit) {
      worstDay = { date, profit };
    }
  });

  return { bestDay, worstDay };
}

/**
 * Envia notificações diárias (19h)
 */
async function sendDailyNotifications() {
  console.log('Running daily profit notifications...');
  
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Buscar usuários com ntfy habilitado e resumo diário ativado
  const usersWithNtfy = await db
    .select({
      userId: userSettings.userId,
    })
    .from(userSettings)
    .where(sql`${userSettings.ntfyEnabled} = TRUE AND ${userSettings.ntfyDailyEnabled} = TRUE`);
  
  const allUsers = usersWithNtfy;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const ntfyService = new NtfyService();

  for (const user of allUsers) {
    try {
      const stats = await calculateProfitStats(user.userId, today, tomorrow);
      
      if (!stats) {
        console.log(`No trades today for user ${user.userId}`);
        continue;
      }

      await ntfyService.sendDailyReport(user.userId, {
        totalTrades: stats.tradesCount,
        winRate: stats.winRate,
        profit: stats.profit,
        date: today.toLocaleDateString('pt-BR'),
      });

      console.log(`Daily notification sent to user ${user.userId}`);
    } catch (error) {
      console.error(`Error sending daily notification to user ${user.userId}:`, error);
    }
  }
}

/**
 * Envia notificações semanais (sábado 8h)
 */
async function sendWeeklyNotifications() {
  console.log('Running weekly profit notifications...');
  
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Buscar usuários com ntfy habilitado e resumo semanal ativado
  const usersWithNtfy = await db
    .select({
      userId: userSettings.userId,
    })
    .from(userSettings)
    .where(sql`${userSettings.ntfyEnabled} = TRUE AND ${userSettings.ntfyWeeklyEnabled} = TRUE`);
  
  const allUsers = usersWithNtfy;

  // Calcular domingo a sexta da semana passada
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = domingo, 6 = sábado
  
  // Se hoje é sábado (6), calcular domingo a sexta da semana atual
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek); // Volta para domingo
  sunday.setHours(0, 0, 0, 0);
  
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6); // Avança para sábado
  saturday.setHours(0, 0, 0, 0);

  const ntfyService = new NtfyService();

  for (const user of allUsers) {
    try {
      const stats = await calculateProfitStats(user.userId, sunday, saturday);
      
      if (!stats) {
        console.log(`No trades this week for user ${user.userId}`);
        continue;
      }

      await ntfyService.sendWeeklyReport(user.userId, {
        totalTrades: stats.tradesCount,
        winRate: stats.winRate,
        profit: stats.profit,
        weekStart: sunday.toLocaleDateString('pt-BR'),
        weekEnd: saturday.toLocaleDateString('pt-BR'),
      });

      console.log(`Weekly notification sent to user ${user.userId}`);
    } catch (error) {
      console.error(`Error sending weekly notification to user ${user.userId}:`, error);
    }
  }
}

/**
 * Inicializa os cron jobs
 */
export function initNotificationCron() {
  // Notificação diária às 19h (horário de Brasília = GMT-3)
  // Cron: 0 19 * * * (19h todos os dias)
  cron.schedule('0 19 * * *', sendDailyNotifications, {
    timezone: 'America/Sao_Paulo',
  });

  // Notificação semanal aos sábados às 8h
  // Cron: 0 8 * * 6 (8h aos sábados)
  cron.schedule('0 8 * * 6', sendWeeklyNotifications, {
    timezone: 'America/Sao_Paulo',
  });

  // Cálculo de drawdown diário às 23:59
  // Cron: 59 23 * * * (23:59 todos os dias)
  cron.schedule('59 23 * * *', calculateDailyDrawdown, {
    timezone: 'America/Sao_Paulo',
  });

  // Verificação de expirações (VPS, assinaturas, EAs) às 9h
  // Cron: 0 9 * * * (9h todos os dias)
  cron.schedule('0 9 * * *', checkExpirations, {
    timezone: 'America/Sao_Paulo',
  });

  // Verificação de inatividade às 10h
  // Cron: 0 10 * * * (10h todos os dias)
  cron.schedule('0 10 * * *', async () => {
    const { checkInactivity } = await import('./services/inactivity-checker');
    await checkInactivity();
  }, {
    timezone: 'America/Sao_Paulo',
  });

  // Limpeza de contas offline (48h) a cada hora
  // Cron: 0 * * * * (a cada hora)
  cron.schedule('0 * * * *', async () => {
    const { cleanupOfflineAccounts } = await import('./jobs/cleanup-offline-accounts');
    await cleanupOfflineAccounts();
  }, {
    timezone: 'America/Sao_Paulo',
  });

  console.log('Notification cron jobs initialized:');
  console.log('- Daily: Every day at 19:00 (America/Sao_Paulo)');
  console.log('- Weekly: Every Saturday at 08:00 (America/Sao_Paulo)');
  console.log('- Drawdown: Every day at 23:59 (America/Sao_Paulo)');
  console.log('- Expirations: Every day at 09:00 (America/Sao_Paulo)');
  console.log('- Inactivity: Every day at 10:00 (America/Sao_Paulo)');
  console.log('- Cleanup Offline Accounts: Every hour (America/Sao_Paulo)');
}
