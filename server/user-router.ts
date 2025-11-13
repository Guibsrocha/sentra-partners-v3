import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users, userSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const userRouter = router({
  // Obter perfil do usuário
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database não disponível");

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        language: users.language,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    return user;
  }),

  // Atualizar idioma do usuário
  updateLanguage: protectedProcedure
    .input(z.object({ language: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      await db
        .update(users)
        .set({ language: input.language })
        .where(eq(users.id, ctx.user.id));

      console.log(`[user] Idioma atualizado para ${input.language} (usuário ${ctx.user.id})`);
      return { success: true };
    }),

  // Obter configurações de alertas
  getAlertSettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database não disponível");

    const [settings] = await db
      .select({
        ntfyEconomicNewsEnabled: userSettings.ntfyEconomicNewsEnabled,
        ntfyEconomicNewsTime: userSettings.ntfyEconomicNewsTime,
        ntfyEconomicNewsEmail: userSettings.ntfyEconomicNewsEmail,
        alertDrawdown: userSettings.alertDrawdown,
        drawdownThreshold: userSettings.drawdownThreshold,
        ntfyDrawdownLimit: userSettings.ntfyDrawdownLimit,
      })
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.user.id))
      .limit(1);

    // Se não existir, retornar valores padrão
    if (!settings) {
      return {
        ntfyEconomicNewsEnabled: true,
        ntfyEconomicNewsTime: 60,
        ntfyEconomicNewsEmail: true,
        alertDrawdown: true,
        drawdownThreshold: 1000,
        ntfyDrawdownLimit: 1000,
      };
    }

    return settings;
  }),

  // Atualizar configurações de alertas econômicos
  updateEconomicAlertSettings: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        timeMinutes: z.number().min(5).max(1440), // 5 min a 24 horas
        emailEnabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      // Verificar se settings existe
      const [existing] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user.id))
        .limit(1);

      if (!existing) {
        // Criar settings se não existir
        await db.insert(userSettings).values({
          userId: ctx.user.id,
          ntfyEconomicNewsEnabled: input.enabled,
          ntfyEconomicNewsTime: input.timeMinutes,
          ntfyEconomicNewsEmail: input.emailEnabled,
        });
      } else {
        // Atualizar settings existente
        await db
          .update(userSettings)
          .set({
            ntfyEconomicNewsEnabled: input.enabled,
            ntfyEconomicNewsTime: input.timeMinutes,
            ntfyEconomicNewsEmail: input.emailEnabled,
          })
          .where(eq(userSettings.userId, ctx.user.id));
      }

      console.log(
        `[user] Configurações de alertas econômicos atualizadas (usuário ${ctx.user.id}):`,
        input
      );
      return { success: true };
    }),

  // Atualizar configurações de alertas de drawdown
  updateDrawdownAlertSettings: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        thresholdPercent: z.number().min(1).max(100), // 1% a 100%
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      // Converter porcentagem para formato do banco (multiplicar por 100)
      const thresholdValue = Math.round(input.thresholdPercent * 100);

      // Verificar se settings existe
      const [existing] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user.id))
        .limit(1);

      if (!existing) {
        // Criar settings se não existir
        await db.insert(userSettings).values({
          userId: ctx.user.id,
          alertDrawdown: input.enabled,
          drawdownThreshold: thresholdValue,
          ntfyDrawdownLimit: thresholdValue,
        });
      } else {
        // Atualizar settings existente
        await db
          .update(userSettings)
          .set({
            alertDrawdown: input.enabled,
            drawdownThreshold: thresholdValue,
            ntfyDrawdownLimit: thresholdValue,
          })
          .where(eq(userSettings.userId, ctx.user.id));
      }

      console.log(
        `[user] Configurações de alertas de drawdown atualizadas (usuário ${ctx.user.id}):`,
        { enabled: input.enabled, threshold: input.thresholdPercent + "%" }
      );
      return { success: true };
    }),


});
