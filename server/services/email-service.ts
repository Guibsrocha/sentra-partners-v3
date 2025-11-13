import { Resend } from 'resend';

// Verificar se a API key do Resend está configurada
if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ [EMAIL] RESEND_API_KEY não configurada. Emails não serão enviados.');
}

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key');

const FROM_EMAIL = process.env.FROM_EMAIL || 'Sentra Partners <noreply@sentrapartners.com>';
const COMPANY_NAME = 'Sentra Partners';
const COMPANY_URL = process.env.FRONTEND_URL || 'https://sentrapartners.com';
const SUPPORT_EMAIL = 'suporte@sentrapartners.com';

// Log de configuração na inicialização
console.log('[EMAIL] Configuração:', {
  hasApiKey: !!process.env.RESEND_API_KEY,
  fromEmail: FROM_EMAIL,
  companyUrl: COMPANY_URL,
});

/**
 * Template base para todos os emails
 */
function getEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${COMPANY_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${COMPANY_NAME}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                © ${new Date().getFullYear()} ${COMPANY_NAME}. Todos os direitos reservados.
              </p>
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                Dúvidas? Entre em contato: <a href="mailto:${SUPPORT_EMAIL}" style="color: #667eea; text-decoration: none;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 1. Email de boas-vindas com credenciais
 */
export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  password: string;
  planName: string;
}) {
  const { email, name, password, planName } = params;
  
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 24px;">Bem-vindo ao ${COMPANY_NAME}! 🎉</h2>
    
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Olá <strong>${name}</strong>,
    </p>
    
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Sua conta foi criada com sucesso! Você agora tem acesso ao plano <strong>${planName}</strong>.
    </p>
    
    <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 15px 0; color: #212529; font-size: 18px;">Suas credenciais de acesso:</h3>
      <p style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">
        <strong>Email:</strong> ${email}
      </p>
      <p style="margin: 0; color: #495057; font-size: 16px;">
        <strong>Senha:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code>
      </p>
    </div>
    
    <p style="margin: 0 0 25px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      <strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro login.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${COMPANY_URL}/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Acessar Plataforma
      </a>
    </div>
    
    <p style="margin: 25px 0 0 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
      Se você não solicitou esta conta, por favor ignore este email ou entre em contato conosco.
    </p>
  `;
  
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ [EMAIL] Skipping welcome email - RESEND_API_KEY not configured');
      return;
    }
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Bem-vindo ao ${COMPANY_NAME}! 🚀`,
      html: getEmailTemplate(content),
    });
    console.log('✅ [EMAIL] Welcome email sent to:', email);
  } catch (error) {
    console.error('❌ [EMAIL] Error sending welcome email:', error);
    console.error('❌ [EMAIL] Error details:', error);
    throw error;
  }
}

/**
 * 2. Email de confirmação de compra
 */
export async function sendPurchaseConfirmationEmail(params: {
  email: string;
  name: string;
  productName: string;
  amount: number;
  currency: string;
  orderId: string;
}) {
  const { email, name, productName, amount, currency, orderId } = params;
  
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 24px;">Pagamento Confirmado! ✅</h2>
    
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Olá <strong>${name}</strong>,
    </p>
    
    <p style="margin: 0 0 25px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Recebemos a confirmação do seu pagamento. Obrigado pela sua compra!
    </p>
    
    <div style="background-color: #f8f9fa; padding: 25px; margin: 25px 0; border-radius: 8px; border: 1px solid #e9ecef;">
      <h3 style="margin: 0 0 20px 0; color: #212529; font-size: 18px;">Detalhes da Compra</h3>
      
      <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 15px;">
        <tr>
          <td style="color: #6c757d; padding: 8px 0;">Produto:</td>
          <td style="color: #212529; font-weight: 600; text-align: right; padding: 8px 0;">${productName}</td>
        </tr>
        <tr>
          <td style="color: #6c757d; padding: 8px 0;">Valor:</td>
          <td style="color: #212529; font-weight: 600; text-align: right; padding: 8px 0;">${amount.toFixed(2)} ${currency.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="color: #6c757d; padding: 8px 0;">ID do Pedido:</td>
          <td style="color: #212529; font-weight: 600; text-align: right; padding: 8px 0; font-family: monospace; font-size: 13px;">${orderId}</td>
        </tr>
        <tr>
          <td style="color: #6c757d; padding: 8px 0;">Data:</td>
          <td style="color: #212529; font-weight: 600; text-align: right; padding: 8px 0;">${new Date().toLocaleDateString('pt-BR')}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 25px 0 0 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Seu acesso já está liberado! Faça login na plataforma para começar a usar.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${COMPANY_URL}/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Acessar Plataforma
      </a>
    </div>
  `;
  
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ [EMAIL] Skipping purchase confirmation - RESEND_API_KEY not configured');
      return;
    }
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Pagamento Confirmado - ${productName}`,
      html: getEmailTemplate(content),
    });
    console.log('✅ [EMAIL] Purchase confirmation sent to:', email);
  } catch (error) {
    console.error('❌ [EMAIL] Error sending purchase confirmation:', error);
    console.error('❌ [EMAIL] Error details:', error);
    throw error;
  }
}

