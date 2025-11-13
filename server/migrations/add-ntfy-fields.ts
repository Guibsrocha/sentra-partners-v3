import { getDb } from '../db';

/**
 * Migration: Adicionar campos ntfy.sh na tabela user_settings
 * 
 * Adiciona suporte para notificações push via ntfy.sh
 * que funciona em Android e iPhone
 */
export async function addNtfyFields() {
  const db = await getDb();
  
  try {
    console.log('[Migration] Adicionando campos ntfy.sh...');
    
    // MySQL não suporta IF NOT EXISTS em ALTER TABLE ADD COLUMN
    // Vamos adicionar cada coluna individualmente e ignorar erros se já existir
    
    const columns = [
      'ntfyEnabled BOOLEAN DEFAULT FALSE',
      'ntfyTopic VARCHAR(128)',
      'ntfyDailyEnabled BOOLEAN DEFAULT TRUE',
      'ntfyWeeklyEnabled BOOLEAN DEFAULT TRUE',
      'ntfyTradesEnabled BOOLEAN DEFAULT TRUE',
      'ntfyDrawdownEnabled BOOLEAN DEFAULT TRUE',
      'ntfyConnectionEnabled BOOLEAN DEFAULT TRUE'
    ];
    
    for (const column of columns) {
      try {
        await db.execute(`ALTER TABLE user_settings ADD COLUMN ${column}`);
        console.log(`[Migration] ✓ Coluna ${column.split(' ')[0]} adicionada`);
      } catch (error: any) {
        // Ignorar erro se coluna já existe
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`[Migration] ⚠ Coluna ${column.split(' ')[0]} já existe, pulando...`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('[Migration] ✓ Campos ntfy.sh adicionados com sucesso!');
  } catch (error) {
    console.error('[Migration] Erro ao adicionar campos ntfy.sh:', error);
  }
}
