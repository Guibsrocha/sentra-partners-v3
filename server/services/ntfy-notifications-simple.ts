// Versão SUPER SIMPLES apenas para testar
import { getDb } from '../db';
import { userSettings } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export async function sendSimpleDailyTest(userId: number) {
  try {
    console.log('[SIMPLE] Iniciando teste para user:', userId);
    
    // 1. Buscar configurações ntfy do usuário
    const db = await getDb();
    if (!db) throw new Error('Database não disponível');
    
    const settings = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    const ntfyTopic = settings[0]?.ntfyTopic;
    const ntfyEnabled = settings[0]?.ntfyEnabled;
    
    console.log('[SIMPLE] Topic:', ntfyTopic, 'Enabled:', ntfyEnabled);
    
    if (!ntfyEnabled || !ntfyTopic) {
      throw new Error('Notificações ntfy não estão habilitadas');
    }
    
    // 2. Enviar notificação SIMPLES
    const response = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: JSON.stringify({
        topic: ntfyTopic,
        title: '✅ Teste Simples',
        message: 'Se você recebeu isso, o sistema está funcionando!',
        priority: 'default',
        tags: ['white_check_mark'],
      }),
    });
    
    console.log('[SIMPLE] Response status:', response.status);
    
    return response.ok;
  } catch (error) {
    console.error('[SIMPLE] Erro:', error);
    throw error;
  }
}
