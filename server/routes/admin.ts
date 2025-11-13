import express, { Request, Response } from "express";
import { getDb } from "../db";
import { trades } from "../../drizzle/schema";
import { sql } from "drizzle-orm";
import { populateBalanceHistory } from "../scripts/populate-balance-history";

const router = express.Router();

/**
 * POST /api/admin/delete-all-trades
 * Deleta todos os trades do banco de dados
 * Requer senha de admin
 */
router.post("/delete-all-trades", async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    // Senha de admin (você pode mudar depois)
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sentra2025";

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: "Senha incorreta",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database não disponível",
      });
    }

    console.log("[ADMIN] Deletando todos os trades...");
    
    const result = await db.delete(trades);
    
    console.log("[ADMIN] ✅ Todos os trades foram deletados!");

    res.json({
      success: true,
      message: "Todos os trades foram deletados com sucesso",
      result,
    });
  } catch (error: any) {
    console.error("[ADMIN] Erro ao deletar trades:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/run-migration
 * Aplica migration para adicionar isCentAccount na tabela balance_history
 */
router.post("/run-migration", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Verifica se a coluna já existe
    const checkColumn = await db.execute(sql`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'defaultdb' 
        AND TABLE_NAME = 'balance_history' 
        AND COLUMN_NAME = 'isCentAccount'
    `);

    if (checkColumn.length > 0) {
      return res.json({ 
        success: true, 
        message: "Migration already applied - column isCentAccount exists" 
      });
    }

    // Aplica a migration
    await db.execute(sql`
      ALTER TABLE balance_history 
      ADD COLUMN isCentAccount BOOLEAN NOT NULL DEFAULT FALSE
    `);

    console.log("✅ Migration applied: isCentAccount column added to balance_history");

    res.json({ 
      success: true, 
      message: "Migration applied successfully" 
    });
  } catch (error: any) {
    console.error("❌ Migration error:", error);
    res.status(500).json({ 
      error: "Failed to apply migration", 
      details: error.message 
    });
  }
});

/**
 * POST /api/admin/populate-balance-history
 * Popula a tabela balance_history baseado nos trades existentes
 */
router.post("/populate-balance-history", async (req: Request, res: Response) => {
  try {
    console.log("[ADMIN] Iniciando população de balance_history...");
    
    await populateBalanceHistory();
    
    console.log("[ADMIN] ✅ Balance history populado com sucesso!");

    res.json({
      success: true,
      message: "Balance history populado com sucesso",
    });
  } catch (error: any) {
    console.error("[ADMIN] Erro ao popular balance history:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/check-product-status
 * Verifica o status de todos os produtos (ativos/inativos)
 * Requer senha de admin
 */
router.post("/check-product-status", async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    // Senha de admin (você pode mudar depois)
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sentra2025";

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: "Senha incorreta",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database não disponível",
      });
    }

    console.log("[ADMIN] Verificando status dos produtos...");

    // Verificar subscription plans
    const subscriptionActive = await db.execute(sql`
      SELECT COUNT(*) as total FROM subscription_plans WHERE active = true
    `);
    
    const subscriptionInactive = await db.execute(sql`
      SELECT COUNT(*) as total FROM subscription_plans WHERE active = false OR active IS NULL
    `);

    // Verificar VPS products
    const vpsActive = await db.execute(sql`
      SELECT COUNT(*) as total FROM vps_products WHERE active = true AND is_available = true
    `);
    
    const vpsInactive = await db.execute(sql`
      SELECT COUNT(*) as total FROM vps_products WHERE active = false OR active IS NULL OR is_available = false
    `);

    // Verificar Expert Advisors
    const eaActive = await db.execute(sql`
      SELECT COUNT(*) as total FROM expert_advisors WHERE active = true AND available = true
    `);
    
    const eaInactive = await db.execute(sql`
      SELECT COUNT(*) as total FROM expert_advisors WHERE active = false OR active IS NULL OR available = false
    `);

    const result = {
      success: true,
      status: {
        subscription_plans: {
          active: subscriptionActive[0]?.total || 0,
          inactive: subscriptionInactive[0]?.total || 0,
          total: (subscriptionActive[0]?.total || 0) + (subscriptionInactive[0]?.total || 0)
        },
        vps_products: {
          active: vpsActive[0]?.total || 0,
          inactive: vpsInactive[0]?.total || 0,
          total: (vpsActive[0]?.total || 0) + (vpsInactive[0]?.total || 0)
        },
        expert_advisors: {
          active: eaActive[0]?.total || 0,
          inactive: eaInactive[0]?.total || 0,
          total: (eaActive[0]?.total || 0) + (eaInactive[0]?.total || 0)
        }
      }
    };

    console.log("[ADMIN] ✅ Status verificado com sucesso!", result.status);

    res.json(result);
  } catch (error: any) {
    console.error("[ADMIN] Erro ao verificar status:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/activate-all-products
 * Ativa todos os produtos (subscription_plans, vps_products, expert_advisors)
 * Requer senha de admin
 */
router.post("/activate-all-products", async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    // Senha de admin (você pode mudar depois)
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sentra2025";

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: "Senha incorreta",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database não disponível",
      });
    }

    console.log("[ADMIN] Ativando todos os produtos...");

    // Ativar subscription plans
    const subscriptionResult = await db.execute(sql`
      UPDATE subscription_plans SET active = true WHERE active != true
    `);

    // Ativar VPS products
    const vpsResult = await db.execute(sql`
      UPDATE vps_products SET active = true, is_available = true WHERE active != true OR is_available != true
    `);

    // Ativar Expert Advisors
    const eaResult = await db.execute(sql`
      UPDATE expert_advisors SET active = true, available = true WHERE active != true OR available != true
    `);

    console.log("[ADMIN] ✅ Todos os produtos foram ativados!");

    res.json({
      success: true,
      message: "Todos os produtos foram ativados com sucesso",
      results: {
        subscription_plans: subscriptionResult.rowsAffected || 0,
        vps_products: vpsResult.rowsAffected || 0,
        expert_advisors: eaResult.rowsAffected || 0
      }
    });
  } catch (error: any) {
    console.error("[ADMIN] Erro ao ativar produtos:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
