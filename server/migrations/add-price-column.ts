import { getDb } from '../db';

/**
 * Migration: Adicionar coluna price na tabela user_subscriptions
 */
export async function addPriceColumn() {
  const db = await getDb();
  
  try {
    console.log('[Migration] Adicionando coluna price em user_subscriptions...');
    
    await db.execute(`
      ALTER TABLE user_subscriptions 
      ADD COLUMN price INT NOT NULL DEFAULT 0
    `);
    
    console.log('[Migration] ✓ Coluna price adicionada com sucesso!');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('[Migration] ⚠ Coluna price já existe, pulando...');
    } else {
      console.error('[Migration] Erro ao adicionar coluna price:', error);
    }
  }
}
