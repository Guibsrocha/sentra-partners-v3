import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

router.post('/api/admin/add-last-trade-field', async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }
    
    console.log('🔧 Adicionando campo last_trade_at na tabela accounts...');
    
    // Adicionar coluna last_trade_at (se não existir)
    try {
      await connection.query(
        'ALTER TABLE trading_accounts ADD COLUMN last_trade_at DATETIME DEFAULT NULL'
      );
      console.log('✅ Campo last_trade_at adicionado!');
    } catch (error: any) {
      console.log('Erro ao adicionar campo:', error.code, error.message);
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Campo last_trade_at já existe, pulando...');
      } else {
        throw error;
      }
    }
    
    // Atualizar last_trade_at com base nos trades existentes
    console.log('🔄 Atualizando last_trade_at com base nos trades existentes...');
    
    await connection.query(`
      UPDATE trading_accounts a
      SET last_trade_at = (
        SELECT MAX(close_time)
        FROM trades t
        WHERE t.account_id = a.id
      )
      WHERE EXISTS (
        SELECT 1 FROM trades t WHERE t.account_id = a.id
      )
    `);
    
    // Fechar conexão
    await connection.end();
    
    console.log('✅ last_trade_at atualizado para todas as contas!');
    
    res.json({ 
      success: true, 
      message: 'Campo last_trade_at adicionado e atualizado com sucesso!' 
    });
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
});

export default router;
