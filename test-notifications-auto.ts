/**
 * Script de teste para enviar todas as notificações
 * Busca userId automaticamente pelo email
 * 
 * Uso: npx tsx test-notifications-auto.ts
 */

import { getDb } from './server/db';
import { users } from './drizzle/schema';
import { eq } from 'drizzle-orm';
import { NtfyService } from './server/services/ntfy-notifications';

const EMAIL = 'sentrapartners@gmail.com';

async function testAllNotifications() {
  console.log(`\n🔍 Buscando userId para email: ${EMAIL}...\n`);
  
  // Buscar userId
  const db = await getDb();
  if (!db) {
    console.error('❌ Erro: Banco de dados não disponível');
    process.exit(1);
  }

  const [user] = await db.select().from(users).where(eq(users.email, EMAIL)).limit(1);
  
  if (!user) {
    console.error(`❌ Erro: Usuário com email ${EMAIL} não encontrado`);
    process.exit(1);
  }

  const userId = user.id;
  console.log(`✅ userId encontrado: ${userId}`);
  console.log(`👤 Nome: ${user.name || 'N/A'}`);
  console.log(`🌍 Idioma: ${user.language || 'pt-BR'}\n`);
  
  const ntfyService = new NtfyService();

  try {
    // 1. Trade Aberto
    console.log('1️⃣ Enviando: Trade Aberto...');
    await ntfyService.sendTradeOpened(userId, {
      symbol: 'EURUSD',
      type: 'BUY',
      volume: 0.10,
      openPrice: 1.0850,
      accountNumber: '12345678',
      language: user.language || 'pt-BR',
    });
    console.log('✅ Trade Aberto enviado!\n');
    await sleep(2000);

    // 2. Take Profit
    console.log('2️⃣ Enviando: Take Profit...');
    await ntfyService.sendTradeTakeProfit(userId, {
      symbol: 'GBPUSD',
      profit: 15000, // $150.00 (em centavos)
      accountNumber: '12345678',
      currency: 'USD',
      language: user.language || 'pt-BR',
    });
    console.log('✅ Take Profit enviado!\n');
    await sleep(2000);

    // 3. Stop Loss
    console.log('3️⃣ Enviando: Stop Loss...');
    await ntfyService.sendTradeStopLoss(userId, {
      symbol: 'USDJPY',
      loss: -5000, // -$50.00 (em centavos)
      accountNumber: '12345678',
      currency: 'USD',
      language: user.language || 'pt-BR',
    });
    console.log('✅ Stop Loss enviado!\n');
    await sleep(2000);

    // 4. Alerta de Drawdown
    console.log('4️⃣ Enviando: Alerta de Drawdown...');
    await ntfyService.sendDrawdownAlert(userId, {
      accountNumber: '12345678',
      currentDrawdown: 12.5,
      threshold: 10.0,
    });
    console.log('✅ Alerta de Drawdown enviado!\n');
    await sleep(2000);

    // 5. Conta Conectada
    console.log('5️⃣ Enviando: Conta Conectada...');
    await ntfyService.sendAccountConnected(userId, {
      accountNumber: '87654321',
      broker: 'XM Global',
      accountType: 'Standard',
    });
    console.log('✅ Conta Conectada enviada!\n');
    await sleep(2000);

    // 6. Copy Trade Executado
    console.log('6️⃣ Enviando: Copy Trade Executado...');
    await ntfyService.sendCopyTradeExecuted(userId, {
      providerName: 'John Trader Pro',
      symbol: 'XAUUSD',
      type: 'SELL',
      volume: 0.05,
      accountNumber: '12345678',
    });
    console.log('✅ Copy Trade enviado!\n');
    await sleep(2000);

    // 7. VPS Expirando (3 dias)
    console.log('7️⃣ Enviando: VPS Expirando (3 dias)...');
    await ntfyService.sendVpsExpiring(userId, {
      vpsName: 'VPS Trading Pro',
      daysRemaining: 3,
      expirationDate: '2025-11-05',
    });
    console.log('✅ VPS Expirando enviado!\n');
    await sleep(2000);

    // 8. Assinatura Expirando (5 dias)
    console.log('8️⃣ Enviando: Assinatura Expirando (5 dias)...');
    await ntfyService.sendSubscriptionExpiring(userId, {
      planName: 'Plano Premium',
      daysRemaining: 5,
      expirationDate: '2025-11-07',
    });
    console.log('✅ Assinatura Expirando enviada!\n');
    await sleep(2000);

    // 9. EA Expirando (1 dia - URGENTE)
    console.log('9️⃣ Enviando: EA Expirando (1 dia - URGENTE)...');
    await ntfyService.sendEaExpiring(userId, {
      eaName: 'Scalper Pro EA',
      daysRemaining: 1,
      expirationDate: '2025-11-03',
    });
    console.log('✅ EA Expirando enviado!\n');

    console.log('\n🎉 Todos os testes concluídos com sucesso!');
    console.log('📱 Verifique seu celular para ver as 9 notificações!\n');
    console.log('📋 Tipos enviados:');
    console.log('   1. Trade Aberto (EURUSD BUY)');
    console.log('   2. Take Profit (+$150.00)');
    console.log('   3. Stop Loss (-$50.00)');
    console.log('   4. Alerta de Drawdown (12.5%)');
    console.log('   5. Conta Conectada (87654321)');
    console.log('   6. Copy Trade (XAUUSD SELL)');
    console.log('   7. VPS Expirando (3 dias)');
    console.log('   8. Assinatura Expirando (5 dias)');
    console.log('   9. EA Expirando (1 dia - URGENTE)\n');

  } catch (error) {
    console.error('❌ Erro ao enviar notificações:', error);
    process.exit(1);
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Executar testes
testAllNotifications()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
