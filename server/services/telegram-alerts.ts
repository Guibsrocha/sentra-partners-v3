import { getDb } from "../db";
import { users, telegramUsers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8308274026:AAFntpeg6gIOU1aqE_ukDFzgl_9rcXqRn8A";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export class TelegramAlertsService {
  /**
   * Envia mensagem para um chat específico
   */
  async sendMessage(chatId: string | number, text: string, parseMode: "HTML" | "Markdown" = "HTML"): Promise<boolean> {
    try {
      const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
        }),
      });

      if (!response.ok) {
        console.error(`[Telegram] Erro ao enviar mensagem: ${response.statusText}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar mensagem:`, error);
      return false;
    }
  }

  /**
   * Busca chatId do usuário
   */
  async getUserChatId(userId: number): Promise<string | null> {
    try {
      const db = getDb();
      const telegramUser = await db
        .select()
        .from(telegramUsers)
        .where(eq(telegramUsers.userId, userId))
        .limit(1);

      if (telegramUser.length === 0 || !telegramUser[0].chatId) {
        return null;
      }

      return telegramUser[0].chatId;
    } catch (error) {
      console.error(`[Telegram] Erro ao buscar chatId:`, error);
      return null;
    }
  }

  /**
   * Alerta de Drawdown
   */
  async sendDrawdownAlert(
    userId: number,
    accountId: string,
    data: {
      currentDrawdown: number;
      maxDrawdown: number;
      equity: number;
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const chatId = await this.getUserChatId(userId);
      if (!chatId) return false;

      const messages = {
        "pt-BR": `
⚠️ <b>ALERTA DE DRAWDOWN</b>

<b>Conta:</b> ${accountId}
<b>Drawdown Atual:</b> ${data.currentDrawdown.toFixed(2)}%
<b>Limite:</b> ${data.maxDrawdown.toFixed(2)}%
<b>Equity:</b> $${data.equity.toFixed(2)}

<i>Atenção necessária! Revise sua estratégia.</i> 🛡️
        `.trim(),
        "en-US": `
⚠️ <b>DRAWDOWN ALERT</b>

<b>Account:</b> ${accountId}
<b>Current Drawdown:</b> ${data.currentDrawdown.toFixed(2)}%
<b>Limit:</b> ${data.maxDrawdown.toFixed(2)}%
<b>Equity:</b> $${data.equity.toFixed(2)}

<i>Attention required! Review your strategy.</i> 🛡️
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar alerta de drawdown:`, error);
      return false;
    }
  }

  /**
   * Alerta de Conexão
   */
  async sendConnectionAlert(
    userId: number,
    accountId: string,
    isConnected: boolean,
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const chatId = await this.getUserChatId(userId);
      if (!chatId) return false;

      const emoji = isConnected ? "✅" : "🔴";
      const status = isConnected ? "conectada" : "desconectada";
      const statusEn = isConnected ? "connected" : "disconnected";

      const messages = {
        "pt-BR": `
${emoji} <b>ALERTA DE CONEXÃO</b>

<b>Conta:</b> ${accountId}
<b>Status:</b> ${status.toUpperCase()}

${isConnected ? "<i>Conexão restabelecida!</i> ✅" : "<i>Verifique sua conexão com urgência!</i> ⚠️"}
        `.trim(),
        "en-US": `
${emoji} <b>CONNECTION ALERT</b>

<b>Account:</b> ${accountId}
<b>Status:</b> ${statusEn.toUpperCase()}

${isConnected ? "<i>Connection restored!</i> ✅" : "<i>Check your connection urgently!</i> ⚠️"}
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar alerta de conexão:`, error);
      return false;
    }
  }

  /**
   * Alerta de VPS Expirando
   */
  async sendVPSExpirationAlert(
    userId: number,
    vpsData: {
      name: string;
      expirationDate: string;
      daysRemaining: number;
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const chatId = await this.getUserChatId(userId);
      if (!chatId) return false;

      const messages = {
        "pt-BR": `
⏰ <b>ALERTA DE VPS</b>

<b>VPS:</b> ${vpsData.name}
<b>Expira em:</b> ${vpsData.daysRemaining} dias
<b>Data:</b> ${vpsData.expirationDate}

<i>Renove sua VPS para evitar interrupções!</i> 🔔
        `.trim(),
        "en-US": `
⏰ <b>VPS ALERT</b>

<b>VPS:</b> ${vpsData.name}
<b>Expires in:</b> ${vpsData.daysRemaining} days
<b>Date:</b> ${vpsData.expirationDate}

<i>Renew your VPS to avoid interruptions!</i> 🔔
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar alerta de VPS:`, error);
      return false;
    }
  }

  /**
   * Alerta de Assinatura Expirando
   */
  async sendSubscriptionExpirationAlert(
    userId: number,
    subscriptionData: {
      plan: string;
      expirationDate: string;
      daysRemaining: number;
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const chatId = await this.getUserChatId(userId);
      if (!chatId) return false;

      const messages = {
        "pt-BR": `
📅 <b>ALERTA DE ASSINATURA</b>

<b>Plano:</b> ${subscriptionData.plan}
<b>Expira em:</b> ${subscriptionData.daysRemaining} dias
<b>Data:</b> ${subscriptionData.expirationDate}

<i>Renove sua assinatura para continuar usando!</i> 💎
        `.trim(),
        "en-US": `
📅 <b>SUBSCRIPTION ALERT</b>

<b>Plan:</b> ${subscriptionData.plan}
<b>Expires in:</b> ${subscriptionData.daysRemaining} days
<b>Date:</b> ${subscriptionData.expirationDate}

<i>Renew your subscription to continue using!</i> 💎
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar alerta de assinatura:`, error);
      return false;
    }
  }

  /**
   * Alerta de EA Expirando
   */
  async sendEAExpirationAlert(
    userId: number,
    eaData: {
      name: string;
      expirationDate: string;
      daysRemaining: number;
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const chatId = await this.getUserChatId(userId);
      if (!chatId) return false;

      const messages = {
        "pt-BR": `
🤖 <b>ALERTA DE EA</b>

<b>Expert Advisor:</b> ${eaData.name}
<b>Licença expira em:</b> ${eaData.daysRemaining} dias
<b>Data:</b> ${eaData.expirationDate}

<i>Renove sua licença do EA!</i> ⚙️
        `.trim(),
        "en-US": `
🤖 <b>EA ALERT</b>

<b>Expert Advisor:</b> ${eaData.name}
<b>License expires in:</b> ${eaData.daysRemaining} days
<b>Date:</b> ${eaData.expirationDate}

<i>Renew your EA license!</i> ⚙️
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar alerta de EA:`, error);
      return false;
    }
  }

  /**
   * Alerta de Inatividade
   */
  async sendInactivityAlert(
    userId: number,
    accountId: string,
    daysInactive: number,
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const chatId = await this.getUserChatId(userId);
      if (!chatId) return false;

      const messages = {
        "pt-BR": `
😴 <b>ALERTA DE INATIVIDADE</b>

<b>Conta:</b> ${accountId}
<b>Inativa há:</b> ${daysInactive} dias

<i>Sua conta está sem trades há ${daysInactive} dias. Tudo ok?</i> 🤔
        `.trim(),
        "en-US": `
😴 <b>INACTIVITY ALERT</b>

<b>Account:</b> ${accountId}
<b>Inactive for:</b> ${daysInactive} days

<i>Your account has no trades for ${daysInactive} days. Everything ok?</i> 🤔
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar alerta de inatividade:`, error);
      return false;
    }
  }

  /**
   * Notificação de Venda (Admin)
   */
  async sendSaleNotification(
    adminChatId: string,
    saleData: {
      customerName: string;
      plan: string;
      value: number;
      currency: string;
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const currencySymbol = saleData.currency === "BRL" ? "R$" : "$";
      const valueFormatted = `${currencySymbol}${saleData.value.toFixed(2)}`;

      const messages = {
        "pt-BR": `
💰 <b>Venda aprovada!</b>
1M É LOGO ALI! 🚀🎯

<b>Cliente:</b> ${saleData.customerName}
<b>Plano:</b> ${saleData.plan}
<b>Valor:</b> ${valueFormatted}
        `.trim(),
        "en-US": `
💰 <b>Sale approved!</b>
1M IS COMING! 🚀🎯

<b>Customer:</b> ${saleData.customerName}
<b>Plan:</b> ${saleData.plan}
<b>Value:</b> ${valueFormatted}
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(adminChatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de venda:`, error);
      return false;
    }
  }

  /**
   * Notificação de Renovação (Admin)
   */
  async sendRenewalNotification(
    adminChatId: string,
    renewalData: {
      customerName: string;
      plan: string;
      value: number;
      currency: string;
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const currencySymbol = renewalData.currency === "BRL" ? "R$" : "$";
      const valueFormatted = `${currencySymbol}${renewalData.value.toFixed(2)}`;

      const messages = {
        "pt-BR": `
🔄 <b>Renovação confirmada!</b>
Mais ${valueFormatted} no bolso! 💵

<b>Cliente:</b> ${renewalData.customerName}
<b>Plano:</b> ${renewalData.plan}
<b>Valor:</b> ${valueFormatted}
        `.trim(),
        "en-US": `
🔄 <b>Renewal confirmed!</b>
${valueFormatted} more in your pocket! 💵

<b>Customer:</b> ${renewalData.customerName}
<b>Plan:</b> ${renewalData.plan}
<b>Value:</b> ${valueFormatted}
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(adminChatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de renovação:`, error);
      return false;
    }
  }
}

export const telegramAlertsService = new TelegramAlertsService();
