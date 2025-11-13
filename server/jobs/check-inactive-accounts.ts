import { getDb } from '../db';
import { telegramService } from '../services/telegram-notifications';

export async function checkInactiveAccounts() {
  try {
    const db = await getDb();
    
    console.log('🔍 Verificando contas inativas...');
    
    // Buscar contas que:
    // 1. Não tiveram trades nos últimos 3 dias (last_trade_at < NOW() - INTERVAL 3 DAY)
    // 2. Não têm operações abertas (open_positions = 0 ou NULL)
    // 3. Estão ativas (active = 1)
    const [inactiveAccounts] = await db.execute(`
      SELECT 
        a.id,
        a.login,
        a.broker,
        a.last_trade_at,
        a.open_positions,
        u.telegram_chat_id,
        u.name as user_name
      FROM trading_accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.active = 1
        AND (a.last_trade_at IS NULL OR a.last_trade_at < NOW() - INTERVAL 3 DAY)
        AND (a.open_positions IS NULL OR a.open_positions = 0)
        AND u.telegram_chat_id IS NOT NULL
    `);
    
    const accounts = inactiveAccounts as any[];
    
    if (accounts.length === 0) {
      console.log('✅ Nenhuma conta inativa encontrada');
      return;
    }
    
    console.log(`⚠️  ${accounts.length} conta(s) inativa(s) encontrada(s)`);
    
    // Enviar notificação para cada conta inativa
    for (const account of accounts) {
      const daysSinceLastTrade = account.last_trade_at 
        ? Math.floor((Date.now() - new Date(account.last_trade_at).getTime()) / (1000 * 60 * 60 * 24))
        : '∞';
      
      const message = `
⚠️ *Conta Inativa Detectada*

🔢 *Conta:* ${account.login}
🏦 *Broker:* ${account.broker}
📅 *Último Trade:* ${account.last_trade_at ? new Date(account.last_trade_at).toLocaleDateString('pt-BR') : 'Nunca'}
⏱️ *Dias sem trades:* ${daysSinceLastTrade}
📊 *Operações Abertas:* ${account.open_positions || 0}

Esta conta está há mais de 3 dias sem realizar trades e não possui operações em aberto.

Por favor, verifique se está tudo ok! 🔍
      `.trim();
      
      try {
        await telegramService.sendMessage(account.telegram_chat_id, message);
        console.log(`✅ Notificação enviada para conta ${account.login}`);
      } catch (error) {
        console.error(`❌ Erro ao enviar notificação para conta ${account.login}:`, error);
      }
    }
    
    console.log('✅ Verificação de contas inativas concluída');
  } catch (error) {
    console.error('❌ Erro ao verificar contas inativas:', error);
  }
}

// Executar a cada 6 horas
export function startInactivityMonitor() {
  console.log('🚀 Iniciando monitoramento de inatividade de contas...');
  
  // Executar imediatamente ao iniciar
  checkInactiveAccounts();
  
  // Executar a cada 6 horas (21600000 ms)
  setInterval(checkInactiveAccounts, 6 * 60 * 60 * 1000);
}
