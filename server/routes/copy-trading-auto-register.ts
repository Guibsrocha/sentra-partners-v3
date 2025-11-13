import express from "express";
import { getRawConnection, getUserByEmail } from "../db";

const router = express.Router();

//====================================================
// POST /api/mt/copy/auto-register
// Registra automaticamente relação Master/Slave
//====================================================
router.post("/auto-register", async (req, res) => {
  try {
    const { 
      user_email,
      master_account_number, 
      slave_account_number 
    } = req.body;
    
    console.log("[Copy Trading] ========== AUTO-REGISTER ==========" );
    console.log("[Copy Trading] Auto-register recebido:", {
      user_email,
      master_account_number,
      slave_account_number
    });
    
    if (!user_email || !master_account_number || !slave_account_number) {
      return res.status(400).json({ 
        success: false,
        error: "user_email, master_account_number e slave_account_number são obrigatórios" 
      });
    }
    
    // Buscar usuário
    console.log("[Copy Trading] Buscando usuário:", user_email);
    const user = await getUserByEmail(user_email);
    console.log("[Copy Trading] Usuário encontrado:", user ? user.id : "NÃO ENCONTRADO");
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    const conn = await getRawConnection();
    console.log("[Copy Trading] Conexão obtida");
    
    try {
      // Verificar se já existe
      console.log("[Copy Trading] Verificando se relação já existe...");
      const [existing] = await conn.query(
        `SELECT id FROM copy_trading_configs 
         WHERE userId = ? 
         AND sourceAccountId = ? 
         AND targetAccountId = ?`,
        [user.id, master_account_number, slave_account_number]
      );
      
      if (existing && existing.length > 0) {
        console.log("[Copy Trading] Relação já existe:", existing[0].id);
        return res.json({ 
          success: true,
          message: "Relação já existe",
          relation_id: existing[0].id
        });
      }
      
      // Criar nova relação
      const name = `Master ${master_account_number} → Slave ${slave_account_number}`;
      
      const [result] = await conn.query(
        `INSERT INTO copy_trading_configs 
         (userId, name, sourceAccountId, targetAccountId, copyRatio, isActive)
         VALUES (?, ?, ?, ?, 10000, 1)`,
        [user.id, name, master_account_number, slave_account_number]
      );
      
      console.log("[Copy Trading] ✅ Relação criada:", result.insertId);
      
      res.json({ 
        success: true,
        message: "Relação criada com sucesso",
        relation_id: result.insertId
      });
      
    } finally {
      conn.release();
    }
    
  } catch (error: any) {
    console.error("[Copy Trading] Erro ao auto-registrar:", error);
    console.error("[Copy Trading] Stack:", error.stack);
    res.status(500).json({ 
      success: false,
      error: "Erro ao registrar relação: " + (error.message || error) 
    });
  }
});

export default router;
