import express from "express";
import { getRawConnection } from "../db";
import { getUserByEmail } from "../auth";

const router = express.Router();

//====================================================
// GET /api/mt/copy/settings
// Buscar configurações de uma relação Master/Slave
//====================================================
router.get("/settings", async (req, res) => {
  try {
    const { user_email, master_account_id, slave_account_id } = req.query;
    
    if (!user_email || !master_account_id || !slave_account_id) {
      return res.status(400).json({ 
        success: false,
        error: "user_email, master_account_id e slave_account_id são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(user_email as string);
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
    
    let rows: any;
    try {
      [rows] = await connection.execute(
        `SELECT * FROM copy_trading_settings 
         WHERE user_id = ? AND master_account_number = ? AND slave_account_number = ?
         LIMIT 1`,
        [user.id, master_account_id, slave_account_number]
      );
    } catch (error) {
      console.log("[Copy Trading Settings] Tabela não existe, usando configurações padrão");
      rows = [];
    }
    
    if (!rows || rows.length === 0) {
      // Retornar configurações padrão
      return res.json({
        success: true,
        settings: {
          // Gestão de Lote
          lotMode: 'exact',
          lotMultiplier: 1.00,
          lotFixed: 0.01,
          lotRiskPercent: 1.00,
          
          // Stop Loss
          slMode: 'copy',
          slPips: 0,
          
          // Take Profit
          tpMode: 'copy',
          tpPips: 0,
          
          // Filtros
          allowedSymbols: '',
          blockedSymbols: '',
          tradingStartTime: '00:00',
          tradingEndTime: '23:59',
          
          // Gestão de Risco
          maxTrades: 10,
          maxRiskPerTrade: 5.00,
          maxDailyLoss: 0.00,
          invertSignals: false,
          
          isActive: true
        },
        message: "Usando configurações padrão"
      });
    }
    
    const settings = rows[0];
    
    res.json({
      success: true,
      settings: {
        // Gestão de Lote
        lotMode: settings.lot_mode,
        lotMultiplier: parseFloat(settings.lot_multiplier),
        lotFixed: parseFloat(settings.lot_fixed),
        lotRiskPercent: parseFloat(settings.lot_risk_percent),
        
        // Stop Loss
        slMode: settings.sl_mode,
        slPips: parseInt(settings.sl_pips),
        
        // Take Profit
        tpMode: settings.tp_mode,
        tpPips: parseInt(settings.tp_pips),
        
        // Filtros
        allowedSymbols: settings.allowed_symbols || '',
        blockedSymbols: settings.blocked_symbols || '',
        tradingStartTime: settings.trading_start_time,
        tradingEndTime: settings.trading_end_time,
        
        // Gestão de Risco
        maxTrades: parseInt(settings.max_trades),
        maxRiskPerTrade: parseFloat(settings.max_risk_per_trade),
        maxDailyLoss: parseFloat(settings.max_daily_loss),
        invertSignals: Boolean(settings.invert_signals),
        
        isActive: Boolean(settings.is_active)
      }
    });
    
  } catch (error: any) {
    console.error("[Copy Trading Settings] Erro ao buscar configurações:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// POST /api/mt/copy/settings
// Salvar configurações de uma relação Master/Slave
//====================================================
router.post("/settings", async (req, res) => {
  try {
    const { 
      user_email, 
      master_account_id, 
      slave_account_id,
      settings 
    } = req.body;
    
    if (!user_email || !master_account_id || !slave_account_id || !settings) {
      return res.status(400).json({ 
        success: false,
        error: "user_email, master_account_id, slave_account_id e settings são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(user_email);
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
    
    // Verificar se já existe configuração
    let existing: any;
    try {
      [existing] = await connection.execute(
        `SELECT id FROM copy_trading_settings 
         WHERE user_id = ? AND master_account_number = ? AND slave_account_number = ?`,
        [user.id, master_account_id, slave_account_number]
      );
    } catch (error) {
      console.log("[Copy Trading Settings] Tabela não existe, não é possível salvar configurações");
      return res.status(503).json({ 
        success: false,
        error: "Tabela de configurações não existe. Execute a migration 010 primeiro." 
      });
    }
    
    if (existing && existing.length > 0) {
      // Atualizar existente
      await connection.execute(
        `UPDATE copy_trading_settings SET
          lot_mode = ?,
          lot_multiplier = ?,
          lot_fixed = ?,
          lot_risk_percent = ?,
          sl_mode = ?,
          sl_pips = ?,
          tp_mode = ?,
          tp_pips = ?,
          allowed_symbols = ?,
          blocked_symbols = ?,
          trading_start_time = ?,
          trading_end_time = ?,
          max_trades = ?,
          max_risk_per_trade = ?,
          max_daily_loss = ?,
          invert_signals = ?,
          is_active = ?,
          updated_at = NOW()
         WHERE user_id = ? AND master_account_number = ? AND slave_account_number = ?`,
        [
          settings.lotMode || 'exact',
          settings.lotMultiplier || 1.00,
          settings.lotFixed || 0.01,
          settings.lotRiskPercent || 1.00,
          settings.slMode || 'copy',
          settings.slPips || 0,
          settings.tpMode || 'copy',
          settings.tpPips || 0,
          settings.allowedSymbols || '',
          settings.blockedSymbols || '',
          settings.tradingStartTime || '00:00',
          settings.tradingEndTime || '23:59',
          settings.maxTrades || 10,
          settings.maxRiskPerTrade || 5.00,
          settings.maxDailyLoss || 0.00,
          settings.invertSignals ? 1 : 0,
          settings.isActive !== false ? 1 : 0,
          user.id,
          master_account_id,
          slave_account_id
        ]
      );
      
      console.log("[Copy Trading Settings] ✅ Configurações atualizadas");
    } else {
      // Inserir nova
      await connection.execute(
        `INSERT INTO copy_trading_settings (
          user_id, slave_account_number, master_account_number,
          lot_mode, lot_multiplier, lot_fixed, lot_risk_percent,
          sl_mode, sl_pips, tp_mode, tp_pips,
          allowed_symbols, blocked_symbols,
          trading_start_time, trading_end_time,
          max_trades, max_risk_per_trade, max_daily_loss,
          invert_signals, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          slave_account_id,
          master_account_id,
          settings.lotMode || 'exact',
          settings.lotMultiplier || 1.00,
          settings.lotFixed || 0.01,
          settings.lotRiskPercent || 1.00,
          settings.slMode || 'copy',
          settings.slPips || 0,
          settings.tpMode || 'copy',
          settings.tpPips || 0,
          settings.allowedSymbols || '',
          settings.blockedSymbols || '',
          settings.tradingStartTime || '00:00',
          settings.tradingEndTime || '23:59',
          settings.maxTrades || 10,
          settings.maxRiskPerTrade || 5.00,
          settings.maxDailyLoss || 0.00,
          settings.invertSignals ? 1 : 0,
          settings.isActive !== false ? 1 : 0
        ]
      );
      
      console.log("[Copy Trading Settings] ✅ Novas configurações salvas");
    }
    
    res.json({
      success: true,
      message: "Configurações salvas com sucesso"
    });
    
  } catch (error: any) {
    console.error("[Copy Trading Settings] Erro ao salvar configurações:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// POST /api/mt/copy/validate-trade
// Validar se um trade deve ser copiado (aplica filtros e limites)
//====================================================
router.post("/validate-trade", async (req, res) => {
  try {
    const {
      user_email,
      master_account_id,
      slave_account_id,
      symbol,
      type,
      volume,
      sl,
      tp,
      open_time
    } = req.body;
    
    if (!user_email || !master_account_id || !slave_account_id) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros obrigatórios faltando"
      });
    }
    
    const user = await getUserByEmail(user_email);
    if (!user) {
      return res.status(404).json({
        success: false,
        shouldCopy: false,
        reason: "Usuário não encontrado"
      });
    }
    
    const connection = await getRawConnection();
    if (!connection) {
      return res.status(500).json({
        success: false,
        shouldCopy: false,
        reason: "Banco de dados indisponível"
      });
    }
    
    // Buscar configurações
    const [rows]: any = await connection.execute(
      `SELECT * FROM copy_trading_settings 
       WHERE user_id = ? AND master_account_number = ? AND slave_account_number = ?
       LIMIT 1`,
      [user.id, master_account_id, slave_account_id]
    );
    
    // Se não tem configuração, usar padrão (copiar tudo)
    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        shouldCopy: true,
        modifiedTrade: {
          symbol,
          type,
          volume,
          sl,
          tp
        }
      });
    }
    
    const settings = rows[0];
    
    // Verificar se está ativo
    if (!settings.is_active) {
      return res.json({
        success: true,
        shouldCopy: false,
        reason: "Configurações desativadas"
      });
    }
    
    // Filtro de símbolos permitidos
    if (settings.allowed_symbols && settings.allowed_symbols.trim() !== '') {
      const allowed = settings.allowed_symbols.split(',').map((s: string) => s.trim().toUpperCase());
      if (!allowed.includes(symbol.toUpperCase())) {
        return res.json({
          success: true,
          shouldCopy: false,
          reason: `Símbolo ${symbol} não está na lista de permitidos`
        });
      }
    }
    
    // Filtro de símbolos bloqueados
    if (settings.blocked_symbols && settings.blocked_symbols.trim() !== '') {
      const blocked = settings.blocked_symbols.split(',').map((s: string) => s.trim().toUpperCase());
      if (blocked.includes(symbol.toUpperCase())) {
        return res.json({
          success: true,
          shouldCopy: false,
          reason: `Símbolo ${symbol} está bloqueado`
        });
      }
    }
    
    // Filtro de horário
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTime < settings.trading_start_time || currentTime > settings.trading_end_time) {
      return res.json({
        success: true,
        shouldCopy: false,
        reason: `Fora do horário de trading (${settings.trading_start_time} - ${settings.trading_end_time})`
      });
    }
    
    // Aplicar modificações no trade
    let modifiedVolume = volume;
    let modifiedSl = sl;
    let modifiedTp = tp;
    let modifiedType = type;
    
    // Gestão de Lote
    switch (settings.lot_mode) {
      case 'multiplier':
        modifiedVolume = volume * parseFloat(settings.lot_multiplier);
        break;
      case 'fixed':
        modifiedVolume = parseFloat(settings.lot_fixed);
        break;
      case 'risk_percent':
        // TODO: Calcular baseado no saldo da conta
        modifiedVolume = parseFloat(settings.lot_fixed);
        break;
      // 'exact' mantém o volume original
    }
    
    // Stop Loss
    switch (settings.sl_mode) {
      case 'custom':
        // TODO: Calcular SL baseado em pips
        modifiedSl = sl; // Por enquanto mantém original
        break;
      case 'none':
        modifiedSl = 0;
        break;
      // 'copy' mantém o SL original
    }
    
    // Take Profit
    switch (settings.tp_mode) {
      case 'custom':
        // TODO: Calcular TP baseado em pips
        modifiedTp = tp; // Por enquanto mantém original
        break;
      case 'none':
        modifiedTp = 0;
        break;
      // 'copy' mantém o TP original
    }
    
    // Inverter sinais
    if (settings.invert_signals) {
      modifiedType = type === 'BUY' || type === 'buy' ? 'SELL' : 'BUY';
    }
    
    return res.json({
      success: true,
      shouldCopy: true,
      modifiedTrade: {
        symbol,
        type: modifiedType,
        volume: modifiedVolume,
        sl: modifiedSl,
        tp: modifiedTp
      }
    });
    
  } catch (error: any) {
    console.error("[Copy Trading Settings] Erro ao validar trade:", error);
    res.status(500).json({
      success: false,
      shouldCopy: false,
      error: error.message
    });
  }
});

export default router;
