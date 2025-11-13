// FORCE REBUILD - 2025-11-04 09:25 BRT - FINAL FIX
import { getDb } from "../db";
import { users, telegramUsers, notificationHistory } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getRandomPhrase } from "./telegram-phrases";
import { getCurrencySymbol, type SupportedCurrency } from "./currency-converter";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8308274026:AAFntpeg6gIOU1aqE_ukDFzgl_9rcXqRn8A";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
}

class TelegramService {
  /**
   * Envia mensagem para um chat específico
   */
  async sendMessage(
    chatId: string | number, 
    text: string, 
    parseMode: "HTML" | "Markdown" = "HTML",
    notificationData?: {
      userId: number;
      type: 'trade_opened' | 'trade_closed_tp' | 'trade_closed_sl' | 'copy_trade_opened' | 'copy_trade_closed' | 'drawdown_alert' | 'connection_alert' | 'vps_expiring' | 'subscription_expiring' | 'ea_expiring' | 'inactivity_alert' | 'daily_report' | 'weekly_report' | 'monthly_report' | 'sale_notification' | 'renewal_notification' | 'test';
      title: string;
      accountNumber?: string;
      ticket?: string;
      eventType?: string;
    }
  ): Promise<boolean> {
    try {
      console.log(`[Telegram] Enviando mensagem para chat ${chatId}`);
      
      const message: TelegramMessage = {
        chat_id: chatId,
        text: text,
        parse_mode: parseMode,
        disable_web_page_preview: true
      };

      // Adicionar timeout de 10 segundos para evitar atrasos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(message),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok || !data.ok) {
        console.error(`[Telegram] Erro ao enviar mensagem:`, data);
        // Salvar histórico como falha
        if (notificationData) {
          await this.saveNotificationHistory({
            ...notificationData,
            message: text,
            status: 'failed'
          });
        }
        return false;
      }

      console.log(`[Telegram] ✅ Mensagem enviada com sucesso`);
      
      // Salvar histórico como sucesso
      if (notificationData) {
        console.log(`[Telegram] 🟢 notificationData existe, chamando saveNotificationHistory...`);
        await this.saveNotificationHistory({
          userId: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: text,
          status: 'sent',
          accountNumber: notificationData.accountNumber,
          ticket: notificationData.ticket,
          eventType: notificationData.eventType
        });
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('aborted')) {
        console.error(`[Telegram] ⚠️ Timeout ao enviar mensagem (>10s)`);
      } else {
        console.error(`[Telegram] Erro ao enviar mensagem:`, error);
      }
      
      // Salvar histórico como falha
      if (notificationData) {
        await this.saveNotificationHistory({
          userId: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: text,
          status: 'failed',
          accountNumber: notificationData.accountNumber,
          ticket: notificationData.ticket,
          eventType: notificationData.eventType
        });
      }
      return false;
    }
  }

  /**
   * Salva notificação no histórico
   */
  private async saveNotificationHistory(data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    status: 'sent' | 'failed';
    accountNumber?: string;
    ticket?: string;
    eventType?: string;
  }): Promise<void> {
    try {
      console.log(`[Telegram] 🔵 ========== SALVANDO HISTÓRICO ==========`);
      console.log(`[Telegram] 🔵 Dados recebidos:`, JSON.stringify({
        userId: data.userId,
        type: data.type,
        title: data.title,
        status: data.status,
        accountNumber: data.accountNumber,
        ticket: data.ticket,
        eventType: data.eventType,
        messageLength: data.message.length
      }, null, 2));
      
      const db = await getDb();
      if (!db) {
        console.error('[Telegram] ❌ Database não disponível para salvar histórico');
        return;
      }

      console.log(`[Telegram] 🔵 Database conectado, preparando insert...`);
      
      const insertData = {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        status: data.status,
        sentAt: new Date(),
        accountNumber: data.accountNumber || null,
        ticket: data.ticket || null,
        eventType: data.eventType || null
      };
      
      console.log(`[Telegram] 🔵 Dados do insert:`, JSON.stringify(insertData, null, 2));
      
      const result = await db.insert(notificationHistory).values(insertData);
      
      console.log(`[Telegram] ✅ ========== HISTÓRICO SALVO COM SUCESSO ==========`);
      console.log(`[Telegram] ✅ Resultado do insert:`, result);
      console.log(`[Telegram] ✅ Título: ${data.title}`);
    } catch (error: any) {
      console.error(`[Telegram] ❌ ========== ERRO AO SALVAR HISTÓRICO ==========`);
      console.error(`[Telegram] ❌ Tipo do erro:`, error?.constructor?.name);
      console.error(`[Telegram] ❌ Mensagem:`, error?.message);
      console.error(`[Telegram] ❌ Stack:`, error?.stack);
      console.error(`[Telegram] ❌ Erro completo:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
  }

  /**
   * Busca idioma do usuário
   */
  async getUserLanguage(userId: number): Promise<string> {
    try {
      const db = await getDb();
      const result = await db
        .select({ language: users.language })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (result.length === 0 || !result[0].language) {
        return 'pt-BR'; // Idioma padrão
      }

      return result[0].language;
    } catch (error) {
      console.error(`[Telegram] Erro ao buscar idioma:`, error);
      return 'pt-BR'; // Idioma padrão em caso de erro
    }
  }

  /**
   * Busca chat_id do Telegram do usuário
   */
  async getUserChatId(userId: number): Promise<string | null> {
    try {
      const db = await getDb();
      const result = await db
        .select({ chatId: telegramUsers.chatId })
        .from(telegramUsers)
        .where(eq(telegramUsers.userId, userId))
        .limit(1);

      if (result.length === 0) {
        console.log(`[Telegram] Usuário ${userId} não tem chat_id cadastrado`);
        return null;
      }

      return result[0].chatId;
    } catch (error) {
      console.error(`[Telegram] Erro ao buscar chat_id:`, error);
      return null;
    }
  }

  /**
   * Busca userId a partir do chatId
   */
  private async getUserIdFromChatId(chatId: string | number): Promise<number | null> {
    try {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db
        .select({ userId: telegramUsers.userId })
        .from(telegramUsers)
        .where(eq(telegramUsers.chatId, chatId.toString()))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return result[0].userId;
    } catch (error) {
      console.error(`[Telegram] Erro ao buscar userId:`, error);
      return null;
    }
  }

  /**
   * Envia mensagem e salva histórico automaticamente
   */
  private async sendMessageWithHistory(
    chatId: string | number,
    message: string,
    type: 'trade_opened' | 'trade_closed_tp' | 'trade_closed_sl' | 'copy_trade_opened' | 'copy_trade_closed' | 'drawdown_alert' | 'connection_alert' | 'vps_expiring' | 'subscription_expiring' | 'ea_expiring' | 'inactivity_alert' | 'daily_report' | 'weekly_report' | 'monthly_report' | 'sale_notification' | 'renewal_notification' | 'test',
    title: string,
    userId?: number,
    dedupData?: {
      accountNumber: string;
      ticket: string;
      eventType: string;
    }
  ): Promise<boolean> {
    // Se userId não foi passado, busca pelo chatId
    const resolvedUserId = userId || await this.getUserIdFromChatId(chatId);
    
    if (!resolvedUserId) {
      console.error(`[Telegram] ⚠️ Não foi possível obter userId para chatId ${chatId}. Histórico não será salvo.`);
      return await this.sendMessage(chatId, message, "HTML");
    }
    
    return await this.sendMessage(chatId, message, "HTML", {
      userId: resolvedUserId,
      type,
      title,
      accountNumber: dedupData?.accountNumber,
      ticket: dedupData?.ticket,
      eventType: dedupData?.eventType
    });
  }

  /**
   * Envia notificação de trade aberto
   */
  async sendTradeOpened(
    chatId: string,
    accountId: string,
    tradeData: {
      ticket: string;
      symbol: string;
      type: string;
      volume: number;
      openPrice: number;
      sl?: number;
      tp?: number;
    },
    language: string = "pt-BR",
    userId?: number
  ): Promise<boolean> {
    try {
      const emoji = tradeData.type === "BUY" ? "📈" : "📉";
      
      const messages = {
        "pt-BR": `
🔵 <b>TRADE MANUAL ABERTO</b>

<b>Símbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}
<b>Volume:</b> ${tradeData.volume} lotes
<b>Preço:</b> ${tradeData.openPrice}
${tradeData.sl ? `<b>Stop Loss:</b> ${tradeData.sl}` : ""}
${tradeData.tp ? `<b>Take Profit:</b> ${tradeData.tp}` : ""}

<b>Conta:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('open', language)}</i>
        `.trim(),
        "en-US": `
🔵 <b>MANUAL TRADE OPENED</b>

<b>Symbol:</b> ${tradeData.symbol}
<b>Type:</b> ${tradeData.type}
<b>Volume:</b> ${tradeData.volume} lots
<b>Price:</b> ${tradeData.openPrice}
${tradeData.sl ? `<b>Stop Loss:</b> ${tradeData.sl}` : ""}
${tradeData.tp ? `<b>Take Profit:</b> ${tradeData.tp}` : ""}

<b>Account:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('open', language)}</i>
        `.trim(),
        "es-ES": `
🔵 <b>OPERACIÓN MANUAL ABIERTA</b>

<b>Símbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}
<b>Volumen:</b> ${tradeData.volume} lotes
<b>Precio:</b> ${tradeData.openPrice}
${tradeData.sl ? `<b>Stop Loss:</b> ${tradeData.sl}` : ""}
${tradeData.tp ? `<b>Take Profit:</b> ${tradeData.tp}` : ""}

<b>Cuenta:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('open', language)}</i>
        `.trim(),
        "fr-FR": `
🔵 <b>TRADE MANUEL OUVERT</b>

<b>Symbole:</b> ${tradeData.symbol}
<b>Type:</b> ${tradeData.type}
<b>Volume:</b> ${tradeData.volume} lots
<b>Prix:</b> ${tradeData.openPrice}
${tradeData.sl ? `<b>Stop Loss:</b> ${tradeData.sl}` : ""}
${tradeData.tp ? `<b>Take Profit:</b> ${tradeData.tp}` : ""}

<b>Compte:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('open', language)}</i>
        `.trim(),
        "de-DE": `
🔵 <b>MANUELLER HANDEL ERÖFFNET</b>

<b>Symbol:</b> ${tradeData.symbol}
<b>Typ:</b> ${tradeData.type}
<b>Volumen:</b> ${tradeData.volume} Lots
<b>Preis:</b> ${tradeData.openPrice}
${tradeData.sl ? `<b>Stop Loss:</b> ${tradeData.sl}` : ""}
${tradeData.tp ? `<b>Take Profit:</b> ${tradeData.tp}` : ""}

<b>Konto:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('open', language)}</i>
        `.trim(),
        "it-IT": `
🔵 <b>TRADE MANUALE APERTO</b>

<b>Simbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}
<b>Volume:</b> ${tradeData.volume} lotti
<b>Prezzo:</b> ${tradeData.openPrice}
${tradeData.sl ? `<b>Stop Loss:</b> ${tradeData.sl}` : ""}
${tradeData.tp ? `<b>Take Profit:</b> ${tradeData.tp}` : ""}

<b>Conto:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('open', language)}</i>
        `.trim(),
        "ru-RU": `
🔵 <b>РУЧНАЯ СДЕЛКА ОТКРЫТА</b>

<b>Символ:</b> ${tradeData.symbol}
<b>Тип:</b> ${tradeData.type}
<b>Объем:</b> ${tradeData.volume} лотов
<b>Цена:</b> ${tradeData.openPrice}
${tradeData.sl ? `<b>Stop Loss:</b> ${tradeData.sl}` : ""}
${tradeData.tp ? `<b>Take Profit:</b> ${tradeData.tp}` : ""}

<b>Счет:</b> ${accountId}
<b>Тикет:</b> ${tradeData.ticket}

<i>${getRandomPhrase('open', language)}</i>
        `.trim(),
        "ja-JP": `
🔵 <b>手動トレード開始</b>

<b>シンボル:</b> ${tradeData.symbol}
<b>タイプ:</b> ${tradeData.type}
<b>ボリューム:</b> ${tradeData.volume} ロット
<b>価格:</b> ${tradeData.openPrice}
${tradeData.sl ? `<b>ストップロス:</b> ${tradeData.sl}` : ""}
${tradeData.tp ? `<b>テイクプロフィット:</b> ${tradeData.tp}` : ""}

<b>アカウント:</b> ${accountId}
<b>チケット:</b> ${tradeData.ticket}

<i>${getRandomPhrase('open', language)}</i>
        `.trim(),
        "zh-CN": `
🔵 <b>手动交易已开始</b>

<b>品种:</b> ${tradeData.symbol}
<b>类型:</b> ${tradeData.type}
<b>交易量:</b> ${tradeData.volume} 手
<b>价格:</b> ${tradeData.openPrice}
${tradeData.sl ? `<b>止损:</b> ${tradeData.sl}` : ""}
${tradeData.tp ? `<b>止盈:</b> ${tradeData.tp}` : ""}

<b>账户:</b> ${accountId}
<b>订单号:</b> ${tradeData.ticket}

<i>${getRandomPhrase('open', language)}</i>
        `.trim(),
        "ko-KR": `
🔵 <b>수동 거래 시작</b>

<b>심볼:</b> ${tradeData.symbol}
<b>유형:</b> ${tradeData.type}
<b>거래량:</b> ${tradeData.volume} 롯
<b>가격:</b> ${tradeData.openPrice}
${tradeData.sl ? `<b>손절매:</b> ${tradeData.sl}` : ""}
${tradeData.tp ? `<b>이익실현:</b> ${tradeData.tp}` : ""}

<b>계정:</b> ${accountId}
<b>티켓:</b> ${tradeData.ticket}

<i>${getRandomPhrase('open', language)}</i>
        `.trim(),
        "hi-IN": `
🔵 <b>मैन्युअल ट्रेड शुरू</b>

<b>प्रतीक:</b> ${tradeData.symbol}
<b>प्रकार:</b> ${tradeData.type}
<b>मात्रा:</b> ${tradeData.volume} लॉट
<b>मूल्य:</b> ${tradeData.openPrice}
${tradeData.sl ? `<b>स्टॉप लॉस:</b> ${tradeData.sl}` : ""}
${tradeData.tp ? `<b>टेक प्रॉफिट:</b> ${tradeData.tp}` : ""}

<b>खाता:</b> ${accountId}
<b>टिकट:</b> ${tradeData.ticket}

<i>${getRandomPhrase('open', language)}</i>
        `.trim(),
        "ar-SA": `
🔵 <b>صفقة يدوية مفتوحة</b>

<b>الرمز:</b> ${tradeData.symbol}
<b>النوع:</b> ${tradeData.type}
<b>الحجم:</b> ${tradeData.volume} عقود
<b>السعر:</b> ${tradeData.openPrice}
${tradeData.sl ? `<b>وقف الخسارة:</b> ${tradeData.sl}` : ""}
${tradeData.tp ? `<b>جني الربح:</b> ${tradeData.tp}` : ""}

<b>الحساب:</b> ${accountId}
<b>التذكرة:</b> ${tradeData.ticket}

