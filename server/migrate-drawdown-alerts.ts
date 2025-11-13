import { getDb } from "./db";
import { sql } from "drizzle-orm";

/**
 * Script de migração: Adiciona tabela drawdown_alert_history
 * Execução: node --loader tsx server/migrate-drawdown-alerts.ts
 */

async function migrate() {
  console.log("[Migration] Iniciando migração: drawdown_alert_history");
  
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Criar tabela drawdown_alert_history
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

    console.log("[Migration] ✅ Tabela drawdown_alert_history criada com sucesso!");
    
    // Verificar se tabela foi criada
    const result = await db.execute(sql`SHOW TABLES LIKE 'drawdown_alert_history'`);
    console.log("[Migration] Verificação:", result);
    
    process.exit(0);
  } catch (error) {
    console.error("[Migration] ❌ Erro na migração:", error);
    process.exit(1);
  }
}

migrate();
