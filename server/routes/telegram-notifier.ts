import { Router } from "express";
import { getDb } from "../db";
import { telegramUsers, users, notificationHistory } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { telegramService } from "../services/telegram-notifications";
// Cache em memória removido - usando apenas banco de dados permanente

const router = Router();

/**
 * Endpoint para receber notificações do EA Sentra Telegram Notifier
 * POST /api/telegram/trade-notification
 */
router.post("/trade-notification", async (req, res) => {
  try {
    const {
      token,
      event,
      isCopyTrade,
      ticket,
      symbol,
      type,
      volume,
      openPrice,
      closePrice,
      sl,
      tp,
      profit,
      comment,
      accountNumber,
    } = req.body;

    console.log(
      `[Telegram Notifier] 📥 Recebido: ${event} - Ticket: ${ticket}, isCopyTrade: ${isCopyTrade}`
    );

    if (!token) {
      return res.status(400).json({ error: "Token não fornecido" });
    }

    // Buscar usuário pelo token
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database não disponível" });
    }

    const [telegramUser] = await db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.telegramToken, token))
      .limit(1);

    if (!telegramUser) {
      console.log(`[Telegram Notifier] ❌ Token inválido: ${token}`);
      return res.status(404).json({ error: "Token inválido" });
    }

    if (!telegramUser.chatId || !telegramUser.isActive) {
      console.log(
        `[Telegram Notifier] ❌ Telegram não ativo para userId: ${telegramUser.userId}`
      );
      return res
        .status(400)
        .json({ error: "Telegram não vinculado ou inativo" });
    }

    // Buscar idioma do usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, telegramUser.userId))
      .limit(1);

    const language = user?.language || "pt-BR";

    // Verificar duplicação no banco de dados (MEMÓRIA PERMANENTE)
    // Sistema usa APENAS banco de dados para garantir persistência total
    // Sem cache temporário - notificações são lembradas para sempre (até limpeza automática)
    const notificationType = event === "OPENED" ? "trade_opened" : 
                            (profit && parseFloat(profit.toString()) > 0 ? "trade_closed_tp" : "trade_closed_sl");
    
    // Verificação por tipo específico
    const existingNotification = await db
      .select()
      .from(notificationHistory)
      .where(and(
        eq(notificationHistory.userId, telegramUser.userId),
        eq(notificationHistory.accountNumber, accountNumber),
        eq(notificationHistory.ticket, ticket.toString()),
        eq(notificationHistory.type, notificationType)
      ))
      .limit(1);
    
    if (existingNotification.length > 0) {
      console.log(`[Telegram Notifier] ⚠️ Notificação duplicada bloqueada (banco de dados): ${ticket}`);
      console.log(`[Telegram Notifier] Notificação original enviada em: ${existingNotification[0].sentAt}`);
      return res.json({ 
        success: true, 
        message: "Notificação duplicada bloqueada (banco de dados)",
        originalSentAt: existingNotification[0].sentAt
      });
    }
    
    // Verificação por ticket (qualquer tipo)
    const existingTicketNotification = await db
      .select()
      .from(notificationHistory)
      .where(and(
        eq(notificationHistory.userId, telegramUser.userId),
        eq(notificationHistory.accountNumber, accountNumber),
        eq(notificationHistory.ticket, ticket.toString())
      ))
      .limit(1);
    
    if (existingTicketNotification.length > 0) {
      console.log(`[Telegram Notifier] ⚠️ Ticket já notificado: ${ticket}`);
      console.log(`[Telegram Notifier] Tipo anterior: ${existingTicketNotification[0].type} - Enviada em: ${existingTicketNotification[0].sentAt}`);
      return res.json({ 
        success: true, 
        message: "Ticket já notificado anteriormente",
        previousType: existingTicketNotification[0].type,
        originalSentAt: existingTicketNotification[0].sentAt
      });
    }

    // Enviar notificação
    if (event === "OPENED") {
      // Trade aberto
      if (isCopyTrade) {
        await telegramService.sendCopyTradeExecuted(
          telegramUser.chatId,
          accountNumber,
          {
            providerName: "Provider", // Extrair do comment se possível
            symbol,
            type,
            volume: parseFloat(volume),
          },
          language
        );
      } else {
        await telegramService.sendTradeOpened(
          telegramUser.chatId,
          accountNumber,
          {
            ticket,
            symbol,
            type,
            volume: parseFloat(volume),
            openPrice: parseFloat(openPrice),
            sl: sl ? parseFloat(sl) : undefined,
            tp: tp ? parseFloat(tp) : undefined,
          },
          language
        );
      }
    } else if (event === "CLOSED") {
      // Trade fechado
      if (isCopyTrade) {
        await telegramService.sendCopyTradeClosed(
          telegramUser.chatId,
          accountNumber,
          {
            providerName: "Provider",
            symbol,
            type,
            profit: parseFloat(profit),
          },
          language
        );
      } else {
        await telegramService.sendTradeClosed(
          telegramUser.chatId,
          accountNumber,
          {
            ticket,
            symbol,
            type,
            openPrice: parseFloat(openPrice),
            closePrice: parseFloat(closePrice),
            profit: parseFloat(profit),
          },
          "USD",
          language
        );
      }
    }

    console.log(
      `[Telegram Notifier] ✅ Notificação enviada: ${event} - Ticket: ${ticket}`
    );
    return res.json({ success: true });
  } catch (error) {
    console.error("[Telegram Notifier] ❌ Erro:", error);
    return res.status(500).json({
      error: "Erro ao processar notificação",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