/**
 * 3. Email de renovação de assinatura
 */
export async function sendRenewalEmail(params: {
  email: string;
  name: string;
  planName: string;
  amount: number;
  currency: string;
  expiryDate: string;
}) {
  const { email, name, planName, amount, currency, expiryDate } = params;
  
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 24px;">Assinatura Renovada! 🎉</h2>
    
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Olá <strong>${name}</strong>,
    </p>
    
    <p style="margin: 0 0 25px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Sua assinatura do plano <strong>${planName}</strong> foi renovada com sucesso!
    </p>
    
    <div style="background-color: #d1f4e0; border-left: 4px solid #28a745; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #155724; font-size: 16px;">
        <strong>✅ Pagamento confirmado:</strong> ${amount.toFixed(2)} ${currency.toUpperCase()}
      </p>
      <p style="margin: 10px 0 0 0; color: #155724; font-size: 16px;">
        <strong>📅 Válido até:</strong> ${expiryDate}
      </p>
    </div>
    
    <p style="margin: 25px 0 0 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Continue aproveitando todos os recursos da plataforma sem interrupções!
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${COMPANY_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Acessar Dashboard
      </a>
    </div>
  `;
  
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ [EMAIL] Skipping renewal email - RESEND_API_KEY not configured');
      return;
    }
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Assinatura Renovada - ${planName}`,
      html: getEmailTemplate(content),
    });
    console.log('✅ [EMAIL] Renewal email sent to:', email);
  } catch (error) {
    console.error('❌ [EMAIL] Error sending renewal email:', error);
    console.error('❌ [EMAIL] Error details:', error);
    throw error;
  }
}

/**
 * 4. Email de reset de senha
 */
export async function sendPasswordResetEmail(params: {
  email: string;
  name: string;
  resetToken: string;
}) {
  const { email, name, resetToken } = params;
  const resetUrl = `${COMPANY_URL}/reset-password?token=${resetToken}`;
  
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 24px;">Redefinir Senha 🔐</h2>
    
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Olá <strong>${name}</strong>,
    </p>
    
    <p style="margin: 0 0 25px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Redefinir Senha
      </a>
    </div>
    
    <p style="margin: 25px 0 15px 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
      Ou copie e cole este link no seu navegador:
    </p>
    <p style="margin: 0 0 25px 0; color: #667eea; font-size: 14px; word-break: break-all;">
      ${resetUrl}
    </p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        <strong>⚠️ Este link expira em 1 hora.</strong> Se você não solicitou a redefinição de senha, ignore este email.
      </p>
    </div>
  `;
  
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ [EMAIL] Skipping password reset - RESEND_API_KEY not configured');
      return;
    }
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Redefinir Senha - Sentra Partners',
      html: getEmailTemplate(content),
    });
    console.log('✅ [EMAIL] Password reset email sent to:', email);
  } catch (error) {
    console.error('❌ [EMAIL] Error sending password reset email:', error);
    console.error('❌ [EMAIL] Error details:', error);
    throw error;
  }
}

/**
 * 5. Email de aviso de expiração
 */
export async function sendExpirationWarningEmail(params: {
  email: string;
  name: string;
  planName: string;
  daysLeft: number;
  expiryDate: string;
}) {
  const { email, name, planName, daysLeft, expiryDate } = params;
  
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #212529; font-size: 24px;">Sua Assinatura Está Expirando ⚠️</h2>
    
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Olá <strong>${name}</strong>,
    </p>
    
    <p style="margin: 0 0 25px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Sua assinatura do plano <strong>${planName}</strong> está próxima do vencimento.
    </p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #856404; font-size: 18px; font-weight: 600;">
        ⏰ ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} restantes
      </p>
      <p style="margin: 0; color: #856404; font-size: 16px;">
        Expira em: <strong>${expiryDate}</strong>
      </p>
    </div>
    
    <p style="margin: 25px 0 0 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Renove agora para continuar aproveitando todos os recursos da plataforma sem interrupções!
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${COMPANY_URL}/subscriptions" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Renovar Assinatura
      </a>
    </div>
  `;
  
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ [EMAIL] Skipping expiration warning - RESEND_API_KEY not configured');
      return;
    }
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `⚠️ Sua assinatura expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`,
      html: getEmailTemplate(content),
    });
    console.log('✅ [EMAIL] Expiration warning sent to:', email);
  } catch (error) {
    console.error('❌ [EMAIL] Error sending expiration warning:', error);
    console.error('❌ [EMAIL] Error details:', error);
    throw error;
  }
}

/**
 * 6. Email de alerta de calendário econômico
 */
