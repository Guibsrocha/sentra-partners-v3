import { getDb } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migração: Criar tabela drawdown_alert_history
 * Para rastrear alertas de drawdown enviados e implementar deduplicação
 * (máximo 2 alertas por dia, espaçados 12h)
 */
export async function createDrawdownAlertHistoryTable() {
  console.log("[Migration] Creating drawdown_alert_history table...");
  
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Migration] Database not available");
      return;
    }

    // Criar tabela se não existir
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS drawdown_alert_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        accountNumber VARCHAR(64) NULL COMMENT 'NULL para alertas consolidados',
        alertType ENUM('individual', 'consolidated') NOT NULL,
        drawdownPercent INT NOT NULL COMMENT 'Armazenado como inteiro (ex: 1550 = 15.50%)',
        sentAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        INDEX userId_idx (userId),
        INDEX accountNumber_idx (accountNumber),
        INDEX alertType_idx (alertType),
        INDEX sentAt_idx (sentAt),
        INDEX user_account_type_idx (userId, accountNumber, alertType)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("[Migration] ✅ drawdown_alert_history table created successfully");
  } catch (error: any) {
    // Ignorar erro se tabela já existe
    if (error?.message?.includes('already exists')) {
      console.log("[Migration] drawdown_alert_history table already exists, skipping");
    } else {
      console.error("[Migration] Error creating drawdown_alert_history table:", error);
    }
  }
}
