import { getDb } from '../db';
import { economicEvents } from '../../drizzle/schema';
import { sql } from 'drizzle-orm';

/**
 * Remove eventos econômicos com mais de 2 meses
 * Roda mensalmente via cron job
 */
export async function cleanupOldEvents() {
  console.log('[Cleanup Old Events] Starting cleanup...');
  
  try {
    const dbInstance = await getDb();
    
    // Calcular data de 2 meses atrás
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    console.log(`[Cleanup Old Events] Deleting events before ${twoMonthsAgo.toISOString()}`);
    
    // Deletar eventos antigos usando Drizzle ORM
    const { lt } = await import('drizzle-orm');
    const result = await dbInstance
      .delete(economicEvents)
      .where(lt(economicEvents.eventTime, twoMonthsAgo));
    
    console.log(`[Cleanup Old Events] Cleanup completed: ${result.rowsAffected || 0} events deleted`);
    
  } catch (error) {
    console.error('[Cleanup Old Events] Cleanup failed:', error);
    throw error;
  }
}

// Exportar para ser usado em outros arquivos
export default cleanupOldEvents;
