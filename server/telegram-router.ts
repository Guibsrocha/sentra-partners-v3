import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { telegramUsers, userSettings, notificationHistory } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { telegramService } from "./services/telegram-notifications";
import { telegramAlertsService, TelegramAlertsService } from "./services/telegram-alerts";
import * as db from "./db";

export const telegramRouter = router({
  // Gerar token único para vincular Telegram (compatível com getTopic do ntfy)
  generateToken: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    // Buscar token existente
    const [existing] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    let token: string;

    // SEMPRE gerar novo token
    {
      // Gerar novo token (64 caracteres)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      token = '';
      for (let i = 0; i < 64; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Salvar no banco
      if (existing) {
        // Atualizar token existente e desativar vinculação anterior
        await database
          .update(telegramUsers)
          .set({ 
            telegramToken: token,
            isActive: false,
            chatId: null,
          })
          .where(eq(telegramUsers.userId, ctx.user.id));
      } else {
        // Criar novo registro
        await database.insert(telegramUsers).values({
          userId: ctx.user.id,
          telegramToken: token,
          isActive: false,
        });
      }

      console.log(`[Telegram] Novo token gerado para usuário ${ctx.user.id}`);
    }

    return {
      token,
      topic: token, // Alias para compatibilidade com frontend
      botUsername: "SentraPartners_Bot",
      botUrl: "https://t.me/SentraPartners_Bot",
      instructions: [
        "1. Abra o Telegram e busque por @SentraPartners_Bot",
        "2. Envie o comando /start",
        "3. Cole o token acima",
        "4. Pronto! Você receberá notificações",
      ],
    };
  }),

  // Alias para generateToken (compatibilidade com ntfy)
  getTopic: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [existing] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    let token: string;

    if (existing?.telegramToken) {
      token = existing.telegramToken;
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      token = '';
      for (let i = 0; i < 64; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      if (existing) {
        await database
          .update(telegramUsers)
          .set({ telegramToken: token })
          .where(eq(telegramUsers.userId, ctx.user.id));
      } else {
        await database.insert(telegramUsers).values({
          userId: ctx.user.id,
          telegramToken: token,
          isActive: false,
        });
      }

      console.log(`[Telegram] Novo token gerado para usuário ${ctx.user.id}`);
    }

    return {
      token,
      topic: token,
      botUsername: "SentraPartners_Bot",
      botUrl: "https://t.me/SentraPartners_Bot",
      instructions: [
        "1. Abra o Telegram e busque por @SentraPartners_Bot",
        "2. Envie o comando /start",
        "3. Cole o token acima",
        "4. Pronto! Você receberá notificações",
      ],
    };
  }),

  // Retornar configurações do Telegram (compatível com getSettings do ntfy)
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [settings] = await database
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.user.id))
      .limit(1);

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    if (!settings) {
      return {
        telegramEnabled: telegram?.isActive || false,
        telegramToken: telegram?.telegramToken || null,
        telegramTradesEnabled: true,
        telegramDrawdownEnabled: true,
        telegramConnectionEnabled: true,
        telegramCopyTradeEnabled: true,
        telegramVpsExpiringEnabled: true,
        telegramSubscriptionExpiringEnabled: true,
        telegramEaExpiringEnabled: true,
        telegramDailyEnabled: true,
        telegramWeeklyEnabled: true,
        drawdownThreshold: 10,
        dailyTime: "19:00",
        weeklyTime: "08:00",
        telegramDailyTitle: "📊 Relatório Diário",
        telegramWeeklyTitle: "🎉 Relatório Semanal",
        telegramDailyIndividualTitle: "💰 Conta {login} - Dia",
        telegramWeeklyIndividualTitle: "📈 Conta {login} - Semana",
        telegramNotificationType: "consolidated" as "consolidated" | "individual",
        displayCurrency: "BRL",
        inactivityDays: 7,
        inactivityAlertEnabled: false,
      };
    }

    return {
      telegramEnabled: telegram?.isActive || false,
      telegramToken: telegram?.telegramToken || null,
      telegramTradesEnabled: settings.ntfyTradesEnabled ?? true,
      telegramDrawdownEnabled: settings.ntfyDrawdownEnabled ?? true,
      telegramConnectionEnabled: settings.ntfyConnectionEnabled ?? true,
      telegramCopyTradeEnabled: settings.ntfyCopyTradeEnabled ?? true,
      telegramVpsExpiringEnabled: settings.ntfyVpsExpiringEnabled ?? true,
      telegramSubscriptionExpiringEnabled: settings.ntfySubscriptionExpiringEnabled ?? true,
      telegramEaExpiringEnabled: settings.ntfyEaExpiringEnabled ?? true,
      telegramDailyEnabled: settings.ntfyDailyEnabled ?? true,
      telegramWeeklyEnabled: settings.ntfyWeeklyEnabled ?? true,
      drawdownThreshold: settings.drawdownThreshold ?? 10,
      dailyTime: settings.dailyTime || "19:00",
      weeklyTime: settings.weeklyTime || "08:00",
      telegramDailyTitle: settings.ntfyDailyTitle || "📊 Relatório Diário",
      telegramWeeklyTitle: settings.ntfyWeeklyTitle || "🎉 Relatório Semanal",
      telegramDailyIndividualTitle: settings.ntfyDailyIndividualTitle || "💰 Conta {login} - Dia",
      telegramWeeklyIndividualTitle: settings.ntfyWeeklyIndividualTitle || "📈 Conta {login} - Semana",
      telegramNotificationType: (settings.ntfyNotificationType || "consolidated") as "consolidated" | "individual",
      displayCurrency: settings.displayCurrency || "BRL",
      inactivityDays: settings.inactivityDays ?? 7,
      inactivityAlertEnabled: settings.inactivityAlertEnabled ?? false,
    };
  }),

  // Atualizar configurações
  updateSettings: protectedProcedure
    .input(
      z.object({
        telegramEnabled: z.boolean().optional(),
        telegramTradesEnabled: z.boolean().optional(),
        telegramDrawdownEnabled: z.boolean().optional(),
        telegramConnectionEnabled: z.boolean().optional(),
        telegramCopyTradeEnabled: z.boolean().optional(),
        telegramVpsExpiringEnabled: z.boolean().optional(),
        telegramSubscriptionExpiringEnabled: z.boolean().optional(),
        telegramEaExpiringEnabled: z.boolean().optional(),
        telegramDailyEnabled: z.boolean().optional(),
        telegramWeeklyEnabled: z.boolean().optional(),
        drawdownThreshold: z.number().optional(),
        dailyTime: z.string().optional(),
        weeklyTime: z.string().optional(),
        telegramDailyTitle: z.string().optional(),
        telegramWeeklyTitle: z.string().optional(),
        telegramDailyIndividualTitle: z.string().optional(),
        telegramWeeklyIndividualTitle: z.string().optional(),
        telegramNotificationType: z.enum(["consolidated", "individual"]).optional(),
        displayCurrency: z.string().optional(),
        inactivityDays: z.number().optional(),
        inactivityAlertEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database não disponível");

      const [existing] = await database
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user.id))
        .limit(1);

      const updateData: any = {};
      if (input.telegramTradesEnabled !== undefined) updateData.ntfyTradesEnabled = input.telegramTradesEnabled;
      if (input.telegramDrawdownEnabled !== undefined) updateData.ntfyDrawdownEnabled = input.telegramDrawdownEnabled;
      if (input.telegramConnectionEnabled !== undefined) updateData.ntfyConnectionEnabled = input.telegramConnectionEnabled;
      if (input.telegramCopyTradeEnabled !== undefined) updateData.ntfyCopyTradeEnabled = input.telegramCopyTradeEnabled;
      if (input.telegramVpsExpiringEnabled !== undefined) updateData.ntfyVpsExpiringEnabled = input.telegramVpsExpiringEnabled;
      if (input.telegramSubscriptionExpiringEnabled !== undefined) updateData.ntfySubscriptionExpiringEnabled = input.telegramSubscriptionExpiringEnabled;
      if (input.telegramEaExpiringEnabled !== undefined) updateData.ntfyEaExpiringEnabled = input.telegramEaExpiringEnabled;
      if (input.telegramDailyEnabled !== undefined) updateData.ntfyDailyEnabled = input.telegramDailyEnabled;
      if (input.telegramWeeklyEnabled !== undefined) updateData.ntfyWeeklyEnabled = input.telegramWeeklyEnabled;
      if (input.drawdownThreshold !== undefined) updateData.drawdownThreshold = input.drawdownThreshold;
      if (input.dailyTime !== undefined) updateData.dailyTime = input.dailyTime;
      if (input.weeklyTime !== undefined) updateData.weeklyTime = input.weeklyTime;
      if (input.telegramDailyTitle !== undefined) updateData.ntfyDailyTitle = input.telegramDailyTitle;
      if (input.telegramWeeklyTitle !== undefined) updateData.ntfyWeeklyTitle = input.telegramWeeklyTitle;
      if (input.telegramDailyIndividualTitle !== undefined) updateData.ntfyDailyIndividualTitle = input.telegramDailyIndividualTitle;
      if (input.telegramWeeklyIndividualTitle !== undefined) updateData.ntfyWeeklyIndividualTitle = input.telegramWeeklyIndividualTitle;
      if (input.telegramNotificationType !== undefined) updateData.ntfyNotificationType = input.telegramNotificationType;
      if (input.displayCurrency !== undefined) updateData.displayCurrency = input.displayCurrency;
      if (input.inactivityDays !== undefined) updateData.inactivityDays = input.inactivityDays;
      if (input.inactivityAlertEnabled !== undefined) updateData.inactivityAlertEnabled = input.inactivityAlertEnabled;

      if (!existing) {
        await database.insert(userSettings).values({
          userId: ctx.user.id,
          ...updateData,
        });
        console.log("[Telegram] Configurações criadas para usuário:", ctx.user.id);
      } else {
        await database
          .update(userSettings)
          .set(updateData)
          .where(eq(userSettings.userId, ctx.user.id));
        console.log("[Telegram] Configurações atualizadas para usuário:", ctx.user.id);
      }

      return { success: true };
    }),

  // Verificar status da vinculação
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    return {
      isLinked: telegram?.isActive || false,
      chatId: telegram?.chatId || null,
      linkedAt: telegram?.linkedAt || null,
    };
  }),

  // Desvincular Telegram
  unlink: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    await database
      .update(telegramUsers)
      .set({
        chatId: null,
        isActive: false,
        telegramToken: null,
      })
      .where(eq(telegramUsers.userId, ctx.user.id));

    return { success: true, message: "Telegram desvinculado com sucesso!" };
  }),

  // Enviar notificação de teste
  sendTest: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      throw new Error("Telegram não vinculado. Por favor, vincule primeiro usando o bot @SentraPartners_Bot");
    }

    await telegramService.sendTestNotification(
      telegram.chatId,
      ctx.user.language || "pt-BR"
    );

    return { success: true, message: "Notificação de teste enviada!" };
  }),

  // Enviar resumo diário de teste
  sendTelegramDailyTest: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      console.log('[telegram.sendDailyTest] CHAMADO! User ID:', ctx.user.id);
      
      const database = await getDb();
      if (!database) throw new Error("Database não disponível");

      const [telegram] = await database
        .select()
        .from(telegramUsers)
        .where(eq(telegramUsers.userId, ctx.user.id))
        .limit(1);

      if (!telegram || !telegram.chatId || !telegram.isActive) {
        throw new Error("Telegram não vinculado. Por favor, vincule primeiro usando o bot @SentraPartners_Bot");
      }

      // Usar data fixa para teste: 30/10/2025 (quinta-feira)
      const testDate = new Date('2025-10-30T00:00:00.000Z');
      console.log('[telegram.sendDailyTest] Data de teste:', testDate);
      
      // Buscar estatísticas diárias do banco de dados (dia fixo)
      let stats = await db.getDailyStats(ctx.user.id, testDate);
      console.log('[telegram.sendDailyTest] Estatísticas:', stats);
      
      // Se não houver trades, retornar erro amigável
      if (stats.totalTrades === 0) {
        console.log('[telegram.sendDailyTest] Sem trades para enviar');
        throw new Error('Você ainda não possui trades registrados. Adicione trades para testar as notificações.');
      }
      
      // Buscar moeda configurada do usuário
      const [settings] = await database.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
      const currency = settings?.displayCurrency || 'USD';
      
      // Enviar via Telegram
      await telegramService.sendDailyReport(telegram.chatId, stats, currency, ctx.user.language || "pt-BR");

      console.log("[Telegram] Resumo diário de teste enviado para usuário:", ctx.user.id);
      return { success: true, message: "Resumo diário de teste enviado!" };
    } catch (error) {
      console.error('[telegram.sendDailyTest] ERRO COMPLETO:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro desconhecido ao enviar resumo diário');
    }
  }),

  // Enviar resumo semanal de teste
  sendTelegramWeeklyTest: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      console.log('[telegram.sendWeeklyTest] CHAMADO! User ID:', ctx.user.id);
      
      const database = await getDb();
      if (!database) throw new Error("Database não disponível");

      const [telegram] = await database
        .select()
        .from(telegramUsers)
        .where(eq(telegramUsers.userId, ctx.user.id))
        .limit(1);

      if (!telegram || !telegram.chatId || !telegram.isActive) {
        throw new Error("Telegram não vinculado. Por favor, vincule primeiro usando o bot @SentraPartners_Bot");
      }

      // Usar semana fixa para teste: 27/10/2025 a 02/11/2025
      const testWeek = new Date('2025-10-27T00:00:00.000Z');
      console.log('[telegram.sendWeeklyTest] Semana de teste (27/10-02/11):', testWeek);
      
      // Buscar estatísticas semanais do banco de dados (semana fixa)
      let stats = await db.getWeeklyStats(ctx.user.id, testWeek);
      console.log('[telegram.sendWeeklyTest] Estatísticas:', stats);
      
      // Se não houver trades, retornar erro amigável
      if (stats.totalTrades === 0) {
        console.log('[telegram.sendWeeklyTest] Sem trades para enviar');
        throw new Error('Você ainda não possui trades registrados. Adicione trades para testar as notificações.');
      }
      
      // Buscar moeda configurada do usuário
      const [settings] = await database.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
      const currency = settings?.displayCurrency || 'USD';
      
      // Enviar via Telegram
      await telegramService.sendWeeklyReport(telegram.chatId, stats, currency, ctx.user.language || "pt-BR");

      console.log("[Telegram] Resumo semanal de teste enviado para usuário:", ctx.user.id);
      return { success: true, message: "Resumo semanal de teste enviado!" };
    } catch (error) {
      console.error('[telegram.sendWeeklyTest] ERRO COMPLETO:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro desconhecido ao enviar resumo semanal');
    }
  }),

  // Gerar relatório personalizado
  sendCustomReport: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(365) }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[telegram.sendCustomReport] CHAMADO! User ID:', ctx.user.id, 'Days:', input.days);
        
        const database = await getDb();
        if (!database) throw new Error("Database não disponível");

        const [telegram] = await database
          .select()
          .from(telegramUsers)
          .where(eq(telegramUsers.userId, ctx.user.id))
          .limit(1);

        if (!telegram || !telegram.chatId || !telegram.isActive) {
          throw new Error("Telegram não vinculado. Por favor, vincule primeiro usando o bot @SentraPartners_Bot");
        }

        const { generateCustomReport } = await import("./services/custom-report");
        const report = await generateCustomReport({ userId: ctx.user.id, days: input.days });

        await telegramService.sendCustomReport(
          telegram.chatId,
          report,
          "USD",
          ctx.user.language || "pt-BR"
        );

        return { success: true, message: `Relatório de ${input.days} dias enviado!` };
      } catch (error) {
        console.error('[telegram.sendCustomReport] Erro:', error);
        throw error;
      }
    }),

  // Enviar resumo mensal de teste
  sendTelegramMonthlyTest: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      console.log('[telegram.sendMonthlyTest] CHAMADO! User ID:', ctx.user.id);
      
      const database = await getDb();
      if (!database) throw new Error("Database não disponível");

      const [telegram] = await database
        .select()
        .from(telegramUsers)
        .where(eq(telegramUsers.userId, ctx.user.id))
        .limit(1);

      if (!telegram || !telegram.chatId || !telegram.isActive) {
        throw new Error("Telegram não vinculado. Por favor, vincule primeiro usando o bot @SentraPartners_Bot");
      }

      // Usar mês passado para teste (outubro 2025)
      const { sendMonthlyReportToUser } = await import("./services/telegram-helper");
      const sent = await sendMonthlyReportToUser(ctx.user.id);

      if (!sent) {
        throw new Error("Erro ao enviar relatório mensal");
      }

      return { success: true, message: "Relatório mensal de teste enviado!" };
    } catch (error) {
      console.error('[telegram.sendMonthlyTest] Erro:', error);
      throw error;
    }
  }),

  // Testar todas as notificações
  testAllTelegramNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      console.log('[telegram.testAll] CHAMADO! User ID:', ctx.user.id);
      
      const database = await getDb();
      if (!database) throw new Error("Database não disponível");

      const [telegram] = await database
        .select()
        .from(telegramUsers)
        .where(eq(telegramUsers.userId, ctx.user.id))
        .limit(1);

      if (!telegram || !telegram.chatId || !telegram.isActive) {
        throw new Error("Telegram não vinculado. Por favor, vincule primeiro usando o bot @SentraPartners_Bot");
      }

      const language = ctx.user.language || "pt-BR";

      // Enviar apenas uma notificação de teste
      await telegramService.sendTestNotification(telegram.chatId, language);

      return { success: true, message: "Notificação de teste enviada!" };
    } catch (error) {
      console.error('[telegram.testAll] ERRO:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao enviar notificações de teste');
    }
  }),

  // Testar notificação de trade normal
  testTradeNormal: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      throw new Error("Telegram não vinculado");
    }

    // 1. Abertura do trade
    await telegramService.sendTradeOpened(
      ctx.user.id,
      "TESTE-12345",
      {
        ticket: "TEST" + Date.now(),
        symbol: "EURUSD",
        type: "BUY",
        volume: 0.1,
        openPrice: 1.0850,
        sl: 1.0800,
        tp: 1.0900,
      },
      ctx.user.language || "pt-BR"
    );

    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Fechamento com take profit
    await telegramService.sendTradeTakeProfit(
      ctx.user.id,
      "TESTE-12345",
      {
        ticket: "TEST" + Date.now(),
        symbol: "EURUSD",
        type: "BUY",
        profit: 50.00,
        closePrice: 1.0900,
      },
      ctx.user.language || "pt-BR"
    );

    return { success: true, message: "Notificações de trade normal enviadas!" };
  }),

  // Testar notificação de copy trade
  testCopyTrade: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      throw new Error("Telegram não vinculado");
    }

    // 1. Execução do copy trade
    await telegramService.sendCopyTradeExecuted(
      ctx.user.id,
      "CONTA-001",
      {
        providerName: "John Trader Pro",
        symbol: "GBPUSD",
        type: "SELL",
        volume: 0.5,
        accounts: ["CONTA-001", "CONTA-002", "CONTA-003"],
      },
      ctx.user.language || "pt-BR"
    );

    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Encerramento do copy trade
    await telegramService.sendCopyTradeClosed(
      ctx.user.id,
      "CONTA-001",
      {
        providerName: "John Trader Pro",
        symbol: "GBPUSD",
        type: "SELL",
        profit: 150.00,
        accountsProfits: [
          { account: "CONTA-001", profit: 50.00, profitConverted: 250.00 },
          { account: "CONTA-002", profit: 50.00, profitConverted: 250.00 },
          { account: "CONTA-003", profit: 50.00, profitConverted: 250.00 },
        ],
        currency: "BRL",
        exchangeRate: 5.0,
      },
      ctx.user.language || "pt-BR"
    );

    return { success: true, message: "Notificações de copy trade enviadas!" };
  }),

  // Testar alerta de drawdown
  testDrawdownAlert: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      throw new Error("Telegram não vinculado");
    }

    await telegramAlertsService.sendDrawdownAlert(
      ctx.user.id,
      "TESTE-12345",
      {
        currentDrawdown: 15.5,
        maxDrawdown: 20.0,
        equity: 8450.00,
      },
      ctx.user.language || "pt-BR"
    );

    return { success: true, message: "Alerta de drawdown enviado!" };
  }),

  // Testar alerta de conexão
  testConnectionAlert: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      throw new Error("Telegram não vinculado");
    }

    await telegramAlertsService.sendConnectionAlert(
      ctx.user.id,
      "TESTE-12345",
      false,
      ctx.user.language || "pt-BR"
    );

    return { success: true, message: "Alerta de conexão enviado!" };
  }),

  // Testar alerta de VPS
  testVPSAlert: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      throw new Error("Telegram não vinculado");
    }

    await telegramAlertsService.sendVPSExpirationAlert(
      ctx.user.id,
      {
        name: "VPS Premium #1",
        expirationDate: "15/11/2025",
        daysRemaining: 7,
      },
      ctx.user.language || "pt-BR"
    );

    return { success: true, message: "Alerta de VPS enviado!" };
  }),

  // Testar alerta de assinatura
  testSubscriptionAlert: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      throw new Error("Telegram não vinculado");
    }

    await telegramAlertsService.sendSubscriptionExpirationAlert(
      ctx.user.id,
      {
        plan: "Plano Premium",
        expirationDate: "20/11/2025",
        daysRemaining: 5,
      },
      ctx.user.language || "pt-BR"
    );

    return { success: true, message: "Alerta de assinatura enviado!" };
  }),

  // Testar alerta de EA
  testEAAlert: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      throw new Error("Telegram não vinculado");
    }

    await telegramAlertsService.sendEAExpirationAlert(
      ctx.user.id,
      {
        name: "Smart Scalper Pro",
        expirationDate: "30/11/2025",
        daysRemaining: 10,
      },
      ctx.user.language || "pt-BR"
    );

    return { success: true, message: "Alerta de EA enviado!" };
  }),

  // Testar alerta de inatividade
  testInactivityAlert: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      throw new Error("Telegram não vinculado");
    }

    await telegramAlertsService.sendInactivityAlert(
      ctx.user.id,
      "TESTE-12345",
      7,
      ctx.user.language || "pt-BR"
    );

    return { success: true, message: "Alerta de inatividade enviado!" };
  }),

  // Testar notificação de venda (Admin)
  testSaleNotification: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      throw new Error("Telegram não vinculado");
    }

    await telegramAlertsService.sendSaleNotification(
      telegram.chatId,
      {
        customerName: "João Silva",
        plan: "Plano Premium",
        value: 197.00,
        currency: "BRL",
      },
      ctx.user.language || "pt-BR"
    );

    return { success: true, message: "Notificação de venda enviada!" };
  }),

  // Testar notificação de renovação (Admin)
  testRenewalNotification: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, ctx.user.id))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      throw new Error("Telegram não vinculado");
    }

    await telegramAlertsService.sendRenewalNotification(
      telegram.chatId,
      {
        customerName: "Maria Santos",
        plan: "Plano Premium",
        value: 197.00,
        currency: "BRL",
      },
      ctx.user.language || "pt-BR"
    );

    return { success: true, message: "Notificação de renovação enviada!" };
  }),

  // Buscar histórico de notificações
  getNotificationHistory: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database não disponível");

      const history = await database
        .select()
        .from(notificationHistory)
        .where(eq(notificationHistory.userId, ctx.user.id))
        .orderBy(desc(notificationHistory.sentAt))
        .limit(input.limit)
        .offset(input.offset);

      return history;
    }),
});
