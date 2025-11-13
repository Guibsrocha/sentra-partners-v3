import { getDb } from "../db";
import { users, userSettings, trades, telegramUsers } from "../../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { telegramService } from "./telegram-notifications";

/**
 * Verifica inatividade de todos os usuários e envia alertas
 */
export async function checkInactivity() {
  try {
    console.log("[Inactivity Checker] Iniciando verificação de inatividade...");
    
    const db = await getDb();
    if (!db) {
      console.error("[Inactivity Checker] Database não disponível");
      return;
    }

    // Buscar todos os usuários com alerta de inatividade habilitado
    const usersWithInactivityAlert = await db
      .select({
        user: users,
        settings: userSettings,
        telegram: telegramUsers,
      })
      .from(userSettings)
      .leftJoin(users, eq(userSettings.userId, users.id))
      .leftJoin(telegramUsers, eq(userSettings.userId, telegramUsers.userId))
      .where(eq(userSettings.inactivityAlertEnabled, true));

    console.log(`[Inactivity Checker] Encontrados ${usersWithInactivityAlert.length} usuários com alerta de inatividade habilitado`);

    for (const { user, settings, telegram } of usersWithInactivityAlert) {
      if (!user || !settings) continue;

      try {
        // Verificar se o usuário tem Telegram vinculado
        if (!telegram || !telegram.chatId || !telegram.isActive) {
          console.log(`[Inactivity Checker] Usuário ${user.id} não tem Telegram vinculado`);
          continue;
        }

        // Buscar último trade do usuário
        const lastTrade = await db
          .select()
          .from(trades)
          .where(eq(trades.userId, user.id))
          .orderBy(desc(trades.openTime))
          .limit(1);

        if (lastTrade.length === 0) {
          console.log(`[Inactivity Checker] Usuário ${user.id} não tem trades registrados`);
          continue;
        }

        const lastTradeDate = new Date(lastTrade[0].openTime);
        const now = new Date();
        const daysSinceLastTrade = Math.floor((now.getTime() - lastTradeDate.getTime()) / (1000 * 60 * 60 * 24));

        console.log(`[Inactivity Checker] Usuário ${user.id} - Último trade há ${daysSinceLastTrade} dias`);

        // Verificar se atingiu o limite de dias de inatividade
        const inactivityDays = settings.inactivityDays || 7;
        
        if (daysSinceLastTrade >= inactivityDays) {
          // Verificar se já enviou alerta recentemente (evitar spam)
          const lastAlert = settings.lastInactivityAlert;
          
          if (lastAlert) {
            const daysSinceLastAlert = Math.floor((now.getTime() - new Date(lastAlert).getTime()) / (1000 * 60 * 60 * 24));
            
            // Só enviar novo alerta se passou pelo menos o mesmo período de inatividade
            if (daysSinceLastAlert < inactivityDays) {
              console.log(`[Inactivity Checker] Usuário ${user.id} - Alerta já enviado há ${daysSinceLastAlert} dias`);
              continue;
            }
          }

          // Enviar alerta de inatividade
          const language = user.language || "pt-BR";
          
          await telegramService.sendInactivityAlert(
            telegram.chatId,
            {
              daysSinceLastTrade,
              lastTradeDate: lastTradeDate.toISOString(),
              userName: user.name || "Trader",
            },
            language
          );

          // Atualizar timestamp do último alerta
          await db
            .update(userSettings)
            .set({ lastInactivityAlert: now })
            .where(eq(userSettings.userId, user.id));

          console.log(`[Inactivity Checker] ✅ Alerta de inatividade enviado para usuário ${user.id}`);
        }
      } catch (error) {
        console.error(`[Inactivity Checker] Erro ao verificar usuário ${user?.id}:`, error);
      }
    }

    console.log("[Inactivity Checker] Verificação concluída");
  } catch (error) {
    console.error("[Inactivity Checker] Erro geral:", error);
  }
}
