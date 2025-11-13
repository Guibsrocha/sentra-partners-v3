import dotenv from 'dotenv';
dotenv.config();

import { getDb } from '../db';

async function addLastTradeAt() {
  try {
    const db = await getDb();
    
    console.log('🔧 Adicionando campo last_trade_at na tabela accounts...');
    
    // Adicionar coluna last_trade_at (se não existir)
    try {
      await db.execute(`
        ALTER TABLE accounts 
        ADD COLUMN last_trade_at DATETIME DEFAULT NULL
      `);
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Campo last_trade_at já existe, pulando...');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Campo last_trade_at adicionado!');
    
    // Atualizar last_trade_at com base nos trades existentes
    console.log('🔄 Atualizando last_trade_at com base nos trades existentes...');
    
    await db.execute(`
      UPDATE accounts a
      SET last_trade_at = (
        SELECT MAX(close_time)
        FROM trades t
        WHERE t.account_id = a.id
      )
      WHERE EXISTS (
        SELECT 1 FROM trades t WHERE t.account_id = a.id
      )
    `);
    
    console.log('✅ last_trade_at atualizado para todas as contas!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

addLastTradeAt();
