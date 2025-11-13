/**
 * Migration: Adicionar novos campos de notificação
 * 
 * Adiciona campos para:
 * - Copy trade notifications
 * - VPS expiring notifications
 * - Subscription expiring notifications
 * - EA expiring notifications
 */

import { getRawConnection } from "../db";

export async function addNotificationFields() {
  console.log("[Migration] Adicionando novos campos de notificação...");
  
  const connection = await getRawConnection();
  if (!connection) {
    console.error("[Migration] Database connection não disponível");
    return;
  }

  try {
    // Adicionar campo ntfyCopyTradeEnabled
    await connection.execute(`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS ntfyCopyTradeEnabled BOOLEAN DEFAULT TRUE
    `);
    console.log("[Migration] ✅ Campo ntfyCopyTradeEnabled adicionado");

    // Adicionar campo ntfyVpsExpiringEnabled
    await connection.execute(`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS ntfyVpsExpiringEnabled BOOLEAN DEFAULT TRUE
    `);
    console.log("[Migration] ✅ Campo ntfyVpsExpiringEnabled adicionado");

    // Adicionar campo ntfySubscriptionExpiringEnabled
    await connection.execute(`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS ntfySubscriptionExpiringEnabled BOOLEAN DEFAULT TRUE
    `);
    console.log("[Migration] ✅ Campo ntfySubscriptionExpiringEnabled adicionado");

    // Adicionar campo ntfyEaExpiringEnabled
    await connection.execute(`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS ntfyEaExpiringEnabled BOOLEAN DEFAULT TRUE
    `);
    console.log("[Migration] ✅ Campo ntfyEaExpiringEnabled adicionado");

    console.log("[Migration] ✅ Todos os campos de notificação adicionados com sucesso!");
  } catch (error: any) {
    // Ignorar erro se coluna já existe
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("[Migration] Campos já existem, pulando...");
    } else {
      console.error("[Migration] Erro ao adicionar campos:", error);
      throw error;
    }
  }
}
