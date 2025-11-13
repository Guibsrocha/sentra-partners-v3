import { getDb } from "../db";
import { users, userSettings } from "../../drizzle/schema";
import { eq, lte, and } from "drizzle-orm";
import { sendVpsExpiring, sendSubscriptionExpiring, sendEaExpiring } from "../services/telegram-helper";

/**
 * Job para verificar expirações de VPS, Assinaturas e EAs
 * Deve ser executado diariamente (ex: 9h)
 * 
 * Envia notificações 7, 3 e 1 dia antes da expiração
 */
export async function checkExpirations() {
  console.log('[Expirations Job] Iniciando verificação de expirações...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Expirations Job] Database not available');
    return;
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Datas de alerta: 7, 3 e 1 dia antes
    const alertDays = [7, 3, 1];
    
    let vpsChecked = 0;
    let subscriptionsChecked = 0;
    let easChecked = 0;
    let notificationsSent = 0;

    // Buscar todos os usuários ativos
    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
      try {
        // Buscar configurações do usuário
        const [settings] = await db
          .select()
          .from(userSettings)
          .where(eq(userSettings.userId, user.id))
          .limit(1);

        if (!settings) continue;

        // ========================================
        // 1. Verificar VPS Expirando
        // ========================================
        if (settings.ntfyVpsExpiringEnabled && user.vpsExpirationDate) {
          vpsChecked++;
          const expirationDate = new Date(user.vpsExpirationDate);
          expirationDate.setHours(0, 0, 0, 0);
          
          const daysRemaining = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (alertDays.includes(daysRemaining)) {
            console.log(`[Expirations] VPS do usuário ${user.id} expira em ${daysRemaining} dias`);
            
            const sent = await sendVpsExpiring(user.id, {
              vpsName: user.vpsName || "VPS",
              daysRemaining,
              expirationDate: expirationDate.toLocaleDateString('pt-BR')
            });
            
            if (sent) notificationsSent++;
          }
        }

        // ========================================
        // 2. Verificar Assinatura Expirando
        // ========================================
        if (settings.ntfySubscriptionExpiringEnabled && user.subscriptionExpiresAt) {
          subscriptionsChecked++;
          const expirationDate = new Date(user.subscriptionExpiresAt);
          expirationDate.setHours(0, 0, 0, 0);
          
          const daysRemaining = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (alertDays.includes(daysRemaining)) {
            console.log(`[Expirations] Assinatura do usuário ${user.id} expira em ${daysRemaining} dias`);
            
            const sent = await sendSubscriptionExpiring(user.id, {
              planName: user.subscriptionPlan || "Premium",
              daysRemaining,
              expirationDate: expirationDate.toLocaleDateString('pt-BR')
            });
            
            if (sent) notificationsSent++;
          }
        }

        // ========================================
        // 3. Verificar EA Expirando
        // ========================================
        if (settings.ntfyEaExpiringEnabled && user.eaExpirationDate) {
          easChecked++;
          const expirationDate = new Date(user.eaExpirationDate);
          expirationDate.setHours(0, 0, 0, 0);
          
          const daysRemaining = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (alertDays.includes(daysRemaining)) {
            console.log(`[Expirations] EA do usuário ${user.id} expira em ${daysRemaining} dias`);
            
            const sent = await sendEaExpiring(user.id, {
              eaName: user.eaName || "Expert Advisor",
              daysRemaining,
              expirationDate: expirationDate.toLocaleDateString('pt-BR')
            });
            
            if (sent) notificationsSent++;
          }
        }
      } catch (error) {
        console.error(`[Expirations] Erro ao processar usuário ${user.id}:`, error);
      }
    }

    console.log('[Expirations Job] Verificação concluída!');
    console.log(`[Expirations Job] VPS verificados: ${vpsChecked}`);
    console.log(`[Expirations Job] Assinaturas verificadas: ${subscriptionsChecked}`);
    console.log(`[Expirations Job] EAs verificados: ${easChecked}`);
    console.log(`[Expirations Job] Notificações enviadas: ${notificationsSent}`);

    return {
      success: true,
      vpsChecked,
      subscriptionsChecked,
      easChecked,
      notificationsSent
    };
  } catch (error) {
    console.error('[Expirations Job] Erro fatal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
