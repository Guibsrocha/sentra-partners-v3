import { Router } from "express";
import { getDb } from "../db";
import { users, tradingAccounts, telegramUsers, userSettings, notificationHistory } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { telegramService } from "../services/telegram-notifications";

const router = Router();

//+------------------------------------------------------------------+
//| HELPER: Detectar e extrair informações de copy trade            |
//+------------------------------------------------------------------+
interface CopyTradeInfo {
  isCopyTrade: boolean;
  providerName: string;
  masterTicket?: string;
}

function detectCopyTrade(comment: string | null | undefined): CopyTradeInfo {
  if (!comment || typeof comment !== 'string') {
    return { isCopyTrade: false, providerName: 'Unknown' };
  }

  const commentLower = comment.toLowerCase().trim();
  
  // Padrão 1: "copy 123456" ou "copy123456"
  if (commentLower.startsWith('copy')) {
    // Remover "copy" e pegar o resto
    const afterCopy = comment.substring(4).trim();
    
    // Se começa com espaço ou dois pontos, remover
    const cleaned = afterCopy.replace(/^[\s:]+/, '');
    
    if (cleaned) {
      // Extrair apenas números (ticket do Master)
      const ticketMatch = cleaned.match(/^(\d+)/);
      if (ticketMatch) {
        return {
          isCopyTrade: true,
          providerName: `Master #${ticketMatch[1]}`,
          masterTicket: ticketMatch[1]
        };
      }
      
      // Se não é número, é nome do provider
      const providerName = cleaned.split('#')[0].trim();
      return {
        isCopyTrade: true,
        providerName: providerName || 'Unknown Provider'
      };
    }
    
    // "copy" sozinho
    return { isCopyTrade: true, providerName: 'Unknown Provider' };
  }
  
  return { isCopyTrade: false, providerName: 'Unknown' };
}

