import 'dotenv/config';
import { emailService } from '../services/email-service';

async function testEmails() {
  console.log('🧪 Testando sistema de emails...\n');
  
  const testEmail = 'sentrapartners@gmail.com';
  
  try {
    // 1. Testar email de boas-vindas
    console.log('📧 1. Enviando email de boas-vindas...');
    await emailService.sendWelcomeEmail({
      email: testEmail,
      name: 'Usuário Teste',
      password: 'senha123teste',
      planName: 'Profissional'
    });
    console.log('✅ Email de boas-vindas enviado!\n');
    
    // 2. Testar email de confirmação de compra
    console.log('💳 2. Enviando email de confirmação de compra...');
    await emailService.sendPurchaseConfirmationEmail({
      email: testEmail,
      name: 'Usuário Teste',
      productName: 'Plano Profissional',
      amount: 97,
      currency: 'USD',
      orderId: 'TEST_' + Date.now()
    });
    console.log('✅ Email de confirmação enviado!\n');
    
    // 3. Testar email de renovação
    console.log('🔄 3. Enviando email de renovação...');
    await emailService.sendRenewalEmail({
      email: testEmail,
      name: 'Usuário Teste',
      planName: 'Profissional',
      amount: 97,
      currency: 'USD',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    });
    console.log('✅ Email de renovação enviado!\n');
    
    // 4. Testar email de reset de senha
    console.log('🔐 4. Enviando email de reset de senha...');
    await emailService.sendPasswordResetEmail({
      email: testEmail,
      name: 'Usuário Teste',
      resetToken: 'test_token_' + Date.now()
    });
    console.log('✅ Email de reset enviado!\n');
    
    // 5. Testar email de aviso de expiração
    console.log('⚠️ 5. Enviando email de aviso de expiração...');
    await emailService.sendExpirationWarningEmail({
      email: testEmail,
      name: 'Usuário Teste',
      planName: 'Profissional',
      daysLeft: 3,
      expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    });
    console.log('✅ Email de expiração enviado!\n');
    
    console.log('🎉 Todos os emails foram enviados com sucesso!');
    console.log(`📬 Verifique a caixa de entrada de: ${testEmail}`);
    
  } catch (error: any) {
    console.error('❌ Erro ao enviar emails:', error.message);
    process.exit(1);
  }
}

testEmails()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
