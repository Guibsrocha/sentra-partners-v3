import express from "express";
import { getRawConnection } from "../db";
import { broadcastToUser } from "../websocket/copyTradingWs";
import { updateProviderStatistics } from "../services/update-provider-statistics";
import { getUserByEmail } from "../db";
import { checkAccountLimit } from "../middleware/subscription-check";

const router = express.Router();

//====================================================
// POST /api/mt/copy/master-signal
// Recebe sinais da conta Master (v4.0 com eventos)
//====================================================
router.post("/master-signal", async (req, res) => {
  try {
    const { 
      action,
      master_email, 
      user_email,
      account_number, 
      broker, 
      positions, 
      positions_count,
      ticket,
      symbol,
      type,
      lots,
      open_price,
      stop_loss,
      take_profit,
      open_time,
      comment,
      timestamp,
      profit,
      close_price
    } = req.body;
    
    const email = user_email || master_email;
    
    console.log("[Copy Trading] Master signal recebido:", {
      action: action || "legacy",
      email,
      account_number,
      positions_count: positions_count || (positions ? positions.length : 0)
    });
    
    if (!email || !account_number) {
      return res.status(400).json({ 
        success: false,
        error: "user_email/master_email e account_number são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    // === NOVA VERIFICAÇÃO: COPY TRADING HABILITADO NO PLANO ===
    const { checkSubscription, requireCopyTrading } = await import("../middleware/subscription-check");
    
    // Verificar se o usuário tem copy trading habilitado
    // Simular request para usar o middleware
    const mockReq = { userId: user.id } as any;
    const mockRes = {} as any;
    const mockNext = () => {};
    
    await checkSubscription(mockReq, mockRes, mockNext);
    
    if (!mockReq.subscription?.limits?.copyTradingEnabled) {
      return res.status(403).json({ 
        success: false,
        error: "Copy Trading não disponível no seu plano",
        message: "Faça upgrade para um plano que inclui Copy Trading para usar esta funcionalidade.",
        code: "COPY_TRADING_NOT_ENABLED"
      });
    }
    
    console.log(`✅ [COPY TRADING ALLOWED] User ${user.id}: Copy Trading enabled`);
    
    const connection = await getRawConnection();
    if (!connection) {
      return res.status(500).json({ 
        success: false,
        error: "Conexão com banco de dados não disponível" 
      });
    }
    
    // Processar baseado no tipo de action
    if (action === "open") {
      await processOpenEvent(connection, email, account_number, {
        ticket, symbol, type, lots, open_price, stop_loss, take_profit, open_time, comment, timestamp
      }, user.id);
    }
    else if (action === "close") {
      await processCloseEvent(connection, email, account_number, ticket, user.id, profit, close_price);
    }
    else if (action === "modify") {
      await processModifyEvent(connection, email, account_number, ticket, stop_loss, take_profit, user.id);
    }
    else if (action === "heartbeat") {
      await processHeartbeat(connection, email, account_number, broker, positions, positions_count, user.id);
    }
    else {
      // Formato legado (compatibilidade)
      await processLegacyFormat(connection, email, account_number, broker, positions, positions_count, user.id);
    }
    
    res.json({ success: true, message: "Sinal recebido e processado" });
    
  } catch (error: any) {
    console.error("[Copy Trading] Erro ao processar sinal master:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// Processar Evento de Abertura
//====================================================
async function processOpenEvent(connection: any, email: string, accountNumber: string, tradeData: any, userId: number) {
  const { ticket, symbol, type, lots, open_price, stop_loss, take_profit, open_time, comment, timestamp } = tradeData;
  
  // Salvar trade individual na tabela de trades
  await connection.execute(
    `INSERT INTO copy_trades (master_email, account_number, ticket, symbol, type, lots, open_price, stop_loss, take_profit, open_time, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?), 'open', NOW())
     ON DUPLICATE KEY UPDATE stop_loss = VALUES(stop_loss), take_profit = VALUES(take_profit), updated_at = NOW()`,
    [email, accountNumber, ticket, symbol, type, lots, open_price, stop_loss, take_profit, open_time]
  );
  
  console.log(`[Copy Trading] ✅ OPEN: ${symbol} ${type === 0 ? 'BUY' : 'SELL'} ${lots} lotes (ticket: ${ticket})`);
  
  // Broadcast via WebSocket
  try {
    broadcastToUser(userId, {
      type: 'TRADE_OPENED',
      action: 'open',
      masterAccountId: accountNumber,
      ticket,
      symbol,
      orderType: type === 0 ? 'BUY' : 'SELL',
      lots,
      openPrice: open_price,
      stopLoss: stop_loss,
      takeProfit: take_profit,
      timestamp: new Date()
    });
  } catch (wsError) {
    console.error("[Copy Trading] Erro ao broadcast OPEN:", wsError);
  }
  
  // Notificações agora são enviadas pelo Conector Lite via /api/mt/trade-event
}

//====================================================
// Processar Evento de Fechamento
//====================================================
async function processCloseEvent(connection: any, email: string, accountNumber: string, ticket: string, userId: number, profit?: number, closePrice?: number) {
  // Atualizar status do trade com profit e close_price
  await connection.execute(
    `UPDATE copy_trades 
     SET status = 'closed', 
         closed_at = NOW(), 
         profit = ?, 
         close_price = ?, 
         updated_at = NOW()
     WHERE master_email = ? AND account_number = ? AND ticket = ?`,
    [profit || 0, closePrice || 0, email, accountNumber, ticket]
  );
  
  console.log(`[Copy Trading] ✅ CLOSE: ticket ${ticket}, profit ${profit || 0}, close_price ${closePrice || 0}`);
  
  // Atualizar estatísticas do provedor (se houver)
  updateProviderStatistics(accountNumber).catch(err => 
    console.error('[Copy Trading] Erro ao atualizar estatísticas do provedor:', err)
  );
  
  // Broadcast via WebSocket
  try {
    broadcastToUser(userId, {
      type: 'TRADE_CLOSED',
      action: 'close',
      masterAccountId: accountNumber,
      ticket,
      timestamp: new Date()
    });
  } catch (wsError) {
    console.error("[Copy Trading] Erro ao broadcast CLOSE:", wsError);
  }
}

//====================================================
// Processar Evento de Modificação
//====================================================
async function processModifyEvent(connection: any, email: string, accountNumber: string, ticket: string, stopLoss: number, takeProfit: number, userId: number) {
  // Atualizar S/L e T/P
  await connection.execute(
    `UPDATE copy_trades SET stop_loss = ?, take_profit = ?, updated_at = NOW()
     WHERE master_email = ? AND account_number = ? AND ticket = ?`,
    [stopLoss, takeProfit, email, accountNumber, ticket]
  );
  
  console.log(`[Copy Trading] ✅ MODIFY: ticket ${ticket} SL:${stopLoss} TP:${takeProfit}`);
  
  // Broadcast via WebSocket
  try {
    broadcastToUser(userId, {
      type: 'TRADE_MODIFIED',
      action: 'modify',
      masterAccountId: accountNumber,
      ticket,
      stopLoss,
      takeProfit,
      timestamp: new Date()
    });
  } catch (wsError) {
    console.error("[Copy Trading] Erro ao broadcast MODIFY:", wsError);
  }
}

//====================================================
// Processar Heartbeat
//====================================================
async function processHeartbeat(connection: any, email: string, accountNumber: string, broker: string, positions: any[], positionsCount: number, userId: number) {
  console.log(`[Copy Trading] 🔍 DEBUG - Positions recebidas no heartbeat:`, JSON.stringify(positions, null, 2));
  const positionsJson = JSON.stringify(positions || []);
  
  // Atualizar ou inserir heartbeat
  const [existing]: any = await connection.execute(
    "SELECT id FROM copy_signals WHERE master_email = ? AND account_number = ?",
    [email, accountNumber]
  );
  
  if (existing && existing.length > 0) {
    await connection.execute(
      "UPDATE copy_signals SET positions = ?, positions_count = ?, broker = ?, last_heartbeat = NOW(), failed_attempts = 0, is_connected = TRUE, updated_at = NOW() WHERE master_email = ? AND account_number = ?",
      [positionsJson, positionsCount || 0, broker || "", email, accountNumber]
    );
  } else {
    await connection.execute(
      "INSERT INTO copy_signals (master_email, account_number, broker, positions, positions_count, last_heartbeat, failed_attempts, is_connected) VALUES (?, ?, ?, ?, ?, NOW(), 0, TRUE)",
      [email, accountNumber, broker || "", positionsJson, positionsCount || 0]
    );
  }
  
  console.log(`[Copy Trading] 💓 HEARTBEAT: ${positionsCount} posições`);
  
  // Broadcast via WebSocket
  try {
    broadcastToUser(userId, {
      type: 'MASTER_HEARTBEAT',
      action: 'heartbeat',
      masterAccountId: accountNumber,
      positionsCount: positionsCount || 0,
      timestamp: new Date()
    });
  } catch (wsError) {
    console.error("[Copy Trading] Erro ao broadcast HEARTBEAT:", wsError);
  }
}

//====================================================
// Processar Formato Legado (Compatibilidade)
//====================================================
async function processLegacyFormat(connection: any, email: string, accountNumber: string, broker: string, positions: any[], positionsCount: number, userId: number) {
  const positionsJson = JSON.stringify(positions || []);
  
  const [existing]: any = await connection.execute(
    "SELECT id FROM copy_signals WHERE master_email = ? AND account_number = ?",
    [email, accountNumber]
  );
  
  if (existing && existing.length > 0) {
    await connection.execute(
      "UPDATE copy_signals SET positions = ?, positions_count = ?, broker = ?, updated_at = NOW() WHERE master_email = ? AND account_number = ?",
      [positionsJson, positionsCount || 0, broker || "", email, accountNumber]
    );
    console.log("[Copy Trading] ✅ Sinais atualizados (formato legado)");
  } else {
    await connection.execute(
      "INSERT INTO copy_signals (master_email, account_number, broker, positions, positions_count) VALUES (?, ?, ?, ?, ?)",
      [email, accountNumber, broker || "", positionsJson, positionsCount || 0]
    );
    console.log("[Copy Trading] ✅ Novos sinais salvos (formato legado)");
  }
  
  try {
    broadcastToUser(userId, {
      type: 'MASTER_SIGNAL_UPDATE',
      masterAccountId: accountNumber,
      positionsCount: positionsCount || 0,
      timestamp: new Date()
    });
  } catch (wsError) {
    console.error("[Copy Trading] Erro ao broadcast:", wsError);
  }
}

//====================================================
// POST /api/mt/copy/slave-heartbeat
// Recebe heartbeat da conta Slave
//====================================================
router.post("/slave-heartbeat", async (req, res) => {
  try {
    const { 
      slave_email, 
      master_email,
      master_account_id,
      account_number, 
      broker,
      positions_count,
      balance,
      equity,
      timestamp
    } = req.body;
    
    const masterIdentifier = master_account_id || master_email;
    
    if (!slave_email || !masterIdentifier || !account_number) {
      return res.status(400).json({ 
        success: false,
        error: "slave_email, master_account_id (ou master_email) e account_number são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(slave_email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    const connection = await getRawConnection();
    if (!connection) {
      return res.status(500).json({ 
        success: false,
        error: "Conexão com banco de dados não disponível" 
      });
    }
    
    // Atualizar ou inserir heartbeat do Slave
    const [existing]: any = await connection.execute(
      "SELECT id FROM slave_heartbeats WHERE slave_email = ? AND account_number = ?",
      [slave_email, account_number]
    );
    
    if (existing && existing.length > 0) {
      await connection.execute(
        `UPDATE slave_heartbeats 
         SET master_account_id = ?, broker = ?, positions_count = ?, balance = ?, equity = ?, last_heartbeat = NOW(), updated_at = NOW()
         WHERE slave_email = ? AND account_number = ?`,
        [masterIdentifier, broker || "", positions_count || 0, balance || 0, equity || 0, slave_email, account_number]
      );
    } else {
      await connection.execute(
        `INSERT INTO slave_heartbeats (slave_email, master_account_id, account_number, broker, positions_count, balance, equity, last_heartbeat)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [slave_email, masterIdentifier, account_number, broker || "", positions_count || 0, balance || 0, equity || 0]
      );
    }
    
    console.log(`[Copy Trading] 💓 Slave heartbeat: ${account_number} (${slave_email})`);
    
    // Auto-registrar relação Master/Slave se não existir
    try {
      const [existingRelation] = await connection.query(
        `SELECT id FROM copy_trading_configs 
         WHERE userId = ? AND sourceAccountId = ? AND targetAccountId = ?`,
        [user.id, masterIdentifier, account_number]
      );
      
      if (!existingRelation || existingRelation.length === 0) {
        const relationName = `Master ${masterIdentifier} → Slave ${account_number}`;
        await connection.query(
          `INSERT INTO copy_trading_configs 
           (userId, name, sourceAccountId, targetAccountId, copyRatio, isActive)
           VALUES (?, ?, ?, ?, 10000, 1)`,
          [user.id, relationName, masterIdentifier, account_number]
        );
        console.log(`[Copy Trading] ✅ Relação auto-registrada: ${relationName}`);
      }
    } catch (autoRegError) {
      console.error("[Copy Trading] ⚠️ Erro ao auto-registrar relação (não crítico):", autoRegError);
    }
    
    // Broadcast via WebSocket
    try {
      broadcastToUser(user.id, {
        type: 'SLAVE_HEARTBEAT',
        slaveAccountId: account_number,
        masterAccountId: masterIdentifier,
        positionsCount: positions_count || 0,
        balance: balance || 0,
        equity: equity || 0,
        timestamp: new Date()
      });
    } catch (wsError) {
      console.error("[Copy Trading] Erro ao broadcast slave heartbeat:", wsError);
    }
    
    res.json({ success: true, message: "Heartbeat recebido" });
    
  } catch (error: any) {
    console.error("[Copy Trading] Erro ao processar slave heartbeat:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// GET /api/mt/copy/slave-signals
// Retorna sinais para contas Slave
//====================================================
router.get("/slave-signals", async (req, res) => {
  try {
    console.log("[Copy Trading] 🔍 DEBUG - Query params recebidos:", req.query);
    
    const { master_email, master_account_id, account_number, slave_email } = req.query;
    
    console.log("[Copy Trading] Slave solicitando sinais:", {
      master_email,
      master_account_id,
      slave_email
    });
    
    // Aceitar master_email (legado) ou master_account_id (novo)
    const masterIdentifier = master_account_id || master_email;
    
    if (!masterIdentifier) {
      return res.status(400).json({ 
        success: false,
        error: "master_account_id ou master_email é obrigatório" 
      });
    }
    
    const connection = await getRawConnection();
    if (!connection) {
      return res.status(500).json({ 
        success: false,
        error: "Conexão com banco de dados não disponível" 
      });
    }
    
    // Buscar sinais mais recentes do master
    let query = "SELECT positions, positions_count, broker, updated_at, last_heartbeat FROM copy_signals WHERE ";
    let params: any[] = [];
    
    // Buscar por account_number (preferencial) ou email
    if (master_account_id) {
      query += "account_number = ?";
      params.push(master_account_id);
    } else {
      query += "master_email = ?";
      params.push(master_email);
    }
    
    query += " AND updated_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) ORDER BY updated_at DESC LIMIT 1";
    
    const [signals]: any = await connection.execute(query, params);
    
    if (!signals || signals.length === 0) {
      console.log("[Copy Trading] ℹ️ Nenhum sinal recente");
      return res.json({
        success: true,
        action: "heartbeat",
        positions: [],
        positions_count: 0,
        message: "Nenhum sinal recente do Master"
      });
    }
    
    const signal = signals[0];
    
    let positions = [];
    try {
      // Verificar se já é um objeto ou se é uma string JSON
      if (typeof signal.positions === 'string') {
        positions = JSON.parse(signal.positions);
      } else if (Array.isArray(signal.positions)) {
        positions = signal.positions;
      } else if (signal.positions && typeof signal.positions === 'object') {
        // Se for objeto mas não array, converter para array
        positions = [signal.positions];
      }
    } catch (e) {
      console.error("[Copy Trading] Erro ao parse JSON:", e);
      positions = [];
    }
    
    // FILTRO REMOVIDO: Retornar TODAS as posições do Master
    // O Slave já tem lógica de sincronização para gerenciar posições
    
    console.log(`[Copy Trading] ✅ Retornando ${positions.length} posições do Master`);
    console.log("[Copy Trading] 🔍 DEBUG - Posições:", JSON.stringify(positions, null, 2));
    
    res.json({
      success: true,
      action: "heartbeat",
      positions: positions,
      positions_count: positions.length,
      broker: signal.broker,
      updated_at: signal.updated_at,
      last_heartbeat: signal.last_heartbeat
    });
    
  } catch (error: any) {
    console.error("[Copy Trading] Erro ao buscar sinais:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// GET /api/mt/copy/connected-accounts
// Retorna contas Master e Slave online (fallback HTTP)
//====================================================
router.get("/connected-accounts", async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: "email é obrigatório" 
      });
    }
    
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const accounts: any[] = [];

    // Buscar contas Master (copy_signals) - apenas online
    const [masterAccounts]: any = await connection.execute(
      `SELECT master_email, account_number, broker, last_heartbeat, is_connected, failed_attempts
       FROM copy_signals 
       WHERE master_email = ? AND is_connected = true
       ORDER BY last_heartbeat DESC`,
      [email]
    );

    for (const master of masterAccounts) {
      accounts.push({
        accountId: master.account_number,
        accountName: `Master ${master.account_number}`,
        type: 'master',
        status: master.is_connected ? 'online' : 'offline',
        lastHeartbeat: master.last_heartbeat,
        balance: 0,
        equity: 0
      });
    }

    // Buscar contas Slave (slave_heartbeats) - apenas online
    const [slaveAccounts]: any = await connection.execute(
      `SELECT account_number, master_account_id, broker, balance, equity, last_heartbeat, is_connected, failed_attempts
       FROM slave_heartbeats 
       WHERE slave_email = ? AND is_connected = true
       ORDER BY last_heartbeat DESC`,
      [email]
    );

    for (const slave of slaveAccounts) {
      accounts.push({
        accountId: slave.account_number,
        accountName: `Slave ${slave.account_number}`,
        type: 'slave',
        status: slave.is_connected ? 'online' : 'offline',
        lastHeartbeat: slave.last_heartbeat,
        balance: parseFloat(slave.balance) || 0,
        equity: parseFloat(slave.equity) || 0
      });
    }

    // Buscar contas normais do usuário (trading_accounts) - apenas online
    const [regularAccounts]: any = await connection.execute(
      `SELECT ta.accountNumber as account_number, ta.broker, ta.balance, ta.equity, ta.lastHeartbeat as last_heartbeat, ta.is_connected, ta.failed_attempts,
              u.email
       FROM trading_accounts ta
       JOIN users u ON ta.userId = u.id
       WHERE u.email = ? AND ta.is_connected = true
       ORDER BY ta.lastHeartbeat DESC`,
      [email]
    );

    for (const acc of regularAccounts) {
      // Não adicionar se já está na lista como master ou slave
      const alreadyAdded = accounts.find(a => a.accountId === acc.account_number);
      if (!alreadyAdded) {
        accounts.push({
          accountId: acc.account_number,
          accountName: `Conta ${acc.account_number}`,
          type: 'regular',
          status: acc.is_connected ? 'online' : 'offline',
          lastHeartbeat: acc.last_heartbeat,
          balance: parseFloat(acc.balance) || 0,
          equity: parseFloat(acc.equity) || 0
        });
      }
    }

    console.log(`📊 HTTP: Contas encontradas para ${email}: ${accounts.length} (${accounts.filter(a => a.status === 'online').length} online)`);

    res.json({
      success: true,
      accounts
    });
    
  } catch (error: any) {
    console.error('[Copy Trading] Erro ao buscar contas conectadas:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// DELETE /api/mt/copy/master/:accountId
// Deletar conta Master
//====================================================
router.delete("/master/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;
    const { email } = req.query;
    
    if (!email || !accountId) {
      return res.status(400).json({ 
        success: false,
        error: "email e accountId são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(email as string);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    const connection = await getRawConnection();
    if (!connection) {
      return res.status(500).json({ 
        success: false,
        error: "Conexão com banco de dados não disponível" 
      });
    }
    
    // Deletar conta Master da tabela copy_signals
    await connection.execute(
      `DELETE FROM copy_signals WHERE account_number = ? AND master_email = ?`,
      [accountId, email]
    );
    
    // Deletar configurações de copy trading relacionadas (se existir a tabela)
    try {
      await connection.execute(
        `DELETE FROM copy_trading_settings WHERE master_account_id = ? AND user_id = ?`,
        [accountId, user.id]
      );
    } catch (e) {
      // Tabela pode não existir, ignorar erro
      console.log('[Copy Trading] copy_trading_settings não existe ou já foi deletada');
    }
    
    console.log(`🗑️ Conta Master deletada: ${accountId} (user: ${email})`);
    
    res.json({ 
      success: true, 
      message: "Conta Master deletada com sucesso" 
    });
    
  } catch (error: any) {
    console.error('[Copy Trading] Erro ao deletar conta Master:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// DELETE /api/mt/copy/slave/:accountId
// Deletar conta Slave
//====================================================
router.delete("/slave/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;
    const { email } = req.query;
    
    if (!email || !accountId) {
      return res.status(400).json({ 
        success: false,
        error: "email e accountId são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(email as string);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    const connection = await getRawConnection();
    if (!connection) {
      return res.status(500).json({ 
        success: false,
        error: "Conexão com banco de dados não disponível" 
      });
    }
    
    // Deletar conta Slave da tabela slave_heartbeats
    await connection.execute(
      `DELETE FROM slave_heartbeats WHERE account_number = ? AND slave_email = ?`,
      [accountId, email]
    );
    
    // Deletar configurações de copy trading relacionadas (se existir a tabela)
    try {
      await connection.execute(
        `DELETE FROM copy_trading_settings WHERE slave_account_id = ? AND user_id = ?`,
        [accountId, user.id]
      );
    } catch (e) {
      // Tabela pode não existir, ignorar erro
      console.log('[Copy Trading] copy_trading_settings não existe ou já foi deletada');
    }
    
    console.log(`🗑️ Conta Slave deletada: ${accountId} (user: ${email})`);
    
    res.json({ 
      success: true, 
      message: "Conta Slave deletada com sucesso" 
    });
    
  } catch (error: any) {
    console.error('[Copy Trading] Erro ao deletar conta Slave:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// GET /api/mt/copy/analytics
// Buscar dados de analytics de copy trading
//====================================================
router.get("/analytics", async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: "email é obrigatório" 
      });
    }
    
    const user = await getUserByEmail(email as string);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    const connection = await getRawConnection();
    if (!connection) {
      return res.status(500).json({ 
        success: false,
        error: "Conexão com banco de dados não disponível" 
      });
    }
    
    // Buscar performance por conta Master
    const [masterPerformance]: any = await connection.execute(
      `SELECT 
        ma.account_id,
        ma.broker,
        ma.balance,
        ma.equity,
        COUNT(DISTINCT cts.slave_account_id) as slave_count,
        ma.last_heartbeat,
        CASE 
          WHEN TIMESTAMPDIFF(MINUTE, ma.last_heartbeat, NOW()) < 5 THEN 'online'
          ELSE 'offline'
        END as status
       FROM master_accounts ma
       LEFT JOIN copy_trading_settings cts ON ma.account_id = cts.master_account_id
       WHERE ma.user_id = ?
       GROUP BY ma.account_id
       ORDER BY ma.last_heartbeat DESC`,
      [user.id]
    );
    
    // Buscar performance por conta Slave
    const [slavePerformance]: any = await connection.execute(
      `SELECT 
        sa.account_id,
        sa.broker,
        sa.balance,
        sa.equity,
        cts.master_account_id,
        cts.daily_loss,
        cts.daily_trades_count,
        sa.last_heartbeat,
        CASE 
          WHEN TIMESTAMPDIFF(MINUTE, sa.last_heartbeat, NOW()) < 5 THEN 'online'
          ELSE 'offline'
        END as status
       FROM slave_accounts sa
       LEFT JOIN copy_trading_settings cts ON sa.account_id = cts.slave_account_id
       WHERE sa.user_id = ?
       ORDER BY sa.last_heartbeat DESC`,
      [user.id]
    );
    
    // Calcular estatísticas gerais
    const totalMasters = masterPerformance.length;
    const totalSlaves = slavePerformance.length;
    const onlineMasters = masterPerformance.filter((m: any) => m.status === 'online').length;
    const onlineSlaves = slavePerformance.filter((s: any) => s.status === 'online').length;
    
    const totalEquity = [...masterPerformance, ...slavePerformance]
      .reduce((sum: number, acc: any) => sum + parseFloat(acc.equity || 0), 0);
    
    res.json({
      success: true,
      analytics: {
        summary: {
          totalMasters,
          totalSlaves,
          onlineMasters,
          onlineSlaves,
          totalEquity
        },
        masterPerformance: masterPerformance.map((m: any) => ({
          accountId: m.account_id,
          broker: m.broker,
          balance: parseFloat(m.balance || 0),
          equity: parseFloat(m.equity || 0),
          slaveCount: m.slave_count || 0,
          status: m.status,
          lastHeartbeat: m.last_heartbeat
        })),
        slavePerformance: slavePerformance.map((s: any) => ({
          accountId: s.account_id,
          broker: s.broker,
          balance: parseFloat(s.balance || 0),
          equity: parseFloat(s.equity || 0),
          masterAccountId: s.master_account_id,
          dailyLoss: parseFloat(s.daily_loss || 0),
          dailyTradesCount: s.daily_trades_count || 0,
          status: s.status,
          lastHeartbeat: s.last_heartbeat
        }))
      }
    });
    
  } catch (error: any) {
    console.error('[Copy Trading] Erro ao buscar analytics:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
