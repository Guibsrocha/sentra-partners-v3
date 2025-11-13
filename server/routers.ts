import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { economicEvents } from "../drizzle/schema";
import { getForexFactoryEvents } from "./forex-calendar";
import { registerUser, loginUser } from "./auth";
import { analyticsRouter } from "./analytics-router";
import { adminRouter } from "./admin-router";
import { supportRouter } from "./support-router";
import { passwordResetRouter } from "./password-reset-router";
import { eaLicenseRouter } from "./ea-license-router";
import { mt4Router } from "./mt4-router";
import { notificationsRouter } from "./notifications-router";
import { ntfyRouter } from "./ntfy-router";
import { telegramRouter } from "./telegram-router";
import { userRouter } from "./user-router";
import { bugReportsRouter } from "./bug-reports-router";
import * as drawdown from "./drawdown-calculator";
import { hasDataAccess } from "./middleware/access-control";

// Função para gerar API Key única
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'sk_';
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export const appRouter = router({
  system: systemRouter,
  analytics: analyticsRouter,
  admin: adminRouter,
  support: supportRouter,
  passwordReset: passwordResetRouter,
  eaLicense: eaLicenseRouter,
  mt4: mt4Router,
  notifications: notificationsRouter,
  ntfy: ntfyRouter,
  telegram: telegramRouter,
  user: userRouter,
  bugReports: bugReportsRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await registerUser(input.email, input.password, input.name);
        
        if (!result.success || !result.user) {
          throw new Error(result.error || 'Registration failed');
        }

        // Create session token
        const { createToken } = await import('./auth');
        const token = await createToken(result.user);

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          success: true,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
          },
        };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await loginUser(input.email, input.password);
        
        if (!result.success || !result.user || !result.token) {
          throw new Error(result.error || 'Login failed');
        }

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, result.token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          success: true,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
          },
        };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ===== DASHBOARD =====
  dashboard: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      // Verificar se usuário tem acesso aos dados
      const canAccess = await hasDataAccess(ctx.user.id);
      console.log('[dashboard.summary] User ID:', ctx.user.id, 'Can access:', canAccess);
      
      // Se não tiver acesso, retornar dados vazios
      if (!canAccess) {
        return {
          summary: null,
          stats: null,
          openTrades: [],
          transactionStats: null,
          recentTrades: [],
        };
      }
      
      const summary = await db.getAccountSummary(ctx.user.id);
      const stats = await db.getTradeStatistics(ctx.user.id);
      const openTrades = await db.getOpenTrades(ctx.user.id);
      const recentTrades = await db.getUserTrades(ctx.user.id, 10);
      const transactionStats = await db.getTransactionStatistics(ctx.user.id);
      
      return {
        summary,
        stats,
        openTrades,
        transactionStats,
        recentTrades,
      };
    }),
  }),

  // ===== DRAWDOWN =====
  drawdown: router({
    // Calcular drawdown consolidado (total)
    calculateConsolidated: protectedProcedure
      .input(z.object({
        date: z.string().optional(), // YYYY-MM-DD
        period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
      }))
      .mutation(async ({ ctx, input }) => {
        const date = input.date ? new Date(input.date) : new Date();
        return await drawdown.calculateConsolidatedDrawdown(ctx.user.id, date, input.period);
      }),

    // Calcular drawdown individual de uma conta
    calculateAccount: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        date: z.string().optional(), // YYYY-MM-DD
        period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
      }))
      .mutation(async ({ ctx, input }) => {
        const date = input.date ? new Date(input.date) : new Date();
        return await drawdown.calculateAccountDrawdown(input.accountId, ctx.user.id, date, input.period);
      }),

    // Buscar drawdown consolidado
    getConsolidated: protectedProcedure
      .input(z.object({
        date: z.string().optional(), // YYYY-MM-DD
        period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
      }))
      .query(async ({ ctx, input }) => {
        const date = input.date ? new Date(input.date) : new Date();
        return await drawdown.getConsolidatedDrawdown(ctx.user.id, date, input.period);
      }),

    // Buscar drawdown individual de uma conta
    getAccount: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        date: z.string().optional(), // YYYY-MM-DD
        period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
      }))
      .query(async ({ ctx, input }) => {
        const date = input.date ? new Date(input.date) : new Date();
        return await drawdown.getAccountDrawdown(input.accountId, date, input.period);
      }),

    // Buscar histórico de drawdown consolidado
    getConsolidatedHistory: protectedProcedure
      .input(z.object({
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(), // YYYY-MM-DD
        period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
      }))
      .query(async ({ ctx, input }) => {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        return await drawdown.getConsolidatedDrawdownHistory(ctx.user.id, startDate, endDate, input.period);
      }),

    // Buscar histórico de drawdown individual de uma conta
    getAccountHistory: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(), // YYYY-MM-DD
        period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
      }))
      .query(async ({ ctx, input }) => {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        return await drawdown.getAccountDrawdownHistory(input.accountId, startDate, endDate, input.period);
      }),
  }),

  // ===== ACCOUNTS =====
  accounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // hasDataAccess já importado no topo
      const canAccess = await hasDataAccess(ctx.user.id);
      if (!canAccess) return [];
      return await db.getUserAccounts(ctx.user.id);
    }),

    active: protectedProcedure.query(async ({ ctx }) => {
      // hasDataAccess já importado no topo
      const canAccess = await hasDataAccess(ctx.user.id);
      if (!canAccess) return [];
      return await db.getActiveAccounts(ctx.user.id);
    }),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAccountByTerminalId(input.id.toString());
      }),

    updateClassification: protectedProcedure
      .input(z.object({
        terminalId: z.string(),
        classification: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const account = await db.getAccountByTerminalId(input.terminalId);
        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }
        
        await db.createOrUpdateAccount({
          ...account,
          classification: input.classification,
        });
        
        return { success: true };
      }),

    transactions: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Buscar conta pelo accountId diretamente
        const accounts = await db.getUserAccounts(ctx.user.id);
        const account = accounts.find(a => a.id === input.accountId);
        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }
        return await db.getAccountTransactions(input.accountId);
      }),

    performance: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ input, ctx }) => {
        const accounts = await db.getUserAccounts(ctx.user.id);
        const account = accounts.find(a => a.id === input.accountId);
        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }

        // Buscar trades da conta
        const trades = await db.getAccountTrades(input.accountId, 1000);
        const closedTrades = trades.filter(t => t.closeTime);

        // Fator de conversão baseado no tipo de conta
        // Para contas CENT: profit está em centavos, dividir por 100 para obter dólares
        // Para contas NORMAIS: profit está em cents (1/100 de dólar), dividir por 100
        const conversionFactor = 100; // Sempre 100 para ambos os tipos

        // Calcular métricas
        const winningTrades = closedTrades.filter(t => (t.profit || 0) > 0);
        const losingTrades = closedTrades.filter(t => (t.profit || 0) < 0);
        const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
        const avgProfit = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / winningTrades.length / conversionFactor : 0;
        const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / losingTrades.length / conversionFactor : 0;
        const totalProfit = closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / conversionFactor;

        // Calcular rendimento mensal (últimos 6 meses)
        const now = new Date();
        
        // Calcular saldo atual em dólares
        const currentBalance = account.balance ? (account.balance / (account.isCentAccount ? 100 : 1)) : 0;
        
        // Calcular lucro total de todos os trades em dólares
        const totalHistoricalProfit = closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / conversionFactor;
        
        // Estimar saldo inicial (antes de todos os trades)
        const estimatedInitialBalance = Math.max(currentBalance - totalHistoricalProfit, currentBalance * 0.1);
        
        // Calcular saldo progressivo mês a mês (do mais antigo para o mais recente)
        let runningBalance = estimatedInitialBalance;
        const monthsData = [];
        
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
          
          const monthTrades = closedTrades.filter(t => {
            const closeTime = new Date(t.closeTime!);
            return closeTime >= monthStart && closeTime <= monthEnd;
          });

          const monthProfit = monthTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / conversionFactor;
          
          // Calcular retorno baseado no saldo no início do mês
          const monthStartBalance = runningBalance;
          const monthReturn = monthStartBalance > 0 ? (monthProfit / monthStartBalance) * 100 : 0;
          
          // Atualizar saldo para o próximo mês
          runningBalance += monthProfit;

          monthsData.push({
            month: monthDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
            return: Number(monthReturn.toFixed(2)),
            profit: monthProfit,
          });
        }
        
        // Retornar na ordem correta (mais recente primeiro)
        const monthlyReturns = monthsData;

        // Trades recentes (últimos 5)
        const recentTrades = closedTrades.slice(0, 5).map(t => ({
          id: t.id,
          symbol: t.symbol,
          type: t.type,
          profit: t.profit || 0, // Não divide aqui, deixa o frontend fazer
          isCentAccount: account.isCentAccount,
          pips: t.pips || 0,
          closeTime: t.closeTime,
        }));

        const totalReturn = monthlyReturns.reduce((sum, m) => sum + m.return, 0);

        return {
          winRate: Number(winRate.toFixed(2)),
          avgProfit: Number(avgProfit.toFixed(2)),
          avgLoss: Number(avgLoss.toFixed(2)),
          totalProfit: Number(totalProfit.toFixed(2)),
          totalReturn: Number(totalReturn.toFixed(2)),
          monthlyReturns,
          recentTrades,
          totalTrades: closedTrades.length,
          winningTrades: winningTrades.length,
          losingTrades: losingTrades.length,
        };
      }),
  }),

  // ===== TRADES =====
  trades: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(100),
        accountId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        // hasDataAccess já importado no topo
        const canAccess = await hasDataAccess(ctx.user.id);
        if (!canAccess) return [];
        
        // Filtro por data + conta específica
        if (input.startDate && input.endDate && input.accountId) {
          const allTrades = await db.getTradesByDateRange(ctx.user.id, input.startDate, input.endDate);
          return allTrades.filter(t => t.accountId === input.accountId);
        }
        // Filtro apenas por data (todas as contas)
        if (input.startDate && input.endDate) {
          return await db.getTradesByDateRange(ctx.user.id, input.startDate, input.endDate);
        }
        // Filtro apenas por conta (sem data)
        if (input.accountId) {
          return await db.getAccountTrades(input.accountId, input.limit);
        }
        // Sem filtro (todas as contas, sem data)
        return await db.getUserTrades(ctx.user.id, input.limit);
      }),

    open: protectedProcedure.query(async ({ ctx }) => {
      // hasDataAccess já importado no topo
      const canAccess = await hasDataAccess(ctx.user.id);
      if (!canAccess) return [];
      return await db.getOpenTrades(ctx.user.id);
    }),

    byDateRange: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getTradesByDateRange(ctx.user.id, input.startDate, input.endDate);
      }),

    statistics: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getTradeStatistics(ctx.user.id, input.startDate, input.endDate);
      }),
  }),

  // ===== TRADE NOTES =====
  tradeNotes: router({
    list: protectedProcedure
      .input(z.object({ tradeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTradeNotes(input.tradeId);
      }),

    create: protectedProcedure
      .input(z.object({
        tradeId: z.number(),
        note: z.string().optional(),
        tags: z.array(z.string()).optional(),
        screenshot: z.string().optional(),
        emotion: z.enum(["confident", "nervous", "greedy", "fearful", "neutral"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createTradeNote({
          ...input,
          userId: ctx.user.id,
          tags: input.tags ? JSON.stringify(input.tags) : undefined,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        note: z.string().optional(),
        tags: z.array(z.string()).optional(),
        screenshot: z.string().optional(),
        emotion: z.enum(["confident", "nervous", "greedy", "fearful", "neutral"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTradeNote(id, {
          ...data,
          tags: data.tags ? JSON.stringify(data.tags) : undefined,
        });
        return { success: true };
      }),
  }),

  // ===== STRATEGIES =====
  strategies: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // hasDataAccess já importado no topo
      const canAccess = await hasDataAccess(ctx.user.id);
      if (!canAccess) return [];
      return await db.getUserStrategies(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        rules: z.record(z.string(), z.any()).optional(),
        entryConditions: z.string().optional(),
        exitConditions: z.string().optional(),
        riskManagement: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const strategyData: any = {
          userId: ctx.user.id,
          name: input.name,
        };
        if (input.description) strategyData.description = input.description;
        if (input.rules) strategyData.rules = JSON.stringify(input.rules);
        if (input.entryConditions) strategyData.entryConditions = input.entryConditions;
        if (input.exitConditions) strategyData.exitConditions = input.exitConditions;
        if (input.riskManagement) strategyData.riskManagement = input.riskManagement;
        
        const id = await db.createStrategy(strategyData);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        rules: z.record(z.string(), z.any()).optional(),
        entryConditions: z.string().optional(),
        exitConditions: z.string().optional(),
        riskManagement: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.rules) {
          updateData.rules = JSON.stringify(data.rules);
        }
        await db.updateStrategy(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStrategy(input.id);
        return { success: true };
      }),
  }),

  // ===== BALANCE HISTORY =====
  balanceHistory: router({
    get: protectedProcedure
      .input(z.object({
        accountId: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        if (input.accountId) {
          return await db.getBalanceHistory(input.accountId, input.startDate, input.endDate);
        }
        return await db.getUserBalanceHistory(ctx.user.id, input.startDate, input.endDate);
      }),
  }),

  // ===== ECONOMIC EVENTS =====
  economicEvents: router({
    upcoming: protectedProcedure
      .input(z.object({ hours: z.number().optional().default(24) }))
      .query(async ({ input }) => {
        return await db.getUpcomingEvents(input.hours);
      }),

    byDateRange: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getEconomicEvents(input.startDate, input.endDate);
      }),
  }),

  // ===== COPY TRADING =====
  copyTrading: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserCopyConfigs(ctx.user.id);
    }),

    active: protectedProcedure.query(async ({ ctx }) => {
      return await db.getActiveCopyConfigs(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        sourceAccountId: z.number(),
        targetAccountId: z.number(),
        copyRatio: z.number().optional().default(10000), // 100.00%
        maxLotSize: z.number().optional().default(0),
        minLotSize: z.number().optional().default(0),
        stopOnDrawdown: z.number().optional().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCopyTradingConfig({
          ...input,
          userId: ctx.user.id,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        copyRatio: z.number().optional(),
        maxLotSize: z.number().optional(),
        minLotSize: z.number().optional(),
        stopOnDrawdown: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCopyConfig(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCopyConfig(input.id);
        return { success: true };
      }),
  }),

  // ===== ALERTS =====
  alerts: router({
    list: protectedProcedure
      .input(z.object({}))
      .query(async ({ ctx }) => {
        return await db.getUserAlerts(ctx.user.id);
      }),

    unread: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadAlerts(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markAlertAsRead(input.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllAlertsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ===== USER SETTINGS =====
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserSettings(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        theme: z.enum(["light", "dark"]).optional(),
        displayCurrency: z.string().optional(),
        dateFormat: z.string().optional(),
        timezone: z.string().optional(),
        decimalPrecision: z.number().optional(),
        heartbeatInterval: z.number().optional(),
        alertsEnabled: z.boolean().optional(),
        alertBalance: z.boolean().optional(),
        alertDrawdown: z.boolean().optional(),
        alertTrades: z.boolean().optional(),
        alertConnection: z.boolean().optional(),
        drawdownThreshold: z.number().optional(),
        barkKey: z.string().optional(),
        barkServerUrl: z.string().optional(),
        barkDailyEnabled: z.boolean().optional(),
        barkWeeklyEnabled: z.boolean().optional(),
        barkDailyTime: z.string().optional(),
        barkWeeklyTime: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log('[Settings Update] User ID:', ctx.user.id);
        console.log('[Settings Update] Input:', input);
        
        await db.createOrUpdateUserSettings({
          ...input,
          userId: ctx.user.id,
        });
        
        console.log('[Settings Update] Saved successfully');
        return { success: true };
      }),

    updateTimezone: protectedProcedure
      .input(z.object({
        timezone: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log('[Settings UpdateTimezone] User ID:', ctx.user.id);
        console.log('[Settings UpdateTimezone] Timezone:', input.timezone);
        
        await db.createOrUpdateUserSettings({
          timezone: input.timezone,
          userId: ctx.user.id,
        });
        
        console.log('[Settings UpdateTimezone] Saved successfully');
        return { success: true };
      }),

    testBark: protectedProcedure
      .input(z.object({
        barkKey: z.string(),
        barkServerUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        console.log('[testBark] START');
        console.log('[testBark] Bark Key:', input.barkKey);
        console.log('[testBark] Bark Server URL:', input.barkServerUrl);
        
        if (!input.barkServerUrl) {
          throw new Error('URL do servidor Bark é obrigatória');
        }
        
        try {
          const url = `${input.barkServerUrl}/${input.barkKey}/Teste%20Sentra%20Partners/Sua%20configura%C3%A7%C3%A3o%20est%C3%A1%20funcionando!?group=test&icon=https://sentrapartners.com/icon.png`;
          console.log('[testBark] URL:', url);
          
          const response = await fetch(url);
          console.log('[testBark] Response status:', response.status);
          
          const responseText = await response.text();
          console.log('[testBark] Response body:', responseText);
          
          if (!response.ok) {
            console.error('[testBark] Response not OK:', response.status, responseText);
            throw new Error(`Failed to send notification: ${response.status}`);
          }
          
          console.log('[testBark] SUCCESS');
          return { success: true };
        } catch (error: any) {
          console.error('[testBark] ERROR:', error);
          throw new Error(`Erro ao enviar notificação Bark: ${error.message}`);
        }
      }),
  }),



  // ===== JOURNAL =====
  journal: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDailyJournal(ctx.user!.id);
    }),

    save: protectedProcedure
      .input(z.object({
        date: z.string(),
        notes: z.string().optional(),
        mood: z.enum(["excellent", "good", "neutral", "bad", "terrible"]).optional(),
        marketConditions: z.string().optional(),
        lessonsLearned: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.saveDailyJournal(ctx.user!.id, input);
      }),
  }),

  // ===== CALENDAR =====
  calendar: router({
    // Buscar eventos do banco de dados
    events: publicProcedure.query(async () => {
      const dbInstance = await db.getDb();
      const events = await dbInstance.select().from(economicEvents).orderBy(economicEvents.eventTime);
      console.log(`[Calendar Router] Returning ${events.length} events from database`);
      // Transformar para formato esperado pelo frontend
      return events.map(e => {
        const eventDate = new Date(e.eventTime);
        const hours = eventDate.getUTCHours();
        const minutes = eventDate.getUTCMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        const hours12 = hours % 12 || 12;
        const minutesStr = minutes.toString().padStart(2, '0');
        const time12h = `${hours12}:${minutesStr}${ampm}`;
        
        return {
          title: e.eventName,
          country: e.currency,
          date: e.eventTime.toISOString().split('T')[0],
          time: time12h,
          impact: e.impact.charAt(0).toUpperCase() + e.impact.slice(1),
          forecast: e.forecastValue,
          previous: e.previousValue,
        };
      });
    }),
    
    // Alias para compatibilidade - com suporte a timezone
    getEvents: publicProcedure.query(async ({ ctx }) => {
      const dbInstance = await db.getDb();
      const events = await dbInstance.select().from(economicEvents).orderBy(economicEvents.eventTime);
      
      // Buscar timezone do usuário (padrão: UTC)
      let userTimezone = 'UTC';
      if (ctx.user?.id) {
        const { userSettings } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const settings = await dbInstance.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
        if (settings.length > 0 && settings[0].timezone) {
          userTimezone = settings[0].timezone;
        }
      }
      
      console.log(`[Calendar.getEvents] Returning ${events.length} events (timezone: ${userTimezone})`);
      
      // Transformar para formato esperado pelo frontend
      return events.map(e => {
        // Converter para timezone do usuário
        const eventDate = new Date(e.eventTime);
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        const parts = formatter.formatToParts(eventDate);
        const hour = parts.find(p => p.type === 'hour')?.value || '12';
        const minute = parts.find(p => p.type === 'minute')?.value || '00';
        const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value.toLowerCase() || 'am';
        const year = parts.find(p => p.type === 'year')?.value || '';
        const month = parts.find(p => p.type === 'month')?.value || '';
        const day = parts.find(p => p.type === 'day')?.value || '';
        
        const time12h = `${hour}:${minute}${dayPeriod}`;
        const localDate = `${year}-${month}-${day}`;
        
        return {
          title: e.eventName,
          country: e.currency,
          date: localDate,
          time: time12h,
          impact: e.impact.charAt(0).toUpperCase() + e.impact.slice(1),
          forecast: e.forecastValue,
          previous: e.previousValue,
        };
      });
    }),
  }),

  // ===== SUBSCRIPTIONS =====
  subscriptions: router({
    current: protectedProcedure.query(async ({ ctx }) => {
      const { checkSubscription } = await import('./middleware/subscription-check');
      const hasAccess = await checkSubscription(ctx.user.id);
      
      // Buscar assinatura ativa
      const database = await db.getDb();
      const { userSubscriptions, subscriptionPlans, users } = await import('../drizzle/schema');
      const { eq, and, gt } = await import('drizzle-orm');
      
      const [subscription] = await database
        .select({
          subscription: userSubscriptions,
          plan: subscriptionPlans,
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(
          and(
            eq(userSubscriptions.userId, ctx.user.id),
            eq(userSubscriptions.status, 'active'),
            gt(userSubscriptions.endDate, new Date())
          )
        )
        .limit(1);
      
      // Buscar permissões manuais
      const [user] = await database
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      
      // Parse manual_permissions apenas se for string JSON válida
      let manualPermissions = null;
      try {
        if (user?.manual_permissions && typeof user.manual_permissions === 'string') {
          manualPermissions = JSON.parse(user.manual_permissions);
        } else if (user?.manual_permissions && typeof user.manual_permissions === 'object') {
          manualPermissions = user.manual_permissions;
        }
      } catch (e) {
        console.error('[subscriptions.current] Erro ao parsear manual_permissions:', e);
      }
      
      const hasManualPermissions = manualPermissions && typeof manualPermissions === 'object' && Object.values(manualPermissions).some(v => v === true);
      
      return {
        hasActiveSubscription: hasAccess,
        subscription: subscription?.subscription || null,
        plan: subscription?.plan || null,
        hasManualPermissions,
        manualPermissions,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;

