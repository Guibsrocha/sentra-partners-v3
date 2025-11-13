/**
 * Job de Limpeza de Notificações Antigas
 * 
 * Remove notificações do histórico com mais de 15 horas para:
 * 1. Evitar acúmulo excessivo de dados
 * 2. Manter apenas histórico recente para verificação de duplicatas
 * 3. Melhorar performance das queries
 * 
 * Executa automaticamente a cada 15 horas
 */

import { getDb } from '../db';
import { notificationHistory } from '../../drizzle/schema';
import { sql } from 'drizzle-orm';

export async function cleanupOldNotifications() {
  try {
    console.log('[Cleanup] 🧹 Iniciando limpeza de notificações antigas...');
    
    const db = await getDb();
    if (!db) {
      console.error('[Cleanup] ❌ Database não disponível');
      return;
    }

    // Deletar notificações com mais de 15 horas
    const result = await db
      .delete(notificationHistory)
      .where(sql`${notificationHistory.sentAt} < DATE_SUB(NOW(), INTERVAL 15 HOUR)`);

    const deletedCount = result.rowsAffected || 0;
    
    if (deletedCount > 0) {
      console.log(`[Cleanup] ✅ ${deletedCount} notificações antigas removidas`);
    } else {
      console.log('[Cleanup] ℹ️ Nenhuma notificação antiga para remover');
    }

    // Estatísticas após limpeza
    const [stats] = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        MIN(sentAt) as mais_antiga,
        MAX(sentAt) as mais_recente
      FROM notification_history
    `);

    if (stats && stats[0]) {
      const { total, mais_antiga, mais_recente } = stats[0] as any;
      console.log(`[Cleanup] 📊 Estatísticas após limpeza:`);
      console.log(`  - Total de notificações: ${total}`);
      console.log(`  - Mais antiga: ${mais_antiga}`);
      console.log(`  - Mais recente: ${mais_recente}`);
    }

  } catch (error) {
    console.error('[Cleanup] ❌ Erro ao limpar notificações:', error);
  }
}

// Executar limpeza a cada 15 horas (54000000 ms)
const CLEANUP_INTERVAL = 15 * 60 * 60 * 1000;

export function startCleanupSchedule() {
  console.log('[Cleanup] 🚀 Agendador de limpeza iniciado (a cada 15 horas)');
  
  // Executar imediatamente na inicialização
  cleanupOldNotifications();
  
  // Agendar execuções periódicas
  setInterval(cleanupOldNotifications, CLEANUP_INTERVAL);
}