<i>${getRandomPhrase('open', language)}</i>
        `.trim()
      };
      
      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessageWithHistory(
        chatId, 
        message, 
        'trade_opened', 
        `Trade Aberto: ${tradeData.symbol}`,
        userId,
        {
          accountNumber: accountId,
          ticket: tradeData.ticket,
          eventType: 'opened'
        }
      );
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de trade aberto:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de trade fechado com take profit
   */
  async sendTradeTakeProfit(
    chatId: string,
    accountId: string,
    tradeData: {
      ticket: string;
      symbol: string;
      type: string;
      profit: number;
      profitConverted?: number;
      closePrice: number;
    },
    currency: string = "USD",
    language: string = "pt-BR",
    exchangeRate?: number,
    userId?: number
  ): Promise<boolean> {
    try {
      const currencySymbol = getCurrencySymbol(currency as SupportedCurrency);
      
      // Formatar profit em USD
      const profitUSD = tradeData.profit >= 0 
        ? `+$${tradeData.profit.toFixed(2)}` 
        : `-$${Math.abs(tradeData.profit).toFixed(2)}`;
      
      // Se houver conversão, adicionar moeda convertida
      let profitFormatted = profitUSD;
      if (tradeData.profitConverted !== undefined && exchangeRate) {
        const profitConverted = tradeData.profit >= 0
          ? `+${currencySymbol}${tradeData.profitConverted.toFixed(2)}`
          : `-${currencySymbol}${Math.abs(tradeData.profitConverted).toFixed(2)}`;
        profitFormatted = `${profitUSD} (${profitConverted})`;
      }
      const emoji = tradeData.profit >= 0 ? "💰" : "📉";

      const messages = {
        "pt-BR": `
${emoji} <b>TRADE MANUAL FECHADO - TAKE PROFIT</b>

<b>Símbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}
<b>Lucro:</b> ${profitFormatted}
<b>Preço de Fechamento:</b> ${tradeData.closePrice}

<b>Conta:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('profit', language)}</i>
        `.trim(),
        "en-US": `
${emoji} <b>MANUAL TRADE CLOSED - TAKE PROFIT</b>

<b>Symbol:</b> ${tradeData.symbol}
<b>Type:</b> ${tradeData.type}
<b>Profit:</b> ${profitFormatted}
<b>Close Price:</b> ${tradeData.closePrice}

<b>Account:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('profit', language)}</i>
        `.trim(),
        "es-ES": `
${emoji} <b>OPERACIÓN MANUAL CERRADA - TAKE PROFIT</b>

<b>Símbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}
<b>Beneficio:</b> ${profitFormatted}
<b>Precio de Cierre:</b> ${tradeData.closePrice}

<b>Cuenta:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('profit', language)}</i>
        `.trim(),
        "fr-FR": `
${emoji} <b>TRADE MANUEL FERMÉ - TAKE PROFIT</b>

<b>Symbole:</b> ${tradeData.symbol}
<b>Type:</b> ${tradeData.type}
<b>Profit:</b> ${profitFormatted}
<b>Prix de Clôture:</b> ${tradeData.closePrice}

<b>Compte:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('profit', language)}</i>
        `.trim(),
        "de-DE": `
${emoji} <b>MANUELLER HANDEL GESCHLOSSEN - TAKE PROFIT</b>

<b>Symbol:</b> ${tradeData.symbol}
<b>Typ:</b> ${tradeData.type}
<b>Gewinn:</b> ${profitFormatted}
<b>Schlusskurs:</b> ${tradeData.closePrice}

<b>Konto:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('profit', language)}</i>
        `.trim(),
        "it-IT": `
${emoji} <b>TRADE MANUALE CHIUSO - TAKE PROFIT</b>

<b>Simbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}
<b>Profitto:</b> ${profitFormatted}
<b>Prezzo di Chiusura:</b> ${tradeData.closePrice}

<b>Conto:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('profit', language)}</i>
        `.trim(),
        "ru-RU": `
${emoji} <b>РУЧНАЯ СДЕЛКА ЗАКРЫТА - TAKE PROFIT</b>

<b>Символ:</b> ${tradeData.symbol}
<b>Тип:</b> ${tradeData.type}
<b>Прибыль:</b> ${profitFormatted}
<b>Цена Закрытия:</b> ${tradeData.closePrice}

<b>Счет:</b> ${accountId}
<b>Тикет:</b> ${tradeData.ticket}

<i>${getRandomPhrase('profit', language)}</i>
        `.trim(),
        "ja-JP": `
${emoji} <b>手動トレードクローズ - 利益確定</b>

<b>シンボル:</b> ${tradeData.symbol}
<b>タイプ:</b> ${tradeData.type}
<b>利益:</b> ${profitFormatted}
<b>終了価格:</b> ${tradeData.closePrice}

<b>アカウント:</b> ${accountId}
<b>チケット:</b> ${tradeData.ticket}

<i>${getRandomPhrase('profit', language)}</i>
        `.trim(),
        "zh-CN": `
${emoji} <b>手动交易已关闭 - 止盈</b>

<b>品种:</b> ${tradeData.symbol}
<b>类型:</b> ${tradeData.type}
<b>利润:</b> ${profitFormatted}
<b>收盘价:</b> ${tradeData.closePrice}

<b>账户:</b> ${accountId}
<b>订单号:</b> ${tradeData.ticket}

<i>${getRandomPhrase('profit', language)}</i>
        `.trim(),
        "ko-KR": `
${emoji} <b>수동 거래 종료 - 이익 실현</b>

<b>심볼:</b> ${tradeData.symbol}
<b>유형:</b> ${tradeData.type}
<b>수익:</b> ${profitFormatted}
<b>종가:</b> ${tradeData.closePrice}

<b>계정:</b> ${accountId}
<b>티켓:</b> ${tradeData.ticket}

<i>${getRandomPhrase('profit', language)}</i>
        `.trim(),
        "hi-IN": `
${emoji} <b>मैनुअल ट्रेड बंद - लाभ लें</b>

<b>प्रतीक:</b> ${tradeData.symbol}
<b>प्रकार:</b> ${tradeData.type}
<b>लाभ:</b> ${profitFormatted}
<b>समापन मूल्य:</b> ${tradeData.closePrice}

<b>खाता:</b> ${accountId}
<b>टिकट:</b> ${tradeData.ticket}

<i>${getRandomPhrase('profit', language)}</i>
        `.trim(),
        "ar-SA": `
${emoji} <b>صفقة يدوية مغلقة - جني الأرباح</b>

<b>الرمز:</b> ${tradeData.symbol}
<b>النوع:</b> ${tradeData.type}
<b>الربح:</b> ${profitFormatted}
<b>سعر الإغلاق:</b> ${tradeData.closePrice}

<b>الحساب:</b> ${accountId}
<b>التذكرة:</b> ${tradeData.ticket}

