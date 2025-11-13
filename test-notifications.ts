/**
 * Script de teste para enviar todas as notificações
 * 
 * Uso: npx tsx test-notifications.ts <userId>
 */

import { NtfyService } from './server/services/ntfy-notifications';

const userId = parseInt(process.argv[2] || '1');

async function testAllNotifications() {
  console.log(`\n🧪 Testando todas as notificações para userId=${userId}\n`);
  
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
      language: 'pt-BR',
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
      language: 'pt-BR',
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
      language: 'pt-BR',
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

    // 7. VPS Expirando
    console.log('7️⃣ Enviando: VPS Expirando...');
    await ntfyService.sendVpsExpiring(userId, {
      vpsName: 'VPS Trading Pro',
      daysRemaining: 3,
      expirationDate: '2025-11-05',
    });
    console.log('✅ VPS Expirando enviado!\n');
    await sleep(2000);

    // 8. Assinatura Expirando
    console.log('8️⃣ Enviando: Assinatura Expirando...');
    await ntfyService.sendSubscriptionExpiring(userId, {
      planName: 'Plano Premium',
      daysRemaining: 5,
      expirationDate: '2025-11-07',
    });
    console.log('✅ Assinatura Expirando enviada!\n');
    await sleep(2000);

    // 9. EA Expirando
    console.log('9️⃣ Enviando: EA Expirando...');
    await ntfyService.sendEaExpiring(userId, {
      eaName: 'Scalper Pro EA',
      daysRemaining: 1,
      expirationDate: '2025-11-03',
    });
    console.log('✅ EA Expirando enviado!\n');

    console.log('\n🎉 Todos os testes concluídos com sucesso!');
    console.log('📱 Verifique seu celular para ver as notificações!\n');

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
