import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { ntfyService } from "./services/ntfy-notifications";
import { getDb } from "./db";
import { userSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const ntfyRouter = router({
  // Retorna o tópico único do usuário
  getTopic: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database não disponível");

    // Buscar tópico existente do banco
    const [settings] = await database
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.user.id))
      .limit(1);

    let topic: string;

    if (settings?.ntfyTopic) {
      // Usuário já tem tópico salvo
      topic = settings.ntfyTopic;
    } else {
      // Gerar novo tópico com hash aleatório
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let hash = '';
      for (let i = 0; i < 16; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      topic = `sentra-${hash}`;

      // Salvar no banco
      if (settings) {
        // Atualizar settings existente
        await database
          .update(userSettings)
          .set({ ntfyTopic: topic })
          .where(eq(userSettings.userId, ctx.user.id));
      } else {
        // Criar novo settings
        await database.insert(userSettings).values({
          userId: ctx.user.id,
          ntfyTopic: topic,
        });
      }
      console.log(`[ntfy] Novo tópico gerado para usuário ${ctx.user.id}: ${topic}`);
    }
    
    return {
      topic,
      appStoreUrl: "https://apps.apple.com/us/app/ntfy/id1625396347",
      googlePlayUrl: "https://play.google.com/store/apps/details?id=io.heckel.ntfy",
      instructions: [
        "1. Instale o app \"ntfy\" no seu celular",
        "2. Abra o app e clique em \"+\"",
        `3. Digite o tópico: ${topic}`,
        "4. Pronto! Você receberá notificações aqui",
      ],
    };
  }),

  // Retorna as configurações ntfy do usuário
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) {
      throw new Error("Database não disponível");
    }

    const settings = await database
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.user.id))
      .limit(1);

    if (settings.length === 0) {
      return {
        ntfyEnabled: false,
        ntfyTopic: null,
        ntfyDailyEnabled: true,
        ntfyWeeklyEnabled: true,
        ntfyTradesEnabled: true,
        ntfyDrawdownEnabled: true,
        ntfyConnectionEnabled: true,
        drawdownThreshold: 10,
        dailyTime: "19:00",
        weeklyTime: "08:00",
      };
    }

    const s = settings[0];
    return {
      ntfyEnabled: s.ntfyEnabled || false,
      ntfyTopic: s.ntfyTopic,
      ntfyDailyEnabled: s.ntfyDailyEnabled ?? true,
      ntfyWeeklyEnabled: s.ntfyWeeklyEnabled ?? true,
      ntfyTradesEnabled: s.ntfyTradesEnabled ?? true,
      ntfyDrawdownEnabled: s.ntfyDrawdownEnabled ?? true,
      ntfyConnectionEnabled: s.ntfyConnectionEnabled ?? true,
      drawdownThreshold: s.drawdownThreshold ?? 10,
      dailyTime: s.dailyTime || "19:00",
      weeklyTime: s.weeklyTime || "08:00",
      ntfyDailyTitle: s.ntfyDailyTitle || "📊 Relatório Diário",
      ntfyWeeklyTitle: s.ntfyWeeklyTitle || "🎉 Relatório Semanal",
      ntfyDailyIndividualTitle: s.ntfyDailyIndividualTitle || "💰 Conta {login} - Dia",
      ntfyWeeklyIndividualTitle: s.ntfyWeeklyIndividualTitle || "📈 Conta {login} - Semana",
      ntfyNotificationType: s.ntfyNotificationType || "consolidated",
    };
  }),

  // Atualiza as configurações ntfy do usuário
  updateSettings: protectedProcedure
    .input(
      z.object({
        ntfyEnabled: z.boolean().optional(),
        ntfyDailyEnabled: z.boolean().optional(),
        ntfyWeeklyEnabled: z.boolean().optional(),
        ntfyTradesEnabled: z.boolean().optional(),
        ntfyDrawdownEnabled: z.boolean().optional(),
        ntfyConnectionEnabled: z.boolean().optional(),
        drawdownThreshold: z.number().optional(),
        dailyTime: z.string().optional(),
        weeklyTime: z.string().optional(),
        ntfyDailyTitle: z.string().optional(),
        ntfyWeeklyTitle: z.string().optional(),
        ntfyDailyIndividualTitle: z.string().optional(),
        ntfyWeeklyIndividualTitle: z.string().optional(),
        ntfyNotificationType: z.enum(["consolidated", "individual"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new Error("Database não disponível");
      }

      // Verificar se já existe configuração
      const existing = await database
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user.id))
        .limit(1);

      const updateData: any = {};
      if (input.ntfyEnabled !== undefined) updateData.ntfyEnabled = input.ntfyEnabled;
      if (input.ntfyDailyEnabled !== undefined) updateData.ntfyDailyEnabled = input.ntfyDailyEnabled;
      if (input.ntfyWeeklyEnabled !== undefined) updateData.ntfyWeeklyEnabled = input.ntfyWeeklyEnabled;
      if (input.ntfyTradesEnabled !== undefined) updateData.ntfyTradesEnabled = input.ntfyTradesEnabled;
      if (input.ntfyDrawdownEnabled !== undefined) updateData.ntfyDrawdownEnabled = input.ntfyDrawdownEnabled;
      if (input.ntfyConnectionEnabled !== undefined) updateData.ntfyConnectionEnabled = input.ntfyConnectionEnabled;
      if (input.drawdownThreshold !== undefined) updateData.drawdownThreshold = input.drawdownThreshold;
      if (input.dailyTime !== undefined) updateData.dailyTime = input.dailyTime;
      if (input.weeklyTime !== undefined) updateData.weeklyTime = input.weeklyTime;
      if (input.ntfyDailyTitle !== undefined) updateData.ntfyDailyTitle = input.ntfyDailyTitle;
      if (input.ntfyWeeklyTitle !== undefined) updateData.ntfyWeeklyTitle = input.ntfyWeeklyTitle;
      if (input.ntfyDailyIndividualTitle !== undefined) updateData.ntfyDailyIndividualTitle = input.ntfyDailyIndividualTitle;
      if (input.ntfyWeeklyIndividualTitle !== undefined) updateData.ntfyWeeklyIndividualTitle = input.ntfyWeeklyIndividualTitle;
      if (input.ntfyNotificationType !== undefined) updateData.ntfyNotificationType = input.ntfyNotificationType;

      if (existing.length === 0) {
        // Criar nova configuração
        const topic = await ntfyService.getUserTopic(ctx.user.id);
        await database.insert(userSettings).values({
          userId: ctx.user.id,
          ntfyTopic: topic,
          ...updateData,
        });
        console.log("[ntfy] Configurações criadas para usuário:", ctx.user.id);
      } else {
        // Atualizar configuração existente
        await database
          .update(userSettings)
          .set(updateData)
          .where(eq(userSettings.userId, ctx.user.id));
        console.log("[ntfy] Configurações atualizadas para usuário:", ctx.user.id);
      }

      return { success: true };
    }),

  // Envia uma notificação de teste
  sendTest: protectedProcedure.mutation(async ({ ctx }) => {
    console.log('[ntfy.sendTest] CHAMADO! User ID:', ctx.user.id);
    const success = await ntfyService.sendTestNotification(ctx.user.id);

    if (success) {
      console.log("[ntfy] Notificação de teste enviada para usuário:", ctx.user.id);
      return { success: true, message: "Notificação de teste enviada!" };
    } else {
      console.error("[ntfy] Falha ao enviar notificação de teste para usuário:", ctx.user.id);
      throw new Error("Erro ao enviar notificação de teste");
    }
  }),

  // Envia um resumo diário de teste
  sendDailyTest: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      console.log('[ntfy.sendDailyTest] CHAMADO! User ID:', ctx.user.id);
      
      // Usar data fixa para teste: 30/10/2025 (quinta-feira)
      const testDate = new Date('2025-10-30T00:00:00.000Z');
      console.log('[ntfy.sendDailyTest] Data de teste:', testDate);
      
      // Buscar estatísticas diárias do banco de dados (dia fixo)
      let stats = await db.getDailyStats(ctx.user.id, testDate);
      console.log('[ntfy.sendDailyTest] Estatísticas:', stats);
      
      // Se não houver trades, retornar erro amigável
      if (stats.totalTrades === 0) {
        console.log('[ntfy.sendDailyTest] Sem trades para enviar');
        throw new Error('Você ainda não possui trades registrados. Adicione trades para testar as notificações.');
      }
      
      // Buscar moeda configurada do usuário
      const database = await getDb();
      if (!database) throw new Error("Database não disponível");
      const settings = await database.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
      const currency = settings[0]?.displayCurrency || 'USD';
      
      const success = await ntfyService.sendDailyReport(ctx.user.id, stats, currency);

      if (success) {
        console.log("[ntfy] Resumo diário de teste enviado para usuário:", ctx.user.id);
        return { success: true, message: "Resumo diário de teste enviado!" };
      } else {
        console.error("[ntfy] Falha ao enviar resumo diário de teste para usuário:", ctx.user.id);
        throw new Error("Erro ao enviar resumo diário de teste");
      }
    } catch (error) {
      console.error('[ntfy.sendDailyTest] ERRO COMPLETO:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro desconhecido ao enviar resumo diário');
    }
  }),

  // Envia um resumo semanal de teste
  sendWeeklyTest: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      console.log('[ntfy.sendWeeklyTest] CHAMADO! User ID:', ctx.user.id);
      
      // Usar semana fixa para teste: 27/10/2025 a 02/11/2025
      const testWeek = new Date('2025-10-27T00:00:00.000Z');
      console.log('[ntfy.sendWeeklyTest] Semana de teste (27/10-02/11):', testWeek);
      
      // Buscar estatísticas semanais do banco de dados (semana fixa)
      let stats = await db.getWeeklyStats(ctx.user.id, testWeek);
      console.log('[ntfy.sendWeeklyTest] Estatísticas:', stats);
      
      // Se não houver trades, retornar erro amigável
      if (stats.totalTrades === 0) {
        console.log('[ntfy.sendWeeklyTest] Sem trades para enviar');
        throw new Error('Você ainda não possui trades registrados. Adicione trades para testar as notificações.');
      }
      
      // Buscar moeda configurada do usuário
      const database = await getDb();
      if (!database) throw new Error("Database não disponível");
      const settings = await database.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
      const currency = settings[0]?.displayCurrency || 'USD';
      
      const success = await ntfyService.sendWeeklyReport(ctx.user.id, stats, currency);

      if (success) {
        console.log("[ntfy] Resumo semanal de teste enviado para usuário:", ctx.user.id);
        return { success: true, message: "Resumo semanal de teste enviado!" };
      } else {
        console.error("[ntfy] Falha ao enviar resumo semanal de teste para usuário:", ctx.user.id);
        throw new Error("Erro ao enviar resumo semanal de teste");
      }
    } catch (error) {
      console.error('[ntfy.sendWeeklyTest] ERRO COMPLETO:', error);
      if (error instanceof Error) {
        throw error; // Re-lançar o erro original sem envolver
      }
      throw new Error('Erro desconhecido ao enviar resumo semanal');
    }
  }),

  // Testa TODAS as notificações de uma vez
  testAllNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      console.log('[ntfy.testAllNotifications] Iniciando testes para user:', ctx.user.id);
      
      const results: string[] = [];
      
      // Buscar idioma do usuário
      const database = await getDb();
      if (!database) throw new Error("Database não disponível");
      
      const { users } = await import("../drizzle/schema");
      const [user] = await database.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const userLanguage = user?.language || 'pt-BR';

      // 1. Trade Aberto
      await ntfyService.sendTradeOpened(ctx.user.id, {
        symbol: 'EURUSD',
        type: 'BUY',
        volume: 0.10,
        openPrice: 1.0850,
        accountNumber: '12345678',
        language: userLanguage,
      });
      results.push('✅ Trade Aberto');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 2. Take Profit
      await ntfyService.sendTradeTakeProfit(ctx.user.id, {
        symbol: 'GBPUSD',
        profit: 15000, // $150.00
        accountNumber: '12345678',
        currency: 'USD',
        language: userLanguage,
      });
      results.push('✅ Take Profit');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 3. Stop Loss
      await ntfyService.sendTradeStopLoss(ctx.user.id, {
        symbol: 'USDJPY',
        loss: -5000, // -$50.00
        accountNumber: '12345678',
        currency: 'USD',
        language: userLanguage,
      });
      results.push('✅ Stop Loss');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 4. Alerta de Drawdown
      await ntfyService.sendDrawdownAlert(ctx.user.id, {
        accountNumber: '12345678',
        currentDrawdown: 12.5,
        threshold: 10.0,
      });
      results.push('✅ Alerta de Drawdown');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 5. Conta Conectada
      await ntfyService.sendAccountConnected(ctx.user.id, {
        accountNumber: '87654321',
        broker: 'XM Global',
        accountType: 'Standard',
      });
      results.push('✅ Conta Conectada');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 6. Copy Trade Executado
      await ntfyService.sendCopyTradeExecuted(ctx.user.id, {
        providerName: 'John Trader Pro',
        symbol: 'XAUUSD',
        type: 'SELL',
        volume: 0.05,
        accountNumber: '12345678',
      });
      results.push('✅ Copy Trade');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 7. VPS Expirando (3 dias)
      await ntfyService.sendVpsExpiring(ctx.user.id, {
        vpsName: 'VPS Trading Pro',
        daysRemaining: 3,
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      });
      results.push('✅ VPS Expirando');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 8. Assinatura Expirando (5 dias)
      await ntfyService.sendSubscriptionExpiring(ctx.user.id, {
        planName: 'Plano Premium',
        daysRemaining: 5,
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      });
      results.push('✅ Assinatura Expirando');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 9. EA Expirando (1 dia - URGENTE)
      await ntfyService.sendEaExpiring(ctx.user.id, {
        eaName: 'Scalper Pro EA',
        daysRemaining: 1,
        expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      });
      results.push('✅ EA Expirando (1 dia)');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 10. VPS Expirando (5 dias)
      await ntfyService.sendVpsExpiring(ctx.user.id, {
        vpsName: 'VPS Trading Pro',
        daysRemaining: 5,
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      });
      results.push('✅ VPS Expirando (5 dias)');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 11. VPS Expirando (7 dias)
      await ntfyService.sendVpsExpiring(ctx.user.id, {
        vpsName: 'VPS Trading Pro',
        daysRemaining: 7,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      });
      results.push('✅ VPS Expirando (7 dias)');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 12. Assinatura Expirando (3 dias)
      await ntfyService.sendSubscriptionExpiring(ctx.user.id, {
        planName: 'Plano Premium',
        daysRemaining: 3,
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      });
      results.push('✅ Assinatura Expirando (3 dias)');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 13. Assinatura Expirando (7 dias)
      await ntfyService.sendSubscriptionExpiring(ctx.user.id, {
        planName: 'Plano Premium',
        daysRemaining: 7,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      });
      results.push('✅ Assinatura Expirando (7 dias)');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 14. EA Expirando (3 dias)
      await ntfyService.sendEaExpiring(ctx.user.id, {
        eaName: 'Scalper Pro EA',
        daysRemaining: 3,
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      });
      results.push('✅ EA Expirando (3 dias)');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 15. EA Expirando (5 dias)
      await ntfyService.sendEaExpiring(ctx.user.id, {
        eaName: 'Scalper Pro EA',
        daysRemaining: 5,
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      });
      results.push('✅ EA Expirando (5 dias)');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 16. EA Expirando (7 dias)
      await ntfyService.sendEaExpiring(ctx.user.id, {
        eaName: 'Scalper Pro EA',
        daysRemaining: 7,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      });
      results.push('✅ EA Expirando (7 dias)');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 17. Relatório Diário (se houver trades)
      try {
        const testDate = new Date('2025-10-30T00:00:00.000Z');
        const stats = await db.getDailyStats(ctx.user.id, testDate);
        if (stats.totalTrades > 0) {
          const settings = await database.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
          const currency = settings[0]?.displayCurrency || 'USD';
          await ntfyService.sendDailyReport(ctx.user.id, stats, currency);
          results.push('✅ Relatório Diário');
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (e) {
        console.log('[testAll] Pulando relatório diário (sem trades)');
      }

      // 18. Relatório Semanal (se houver trades)
      try {
        const testWeek = new Date('2025-10-27T00:00:00.000Z');
        const stats = await db.getWeeklyStats(ctx.user.id, testWeek);
        if (stats.totalTrades > 0) {
          const settings = await database.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
          const currency = settings[0]?.displayCurrency || 'USD';
          await ntfyService.sendWeeklyReport(ctx.user.id, stats, currency);
          results.push('✅ Relatório Semanal');
        }
      } catch (e) {
        console.log('[testAll] Pulando relatório semanal (sem trades)');
      }

      console.log('[ntfy.testAllNotifications] Todos os testes concluídos:', results);
      
      return {
        success: true,
        message: `${results.length} notificações enviadas! Verifique seu celular.`,
        results,
      };
    } catch (error) {
      console.error('[ntfy.testAllNotifications] ERRO:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao enviar notificações de teste');
    }
  }),
});