export async function sendEconomicAlertEmail(params: {
  email: string;
  name: string;
  eventName: string;
  currency: string;
  eventTime: string;
  minutesAhead: number;
  previousValue?: string;
  forecastValue?: string;
}) {
  const { email, name, eventName, currency, eventTime, minutesAhead, previousValue, forecastValue } = params;
  
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #dc2626; font-size: 24px;">🔴 Alerta de Evento Econômico</h2>
    
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Olá <strong>${name}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Um evento econômico de <strong style="color: #dc2626;">ALTO IMPACTO</strong> está próximo:
    </p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #212529; font-size: 16px;">
        <strong>Evento:</strong> ${eventName}
      </p>
      <p style="margin: 0 0 10px 0; color: #212529; font-size: 16px;">
        <strong>Moeda:</strong> ${currency}
      </p>
      <p style="margin: 0 0 10px 0; color: #212529; font-size: 16px;">
        <strong>Horário:</strong> ${eventTime}
      </p>
      <p style="margin: 0 0 10px 0; color: #dc2626; font-size: 18px; font-weight: bold;">
        <strong>Em:</strong> ${minutesAhead} minutos
      </p>
      ${previousValue ? `
      <hr style="border: none; border-top: 1px solid #fecaca; margin: 15px 0;">
      <p style="margin: 0 0 5px 0; color: #212529; font-size: 14px;">
        <strong>Anterior:</strong> ${previousValue}
      </p>
      ` : ''}
      ${forecastValue ? `
      <p style="margin: 0; color: #212529; font-size: 14px;">
        <strong>Previsão:</strong> ${forecastValue}
      </p>
      ` : ''}
    </div>
    
    <p style="margin: 20px 0 0 0; color: #dc2626; font-size: 16px; font-weight: bold;">
      ⚠️ Prepare-se! Este evento pode causar alta volatilidade no mercado.
    </p>
  `;
  
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ [EMAIL] Skipping economic alert - RESEND_API_KEY not configured');
      return;
    }
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `🔴 Alerta: ${eventName} em ${minutesAhead} minutos`,
      html: getEmailTemplate(content),
    });
    console.log('✅ [EMAIL] Economic alert sent to:', email);
  } catch (error) {
    console.error('❌ [EMAIL] Error sending economic alert:', error);
    console.error('❌ [EMAIL] Error details:', error);
    throw error;
  }
}

/**
 * 7. Email de alerta de drawdown
 */
export async function sendDrawdownAlertEmail(params: {
  email: string;
  name: string;
  accountNumber: string;
  broker: string;
  drawdownPercent: number;
  thresholdPercent: number;
  balance: number;
  equity: number;
  loss: number;
}) {
  const { email, name, accountNumber, broker, drawdownPercent, thresholdPercent, balance, equity, loss } = params;
  
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #dc2626; font-size: 24px;">📉 Alerta de Drawdown</h2>
    
    <p style="margin: 0 0 15px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Olá <strong>${name}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #495057; font-size: 16px; line-height: 1.6;">
      Sua conta <strong>${accountNumber}</strong> (${broker}) atingiu o limite de drawdown configurado.
    </p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #212529; font-size: 16px;">
        <strong>Conta:</strong> ${accountNumber}
      </p>
      <p style="margin: 0 0 10px 0; color: #212529; font-size: 16px;">
        <strong>Corretora:</strong> ${broker}
      </p>
      <p style="margin: 0 0 10px 0; color: #dc2626; font-size: 18px; font-weight: bold;">
        <strong>Drawdown Atual:</strong> ${drawdownPercent.toFixed(2)}%
      </p>
      <p style="margin: 0 0 10px 0; color: #212529; font-size: 16px;">
        <strong>Limite Configurado:</strong> ${thresholdPercent.toFixed(2)}%
      </p>
      <hr style="border: none; border-top: 1px solid #fecaca; margin: 15px 0;">
      <p style="margin: 0 0 5px 0; color: #212529; font-size: 14px;">
        <strong>Balanço:</strong> $${balance.toFixed(2)}
      </p>
      <p style="margin: 0 0 5px 0; color: #212529; font-size: 14px;">
        <strong>Equity:</strong> $${equity.toFixed(2)}
      </p>
      <p style="margin: 0; color: #dc2626; font-size: 14px; font-weight: bold;">
        <strong>Perda:</strong> -$${loss.toFixed(2)}
      </p>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #dc2626; font-size: 16px; font-weight: bold;">
      ⚠️ Considere revisar sua estratégia de trading.
    </p>
    
    <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 14px;">
      <em>Você receberá no máximo 2 alertas por dia, espaçados em 12 horas.</em>
    </p>
  `;
  
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ [EMAIL] Skipping drawdown alert - RESEND_API_KEY not configured');
      return;
    }
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `📉 Alerta: Drawdown de ${drawdownPercent.toFixed(2)}% na conta ${accountNumber}`,
      html: getEmailTemplate(content),
    });
    console.log('✅ [EMAIL] Drawdown alert sent to:', email);
  } catch (error) {
    console.error('❌ [EMAIL] Error sending drawdown alert:', error);
    console.error('❌ [EMAIL] Error details:', error);
    throw error;
  }
}

export const emailService = {
  sendWelcomeEmail,
  sendPurchaseConfirmationEmail,
  sendRenewalEmail,
  sendPasswordResetEmail,
  sendExpirationWarningEmail,
  sendEconomicAlertEmail,
  sendDrawdownAlertEmail,
};