//+------------------------------------------------------------------+
//| POST /api/mt/trade-event                                         |
//| Receber evento de trade (aberto/fechado)                         |
//+------------------------------------------------------------------+
router.post("/trade-event", async (req, res) => {
  console.log(`[MT4 Lite] ✅ Webhook recebido - eventType: ${req.body.eventType}, ticket: ${req.body.ticket}`);
  try {
    const { 
      email, 
      accountNumber, 
      ticket, 
      eventType, 
      symbol = "UNKNOWN", 
      type = "UNKNOWN", 
      volume = 0, 
      openPrice = 0, 
      closePrice = 0, 
      sl = 0, 
      tp = 0, 
      profit = 0, 
      openTime, 
      closeTime,
      comment = "" 
    } = req.body;
    
    // Log da requisição recebida
    console.log(`[MT4 Lite] Evento recebido: ${eventType} - Ticket: ${ticket} - Symbol: ${symbol} - Comment: "${comment}"`);
    
    // VERIFICAÇÃO 1: Validar se o evento é recente (últimos 5 minutos)
    const eventTime = eventType === "opened" ? openTime : closeTime;
    if (eventTime) {
      const eventDate = new Date(eventTime);
      const now = new Date();
      const diffMinutes = (now.getTime() - eventDate.getTime()) / (1000 * 60);
      
      // Se o evento tem mais de 5 minutos, ignorar
      if (diffMinutes > 5) {
        console.log(`[MT4 Lite] ⚠️ Evento antigo ignorado: ${ticket} (${Math.round(diffMinutes)} minutos atrás)`);
        return res.json({ 
          success: true, 
          notificationSent: false,
          reason: 'old_event',
          ageMinutes: Math.round(diffMinutes)
        });
      }
    }
    
    if (!email || !accountNumber || !ticket || !eventType) {
      console.error("[MT4 Lite] Parâmetros obrigatórios faltando:", { email, accountNumber, ticket, eventType });
      return res.status(400).json({ 
        success: false, 
        error: "Parâmetros obrigatórios faltando" 
      });
    }
    
    const db = await getDb();
    
    // Buscar usuário
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      console.error(`[MT4 Lite] Usuário não encontrado: ${email}`);
      return res.status(404).json({ 
        success: false, 
        error: "Usuário não encontrado" 
      });
    }
    
    // Buscar configurações do usuário
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, user[0].id))
      .limit(1);
    
    // Buscar conta
    const account = await db.select().from(tradingAccounts)
      .where(and(
        eq(tradingAccounts.userId, user[0].id),
        eq(tradingAccounts.accountNumber, accountNumber)
      ))
      .limit(1);
    
    if (account.length === 0) {
      console.error(`[MT4 Lite] Conta não encontrada: ${accountNumber} para usuário ${email}`);
      return res.status(404).json({ 
        success: false, 
        error: "Conta não encontrada" 
      });
    }
    
    // VERIFICAÇÃO 2: Verificar se notificação já foi enviada (MEMÓRIA PERMANENTE - BANCO DE DADOS)
    // Sistema usa APENAS banco de dados para garantir persistência total
    // Sem cache temporário - notificações são lembradas para sempre (até limpeza automática)
    const notificationType = eventType === "opened" ? "trade_opened" : 
                            (profit && parseFloat(profit.toString()) > 0 ? "trade_closed_tp" : "trade_closed_sl");
    
    // Verificação 2.1: Verificar por tipo específico de notificação
    const existingNotification = await db
      .select()
      .from(notificationHistory)
      .where(and(
        eq(notificationHistory.userId, user[0].id),
        eq(notificationHistory.accountNumber, accountNumber),
        eq(notificationHistory.ticket, ticket.toString()),
        eq(notificationHistory.type, notificationType)
      ))
      .limit(1);
    
    if (existingNotification.length > 0) {
      console.log(`[MT4 Lite] ⚠️ Notificação duplicada bloqueada (banco de dados): ${ticket} - Tipo: ${notificationType}`);
      console.log(`[MT4 Lite] Notificação original enviada em: ${existingNotification[0].sentAt}`);
      return res.json({ 
        success: true, 
        notificationSent: false,
        reason: 'duplicate_notification_by_type',
        originalSentAt: existingNotification[0].sentAt
      });
    }
    
    // Verificação 2.2 REMOVIDA: Permitir notificações de abertura E fechamento do mesmo ticket
    // Apenas a verificação 2.1 (por tipo específico) é mantida para evitar duplicatas
    
    // Processar evento
    let notificationSent = false;
    
    if (eventType === "opened") {
      // Detectar copy trade usando função helper
      const copyInfo = detectCopyTrade(comment);
      
      if (copyInfo.isCopyTrade) {
        // Trade de copy trading
        console.log(`🔁 Copy trade aberto: ${ticket} - ${symbol} ${type} ${volume} lotes - Provider: ${copyInfo.providerName}`);
        
        
        // Adicionar ao buffer para agrupar com outras contas do mesmo usuário
        const { bufferCopyTradeOpened } = await import("../services/copy-trade-notification-buffer");
        await bufferCopyTradeOpened(
          user[0].id,
          accountNumber,
          {
            providerName: copyInfo.providerName,
            symbol,
            type,
            volume: volume ? parseFloat(volume.toString()) : 0
          },
          user[0].language || "pt-BR"
        );

      } else {
        // Trade manual
        console.log(`🟢 Trade aberto: ${ticket} - ${symbol} ${type} ${volume} lotes`);
        
        // Buscar chatId do Telegram
        const [telegramUser] = await db
          .select()
          .from(telegramUsers)
          .where(eq(telegramUsers.userId, user[0].id))
          .limit(1);

        if (telegramUser && telegramUser.chatId && telegramUser.isActive) {
          // Enviar notificação via Telegram
          await telegramService.sendTradeOpened(
            telegramUser.chatId,
            accountNumber,
            {
              ticket: ticket.toString(),
              symbol,
              type,
              volume: volume ? parseFloat(volume.toString()) : 0,
              openPrice: openPrice ? parseFloat(openPrice.toString()) : 0,
              sl: sl ? parseFloat(sl.toString()) : 0,
              tp: tp ? parseFloat(tp.toString()) : 0
            },
            user[0].language || "pt-BR",
            user[0].id
          );
        } else {
          console.log(`[MT4 Lite] Usuário ${user[0].id} não tem Telegram ativo`);
        }
      }
      
      notificationSent = true;
      
    } else if (eventType === "closed") {
      // Detectar copy trade usando função helper
      const copyInfo = detectCopyTrade(comment);
      
      // Trade fechado
      console.log(`🔴 Trade fechado: ${ticket} - Symbol: ${symbol} - Profit: ${profit} - Comment: "${comment}" - IsCopyTrade: ${copyInfo.isCopyTrade}`);
      
      // Determinar se foi TP ou SL
      const profitValue = profit ? parseFloat(profit.toString()) : 0;
      const isTakeProfit = profitValue > 0;
      const isStopLoss = profitValue < 0;
      
      // Enviar notificação
      
      if (copyInfo.isCopyTrade && isTakeProfit) {
        // Copy trade fechado com lucro
        const isCentAccount = account[0].isCentAccount || false;
        const adjustedProfit = isCentAccount ? profitValue / 100 : profitValue;
        
        // Adicionar ao buffer para agrupar
        const { bufferCopyTradeClosed } = await import("../services/copy-trade-notification-buffer");
        await bufferCopyTradeClosed(
          user[0].id,
          accountNumber,
          {
            providerName: copyInfo.providerName,
            symbol,
            type,
            profit: adjustedProfit
          },
          user[0].language || "pt-BR"
        );
      } else if (isTakeProfit) {
        // Trade manual fechado com lucro
        const isCentAccount = account[0].isCentAccount || false;
        const adjustedProfit = isCentAccount ? profitValue / 100 : profitValue;
        
        // Buscar chatId do Telegram
        const [telegramUser] = await db
          .select()
          .from(telegramUsers)
          .where(eq(telegramUsers.userId, user[0].id))
          .limit(1);

        if (telegramUser && telegramUser.chatId && telegramUser.isActive) {
          // Buscar moeda de preferência do usuário
          const userCurrency = settings?.displayCurrency || user[0].currency || "USD";
          
          // Calcular conversão de moeda se necessário
          let profitConverted: number | undefined;
          let exchangeRate: number | undefined;
          
          if (userCurrency && userCurrency !== "USD") {
            try {
              const { convertCurrency } = await import("../services/currency-converter");
              profitConverted = await convertCurrency(adjustedProfit, "USD", userCurrency as any);
              exchangeRate = profitConverted / adjustedProfit;
              console.log(`[MT4 Lite] Conversão: ${adjustedProfit} USD -> ${profitConverted} ${userCurrency} (taxa: ${exchangeRate})`);
            } catch (error) {
              console.error(`[MT4 Lite] Erro ao converter moeda:`, error);
            }
          }
          
          // Enviar notificação via Telegram
          await telegramService.sendTradeTakeProfit(
            telegramUser.chatId,
            accountNumber,
            {
              ticket: ticket.toString(),
              symbol,
              type,
              profit: adjustedProfit,
              profitConverted,
              closePrice: closePrice ? parseFloat(closePrice.toString()) : 0
            },
            userCurrency,
            user[0].language || "pt-BR",
            exchangeRate,
            user[0].id
          );
        } else {
          console.log(`[MT4 Lite] Usuário ${user[0].id} não tem Telegram ativo`);
        }

      } else if (copyInfo.isCopyTrade && isStopLoss) {
        // Copy trade fechado com prejuízo
        const isCentAccount = account[0].isCentAccount || false;
        const adjustedLoss = isCentAccount ? profitValue / 100 : profitValue;
        
        // Adicionar ao buffer para agrupar
        const { bufferCopyTradeClosed } = await import("../services/copy-trade-notification-buffer");
        await bufferCopyTradeClosed(
          user[0].id,
          accountNumber,
          {
            providerName: copyInfo.providerName,
            symbol,
            type,
            profit: adjustedLoss
          },
          user[0].language || "pt-BR"
        );

      } else if (isStopLoss) {
        // Trade manual fechado com prejuízo
        const isCentAccount = account[0].isCentAccount || false;
        const adjustedLoss = isCentAccount ? profitValue / 100 : profitValue;
        
        // Buscar chatId do Telegram
        const [telegramUser] = await db
          .select()
          .from(telegramUsers)
          .where(eq(telegramUsers.userId, user[0].id))
          .limit(1);

        if (telegramUser && telegramUser.chatId && telegramUser.isActive) {
          // Buscar moeda de preferência do usuário
          const userCurrency = settings?.displayCurrency || user[0].currency || "USD";
          
          // Calcular conversão de moeda se necessário
          let profitConverted: number | undefined;
          let exchangeRate: number | undefined;
          
          if (userCurrency && userCurrency !== "USD") {
            try {
              const { convertCurrency } = await import("../services/currency-converter");
              profitConverted = await convertCurrency(adjustedLoss, "USD", userCurrency as any);
              exchangeRate = profitConverted / adjustedLoss;
              console.log(`[MT4 Lite] Conversão: ${adjustedLoss} USD -> ${profitConverted} ${userCurrency} (taxa: ${exchangeRate})`);
            } catch (error) {
              console.error(`[MT4 Lite] Erro ao converter moeda:`, error);
            }
          }
          
          // Enviar notificação via Telegram
          await telegramService.sendTradeStopLoss(
            telegramUser.chatId,
            accountNumber,
            {
              ticket: ticket.toString(),
              symbol,
              type,
              profit: adjustedLoss,
              profitConverted,
              closePrice: closePrice ? parseFloat(closePrice.toString()) : 0
            },
            userCurrency,
            user[0].language || "pt-BR",
            exchangeRate,
            user[0].id
          );
        } else {
          console.log(`[MT4 Lite] Usuário ${user[0].id} não tem Telegram ativo`);
        }

      }
      
      notificationSent = true;
    }
    
    console.log(`[MT4 Lite] Evento processado com sucesso - Notificação enviada: ${notificationSent}`);
    
    res.json({ 
      success: true, 
      notificationSent 
    });
    
  } catch (error: any) {
    console.error("[MT4 Lite] Erro ao processar evento de trade:", error);
    console.error("[MT4 Lite] Stack trace:", error.stack);
    res.status(500).json({ 
      success: false, 
      error: "Erro ao processar evento de trade",
      details: error.message 
    });
  }
});

export default router;
