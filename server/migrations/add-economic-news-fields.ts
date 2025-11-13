import { getDb } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migração: Adicionar campos de alertas de calendário econômico no userSettings
 */
export async function addEconomicNewsFields() {
  console.log("[Migration] Adding economic news alert fields to user_settings...");
  
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Migration] Database not available");
      return;
    }

    // Adicionar campo ntfyEconomicNewsEnabled
    try {
      await db.execute(sql`
        ALTER TABLE user_settings 
        ADD COLUMN ntfyEconomicNewsEnabled BOOLEAN DEFAULT TRUE
      `);
      console.log("[Migration] ✅ Added ntfyEconomicNewsEnabled column");
    } catch (error: any) {
      if (error?.message?.includes('Duplicate column name')) {
        console.log("[Migration] ntfyEconomicNewsEnabled column already exists");
      } else {
        throw error;
      }
    }

    // Adicionar campo ntfyEconomicNewsTime
    try {
      await db.execute(sql`
        ALTER TABLE user_settings 
        ADD COLUMN ntfyEconomicNewsTime INT DEFAULT 60 COMMENT 'Minutos de antecedência para alertas (padrão: 60 = 1 hora)'
      `);
      console.log("[Migration] ✅ Added ntfyEconomicNewsTime column");
    } catch (error: any) {
      if (error?.message?.includes('Duplicate column name')) {
        console.log("[Migration] ntfyEconomicNewsTime column already exists");
      } else {
        throw error;
      }
    }

    // Adicionar campo ntfyEconomicNewsEmail
    try {
      await db.execute(sql`
        ALTER TABLE user_settings 
        ADD COLUMN ntfyEconomicNewsEmail BOOLEAN DEFAULT TRUE COMMENT 'Enviar alertas econômicos também por email'
      `);
      console.log("[Migration] ✅ Added ntfyEconomicNewsEmail column");
    } catch (error: any) {
      if (error?.message?.includes('Duplicate column name')) {
        console.log("[Migration] ntfyEconomicNewsEmail column already exists");
      } else {
        throw error;
      }
    }

    // Adicionar campo ntfyDrawdownLimit se não existir
    try {
      await db.execute(sql`
        ALTER TABLE user_settings 
        ADD COLUMN ntfyDrawdownLimit INT DEFAULT 1000 COMMENT 'Limite de drawdown para alertas (porcentagem * 100, ex: 1000 = 10%)'
      `);
      console.log("[Migration] ✅ Added ntfyDrawdownLimit column");
    } catch (error: any) {
      if (error?.message?.includes('Duplicate column name')) {
        console.log("[Migration] ntfyDrawdownLimit column already exists");
      } else {
        throw error;
      }
    }

    console.log("[Migration] ✅ Economic news alert fields migration completed successfully");
  } catch (error: any) {
    console.error("[Migration] Error adding economic news fields:", error);
  }
}