<i>${getRandomPhrase('profit', language)}</i>
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];

      return await this.sendMessageWithHistory(
        chatId, 
        message, 
        'trade_closed_tp', 
        `Trade Fechado (TP): ${tradeData.symbol}`,
        userId
      );
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de take profit:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de trade fechado com stop loss
   */
  async sendTradeStopLoss(
    chatId: string,
    accountId: string,
    tradeData: {
      ticket: string;
      symbol: string;
      type: string;
      profit: number;
      profitConverted?: number;
      closePrice: number;
    },
    currency: string = "USD",
    language: string = "pt-BR",
    exchangeRate?: number,
    userId?: number
  ): Promise<boolean> {
    try {
      const currencySymbol = getCurrencySymbol(currency as SupportedCurrency);
      
      // Formatar loss em USD
      const lossUSD = `$${Math.abs(tradeData.profit).toFixed(2)}`;
      
      // Se houver conversão, adicionar moeda convertida
      let lossFormatted = lossUSD;
      if (tradeData.profitConverted !== undefined && exchangeRate) {
        const lossConverted = `${currencySymbol}${Math.abs(tradeData.profitConverted).toFixed(2)}`;
        lossFormatted = `${lossUSD} (${lossConverted})`;
      }

      const messages = {
        "pt-BR": `
🛑 <b>TRADE MANUAL FECHADO - STOP LOSS</b>

<b>Símbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}
<b>Perda:</b> -${lossFormatted}
<b>Preço de Fechamento:</b> ${tradeData.closePrice}

<b>Conta:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('loss', language)}</i>
        `.trim(),
        "en-US": `
🛑 <b>MANUAL TRADE CLOSED - STOP LOSS</b>

<b>Symbol:</b> ${tradeData.symbol}
<b>Type:</b> ${tradeData.type}
<b>Loss:</b> -${lossFormatted}
<b>Close Price:</b> ${tradeData.closePrice}

<b>Account:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('loss', language)}</i>
        `.trim(),
        "es-ES": `
🛑 <b>OPERACIÓN MANUAL CERRADA - STOP LOSS</b>

<b>Símbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}
<b>Pérdida:</b> -${lossFormatted}
<b>Precio de Cierre:</b> ${tradeData.closePrice}

<b>Cuenta:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('loss', language)}</i>
        `.trim(),
        "fr-FR": `
🛑 <b>TRADE MANUEL FERMÉ - STOP LOSS</b>

<b>Symbole:</b> ${tradeData.symbol}
<b>Type:</b> ${tradeData.type}
<b>Perte:</b> -${lossFormatted}
<b>Prix de Clôture:</b> ${tradeData.closePrice}

<b>Compte:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('loss', language)}</i>
        `.trim(),
        "de-DE": `
🛑 <b>MANUELLER HANDEL GESCHLOSSEN - STOP LOSS</b>

<b>Symbol:</b> ${tradeData.symbol}
<b>Typ:</b> ${tradeData.type}
<b>Verlust:</b> -${lossFormatted}
<b>Schlusskurs:</b> ${tradeData.closePrice}

<b>Konto:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('loss', language)}</i>
        `.trim(),
        "it-IT": `
🛑 <b>TRADE MANUALE CHIUSO - STOP LOSS</b>

<b>Simbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}
<b>Perdita:</b> -${lossFormatted}
<b>Prezzo di Chiusura:</b> ${tradeData.closePrice}

<b>Conto:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase('loss', language)}</i>
        `.trim(),
        "ru-RU": `
🛑 <b>РУЧНАЯ СДЕЛКА ЗАКРЫТА - STOP LOSS</b>

<b>Символ:</b> ${tradeData.symbol}
<b>Тип:</b> ${tradeData.type}
<b>Убыток:</b> -${lossFormatted}
<b>Цена Закрытия:</b> ${tradeData.closePrice}

<b>Счет:</b> ${accountId}
<b>Тикет:</b> ${tradeData.ticket}

<i>${getRandomPhrase('loss', language)}</i>
        `.trim(),
        "ja-JP": `
🛑 <b>手動トレードクローズ - 損切り</b>

<b>シンボル:</b> ${tradeData.symbol}
<b>タイプ:</b> ${tradeData.type}
<b>損失:</b> -${lossFormatted}
<b>終了価格:</b> ${tradeData.closePrice}

<b>アカウント:</b> ${accountId}
<b>チケット:</b> ${tradeData.ticket}

<i>${getRandomPhrase('loss', language)}</i>
        `.trim(),
        "zh-CN": `
🛑 <b>手动交易已关闭 - 止损</b>

<b>品种:</b> ${tradeData.symbol}
<b>类型:</b> ${tradeData.type}
<b>亏损:</b> -${lossFormatted}
<b>收盘价:</b> ${tradeData.closePrice}

<b>账户:</b> ${accountId}
<b>订单号:</b> ${tradeData.ticket}

<i>${getRandomPhrase('loss', language)}</i>
        `.trim(),
        "ko-KR": `
🛑 <b>수동 거래 종료 - 손절매</b>

<b>심볼:</b> ${tradeData.symbol}
<b>유형:</b> ${tradeData.type}
<b>손실:</b> -${lossFormatted}
<b>종가:</b> ${tradeData.closePrice}

<b>계정:</b> ${accountId}
<b>티켓:</b> ${tradeData.ticket}

<i>${getRandomPhrase('loss', language)}</i>
        `.trim(),
        "hi-IN": `
🛑 <b>मैनुअल ट्रेड बंद - नुकसान रोकें</b>

<b>प्रतीक:</b> ${tradeData.symbol}
<b>प्रकार:</b> ${tradeData.type}
<b>हानि:</b> -${lossFormatted}
<b>समापन मूल्य:</b> ${tradeData.closePrice}

<b>खाता:</b> ${accountId}
<b>टिकट:</b> ${tradeData.ticket}

<i>${getRandomPhrase('loss', language)}</i>
        `.trim(),
        "ar-SA": `
🛑 <b>صفقة يدوية مغلقة - وقف الخسارة</b>

<b>الرمز:</b> ${tradeData.symbol}
<b>النوع:</b> ${tradeData.type}
<b>الخسارة:</b> -${lossFormatted}
<b>سعر الإغلاق:</b> ${tradeData.closePrice}

<b>الحساب:</b> ${accountId}
<b>التذكرة:</b> ${tradeData.ticket}

<i>${getRandomPhrase('loss', language)}</i>
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];

      return await this.sendMessageWithHistory(chatId, message, 'trade_closed_sl', `Trade Fechado (SL): ${tradeData.symbol}`, userId);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de stop loss:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de trade fechado (genérica)
   */
  async sendTradeClosed(
    chatId: string,
    accountId: string,
    tradeData: {
      ticket: string;
      symbol: string;
      type: string;
      openPrice: number;
      closePrice: number;
      profit: number;
      profitConverted?: number;
      currency?: string;
      exchangeRate?: number;
    },
    currency: string = "USD",
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const currencySymbol = getCurrencySymbol(currency as SupportedCurrency);
      
      // Formatar profit em USD
      let profitFormatted = tradeData.profit >= 0 
        ? `+$${tradeData.profit.toFixed(2)}` 
        : `-$${Math.abs(tradeData.profit).toFixed(2)}`;
      
      // Adicionar conversão se houver
      if (tradeData.profitConverted !== undefined && tradeData.currency && tradeData.currency !== "USD") {
        const convertedSymbol = getCurrencySymbol(tradeData.currency as SupportedCurrency);
        const convertedFormatted = tradeData.profitConverted >= 0
          ? `+${convertedSymbol}${tradeData.profitConverted.toFixed(2)}`
          : `-${convertedSymbol}${Math.abs(tradeData.profitConverted).toFixed(2)}`;
        profitFormatted = `${profitFormatted} (${convertedFormatted})`;
      }
      
      const emoji = tradeData.profit >= 0 ? "💰" : "🛑";
      const status = tradeData.profit >= 0 ? "LUCRO" : "PREJUÍZO";
      const statusEn = tradeData.profit >= 0 ? "PROFIT" : "LOSS";

      const messages = {
        "pt-BR": `
${emoji} <b>TRADE FECHADO - ${status}</b>

<b>Símbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}
<b>Preço Abertura:</b> ${tradeData.openPrice.toFixed(5)}
<b>Preço Fechamento:</b> ${tradeData.closePrice.toFixed(5)}
<b>Resultado:</b> ${profitFormatted}

<b>Conta:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase(tradeData.profit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "en-US": `
${emoji} <b>TRADE CLOSED - ${statusEn}</b>

<b>Symbol:</b> ${tradeData.symbol}
<b>Type:</b> ${tradeData.type}
<b>Open Price:</b> ${tradeData.openPrice.toFixed(5)}
<b>Close Price:</b> ${tradeData.closePrice.toFixed(5)}
<b>Result:</b> ${profitFormatted}

<b>Account:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase(tradeData.profit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "es-ES": `
${emoji} <b>OPERACIÓN CERRADA - ${tradeData.profit >= 0 ? 'BENEFICIO' : 'PÉRDIDA'}</b>

<b>Símbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}
<b>Precio Apertura:</b> ${tradeData.openPrice.toFixed(5)}
<b>Precio Cierre:</b> ${tradeData.closePrice.toFixed(5)}
<b>Resultado:</b> ${profitFormatted}

<b>Cuenta:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase(tradeData.profit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "fr-FR": `
${emoji} <b>TRADE FERMÉ - ${tradeData.profit >= 0 ? 'PROFIT' : 'PERTE'}</b>

<b>Symbole:</b> ${tradeData.symbol}
<b>Type:</b> ${tradeData.type}
<b>Prix d'Ouverture:</b> ${tradeData.openPrice.toFixed(5)}
<b>Prix de Clôture:</b> ${tradeData.closePrice.toFixed(5)}
<b>Résultat:</b> ${profitFormatted}

<b>Compte:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase(tradeData.profit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "de-DE": `
${emoji} <b>HANDEL GESCHLOSSEN - ${tradeData.profit >= 0 ? 'GEWINN' : 'VERLUST'}</b>

<b>Symbol:</b> ${tradeData.symbol}
<b>Typ:</b> ${tradeData.type}
<b>Eröffnungskurs:</b> ${tradeData.openPrice.toFixed(5)}
<b>Schlusskurs:</b> ${tradeData.closePrice.toFixed(5)}
<b>Ergebnis:</b> ${profitFormatted}

<b>Konto:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase(tradeData.profit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "it-IT": `
${emoji} <b>TRADE CHIUSO - ${tradeData.profit >= 0 ? 'PROFITTO' : 'PERDITA'}</b>

<b>Simbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}
<b>Prezzo Apertura:</b> ${tradeData.openPrice.toFixed(5)}
<b>Prezzo Chiusura:</b> ${tradeData.closePrice.toFixed(5)}
<b>Risultato:</b> ${profitFormatted}

<b>Conto:</b> ${accountId}
<b>Ticket:</b> ${tradeData.ticket}

<i>${getRandomPhrase(tradeData.profit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "ru-RU": `
${emoji} <b>СДЕЛКА ЗАКРЫТА - ${tradeData.profit >= 0 ? 'ПРИБЫЛЬ' : 'УБЫТОК'}</b>

<b>Символ:</b> ${tradeData.symbol}
<b>Тип:</b> ${tradeData.type}
<b>Цена Открытия:</b> ${tradeData.openPrice.toFixed(5)}
<b>Цена Закрытия:</b> ${tradeData.closePrice.toFixed(5)}
<b>Результат:</b> ${profitFormatted}

<b>Счет:</b> ${accountId}
<b>Тикет:</b> ${tradeData.ticket}

<i>${getRandomPhrase(tradeData.profit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "ja-JP": `
${emoji} <b>トレードクローズ - ${tradeData.profit >= 0 ? '利益' : '損失'}</b>

<b>シンボル:</b> ${tradeData.symbol}
<b>タイプ:</b> ${tradeData.type}
<b>開始価格:</b> ${tradeData.openPrice.toFixed(5)}
<b>終了価格:</b> ${tradeData.closePrice.toFixed(5)}
<b>結果:</b> ${profitFormatted}

<b>アカウント:</b> ${accountId}
<b>チケット:</b> ${tradeData.ticket}

<i>${getRandomPhrase(tradeData.profit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "zh-CN": `
${emoji} <b>交易已关闭 - ${tradeData.profit >= 0 ? '盈利' : '亏损'}</b>

<b>品种:</b> ${tradeData.symbol}
<b>类型:</b> ${tradeData.type}
<b>开盘价:</b> ${tradeData.openPrice.toFixed(5)}
<b>收盘价:</b> ${tradeData.closePrice.toFixed(5)}
<b>结果:</b> ${profitFormatted}

<b>账户:</b> ${accountId}
<b>订单号:</b> ${tradeData.ticket}

<i>${getRandomPhrase(tradeData.profit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "ko-KR": `
${emoji} <b>거래 종료 - ${tradeData.profit >= 0 ? '수익' : '손실'}</b>

<b>심볼:</b> ${tradeData.symbol}
<b>유형:</b> ${tradeData.type}
<b>시가:</b> ${tradeData.openPrice.toFixed(5)}
<b>종가:</b> ${tradeData.closePrice.toFixed(5)}
<b>결과:</b> ${profitFormatted}

<b>계정:</b> ${accountId}
<b>티켓:</b> ${tradeData.ticket}

<i>${getRandomPhrase(tradeData.profit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "hi-IN": `
${emoji} <b>ट्रेड बंद - ${tradeData.profit >= 0 ? 'लाभ' : 'हानि'}</b>

<b>प्रतीक:</b> ${tradeData.symbol}
<b>प्रकार:</b> ${tradeData.type}
<b>शुरुआती मूल्य:</b> ${tradeData.openPrice.toFixed(5)}
<b>समापन मूल्य:</b> ${tradeData.closePrice.toFixed(5)}
<b>परिणाम:</b> ${profitFormatted}

<b>खाता:</b> ${accountId}
<b>टिकट:</b> ${tradeData.ticket}

<i>${getRandomPhrase(tradeData.profit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "ar-SA": `
${emoji} <b>صفقة مغلقة - ${tradeData.profit >= 0 ? 'ربح' : 'خسارة'}</b>

<b>الرمز:</b> ${tradeData.symbol}
<b>النوع:</b> ${tradeData.type}
<b>سعر الافتتاح:</b> ${tradeData.openPrice.toFixed(5)}
<b>سعر الإغلاق:</b> ${tradeData.closePrice.toFixed(5)}
<b>النتيجة:</b> ${profitFormatted}

<b>الحساب:</b> ${accountId}
<b>التذكرة:</b> ${tradeData.ticket}

<i>${getRandomPhrase(tradeData.profit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de trade fechado:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de copy trade executado
   */
  async sendCopyTradeExecuted(
    chatId: string,
    accountId: string,
    tradeData: {
      providerName: string;
      symbol: string;
      type: string;
      volume: number;
      accounts?: string[]; // Lista de contas que copiaram (opcional)
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const emoji = tradeData.type === "BUY" ? "📈" : "📉";

      // Se houver múltiplas contas, mostrar lista
      const accountsList = tradeData.accounts && tradeData.accounts.length > 0
        ? tradeData.accounts
        : [accountId];

      const accountsText = accountsList.length > 1
        ? accountsList.map(acc => `  • ${acc}`).join("\n")
        : accountsList[0];

      const messages = {
        "pt-BR": `
🔁 <b>COPY TRADE ABERTO</b>

<b>Provider:</b> ${tradeData.providerName}
<b>Símbolo:</b> ${tradeData.symbol} ${emoji}
<b>Tipo:</b> ${tradeData.type}
<b>Volume:</b> ${tradeData.volume} lotes

<b>${accountsList.length > 1 ? `Contas Vinculadas (${accountsList.length})` : 'Conta'}:</b>
${accountsText}

<i>${getRandomPhrase('copy_open', language)}</i>
        `.trim(),
        "en-US": `
🔁 <b>COPY TRADE OPENED</b>

<b>Provider:</b> ${tradeData.providerName}
<b>Symbol:</b> ${tradeData.symbol} ${emoji}
<b>Type:</b> ${tradeData.type}
<b>Volume:</b> ${tradeData.volume} lots

<b>${accountsList.length > 1 ? `Linked Accounts (${accountsList.length})` : 'Account'}:</b>
${accountsText}

<i>${getRandomPhrase('copy_open', language)}</i>
        `.trim(),
        "es-ES": `
🔁 <b>COPY TRADE ABIERTO</b>

<b>Proveedor:</b> ${tradeData.providerName}
<b>Símbolo:</b> ${tradeData.symbol} ${emoji}
<b>Tipo:</b> ${tradeData.type}
<b>Volumen:</b> ${tradeData.volume} lotes

<b>${accountsList.length > 1 ? `Cuentas Vinculadas (${accountsList.length})` : 'Cuenta'}:</b>
${accountsText}

<i>${getRandomPhrase('copy_open', language)}</i>
        `.trim(),
        "fr-FR": `
🔁 <b>COPY TRADE OUVERT</b>

<b>Fournisseur:</b> ${tradeData.providerName}
<b>Symbole:</b> ${tradeData.symbol} ${emoji}
<b>Type:</b> ${tradeData.type}
<b>Volume:</b> ${tradeData.volume} lots

<b>${accountsList.length > 1 ? `Comptes Liés (${accountsList.length})` : 'Compte'}:</b>
${accountsText}

<i>${getRandomPhrase('copy_open', language)}</i>
        `.trim(),
        "de-DE": `
🔁 <b>COPY TRADE ERÖFFNET</b>

<b>Anbieter:</b> ${tradeData.providerName}
<b>Symbol:</b> ${tradeData.symbol} ${emoji}
<b>Typ:</b> ${tradeData.type}
<b>Volumen:</b> ${tradeData.volume} Lots

<b>${accountsList.length > 1 ? `Verknüpfte Konten (${accountsList.length})` : 'Konto'}:</b>
${accountsText}

<i>${getRandomPhrase('copy_open', language)}</i>
        `.trim(),
        "it-IT": `
🔁 <b>COPY TRADE APERTO</b>

<b>Fornitore:</b> ${tradeData.providerName}
<b>Simbolo:</b> ${tradeData.symbol} ${emoji}
<b>Tipo:</b> ${tradeData.type}
<b>Volume:</b> ${tradeData.volume} lotti

<b>${accountsList.length > 1 ? `Conti Collegati (${accountsList.length})` : 'Conto'}:</b>
${accountsText}

<i>${getRandomPhrase('copy_open', language)}</i>
        `.trim(),
        "ru-RU": `
🔁 <b>КОПИ-СДЕЛКА ОТКРЫТА</b>

<b>Провайдер:</b> ${tradeData.providerName}
<b>Символ:</b> ${tradeData.symbol} ${emoji}
<b>Тип:</b> ${tradeData.type}
<b>Объем:</b> ${tradeData.volume} лотов

<b>${accountsList.length > 1 ? `Связанные Счета (${accountsList.length})` : 'Счет'}:</b>
${accountsText}

<i>${getRandomPhrase('copy_open', language)}</i>
        `.trim(),
        "ja-JP": `
🔁 <b>コピートレード開始</b>

<b>プロバイダー:</b> ${tradeData.providerName}
<b>シンボル:</b> ${tradeData.symbol} ${emoji}
<b>タイプ:</b> ${tradeData.type}
<b>ボリューム:</b> ${tradeData.volume} ロット

<b>${accountsList.length > 1 ? `リンクされたアカウント (${accountsList.length})` : 'アカウント'}:</b>
${accountsText}

<i>${getRandomPhrase('copy_open', language)}</i>
        `.trim(),
        "zh-CN": `
🔁 <b>复制交易已开始</b>

<b>提供者:</b> ${tradeData.providerName}
<b>品种:</b> ${tradeData.symbol} ${emoji}
<b>类型:</b> ${tradeData.type}
<b>交易量:</b> ${tradeData.volume} 手

<b>${accountsList.length > 1 ? `关联账户 (${accountsList.length})` : '账户'}:</b>
${accountsText}

<i>${getRandomPhrase('copy_open', language)}</i>
        `.trim(),
        "ko-KR": `
🔁 <b>복사 거래 시작</b>

<b>공급자:</b> ${tradeData.providerName}
<b>심볼:</b> ${tradeData.symbol} ${emoji}
<b>유형:</b> ${tradeData.type}
<b>거래량:</b> ${tradeData.volume} 롯

<b>${accountsList.length > 1 ? `연결된 계정 (${accountsList.length})` : '계정'}:</b>
${accountsText}

<i>${getRandomPhrase('copy_open', language)}</i>
        `.trim(),
        "hi-IN": `
🔁 <b>कॉपी ट्रेड शुरू</b>

<b>प्रदाता:</b> ${tradeData.providerName}
<b>प्रतीक:</b> ${tradeData.symbol} ${emoji}
<b>प्रकार:</b> ${tradeData.type}
<b>मात्रा:</b> ${tradeData.volume} लॉट

<b>${accountsList.length > 1 ? `जुड़े खाते (${accountsList.length})` : 'खाता'}:</b>
${accountsText}

<i>${getRandomPhrase('copy_open', language)}</i>
        `.trim(),
        "ar-SA": `
🔁 <b>صفقة نسخ مفتوحة</b>

<b>المزود:</b> ${tradeData.providerName}
<b>الرمز:</b> ${tradeData.symbol} ${emoji}
<b>النوع:</b> ${tradeData.type}
<b>الحجم:</b> ${tradeData.volume} عقود

<b>${accountsList.length > 1 ? `الحسابات المرتبطة (${accountsList.length})` : 'الحساب'}:</b>
${accountsText}

<i>${getRandomPhrase('copy_open', language)}</i>
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];

      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de copy trade:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de copy trade fechado
   */
  async sendCopyTradeClosed(
    chatId: string,
    accountId: string,
    tradeData: {
      providerName: string;
      symbol: string;
      type: string;
      profit: number;
      accountsProfits?: Array<{ account: string; profit: number; profitConverted?: number }>; // Lucro por conta (opcional)
      currency?: string;
      exchangeRate?: number;
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      // Se houver múltiplas contas com lucros, mostrar detalhamento
      const hasMultipleAccounts = tradeData.accountsProfits && tradeData.accountsProfits.length > 0;
      
      let accountsText = "";
      let totalProfit = tradeData.profit;
      
      const currency = tradeData.currency || "USD";
      const currencySymbol = getCurrencySymbol(currency as SupportedCurrency);
      const hasConversion = tradeData.currency && tradeData.currency !== "USD" && tradeData.exchangeRate;

      if (hasMultipleAccounts) {
        totalProfit = tradeData.accountsProfits!.reduce((sum, ap) => sum + ap.profit, 0);
        accountsText = tradeData.accountsProfits!.map(ap => {
          const profitFormatted = ap.profit >= 0 
            ? `+$${ap.profit.toFixed(2)}` 
            : `-$${Math.abs(ap.profit).toFixed(2)}`;
          
          let profitLine = profitFormatted;
          if (hasConversion && ap.profitConverted !== undefined) {
            const convertedFormatted = ap.profitConverted >= 0
              ? `+${currencySymbol}${ap.profitConverted.toFixed(2)}`
              : `-${currencySymbol}${Math.abs(ap.profitConverted).toFixed(2)}`;
            profitLine = `${profitFormatted} (${convertedFormatted})`;
          }
          
          const profitEmoji = ap.profit >= 0 ? "🟢" : "🔴";
          return `  ${profitEmoji} ${ap.account}: ${profitLine}`;
        }).join("\n");
      } else {
        const profitFormatted = tradeData.profit >= 0 
          ? `+$${tradeData.profit.toFixed(2)}` 
          : `-$${Math.abs(tradeData.profit).toFixed(2)}`;
        accountsText = `${accountId}: ${profitFormatted}`;
      }

      const totalProfitFormatted = totalProfit >= 0 
        ? `+$${totalProfit.toFixed(2)}` 
        : `-$${Math.abs(totalProfit).toFixed(2)}`;
      
      let totalLine = totalProfitFormatted;
      if (hasConversion && tradeData.exchangeRate) {
        const totalConverted = totalProfit * tradeData.exchangeRate;
        // Usar sinal do profit original, não do convertido
        const totalConvertedFormatted = totalProfit >= 0
          ? `+${currencySymbol}${totalConverted.toFixed(2)}`
          : `-${currencySymbol}${Math.abs(totalConverted).toFixed(2)}`;
        totalLine = `${totalProfitFormatted} (${totalConvertedFormatted})`;
      }
      
      const emoji = totalProfit >= 0 ? "💰" : "📉";

      const messages = {
        "pt-BR": `
${emoji} <b>COPY TRADE FECHADO</b>

<b>Provider:</b> ${tradeData.providerName}
<b>Símbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}

<b>${hasMultipleAccounts ? `Resultado por Conta (${tradeData.accountsProfits!.length})` : 'Resultado'}:</b>
${accountsText}

<b>Total:</b> ${totalLine}

<i>${getRandomPhrase(totalProfit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "en-US": `
${emoji} <b>COPY TRADE CLOSED</b>

<b>Provider:</b> ${tradeData.providerName}
<b>Symbol:</b> ${tradeData.symbol}
<b>Type:</b> ${tradeData.type}

<b>${hasMultipleAccounts ? `Result per Account (${tradeData.accountsProfits!.length})` : 'Result'}:</b>
${accountsText}

<b>Total:</b> ${totalLine}

<i>${getRandomPhrase(totalProfit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "es-ES": `
${emoji} <b>COPY TRADE CERRADO</b>

<b>Proveedor:</b> ${tradeData.providerName}
<b>Símbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}

<b>${hasMultipleAccounts ? `Resultado por Cuenta (${tradeData.accountsProfits!.length})` : 'Resultado'}:</b>
${accountsText}

<b>Total:</b> ${totalLine}

<i>${getRandomPhrase(totalProfit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "fr-FR": `
${emoji} <b>COPY TRADE FERMÉ</b>

<b>Fournisseur:</b> ${tradeData.providerName}
<b>Symbole:</b> ${tradeData.symbol}
<b>Type:</b> ${tradeData.type}

<b>${hasMultipleAccounts ? `Résultat par Compte (${tradeData.accountsProfits!.length})` : 'Résultat'}:</b>
${accountsText}

<b>Total:</b> ${totalLine}

<i>${getRandomPhrase(totalProfit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "de-DE": `
${emoji} <b>COPY TRADE GESCHLOSSEN</b>

<b>Anbieter:</b> ${tradeData.providerName}
<b>Symbol:</b> ${tradeData.symbol}
<b>Typ:</b> ${tradeData.type}

<b>${hasMultipleAccounts ? `Ergebnis pro Konto (${tradeData.accountsProfits!.length})` : 'Ergebnis'}:</b>
${accountsText}

<b>Gesamt:</b> ${totalLine}

<i>${getRandomPhrase(totalProfit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "it-IT": `
${emoji} <b>COPY TRADE CHIUSO</b>

<b>Fornitore:</b> ${tradeData.providerName}
<b>Simbolo:</b> ${tradeData.symbol}
<b>Tipo:</b> ${tradeData.type}

<b>${hasMultipleAccounts ? `Risultato per Conto (${tradeData.accountsProfits!.length})` : 'Risultato'}:</b>
${accountsText}

<b>Totale:</b> ${totalLine}

<i>${getRandomPhrase(totalProfit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "ru-RU": `
${emoji} <b>КОПИ-СДЕЛКА ЗАКРЫТА</b>

<b>Провайдер:</b> ${tradeData.providerName}
<b>Символ:</b> ${tradeData.symbol}
<b>Тип:</b> ${tradeData.type}

<b>${hasMultipleAccounts ? `Результат по Счету (${tradeData.accountsProfits!.length})` : 'Результат'}:</b>
${accountsText}

<b>Итого:</b> ${totalLine}

<i>${getRandomPhrase(totalProfit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "ja-JP": `
${emoji} <b>コピートレードクローズ</b>

<b>プロバイダー:</b> ${tradeData.providerName}
<b>シンボル:</b> ${tradeData.symbol}
<b>タイプ:</b> ${tradeData.type}

<b>${hasMultipleAccounts ? `アカウント別結果 (${tradeData.accountsProfits!.length})` : '結果'}:</b>
${accountsText}

<b>合計:</b> ${totalLine}

<i>${getRandomPhrase(totalProfit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "zh-CN": `
${emoji} <b>复制交易已关闭</b>

<b>提供者:</b> ${tradeData.providerName}
<b>品种:</b> ${tradeData.symbol}
<b>类型:</b> ${tradeData.type}

<b>${hasMultipleAccounts ? `每个账户结果 (${tradeData.accountsProfits!.length})` : '结果'}:</b>
${accountsText}

<b>总计:</b> ${totalLine}

<i>${getRandomPhrase(totalProfit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "ko-KR": `
${emoji} <b>복사 거래 종료</b>

<b>공급자:</b> ${tradeData.providerName}
<b>심볼:</b> ${tradeData.symbol}
<b>유형:</b> ${tradeData.type}

<b>${hasMultipleAccounts ? `계정별 결과 (${tradeData.accountsProfits!.length})` : '결과'}:</b>
${accountsText}

<b>총계:</b> ${totalLine}

<i>${getRandomPhrase(totalProfit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "hi-IN": `
${emoji} <b>कॉपी ट्रेड बंद</b>

<b>प्रदाता:</b> ${tradeData.providerName}
<b>प्रतीक:</b> ${tradeData.symbol}
<b>प्रकार:</b> ${tradeData.type}

<b>${hasMultipleAccounts ? `खाते के अनुसार परिणाम (${tradeData.accountsProfits!.length})` : 'परिणाम'}:</b>
${accountsText}

<b>कुल:</b> ${totalLine}

<i>${getRandomPhrase(totalProfit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim(),
        "ar-SA": `
${emoji} <b>صفقة نسخ مغلقة</b>

<b>المزود:</b> ${tradeData.providerName}
<b>الرمز:</b> ${tradeData.symbol}
<b>النوع:</b> ${tradeData.type}

<b>${hasMultipleAccounts ? `النتيجة لكل حساب (${tradeData.accountsProfits!.length})` : 'النتيجة'}:</b>
${accountsText}

<b>الإجمالي:</b> ${totalLine}

<i>${getRandomPhrase(totalProfit >= 0 ? 'profit' : 'loss', language)}</i>
        `.trim()
      };
      
      const message = messages[language as keyof typeof messages] || messages["pt-BR"];

      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de copy trade fechado:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de teste
   */
  async sendTestNotification(chatId: string | number, language: string = "pt-BR"): Promise<boolean> {
    try {
      const messages = {
        "pt-BR": `🔔 <b>Notificação de Teste</b>\n\nParabéns! Seu Telegram está configurado corretamente.\n\nVocê receberá notificações sobre:\n• Trades abertos e fechados\n• Take Profit e Stop Loss\n• Copy Trades\n• Relatórios diários e semanais\n\n<i>Bons trades!</i> 💪`,
        "en-US": `🔔 <b>Test Notification</b>\n\nCongratulations! Your Telegram is configured correctly.\n\nYou will receive notifications about:\n• Opened and closed trades\n• Take Profit and Stop Loss\n• Copy Trades\n• Daily and weekly reports\n\n<i>Happy trading!</i> 💪`,
        "es-ES": `🔔 <b>Notificación de Prueba</b>\n\n¡Felicidades! Tu Telegram está configurado correctamente.\n\nRecibirás notificaciones sobre:\n• Operaciones abiertas y cerradas\n• Take Profit y Stop Loss\n• Copy Trades\n• Informes diarios y semanales\n\n<i>¡Feliz trading!</i> 💪`,
        "fr-FR": `🔔 <b>Notification de Test</b>\n\nFélicitations! Votre Telegram est correctement configuré.\n\nVous recevrez des notifications sur:\n• Trades ouverts et fermés\n• Take Profit et Stop Loss\n• Copy Trades\n• Rapports quotidiens et hebdomadaires\n\n<i>Bon trading!</i> 💪`,
        "de-DE": `🔔 <b>Test-Benachrichtigung</b>\n\nGlückwunsch! Ihr Telegram ist korrekt konfiguriert.\n\nSie erhalten Benachrichtigungen über:\n• Eröffnete und geschlossene Trades\n• Take Profit und Stop Loss\n• Copy Trades\n• Tägliche und wöchentliche Berichte\n\n<i>Viel Erfolg beim Trading!</i> 💪`,
        "it-IT": `🔔 <b>Notifica di Test</b>\n\nCongratulazioni! Il tuo Telegram è configurato correttamente.\n\nRiceverai notifiche su:\n• Operazioni aperte e chiuse\n• Take Profit e Stop Loss\n• Copy Trades\n• Rapporti giornalieri e settimanali\n\n<i>Buon trading!</i> 💪`,
        "ru-RU": `🔔 <b>Тестовое уведомление</b>\n\nПоздравляем! Ваш Telegram настроен правильно.\n\nВы будете получать уведомления о:\n• Открытых и закрытых сделках\n• Take Profit и Stop Loss\n• Копи-сделках\n• Ежедневных и еженедельных отчетах\n\n<i>Удачной торговли!</i> 💪`,
        "ja-JP": `🔔 <b>テスト通知</b>\n\nおめでとうございます！Telegramが正しく設定されました。\n\n次の通知を受け取ります：\n• 開始および終了した取引\n• テイクプロフィットとストップロス\n• コピートレード\n• 日次および週次レポート\n\n<i>良い取引を！</i> 💪`,
        "zh-CN": `🔔 <b>测试通知</b>\n\n恭喜！您的Telegram已正确配置。\n\n您将收到以下通知：\n• 开仓和平仓交易\n• 止盈和止损\n• 跟单交易\n• 日报和周报\n\n<i>祈祝交易顺利！</i> 💪`,
        "ko-KR": `🔔 <b>테스트 알림</b>\n\n축하합니다! Telegram이 올바르게 구성되었습니다.\n\n다음에 대한 알림을 받게 됩니다:\n• 개시 및 마감된 거래\n• 이익 실현 및 손절매\n• 복사 거래\n• 일일 및 주간 보고서\n\n<i>좋은 거래 되세요!</i> 💪`,
        "hi-IN": `🔔 <b>परीक्षण सूचना</b>\n\nबधाई हो! आपका Telegram सही ढंग से कॉन्फ़िगर किया गया है।\n\nआपको इनके बारे में सूचनाएं मिलेंगी:\n• खोले और बंद ट्रेड\n• टेक प्रॉफ़िट और स्टॉप लॉस\n• कॉपी ट्रेड\n• दैनिक और साप्ताहिक रिपोर्ट\n\n<i>शुभ ट्रेडिंग!</i> 💪`,
        "ar-SA": `🔔 <b>إشعار اختبار</b>\n\nتهانينا! تم تكوين Telegram بشكل صحيح.\n\nستتلقى إشعارات حول:\n• الصفقات المفتوحة والمغلقة\n• جني الأرباح ووقف الخسارة\n• نسخ الصفقات\n• التقارير اليومية والأسبوعية\n\n<i>!تداول سعيد</i> 💪`
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessageWithHistory(chatId, message, 'test', 'Notificação de Teste');
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de teste:`, error);
      return false;
    }
  }

  /**
   * Envia relatório diário
   */
  async sendDailyReport(
    chatId: string | number,
    stats: {
      totalTrades: number;
      winningTrades: number;
      losingTrades: number;
      totalProfit: number;
      winRate: number;
    },
    currency: string = "USD",
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      // Valor em USD
      const profitUSD = stats.totalProfit;
      const profitUSDFormatted = profitUSD >= 0 
        ? `+$${profitUSD.toFixed(2)}`
        : `-$${Math.abs(profitUSD).toFixed(2)}`;
      
      // Valor convertido (se não for USD)
      let profitConverted = "";
      if (currency !== "USD") {
        try {
          const { convertCurrency, getCurrencySymbol } = await import("../services/currency-converter");
          const converted = await convertCurrency(Math.abs(profitUSD), "USD", currency as any);
          const symbol = getCurrencySymbol(currency as any);
          profitConverted = ` (${symbol}${converted.toFixed(2)} ${currency})`;
        } catch (error) {
          console.error("[Telegram] Erro ao converter moeda:", error);
        }
      }
      
      const profitFormatted = profitUSDFormatted + profitConverted;
      
      const emoji = stats.totalProfit >= 0 ? "📈" : "📉";
      const winRateFormatted = stats.winRate.toFixed(1);

      const messages = {
        "pt-BR": `${emoji} <b>Relatório Diário</b>\n\n<b>Total de Trades:</b> ${stats.totalTrades}\n<b>Trades Ganhos:</b> ${stats.winningTrades} ✅\n<b>Trades Perdidos:</b> ${stats.losingTrades} ❌\n<b>Win Rate:</b> ${winRateFormatted}%\n\n<b>Resultado:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Ótimo dia!</i> 🎉" : "<i>Amanhã será melhor!</i> 💪"}`,
        "en-US": `${emoji} <b>Daily Report</b>\n\n<b>Total Trades:</b> ${stats.totalTrades}\n<b>Winning Trades:</b> ${stats.winningTrades} ✅\n<b>Losing Trades:</b> ${stats.losingTrades} ❌\n<b>Win Rate:</b> ${winRateFormatted}%\n\n<b>Result:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Excellent day!</i> 🎉" : "<i>Tomorrow will be better!</i> 💪"}`,
        "es-ES": `${emoji} <b>Informe Diario</b>\n\n<b>Total de Operaciones:</b> ${stats.totalTrades}\n<b>Operaciones Ganadoras:</b> ${stats.winningTrades} ✅\n<b>Operaciones Perdedoras:</b> ${stats.losingTrades} ❌\n<b>Tasa de Éxito:</b> ${winRateFormatted}%\n\n<b>Resultado:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>¡Excelente día!</i> 🎉" : "<i>¡Mañana será mejor!</i> 💪"}`,
        "fr-FR": `${emoji} <b>Rapport Quotidien</b>\n\n<b>Total des Trades:</b> ${stats.totalTrades}\n<b>Trades Gagnants:</b> ${stats.winningTrades} ✅\n<b>Trades Perdants:</b> ${stats.losingTrades} ❌\n<b>Taux de Réussite:</b> ${winRateFormatted}%\n\n<b>Résultat:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Excellente journée!</i> 🎉" : "<i>Demain sera meilleur!</i> 💪"}`,
        "de-DE": `${emoji} <b>Täglicher Bericht</b>\n\n<b>Gesamte Trades:</b> ${stats.totalTrades}\n<b>Gewinnende Trades:</b> ${stats.winningTrades} ✅\n<b>Verlierende Trades:</b> ${stats.losingTrades} ❌\n<b>Gewinnrate:</b> ${winRateFormatted}%\n\n<b>Ergebnis:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Ausgezeichneter Tag!</i> 🎉" : "<i>Morgen wird besser!</i> 💪"}`,
        "it-IT": `${emoji} <b>Rapporto Giornaliero</b>\n\n<b>Totale Operazioni:</b> ${stats.totalTrades}\n<b>Operazioni Vincenti:</b> ${stats.winningTrades} ✅\n<b>Operazioni Perdenti:</b> ${stats.losingTrades} ❌\n<b>Tasso di Successo:</b> ${winRateFormatted}%\n\n<b>Risultato:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Giornata eccellente!</i> 🎉" : "<i>Domani andrà meglio!</i> 💪"}`,
        "ru-RU": `${emoji} <b>Ежедневный отчет</b>\n\n<b>Всего сделок:</b> ${stats.totalTrades}\n<b>Прибыльных сделок:</b> ${stats.winningTrades} ✅\n<b>Убыточных сделок:</b> ${stats.losingTrades} ❌\n<b>Процент побед:</b> ${winRateFormatted}%\n\n<b>Результат:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Отличный день!</i> 🎉" : "<i>Завтра будет лучше!</i> 💪"}`,
        "ja-JP": `${emoji} <b>日次レポート</b>\n\n<b>総取引数:</b> ${stats.totalTrades}\n<b>勝ち取引:</b> ${stats.winningTrades} ✅\n<b>負け取引:</b> ${stats.losingTrades} ❌\n<b>勝率:</b> ${winRateFormatted}%\n\n<b>結果:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>素晴らしい一日！</i> 🎉" : "<i>明日はもっと良くなる！</i> 💪"}`,
        "zh-CN": `${emoji} <b>日报</b>\n\n<b>总交易数:</b> ${stats.totalTrades}\n<b>盈利交易:</b> ${stats.winningTrades} ✅\n<b>亏损交易:</b> ${stats.losingTrades} ❌\n<b>胜率:</b> ${winRateFormatted}%\n\n<b>结果:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>今天表现出色！</i> 🎉" : "<i>明天会更好！</i> 💪"}`,
        "ko-KR": `${emoji} <b>일일 보고서</b>\n\n<b>총 거래:</b> ${stats.totalTrades}\n<b>수익 거래:</b> ${stats.winningTrades} ✅\n<b>손실 거래:</b> ${stats.losingTrades} ❌\n<b>승률:</b> ${winRateFormatted}%\n\n<b>결과:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>훈륙한 하루!</i> 🎉" : "<i>내일은 더 나아질 겁니다!</i> 💪"}`,
        "hi-IN": `${emoji} <b>दैनिक रिपोर्ट</b>\n\n<b>कुल ट्रेड:</b> ${stats.totalTrades}\n<b>जीते ट्रेड:</b> ${stats.winningTrades} ✅\n<b>हारे ट्रेड:</b> ${stats.losingTrades} ❌\n<b>जीत दर:</b> ${winRateFormatted}%\n\n<b>परिणाम:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>शानदार दिन!</i> 🎉" : "<i>कल बेहतर होगा!</i> 💪"}`,
        "ar-SA": `${emoji} <b>التقرير اليومي</b>\n\n<b>إجمالي الصفقات:</b> ${stats.totalTrades}\n<b>الصفقات الرابحة:</b> ${stats.winningTrades} ✅\n<b>الصفقات الخاسرة:</b> ${stats.losingTrades} ❌\n<b>معدل الفوز:</b> ${winRateFormatted}%\n\n<b>النتيجة:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>!يوم ممتاز</i> 🎉" : "<i>!غدا سيكون أفضل</i> 💪"}`
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessageWithHistory(chatId, message, 'daily_report', 'Relatório Diário');
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar relatório diário:`, error);
      return false;
    }
  }

  /**
   * Envia relatório semanal
   */
  async sendWeeklyReport(
    chatId: string | number,
    stats: {
      totalTrades: number;
      winningTrades: number;
      losingTrades: number;
      totalProfit: number;
      winRate: number;
    },
    currency: string = "USD",
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      // Valor em USD
      const profitUSD = stats.totalProfit;
      const profitUSDFormatted = profitUSD >= 0 
        ? `+$${profitUSD.toFixed(2)}`
        : `-$${Math.abs(profitUSD).toFixed(2)}`;
      
      // Valor convertido (se não for USD)
      let profitConverted = "";
      if (currency !== "USD") {
        try {
          const { convertCurrency, getCurrencySymbol } = await import("../services/currency-converter");
          const converted = await convertCurrency(Math.abs(profitUSD), "USD", currency as any);
          const symbol = getCurrencySymbol(currency as any);
          profitConverted = ` (${symbol}${converted.toFixed(2)} ${currency})`;
        } catch (error) {
          console.error("[Telegram] Erro ao converter moeda:", error);
        }
      }
      
      const profitFormatted = profitUSDFormatted + profitConverted;
      
      const emoji = stats.totalProfit >= 0 ? "🎉" : "📊";
      const winRateFormatted = stats.winRate.toFixed(1);

      const messages = {
        "pt-BR": `${emoji} <b>Relatório Semanal</b>\n\n<b>Total de Trades:</b> ${stats.totalTrades}\n<b>Trades Ganhos:</b> ${stats.winningTrades} ✅\n<b>Trades Perdidos:</b> ${stats.losingTrades} ❌\n<b>Win Rate:</b> ${winRateFormatted}%\n\n<b>Resultado:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Semana incrível!</i> 🚀" : "<i>Próxima semana será melhor!</i> 💪"}`,
        "en-US": `${emoji} <b>Weekly Report</b>\n\n<b>Total Trades:</b> ${stats.totalTrades}\n<b>Winning Trades:</b> ${stats.winningTrades} ✅\n<b>Losing Trades:</b> ${stats.losingTrades} ❌\n<b>Win Rate:</b> ${winRateFormatted}%\n\n<b>Result:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Amazing week!</i> 🚀" : "<i>Next week will be better!</i> 💪"}`,
        "es-ES": `${emoji} <b>Informe Semanal</b>\n\n<b>Total de Operaciones:</b> ${stats.totalTrades}\n<b>Operaciones Ganadoras:</b> ${stats.winningTrades} ✅\n<b>Operaciones Perdedoras:</b> ${stats.losingTrades} ❌\n<b>Tasa de Éxito:</b> ${winRateFormatted}%\n\n<b>Resultado:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>¡Semana increíble!</i> 🚀" : "<i>¡La próxima semana será mejor!</i> 💪"}`,
        "fr-FR": `${emoji} <b>Rapport Hebdomadaire</b>\n\n<b>Total des Trades:</b> ${stats.totalTrades}\n<b>Trades Gagnants:</b> ${stats.winningTrades} ✅\n<b>Trades Perdants:</b> ${stats.losingTrades} ❌\n<b>Taux de Réussite:</b> ${winRateFormatted}%\n\n<b>Résultat:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Semaine incroyable!</i> 🚀" : "<i>La semaine prochaine sera meilleure!</i> 💪"}`,
        "de-DE": `${emoji} <b>Wöchentlicher Bericht</b>\n\n<b>Gesamte Trades:</b> ${stats.totalTrades}\n<b>Gewinnende Trades:</b> ${stats.winningTrades} ✅\n<b>Verlierende Trades:</b> ${stats.losingTrades} ❌\n<b>Gewinnrate:</b> ${winRateFormatted}%\n\n<b>Ergebnis:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Erstaunliche Woche!</i> 🚀" : "<i>Nächste Woche wird besser!</i> 💪"}`,
        "it-IT": `${emoji} <b>Rapporto Settimanale</b>\n\n<b>Totale Operazioni:</b> ${stats.totalTrades}\n<b>Operazioni Vincenti:</b> ${stats.winningTrades} ✅\n<b>Operazioni Perdenti:</b> ${stats.losingTrades} ❌\n<b>Tasso di Successo:</b> ${winRateFormatted}%\n\n<b>Risultato:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Settimana fantastica!</i> 🚀" : "<i>La prossima settimana andrà meglio!</i> 💪"}`,
        "ru-RU": `${emoji} <b>Еженедельный отчет</b>\n\n<b>Всего сделок:</b> ${stats.totalTrades}\n<b>Прибыльных сделок:</b> ${stats.winningTrades} ✅\n<b>Убыточных сделок:</b> ${stats.losingTrades} ❌\n<b>Процент побед:</b> ${winRateFormatted}%\n\n<b>Результат:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Удивительная неделя!</i> 🚀" : "<i>Следующая неделя будет лучше!</i> 💪"}`,
        "ja-JP": `${emoji} <b>週次レポート</b>\n\n<b>総取引数:</b> ${stats.totalTrades}\n<b>勝ち取引:</b> ${stats.winningTrades} ✅\n<b>負け取引:</b> ${stats.losingTrades} ❌\n<b>勝率:</b> ${winRateFormatted}%\n\n<b>結果:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>素晴らしい一週間！</i> 🚀" : "<i>来週はもっと良くなる！</i> 💪"}`,
        "zh-CN": `${emoji} <b>周报</b>\n\n<b>总交易数:</b> ${stats.totalTrades}\n<b>盈利交易:</b> ${stats.winningTrades} ✅\n<b>亏损交易:</b> ${stats.losingTrades} ❌\n<b>胜率:</b> ${winRateFormatted}%\n\n<b>结果:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>本周表现出色！</i> 🚀" : "<i>下周会更好！</i> 💪"}`,
        "ko-KR": `${emoji} <b>주간 보고서</b>\n\n<b>총 거래:</b> ${stats.totalTrades}\n<b>수익 거래:</b> ${stats.winningTrades} ✅\n<b>손실 거래:</b> ${stats.losingTrades} ❌\n<b>승률:</b> ${winRateFormatted}%\n\n<b>결과:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>놀라운 한 주!</i> 🚀" : "<i>다음 주는 더 나아질 겁니다!</i> 💪"}`,
        "hi-IN": `${emoji} <b>साप्ताहिक रिपोर्ट</b>\n\n<b>कुल ट्रेड:</b> ${stats.totalTrades}\n<b>जीते ट्रेड:</b> ${stats.winningTrades} ✅\n<b>हारे ट्रेड:</b> ${stats.losingTrades} ❌\n<b>जीत दर:</b> ${winRateFormatted}%\n\n<b>परिणाम:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>शानदार सप्ताह!</i> 🚀" : "<i>अगला सप्ताह बेहतर होगा!</i> 💪"}`,
        "ar-SA": `${emoji} <b>التقرير الأسبوعي</b>\n\n<b>إجمالي الصفقات:</b> ${stats.totalTrades}\n<b>الصفقات الرابحة:</b> ${stats.winningTrades} ✅\n<b>الصفقات الخاسرة:</b> ${stats.losingTrades} ❌\n<b>معدل الفوز:</b> ${winRateFormatted}%\n\n<b>النتيجة:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>!أسبوع رائع</i> 🚀" : "<i>!الأسبوع القادم سيكون أفضل</i> 💪"}`
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar relatório semanal:`, error);
      return false;
    }
  }

  /**
   * Envia relatório personalizado
   */
  async sendCustomReport(
    chatId: string | number,
    data: {
      period: string;
      totalStats: {
        totalTrades: number;
        winningTrades: number;
        losingTrades: number;
        winRate: number;
        totalProfit: number;
        bestTrade: number;
        worstTrade: number;
        averageProfit: number;
      };
      accountsStats: Array<{
        accountNumber: string;
        broker: string;
        totalTrades: number;
        winningTrades: number;
        losingTrades: number;
        winRate: number;
        totalProfit: number;
        bestTrade: number;
        worstTrade: number;
        averageProfit: number;
      }>;
    },
    currency: string = "USD",
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const currencySymbol = currency === "BRL" ? "R$" : "$";
      
      // Formatar lucro total
      const totalProfitFormatted = data.totalStats.totalProfit >= 0 
        ? `+${currencySymbol}${data.totalStats.totalProfit.toFixed(2)}`
        : `-${currencySymbol}${Math.abs(data.totalStats.totalProfit).toFixed(2)}`;
      
      const emoji = data.totalStats.totalProfit >= 0 ? "📈" : "📉";
      const winRateFormatted = data.totalStats.winRate.toFixed(1);

      // Mensagem principal
      const headerTexts: Record<string, string> = {
        "pt-BR": `${emoji} <b>Relatório Personalizado - ${data.period}</b>\n\n`,
        "en-US": `${emoji} <b>Custom Report - ${data.period}</b>\n\n`,
        "es-ES": `${emoji} <b>Informe Personalizado - ${data.period}</b>\n\n`,
        "fr-FR": `${emoji} <b>Rapport Personnalisé - ${data.period}</b>\n\n`,
        "de-DE": `${emoji} <b>Benutzerdefinierter Bericht - ${data.period}</b>\n\n`,
        "it-IT": `${emoji} <b>Rapporto Personalizzato - ${data.period}</b>\n\n`,
        "ru-RU": `${emoji} <b>Настраиваемый отчет - ${data.period}</b>\n\n`,
        "ja-JP": `${emoji} <b>カスタムレポート - ${data.period}</b>\n\n`,
        "zh-CN": `${emoji} <b>自定义报告 - ${data.period}</b>\n\n`,
        "ko-KR": `${emoji} <b>맞춤 보고서 - ${data.period}</b>\n\n`,
        "hi-IN": `${emoji} <b>कस्टम रिपोर्ट - ${data.period}</b>\n\n`,
        "ar-SA": `${emoji} <b>${data.period} - تقرير مخصص</b>\n\n`
      };
      let message = headerTexts[language] || headerTexts["pt-BR"];

      // Estatísticas totais
      const labels: Record<string, any> = {
        "pt-BR": { summary: "RESUMO GERAL", totalTrades: "Total de Trades", winning: "Trades Ganhos", losing: "Trades Perdidos", result: "Resultado", best: "Melhor Trade", worst: "Pior Trade", avg: "Média por Trade", byAccount: "POR CONTA", trades: "Trades", excellent: "Excelente desempenho!", keepImproving: "Continue melhorando!" },
        "en-US": { summary: "OVERALL SUMMARY", totalTrades: "Total Trades", winning: "Winning Trades", losing: "Losing Trades", result: "Result", best: "Best Trade", worst: "Worst Trade", avg: "Average per Trade", byAccount: "BY ACCOUNT", trades: "Trades", excellent: "Excellent performance!", keepImproving: "Keep improving!" },
        "es-ES": { summary: "RESUMEN GENERAL", totalTrades: "Total de Operaciones", winning: "Operaciones Ganadoras", losing: "Operaciones Perdedoras", result: "Resultado", best: "Mejor Operación", worst: "Peor Operación", avg: "Promedio por Operación", byAccount: "POR CUENTA", trades: "Operaciones", excellent: "¡Excelente rendimiento!", keepImproving: "¡Sigue mejorando!" },
        "fr-FR": { summary: "RÉSUMÉ GÉNÉRAL", totalTrades: "Total des Trades", winning: "Trades Gagnants", losing: "Trades Perdants", result: "Résultat", best: "Meilleur Trade", worst: "Pire Trade", avg: "Moyenne par Trade", byAccount: "PAR COMPTE", trades: "Trades", excellent: "Excellente performance!", keepImproving: "Continuez à vous améliorer!" },
        "de-DE": { summary: "GESAMTZUSAMMENFASSUNG", totalTrades: "Gesamte Trades", winning: "Gewinnende Trades", losing: "Verlierende Trades", result: "Ergebnis", best: "Bester Trade", worst: "Schlechtester Trade", avg: "Durchschnitt pro Trade", byAccount: "NACH KONTO", trades: "Trades", excellent: "Ausgezeichnete Leistung!", keepImproving: "Weiter verbessern!" },
        "it-IT": { summary: "RIEPILOGO GENERALE", totalTrades: "Totale Operazioni", winning: "Operazioni Vincenti", losing: "Operazioni Perdenti", result: "Risultato", best: "Migliore Operazione", worst: "Peggiore Operazione", avg: "Media per Operazione", byAccount: "PER CONTO", trades: "Operazioni", excellent: "Prestazione eccellente!", keepImproving: "Continua a migliorare!" },
        "ru-RU": { summary: "ОБЩИЙ ОТЧЕТ", totalTrades: "Всего сделок", winning: "Прибыльных сделок", losing: "Убыточных сделок", result: "Результат", best: "Лучшая сделка", worst: "Худшая сделка", avg: "Среднее на сделку", byAccount: "ПО СЧЕТУ", trades: "Сделки", excellent: "Отличные результаты!", keepImproving: "Продолжайте улучшать!" },
        "ja-JP": { summary: "総合概要", totalTrades: "総取引数", winning: "勝ち取引", losing: "負け取引", result: "結果", best: "最高取引", worst: "最低取引", avg: "平均取引", byAccount: "アカウント別", trades: "取引", excellent: "素晴らしいパフォーマンス！", keepImproving: "引き続き改善してください！" },
        "zh-CN": { summary: "总体概述", totalTrades: "总交易数", winning: "盈利交易", losing: "亏损交易", result: "结果", best: "最佳交易", worst: "最差交易", avg: "平均交易", byAccount: "按账户", trades: "交易", excellent: "表现出色！", keepImproving: "继续改进！" },
        "ko-KR": { summary: "전체 요약", totalTrades: "총 거래", winning: "수익 거래", losing: "손실 거래", result: "결과", best: "최고 거래", worst: "최악 거래", avg: "평균 거래", byAccount: "계좌별", trades: "거래", excellent: "훈륙한 성과!", keepImproving: "계속 개선하세요!" },
        "hi-IN": { summary: "समग्र सारांश", totalTrades: "कुल ट्रेड", winning: "जीते ट्रेड", losing: "हारे ट्रेड", result: "परिणाम", best: "सर्वश्रेष्ठ ट्रेड", worst: "सबसे खराब ट्रेड", avg: "प्रति ट्रेड औसत", byAccount: "खाते के अनुसार", trades: "ट्रेड", excellent: "शानदार प्रदर्शन!", keepImproving: "सुधार जारी रखें!" },
        "ar-SA": { summary: "الملخص العام", totalTrades: "إجمالي الصفقات", winning: "الصفقات الرابحة", losing: "الصفقات الخاسرة", result: "النتيجة", best: "أفضل صفقة", worst: "أسوأ صفقة", avg: "متوسط الصفقة", byAccount: "حسب الحساب", trades: "الصفقات", excellent: "!أداء ممتاز", keepImproving: "!استمر في التحسين" }
      };
      const l = labels[language] || labels["pt-BR"];
      
      message += `📊 <b>${l.summary}</b>\n`;
      message += `<b>${l.totalTrades}:</b> ${data.totalStats.totalTrades}\n`;
      message += `<b>${l.winning}:</b> ${data.totalStats.winningTrades} ✅\n`;
      message += `<b>${l.losing}:</b> ${data.totalStats.losingTrades} ❌\n`;
      message += `<b>Win Rate:</b> ${winRateFormatted}%\n`;
      message += `<b>${l.result}:</b> ${totalProfitFormatted}\n`;
      message += `<b>${l.best}:</b> ${currencySymbol}${data.totalStats.bestTrade.toFixed(2)}\n`;
      message += `<b>${l.worst}:</b> ${currencySymbol}${data.totalStats.worstTrade.toFixed(2)}\n`;
      message += `<b>${l.avg}:</b> ${currencySymbol}${data.totalStats.averageProfit.toFixed(2)}\n\n`;

      // Estatísticas por conta
      if (data.accountsStats.length > 0) {
        message += `💼 <b>${l.byAccount}</b>\n\n`;

        for (const account of data.accountsStats) {
          const accountProfit = account.totalProfit >= 0 
            ? `+${currencySymbol}${account.totalProfit.toFixed(2)}`
            : `-${currencySymbol}${Math.abs(account.totalProfit).toFixed(2)}`;
          
          const accountEmoji = account.totalProfit >= 0 ? "🟢" : "🔴";

          message += `${accountEmoji} <b>${account.accountNumber}</b> (${account.broker})\n`;
          message += `${l.trades}: ${account.totalTrades} | Win Rate: ${account.winRate.toFixed(1)}%\n`;
          message += `${l.result}: ${accountProfit}\n\n`;
        }
      }

      // Mensagem final
      message += data.totalStats.totalProfit >= 0 
        ? `<i>${l.excellent}</i> 🎉`
        : `<i>${l.keepImproving}</i> 💪`;

      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar relatório personalizado:`, error);
      return false;
    }
  }

  /**
   * Envia relatório mensal
   */
  async sendMonthlyReport(
    chatId: string | number,
    stats: {
      totalTrades: number;
      winningTrades: number;
      losingTrades: number;
      totalProfit: number;
      winRate: number;
    },
    currency: string = "USD",
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      // Valor em USD
      const profitUSD = stats.totalProfit;
      const profitUSDFormatted = profitUSD >= 0 
        ? `+$${profitUSD.toFixed(2)}`
        : `-$${Math.abs(profitUSD).toFixed(2)}`;
      
      // Valor convertido (se não for USD)
      let profitConverted = "";
      if (currency !== "USD") {
        try {
          const { convertCurrency, getCurrencySymbol } = await import("../services/currency-converter");
          const converted = await convertCurrency(Math.abs(profitUSD), "USD", currency as any);
          const symbol = getCurrencySymbol(currency as any);
          profitConverted = ` (${symbol}${converted.toFixed(2)} ${currency})`;
        } catch (error) {
          console.error("[Telegram] Erro ao converter moeda:", error);
        }
      }
      
      const profitFormatted = profitUSDFormatted + profitConverted;
      
      const emoji = stats.totalProfit >= 0 ? "🏆" : "📊";
      const winRateFormatted = stats.winRate.toFixed(1);

      const messages = {
        "pt-BR": `${emoji} <b>Relatório Mensal</b>\n\n<b>Total de Trades:</b> ${stats.totalTrades}\n<b>Trades Ganhos:</b> ${stats.winningTrades} ✅\n<b>Trades Perdidos:</b> ${stats.losingTrades} ❌\n<b>Win Rate:</b> ${winRateFormatted}%\n\n<b>Resultado:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Mês excelente!</i> 🎯" : "<i>Próximo mês será melhor!</i> 💪"}`,
        "en-US": `${emoji} <b>Monthly Report</b>\n\n<b>Total Trades:</b> ${stats.totalTrades}\n<b>Winning Trades:</b> ${stats.winningTrades} ✅\n<b>Losing Trades:</b> ${stats.losingTrades} ❌\n<b>Win Rate:</b> ${winRateFormatted}%\n\n<b>Result:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Excellent month!</i> 🎯" : "<i>Next month will be better!</i> 💪"}`,
        "es-ES": `${emoji} <b>Informe Mensual</b>\n\n<b>Total de Operaciones:</b> ${stats.totalTrades}\n<b>Operaciones Ganadoras:</b> ${stats.winningTrades} ✅\n<b>Operaciones Perdedoras:</b> ${stats.losingTrades} ❌\n<b>Tasa de Éxito:</b> ${winRateFormatted}%\n\n<b>Resultado:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>¡Mes excelente!</i> 🎯" : "<i>¡El próximo mes será mejor!</i> 💪"}`,
        "fr-FR": `${emoji} <b>Rapport Mensuel</b>\n\n<b>Total des Trades:</b> ${stats.totalTrades}\n<b>Trades Gagnants:</b> ${stats.winningTrades} ✅\n<b>Trades Perdants:</b> ${stats.losingTrades} ❌\n<b>Taux de Réussite:</b> ${winRateFormatted}%\n\n<b>Résultat:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Excellent mois!</i> 🎯" : "<i>Le mois prochain sera meilleur!</i> 💪"}`,
        "de-DE": `${emoji} <b>Monatsbericht</b>\n\n<b>Gesamte Trades:</b> ${stats.totalTrades}\n<b>Gewinnende Trades:</b> ${stats.winningTrades} ✅\n<b>Verlierende Trades:</b> ${stats.losingTrades} ❌\n<b>Gewinnrate:</b> ${winRateFormatted}%\n\n<b>Ergebnis:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Ausgezeichneter Monat!</i> 🎯" : "<i>Nächster Monat wird besser!</i> 💪"}`,
        "it-IT": `${emoji} <b>Rapporto Mensile</b>\n\n<b>Totale Operazioni:</b> ${stats.totalTrades}\n<b>Operazioni Vincenti:</b> ${stats.winningTrades} ✅\n<b>Operazioni Perdenti:</b> ${stats.losingTrades} ❌\n<b>Tasso di Successo:</b> ${winRateFormatted}%\n\n<b>Risultato:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Mese eccellente!</i> 🎯" : "<i>Il prossimo mese andrà meglio!</i> 💪"}`,
        "ru-RU": `${emoji} <b>Ежемесячный отчет</b>\n\n<b>Всего сделок:</b> ${stats.totalTrades}\n<b>Прибыльных сделок:</b> ${stats.winningTrades} ✅\n<b>Убыточных сделок:</b> ${stats.losingTrades} ❌\n<b>Процент побед:</b> ${winRateFormatted}%\n\n<b>Результат:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>Отличный месяц!</i> 🎯" : "<i>Следующий месяц будет лучше!</i> 💪"}`,
        "ja-JP": `${emoji} <b>月次レポート</b>\n\n<b>総取引数:</b> ${stats.totalTrades}\n<b>勝ち取引:</b> ${stats.winningTrades} ✅\n<b>負け取引:</b> ${stats.losingTrades} ❌\n<b>勝率:</b> ${winRateFormatted}%\n\n<b>結果:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>素晴らしい一ヶ月！</i> 🎯" : "<i>来月はもっと良くなる！</i> 💪"}`,
        "zh-CN": `${emoji} <b>月报</b>\n\n<b>总交易数:</b> ${stats.totalTrades}\n<b>盈利交易:</b> ${stats.winningTrades} ✅\n<b>亏损交易:</b> ${stats.losingTrades} ❌\n<b>胜率:</b> ${winRateFormatted}%\n\n<b>结果:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>本月表现出色！</i> 🎯" : "<i>下月会更好！</i> 💪"}`,
        "ko-KR": `${emoji} <b>월간 보고서</b>\n\n<b>총 거래:</b> ${stats.totalTrades}\n<b>수익 거래:</b> ${stats.winningTrades} ✅\n<b>손실 거래:</b> ${stats.losingTrades} ❌\n<b>승률:</b> ${winRateFormatted}%\n\n<b>결과:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>훈륙한 한 달!</i> 🎯" : "<i>다음 달은 더 나아질 겁니다!</i> 💪"}`,
        "hi-IN": `${emoji} <b>मासिक रिपोर्ट</b>\n\n<b>कुल ट्रेड:</b> ${stats.totalTrades}\n<b>जीते ट्रेड:</b> ${stats.winningTrades} ✅\n<b>हारे ट्रेड:</b> ${stats.losingTrades} ❌\n<b>जीत दर:</b> ${winRateFormatted}%\n\n<b>परिणाम:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>शानदार महीना!</i> 🎯" : "<i>अगला महीना बेहतर होगा!</i> 💪"}`,
        "ar-SA": `${emoji} <b>التقرير الشهري</b>\n\n<b>إجمالي الصفقات:</b> ${stats.totalTrades}\n<b>الصفقات الرابحة:</b> ${stats.winningTrades} ✅\n<b>الصفقات الخاسرة:</b> ${stats.losingTrades} ❌\n<b>معدل الفوز:</b> ${winRateFormatted}%\n\n<b>النتيجة:</b> ${profitFormatted}\n\n${stats.totalProfit >= 0 ? "<i>!شهر ممتاز</i> 🎯" : "<i>!الشهر القادم سيكون أفضل</i> 💪"}`
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar relatório mensal:`, error);
      return false;
    }
  }

  /**
   * Envia alerta de inatividade
   */
  async sendInactivityAlert(
    chatId: string | number,
    data: {
      daysSinceLastTrade: number;
      lastTradeDate: string;
      userName: string;
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const lastTradeDate = new Date(data.lastTradeDate);
      const localeMap: Record<string, string> = {
        "pt-BR": "pt-BR", "en-US": "en-US", "es-ES": "es-ES", "fr-FR": "fr-FR",
        "de-DE": "de-DE", "it-IT": "it-IT", "ru-RU": "ru-RU", "ja-JP": "ja-JP",
        "zh-CN": "zh-CN", "ko-KR": "ko-KR", "hi-IN": "hi-IN", "ar-SA": "ar-SA"
      };
      const formattedDate = lastTradeDate.toLocaleDateString(localeMap[language] || "pt-BR");

      const messages = {
        "pt-BR": `⚠️ <b>Alerta de Inatividade</b>\n\nOlá, ${data.userName}!\n\n📅 Você não opera há <b>${data.daysSinceLastTrade} dias</b>\n⏰ Último trade: ${formattedDate}\n\n💡 <i>Lembre-se: consistência é a chave para o sucesso no trading!</i>\n\n🚀 Que tal voltar à ação?`,
        "en-US": `⚠️ <b>Inactivity Alert</b>\n\nHello, ${data.userName}!\n\n📅 You haven't traded for <b>${data.daysSinceLastTrade} days</b>\n⏰ Last trade: ${formattedDate}\n\n💡 <i>Remember: consistency is key to trading success!</i>\n\n🚀 Ready to get back in action?`,
        "es-ES": `⚠️ <b>Alerta de Inactividad</b>\n\n¡Hola, ${data.userName}!\n\n📅 No has operado en <b>${data.daysSinceLastTrade} días</b>\n⏰ Último trade: ${formattedDate}\n\n💡 <i>¡Recuerda: la consistencia es clave para el éxito en el trading!</i>\n\n🚀 ¿Listo para volver a la acción?`,
        "fr-FR": `⚠️ <b>Alerte d'Inactivité</b>\n\nBonjour, ${data.userName}!\n\n📅 Vous n'avez pas trade depuis <b>${data.daysSinceLastTrade} jours</b>\n⏰ Dernier trade: ${formattedDate}\n\n💡 <i>Rappelez-vous: la constance est la clé du succès en trading!</i>\n\n🚀 Prêt à reprendre l'action?`,
        "de-DE": `⚠️ <b>Inaktivitätswarnung</b>\n\nHallo, ${data.userName}!\n\n📅 Sie haben seit <b>${data.daysSinceLastTrade} Tagen</b> nicht gehandelt\n⏰ Letzter Trade: ${formattedDate}\n\n💡 <i>Denken Sie daran: Konstanz ist der Schlüssel zum Erfolg im Trading!</i>\n\n🚀 Bereit, wieder aktiv zu werden?`,
        "it-IT": `⚠️ <b>Allarme di Inattività</b>\n\nCiao, ${data.userName}!\n\n📅 Non fai trading da <b>${data.daysSinceLastTrade} giorni</b>\n⏰ Ultimo trade: ${formattedDate}\n\n💡 <i>Ricorda: la costanza è la chiave del successo nel trading!</i>\n\n🚀 Pronto a tornare in azione?`,
        "ru-RU": `⚠️ <b>Предупреждение о неактивности</b>\n\nЗдравствуйте, ${data.userName}!\n\n📅 Вы не торговали <b>${data.daysSinceLastTrade} дней</b>\n⏰ Последняя сделка: ${formattedDate}\n\n💡 <i>Помните: постоянство — ключ к успеху в трейдинге!</i>\n\n🚀 Готовы вернуться к действию?`,
        "ja-JP": `⚠️ <b>非アクティブ警告</b>\n\nこんにちは、${data.userName}さん！\n\n📅 <b>${data.daysSinceLastTrade}日間</b>取引していません\n⏰ 最後の取引: ${formattedDate}\n\n💡 <i>忘れないでください：一貫性が取引の成功の鍵です！</i>\n\n🚀 再開する準備はできましたか？`,
        "zh-CN": `⚠️ <b>不活跃警告</b>\n\n您好，${data.userName}！\n\n📅 您已经<b>${data.daysSinceLastTrade}天</b>没有交易\n⏰ 最后交易: ${formattedDate}\n\n💡 <i>记住：坚持是交易成功的关键！</i>\n\n🚀 准备好重新开始了吗？`,
        "ko-KR": `⚠️ <b>비활동 경고</b>\n\n안녕하세요, ${data.userName}님!\n\n📅 <b>${data.daysSinceLastTrade}일</b> 동안 거래하지 않았습니다\n⏰ 마지막 거래: ${formattedDate}\n\n💡 <i>기억하세요: 일관성이 거래 성공의 열쇠입니다!</i>\n\n🚀 다시 시작할 준비가 되셨나요?`,
        "hi-IN": `⚠️ <b>निष्क्रियता चेतावनी</b>\n\nनमस्ते, ${data.userName}!\n\n📅 आपने <b>${data.daysSinceLastTrade} दिनों</b> से व्यापार नहीं किया है\n⏰ अंतिम ट्रेड: ${formattedDate}\n\n💡 <i>याद रखें: निरंतरता ट्रेडिंग सफलता की कुंजी है!</i>\n\n🚀 वापस कार्रवाई में आने के लिए तैयार हैं?`,
        "ar-SA": `⚠️ <b>تنبيه عدم النشاط</b>\n\nمرحبا، ${data.userName}!\n\n📅 لم تتداول منذ <b>${data.daysSinceLastTrade} يوم</b>\n⏰ آخر صفقة: ${formattedDate}\n\n💡 <i>تذكر: الاتساق هو مفتاح النجاح في التداول!</i>\n\n🚀 هل أنت مستعد للعودة إلى العمل؟`
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar alerta de inatividade:`, error);
      return false;
    }
  }

  /**
   * Envia alerta de drawdown
   */
  async sendDrawdownAlert(
    chatId: string | number,
    data: {
      accountNumber: string;
      drawdownPercent: number;
      currentBalance: number;
      initialBalance: number;
    },
    currency: string = "USD",
    language: string = "pt-BR",
    userId?: number,
    alertType: 'individual' | 'consolidated' = 'consolidated'
  ): Promise<boolean> {
    try {
      const currencySymbol = currency === "BRL" ? "R$" : "$";
      const currentBalanceFormatted = `${currencySymbol}${data.currentBalance.toFixed(2)}`;
      const initialBalanceFormatted = `${currencySymbol}${data.initialBalance.toFixed(2)}`;

      const messages = {
        "pt-BR": `⚠️ <b>Alerta de Drawdown!</b>\n\n<b>Conta:</b> ${data.accountNumber}\n<b>Drawdown:</b> ${data.drawdownPercent.toFixed(2)}%\n<b>Saldo Atual:</b> ${currentBalanceFormatted}\n<b>Saldo Inicial:</b> ${initialBalanceFormatted}\n\n<i>Atenção! Revise sua estratégia.</i> 🛑`,
        "en-US": `⚠️ <b>Drawdown Alert!</b>\n\n<b>Account:</b> ${data.accountNumber}\n<b>Drawdown:</b> ${data.drawdownPercent.toFixed(2)}%\n<b>Current Balance:</b> ${currentBalanceFormatted}\n<b>Initial Balance:</b> ${initialBalanceFormatted}\n\n<i>Attention! Review your strategy.</i> 🛑`,
        "es-ES": `⚠️ <b>¡Alerta de Drawdown!</b>\n\n<b>Cuenta:</b> ${data.accountNumber}\n<b>Drawdown:</b> ${data.drawdownPercent.toFixed(2)}%\n<b>Saldo Actual:</b> ${currentBalanceFormatted}\n<b>Saldo Inicial:</b> ${initialBalanceFormatted}\n\n<i>¡Atención! Revisa tu estrategia.</i> 🛑`,
        "fr-FR": `⚠️ <b>Alerte de Drawdown!</b>\n\n<b>Compte:</b> ${data.accountNumber}\n<b>Drawdown:</b> ${data.drawdownPercent.toFixed(2)}%\n<b>Solde Actuel:</b> ${currentBalanceFormatted}\n<b>Solde Initial:</b> ${initialBalanceFormatted}\n\n<i>Attention! Révisez votre stratégie.</i> 🛑`,
        "de-DE": `⚠️ <b>Drawdown-Warnung!</b>\n\n<b>Konto:</b> ${data.accountNumber}\n<b>Drawdown:</b> ${data.drawdownPercent.toFixed(2)}%\n<b>Aktueller Saldo:</b> ${currentBalanceFormatted}\n<b>Anfänglicher Saldo:</b> ${initialBalanceFormatted}\n\n<i>Achtung! Überprüfen Sie Ihre Strategie.</i> 🛑`,
        "it-IT": `⚠️ <b>Allarme Drawdown!</b>\n\n<b>Conto:</b> ${data.accountNumber}\n<b>Drawdown:</b> ${data.drawdownPercent.toFixed(2)}%\n<b>Saldo Attuale:</b> ${currentBalanceFormatted}\n<b>Saldo Iniziale:</b> ${initialBalanceFormatted}\n\n<i>Attenzione! Rivedi la tua strategia.</i> 🛑`,
        "ru-RU": `⚠️ <b>Предупреждение о просадке!</b>\n\n<b>Счет:</b> ${data.accountNumber}\n<b>Просадка:</b> ${data.drawdownPercent.toFixed(2)}%\n<b>Текущий баланс:</b> ${currentBalanceFormatted}\n<b>Начальный баланс:</b> ${initialBalanceFormatted}\n\n<i>Внимание! Проверьте свою стратегию.</i> 🛑`,
        "ja-JP": `⚠️ <b>ドローダウン警告！</b>\n\n<b>口座:</b> ${data.accountNumber}\n<b>ドローダウン:</b> ${data.drawdownPercent.toFixed(2)}%\n<b>現在の残高:</b> ${currentBalanceFormatted}\n<b>初期残高:</b> ${initialBalanceFormatted}\n\n<i>注意！戦略を見直してください。</i> 🛑`,
        "zh-CN": `⚠️ <b>回撤警告！</b>\n\n<b>账户:</b> ${data.accountNumber}\n<b>回撤:</b> ${data.drawdownPercent.toFixed(2)}%\n<b>当前余额:</b> ${currentBalanceFormatted}\n<b>初始余额:</b> ${initialBalanceFormatted}\n\n<i>注意！请检查您的策略。</i> 🛑`,
        "ko-KR": `⚠️ <b>드로다운 경고!</b>\n\n<b>계좌:</b> ${data.accountNumber}\n<b>드로다운:</b> ${data.drawdownPercent.toFixed(2)}%\n<b>현재 잔액:</b> ${currentBalanceFormatted}\n<b>초기 잔액:</b> ${initialBalanceFormatted}\n\n<i>주의! 전략을 검토하세요.</i> 🛑`,
        "hi-IN": `⚠️ <b>ड्रॉडाउन चेतावनी!</b>\n\n<b>खाता:</b> ${data.accountNumber}\n<b>ड्रॉडाउन:</b> ${data.drawdownPercent.toFixed(2)}%\n<b>वर्तमान शेष:</b> ${currentBalanceFormatted}\n<b>प्रारंभिक शेष:</b> ${initialBalanceFormatted}\n\n<i>ध्यान दें! अपनी रणनीति की समीक्षा करें।</i> 🛑`,
        "ar-SA": `⚠️ <b>!تنبيه انخفاض</b>\n\n<b>الحساب:</b> ${data.accountNumber}\n<b>الانخفاض:</b> ${data.drawdownPercent.toFixed(2)}%\n<b>الرصيد الحالي:</b> ${currentBalanceFormatted}\n<b>الرصيد الأولي:</b> ${initialBalanceFormatted}\n\n<i>!انتباه! راجع استراتيجيتك</i> 🛑`
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      
      // Se userId foi fornecido, salvar no histórico
      if (userId) {
        return await this.sendMessage(chatId, message, "HTML", {
          userId,
          type: 'drawdown_alert',
          title: `Alerta de Drawdown: ${data.accountNumber}`,
          accountNumber: data.accountNumber,
          ticket: '', // Não se aplica a drawdown
          eventType: alertType
        });
      }
      
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar alerta de drawdown:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de conta conectada
   */
  async sendAccountConnected(
    chatId: string | number,
    data: {
      accountNumber: string;
      broker: string;
      platform: string;
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const messages = {
        "pt-BR": `✅ <b>Conta Conectada!</b>\n\n<b>Número:</b> ${data.accountNumber}\n<b>Corretora:</b> ${data.broker}\n<b>Plataforma:</b> ${data.platform}\n\n<i>Sua conta foi conectada com sucesso!</i> 🎉`,
        "en-US": `✅ <b>Account Connected!</b>\n\n<b>Number:</b> ${data.accountNumber}\n<b>Broker:</b> ${data.broker}\n<b>Platform:</b> ${data.platform}\n\n<i>Your account has been connected successfully!</i> 🎉`,
        "es-ES": `✅ <b>¡Cuenta Conectada!</b>\n\n<b>Número:</b> ${data.accountNumber}\n<b>Broker:</b> ${data.broker}\n<b>Plataforma:</b> ${data.platform}\n\n<i>¡Tu cuenta ha sido conectada con éxito!</i> 🎉`,
        "fr-FR": `✅ <b>Compte Connecté!</b>\n\n<b>Numéro:</b> ${data.accountNumber}\n<b>Courtier:</b> ${data.broker}\n<b>Plateforme:</b> ${data.platform}\n\n<i>Votre compte a été connecté avec succès!</i> 🎉`,
        "de-DE": `✅ <b>Konto Verbunden!</b>\n\n<b>Nummer:</b> ${data.accountNumber}\n<b>Broker:</b> ${data.broker}\n<b>Plattform:</b> ${data.platform}\n\n<i>Ihr Konto wurde erfolgreich verbunden!</i> 🎉`,
        "it-IT": `✅ <b>Account Connesso!</b>\n\n<b>Numero:</b> ${data.accountNumber}\n<b>Broker:</b> ${data.broker}\n<b>Piattaforma:</b> ${data.platform}\n\n<i>Il tuo account è stato connesso con successo!</i> 🎉`,
        "ru-RU": `✅ <b>Аккаунт Подключен!</b>\n\n<b>Номер:</b> ${data.accountNumber}\n<b>Брокер:</b> ${data.broker}\n<b>Платформа:</b> ${data.platform}\n\n<i>Ваш аккаунт успешно подключен!</i> 🎉`,
        "ja-JP": `✅ <b>アカウント接続完了！</b>\n\n<b>番号:</b> ${data.accountNumber}\n<b>ブローカー:</b> ${data.broker}\n<b>プラットフォーム:</b> ${data.platform}\n\n<i>アカウントが正常に接続されました！</i> 🎉`,
        "zh-CN": `✅ <b>账户已连接！</b>\n\n<b>号码:</b> ${data.accountNumber}\n<b>经纪商:</b> ${data.broker}\n<b>平台:</b> ${data.platform}\n\n<i>您的账户已成功连接！</i> 🎉`,
        "ko-KR": `✅ <b>계정 연결 완료!</b>\n\n<b>번호:</b> ${data.accountNumber}\n<b>브로커:</b> ${data.broker}\n<b>플랫폼:</b> ${data.platform}\n\n<i>계정이 성공적으로 연결되었습니다!</i> 🎉`,
        "hi-IN": `✅ <b>खाता कनेक्ट हो गया!</b>\n\n<b>नंबर:</b> ${data.accountNumber}\n<b>ब्रोकर:</b> ${data.broker}\n<b>प्लेटफॉर्म:</b> ${data.platform}\n\n<i>आपका खाता सफलतापूर्वक कनेक्ट हो गया!</i> 🎉`,
        "ar-SA": `✅ <b>!تم ربط الحساب</b>\n\n<b>الرقم:</b> ${data.accountNumber}\n<b>الوسيط:</b> ${data.broker}\n<b>المنصة:</b> ${data.platform}\n\n<i>!تم ربط حسابك بنجاح</i> 🎉`
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de conta conectada:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de VPS expirando
   */
  async sendVpsExpiring(
    chatId: string | number,
    data: {
      vpsName: string;
      daysRemaining: number;
      expirationDate: string;
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const urgencyEmoji = data.daysRemaining <= 1 ? "🚨" : data.daysRemaining <= 3 ? "⚠️" : "⏰";
      
      const messages = {
        "pt-BR": `${urgencyEmoji} <b>VPS Expirando!</b>\n\n<b>VPS:</b> ${data.vpsName}\n<b>Expira em:</b> ${data.daysRemaining} dia(s)\n<b>Data:</b> ${data.expirationDate}\n\n<i>Renove agora para evitar interrupções!</i> 💻`,
        "en-US": `${urgencyEmoji} <b>VPS Expiring!</b>\n\n<b>VPS:</b> ${data.vpsName}\n<b>Expires in:</b> ${data.daysRemaining} day(s)\n<b>Date:</b> ${data.expirationDate}\n\n<i>Renew now to avoid interruptions!</i> 💻`,
        "es-ES": `${urgencyEmoji} <b>¡VPS Expirando!</b>\n\n<b>VPS:</b> ${data.vpsName}\n<b>Expira en:</b> ${data.daysRemaining} día(s)\n<b>Fecha:</b> ${data.expirationDate}\n\n<i>¡Renueva ahora para evitar interrupciones!</i> 💻`,
        "fr-FR": `${urgencyEmoji} <b>VPS Expirant!</b>\n\n<b>VPS:</b> ${data.vpsName}\n<b>Expire dans:</b> ${data.daysRemaining} jour(s)\n<b>Date:</b> ${data.expirationDate}\n\n<i>Renouvelez maintenant pour éviter les interruptions!</i> 💻`,
        "de-DE": `${urgencyEmoji} <b>VPS läuft ab!</b>\n\n<b>VPS:</b> ${data.vpsName}\n<b>Läuft ab in:</b> ${data.daysRemaining} Tag(en)\n<b>Datum:</b> ${data.expirationDate}\n\n<i>Jetzt erneuern, um Unterbrechungen zu vermeiden!</i> 💻`,
        "it-IT": `${urgencyEmoji} <b>VPS in Scadenza!</b>\n\n<b>VPS:</b> ${data.vpsName}\n<b>Scade tra:</b> ${data.daysRemaining} giorno/i\n<b>Data:</b> ${data.expirationDate}\n\n<i>Rinnova ora per evitare interruzioni!</i> 💻`,
        "ru-RU": `${urgencyEmoji} <b>VPS истекает!</b>\n\n<b>VPS:</b> ${data.vpsName}\n<b>Истекает через:</b> ${data.daysRemaining} дн.\n<b>Дата:</b> ${data.expirationDate}\n\n<i>Продлите сейчас, чтобы избежать перерывов!</i> 💻`,
        "ja-JP": `${urgencyEmoji} <b>VPS期限切れ！</b>\n\n<b>VPS:</b> ${data.vpsName}\n<b>有効期限:</b> ${data.daysRemaining}日\n<b>日付:</b> ${data.expirationDate}\n\n<i>中断を避けるために今すぐ更新してください！</i> 💻`,
        "zh-CN": `${urgencyEmoji} <b>VPS即将到期！</b>\n\n<b>VPS:</b> ${data.vpsName}\n<b>到期时间:</b> ${data.daysRemaining}天\n<b>日期:</b> ${data.expirationDate}\n\n<i>立即续费以避免中断！</i> 💻`,
        "ko-KR": `${urgencyEmoji} <b>VPS 만료 예정!</b>\n\n<b>VPS:</b> ${data.vpsName}\n<b>만료까지:</b> ${data.daysRemaining}일\n<b>날짜:</b> ${data.expirationDate}\n\n<i>중단을 피하려면 지금 갱신하세요!</i> 💻`,
        "hi-IN": `${urgencyEmoji} <b>VPS समाप्त हो रहा है!</b>\n\n<b>VPS:</b> ${data.vpsName}\n<b>समाप्त होने में:</b> ${data.daysRemaining} दिन\n<b>तारीख:</b> ${data.expirationDate}\n\n<i>रुकावट से बचने के लिए अभी नवीनीकरण करें!</i> 💻`,
        "ar-SA": `${urgencyEmoji} <b>!VPS ينتهي</b>\n\n<b>VPS:</b> ${data.vpsName}\n<b>ينتهي في:</b> ${data.daysRemaining} يوم\n<b>التاريخ:</b> ${data.expirationDate}\n\n<i>!جدد الآن لتجنب الانقطاع</i> 💻`
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de VPS expirando:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de assinatura expirando
   */
  async sendSubscriptionExpiring(
    chatId: string | number,
    data: {
      planName: string;
      daysRemaining: number;
      expirationDate: string;
      price?: number;
      billingCycle?: "monthly" | "yearly";
    },
    displayCurrency: string = "USD",
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const urgencyEmoji = data.daysRemaining <= 1 ? "🚨" : data.daysRemaining <= 3 ? "⚠️" : "📅";
      
      // Formatar preço com conversão se disponível
      let priceText = "";
      if (data.price && data.price > 0) {
        const baseCurrency = "USD";
        const baseSymbol = getCurrencySymbol(baseCurrency);
        const displaySymbol = getCurrencySymbol(displayCurrency);
        const convertedPrice = convertCurrency(data.price, baseCurrency, displayCurrency);
        
        const cycleLabels: Record<string, Record<string, string>> = {
          "monthly": { "pt-BR": "/mês", "en-US": "/month", "es-ES": "/mes", "fr-FR": "/mois", "de-DE": "/Monat", "it-IT": "/mese", "ru-RU": "/мес", "ja-JP": "/月", "zh-CN": "/月", "ko-KR": "/월", "hi-IN": "/महीना", "ar-SA": "/شهر" },
          "yearly": { "pt-BR": "/ano", "en-US": "/year", "es-ES": "/año", "fr-FR": "/an", "de-DE": "/Jahr", "it-IT": "/anno", "ru-RU": "/год", "ja-JP": "/年", "zh-CN": "/年", "ko-KR": "/년", "hi-IN": "/वर्ष", "ar-SA": "/سنة" }
        };
        const cycle = data.billingCycle || "monthly";
        const cycleLabel = cycleLabels[cycle][language] || cycleLabels[cycle]["pt-BR"];
        
        const priceLabel = language === "pt-BR" ? "Valor" : language === "en-US" ? "Price" : language === "es-ES" ? "Precio" : language === "fr-FR" ? "Prix" : language === "de-DE" ? "Preis" : language === "it-IT" ? "Prezzo" : language === "ru-RU" ? "Цена" : language === "ja-JP" ? "価格" : language === "zh-CN" ? "价格" : language === "ko-KR" ? "가격" : language === "hi-IN" ? "कीमत" : "السعر";
        
        if (displayCurrency === baseCurrency) {
          // Se a moeda for USD, mostra só USD
          priceText = `\n<b>${priceLabel}:</b> ${baseSymbol}${data.price.toFixed(2)}${cycleLabel}`;
        } else {
          // Mostra USD + moeda convertida lado a lado
          const baseCycleLabel = cycleLabels[cycle]["en-US"];
          priceText = `\n<b>${priceLabel}:</b> ${baseSymbol}${data.price.toFixed(2)}${baseCycleLabel} ${displaySymbol}${convertedPrice.toFixed(2)}${cycleLabel}`;
        }
      }
      
      const messages = {
        "pt-BR": `${urgencyEmoji} <b>Assinatura Expirando!</b>\n\n<b>Plano:</b> ${data.planName}\n<b>Expira em:</b> ${data.daysRemaining} dia(s)\n<b>Data:</b> ${data.expirationDate}${priceText}\n\n<i>Renove para continuar usando!</i> 💳`,
        "en-US": `${urgencyEmoji} <b>Subscription Expiring!</b>\n\n<b>Plan:</b> ${data.planName}\n<b>Expires in:</b> ${data.daysRemaining} day(s)\n<b>Date:</b> ${data.expirationDate}${priceText}\n\n<i>Renew to continue using!</i> 💳`,
        "es-ES": `${urgencyEmoji} <b>¡Suscripción Expirando!</b>\n\n<b>Plan:</b> ${data.planName}\n<b>Expira en:</b> ${data.daysRemaining} día(s)\n<b>Fecha:</b> ${data.expirationDate}${priceText}\n\n<i>¡Renueva para continuar usando!</i> 💳`,
        "fr-FR": `${urgencyEmoji} <b>Abonnement Expirant!</b>\n\n<b>Plan:</b> ${data.planName}\n<b>Expire dans:</b> ${data.daysRemaining} jour(s)\n<b>Date:</b> ${data.expirationDate}${priceText}\n\n<i>Renouvelez pour continuer!</i> 💳`,
        "de-DE": `${urgencyEmoji} <b>Abonnement läuft ab!</b>\n\n<b>Plan:</b> ${data.planName}\n<b>Läuft ab in:</b> ${data.daysRemaining} Tag(en)\n<b>Datum:</b> ${data.expirationDate}${priceText}\n\n<i>Erneuern Sie, um fortzufahren!</i> 💳`,
        "it-IT": `${urgencyEmoji} <b>Abbonamento in Scadenza!</b>\n\n<b>Piano:</b> ${data.planName}\n<b>Scade tra:</b> ${data.daysRemaining} giorno/i\n<b>Data:</b> ${data.expirationDate}${priceText}\n\n<i>Rinnova per continuare!</i> 💳`,
        "ru-RU": `${urgencyEmoji} <b>Подписка истекает!</b>\n\n<b>План:</b> ${data.planName}\n<b>Истекает через:</b> ${data.daysRemaining} дн.\n<b>Дата:</b> ${data.expirationDate}${priceText}\n\n<i>Продлите, чтобы продолжить!</i> 💳`,
        "ja-JP": `${urgencyEmoji} <b>サブスクリプション期限切れ！</b>\n\n<b>プラン:</b> ${data.planName}\n<b>有効期限:</b> ${data.daysRemaining}日\n<b>日付:</b> ${data.expirationDate}${priceText}\n\n<i>更新して続行してください！</i> 💳`,
        "zh-CN": `${urgencyEmoji} <b>订阅即将到期！</b>\n\n<b>计划:</b> ${data.planName}\n<b>到期时间:</b> ${data.daysRemaining}天\n<b>日期:</b> ${data.expirationDate}${priceText}\n\n<i>续订以继续使用！</i> 💳`,
        "ko-KR": `${urgencyEmoji} <b>구독 만료 예정!</b>\n\n<b>플랜:</b> ${data.planName}\n<b>만료까지:</b> ${data.daysRemaining}일\n<b>날짜:</b> ${data.expirationDate}${priceText}\n\n<i>계속 사용하려면 갱신하세요!</i> 💳`,
        "hi-IN": `${urgencyEmoji} <b>सदस्यता समाप्त हो रही है!</b>\n\n<b>योजना:</b> ${data.planName}\n<b>समाप्त होने में:</b> ${data.daysRemaining} दिन\n<b>तारीख:</b> ${data.expirationDate}${priceText}\n\n<i>उपयोग जारी रखने के लिए नवीनीकरण करें!</i> 💳`,
        "ar-SA": `${urgencyEmoji} <b>!الاشتراك ينتهي</b>\n\n<b>الخطة:</b> ${data.planName}\n<b>ينتهي في:</b> ${data.daysRemaining} يوم\n<b>التاريخ:</b> ${data.expirationDate}${priceText}\n\n<i>!جدد للمتابعة</i> 💳`
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de assinatura expirando:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de EA expirando
   */
  async sendEaExpiring(
    chatId: string | number,
    data: {
      eaName: string;
      daysRemaining: number;
      expirationDate: string;
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const urgencyEmoji = data.daysRemaining <= 1 ? "🚨" : data.daysRemaining <= 3 ? "⚠️" : "🤖";
      
      const messages = {
        "pt-BR": `${urgencyEmoji} <b>Licença de EA Expirando!</b>\n\n<b>EA:</b> ${data.eaName}\n<b>Expira em:</b> ${data.daysRemaining} dia(s)\n<b>Data:</b> ${data.expirationDate}\n\n<i>Renove sua licença agora!</i> 🔑`,
        "en-US": `${urgencyEmoji} <b>EA License Expiring!</b>\n\n<b>EA:</b> ${data.eaName}\n<b>Expires in:</b> ${data.daysRemaining} day(s)\n<b>Date:</b> ${data.expirationDate}\n\n<i>Renew your license now!</i> 🔑`,
        "es-ES": `${urgencyEmoji} <b>¡Licencia de EA Expirando!</b>\n\n<b>EA:</b> ${data.eaName}\n<b>Expira en:</b> ${data.daysRemaining} día(s)\n<b>Fecha:</b> ${data.expirationDate}\n\n<i>¡Renueva tu licencia ahora!</i> 🔑`,
        "fr-FR": `${urgencyEmoji} <b>Licence EA Expirant!</b>\n\n<b>EA:</b> ${data.eaName}\n<b>Expire dans:</b> ${data.daysRemaining} jour(s)\n<b>Date:</b> ${data.expirationDate}\n\n<i>Renouvelez votre licence maintenant!</i> 🔑`,
        "de-DE": `${urgencyEmoji} <b>EA-Lizenz läuft ab!</b>\n\n<b>EA:</b> ${data.eaName}\n<b>Läuft ab in:</b> ${data.daysRemaining} Tag(en)\n<b>Datum:</b> ${data.expirationDate}\n\n<i>Erneuern Sie Ihre Lizenz jetzt!</i> 🔑`,
        "it-IT": `${urgencyEmoji} <b>Licenza EA in Scadenza!</b>\n\n<b>EA:</b> ${data.eaName}\n<b>Scade tra:</b> ${data.daysRemaining} giorno/i\n<b>Data:</b> ${data.expirationDate}\n\n<i>Rinnova la tua licenza ora!</i> 🔑`,
        "ru-RU": `${urgencyEmoji} <b>Лицензия EA истекает!</b>\n\n<b>EA:</b> ${data.eaName}\n<b>Истекает через:</b> ${data.daysRemaining} дн.\n<b>Дата:</b> ${data.expirationDate}\n\n<i>Продлите лицензию сейчас!</i> 🔑`,
        "ja-JP": `${urgencyEmoji} <b>EAライセンス期限切れ！</b>\n\n<b>EA:</b> ${data.eaName}\n<b>有効期限:</b> ${data.daysRemaining}日\n<b>日付:</b> ${data.expirationDate}\n\n<i>今すぐライセンスを更新してください！</i> 🔑`,
        "zh-CN": `${urgencyEmoji} <b>EA许可证即将到期！</b>\n\n<b>EA:</b> ${data.eaName}\n<b>到期时间:</b> ${data.daysRemaining}天\n<b>日期:</b> ${data.expirationDate}\n\n<i>立即续费您的许可证！</i> 🔑`,
        "ko-KR": `${urgencyEmoji} <b>EA 라이센스 만료 예정!</b>\n\n<b>EA:</b> ${data.eaName}\n<b>만료까지:</b> ${data.daysRemaining}일\n<b>날짜:</b> ${data.expirationDate}\n\n<i>지금 라이센스를 갱신하세요!</i> 🔑`,
        "hi-IN": `${urgencyEmoji} <b>EA लाइसेंस समाप्त हो रहा है!</b>\n\n<b>EA:</b> ${data.eaName}\n<b>समाप्त होने में:</b> ${data.daysRemaining} दिन\n<b>तारीख:</b> ${data.expirationDate}\n\n<i>अपने लाइसेंस को अभी नवीनीकृत करें!</i> 🔑`,
        "ar-SA": `${urgencyEmoji} <b>!EA ترخيص ينتهي</b>\n\n<b>EA:</b> ${data.eaName}\n<b>ينتهي في:</b> ${data.daysRemaining} يوم\n<b>التاريخ:</b> ${data.expirationDate}\n\n<i>!جدد ترخيصك الآن</i> 🔑`
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de EA expirando:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de alerta genérico
   */
  async sendAlertNotification(
    chatId: string | number,
    data: {
      title: string;
      message: string;
      priority?: "low" | "default" | "high" | "urgent";
    },
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const emoji = data.priority === "urgent" ? "🚨" : data.priority === "high" ? "⚠️" : "🔔";
      
      const message = `
${emoji} <b>${data.title}</b>

${data.message}
      `.trim();

      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar alerta genérico:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de nova compra para admin
   */
  async sendAdminNewPurchase(
    chatId: string | number,
    data: {
      userName: string;
      userEmail: string;
      productName: string;
      amount: number;
      currency: string;
      paymentMethod: string;
    },
    displayCurrency: string = "USD",
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const baseCurrency = data.currency || "USD";
      const baseSymbol = getCurrencySymbol(baseCurrency);
      const displaySymbol = getCurrencySymbol(displayCurrency);
      
      let amountFormatted = `${baseSymbol}${data.amount.toFixed(2)}`;
      
      // Se a moeda de exibição for diferente da moeda base, adicionar conversão
      if (displayCurrency !== baseCurrency) {
        const convertedAmount = convertCurrency(data.amount, baseCurrency, displayCurrency);
        amountFormatted = `${baseSymbol}${data.amount.toFixed(2)} ${displaySymbol}${convertedAmount.toFixed(2)}`;
      }

      const messages = {
        "pt-BR": `
💰 <b>Nova Compra!</b>

<b>Cliente:</b> ${data.userName}
<b>Email:</b> ${data.userEmail}
<b>Produto:</b> ${data.productName}
<b>Valor:</b> ${amountFormatted}
<b>Pagamento:</b> ${data.paymentMethod}

<i>Nova venda realizada!</i> 🎉
        `.trim(),
        "en-US": `
💰 <b>New Purchase!</b>

<b>Customer:</b> ${data.userName}
<b>Email:</b> ${data.userEmail}
<b>Product:</b> ${data.productName}
<b>Amount:</b> ${amountFormatted}
<b>Payment:</b> ${data.paymentMethod}

<i>New sale completed!</i> 🎉
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de compra para admin:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de assinatura renovada para admin
   */
  async sendAdminSubscriptionRenewed(
    chatId: string | number,
    data: {
      userName: string;
      userEmail: string;
      planName: string;
      amount: number;
      currency: string;
      renewalDate: string;
    },
    displayCurrency: string = "USD",
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const baseCurrency = data.currency || "USD";
      const baseSymbol = getCurrencySymbol(baseCurrency);
      const displaySymbol = getCurrencySymbol(displayCurrency);
      
      let amountFormatted = `${baseSymbol}${data.amount.toFixed(2)}`;
      
      // Se a moeda de exibição for diferente da moeda base, adicionar conversão
      if (displayCurrency !== baseCurrency) {
        const convertedAmount = convertCurrency(data.amount, baseCurrency, displayCurrency);
        amountFormatted = `${baseSymbol}${data.amount.toFixed(2)} ${displaySymbol}${convertedAmount.toFixed(2)}`;
      }

      const messages = {
        "pt-BR": `
🔄 <b>Assinatura Renovada!</b>

<b>Cliente:</b> ${data.userName}
<b>Email:</b> ${data.userEmail}
<b>Plano:</b> ${data.planName}
<b>Valor:</b> ${amountFormatted}
<b>Renovação:</b> ${data.renewalDate}

<i>Cliente renovou a assinatura!</i> 💳
        `.trim(),
        "en-US": `
🔄 <b>Subscription Renewed!</b>

<b>Customer:</b> ${data.userName}
<b>Email:</b> ${data.userEmail}
<b>Plan:</b> ${data.planName}
<b>Amount:</b> ${amountFormatted}
<b>Renewal:</b> ${data.renewalDate}

<i>Customer renewed subscription!</i> 💳
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de renovação para admin:`, error);
      return false;
    }
  }

  /**
   * Envia notificação de nova assinatura para admin
   */
  async sendAdminNewSubscription(
    chatId: string | number,
    data: {
      userName: string;
      userEmail: string;
      planName: string;
      amount: number;
      currency: string;
      startDate: string;
    },
    displayCurrency: string = "USD",
    language: string = "pt-BR"
  ): Promise<boolean> {
    try {
      const baseCurrency = data.currency || "USD";
      const baseSymbol = getCurrencySymbol(baseCurrency);
      const displaySymbol = getCurrencySymbol(displayCurrency);
      
      let amountFormatted = `${baseSymbol}${data.amount.toFixed(2)}`;
      
      // Se a moeda de exibição for diferente da moeda base, adicionar conversão
      if (displayCurrency !== baseCurrency) {
        const convertedAmount = convertCurrency(data.amount, baseCurrency, displayCurrency);
        amountFormatted = `${baseSymbol}${data.amount.toFixed(2)} ${displaySymbol}${convertedAmount.toFixed(2)}`;
      }

      const messages = {
        "pt-BR": `
🎯 <b>Nova Assinatura!</b>

<b>Cliente:</b> ${data.userName}
<b>Email:</b> ${data.userEmail}
<b>Plano:</b> ${data.planName}
<b>Valor:</b> ${amountFormatted}
<b>Início:</b> ${data.startDate}

<i>Novo assinante!</i> 🚀
        `.trim(),
        "en-US": `
🎯 <b>New Subscription!</b>

<b>Customer:</b> ${data.userName}
<b>Email:</b> ${data.userEmail}
<b>Plan:</b> ${data.planName}
<b>Amount:</b> ${amountFormatted}
<b>Start:</b> ${data.startDate}

<i>New subscriber!</i> 🚀
        `.trim()
      };

      const message = messages[language as keyof typeof messages] || messages["pt-BR"];
      return await this.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[Telegram] Erro ao enviar notificação de nova assinatura para admin:`, error);
      return false;
    }
  }
}

export const telegramService = new TelegramService();
