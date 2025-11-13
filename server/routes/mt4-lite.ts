import { Router } from "express";
import { getDb } from "../db";
import { users, tradingAccounts, telegramUsers, userSettings } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { telegramService } from "../services/telegram-notifications";

const router = Router();

//+------------------------------------------------------------------+
//| POST /api/mt/trade-event                                         |
//| SISTEMA SIMPLIFICADO - SEM VERIFICAÇÕES COMPLEXAS                |
//| Lógica igual às notificações que funcionam (lucro mensal, etc)  |
//+------------------------------------------------------------------+
router.post("/trade-event", async (req, res) => {
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
    
    console.log(`[MT4 Lite NEW] 📥 Evento recebido: ${eventType} | Ticket: ${ticket} | Symbol: ${symbol}`);
    
    // Validação básica
    if (!email || !accountNumber || !ticket || !eventType) {
      console.error("[MT4 Lite NEW] ❌ Parâmetros faltando");
      return res.status(400).json({ success: false, error: "Parâmetros obrigatórios faltando" });
    }
    
    const db = await getDb();
    
    // Buscar usuário
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      console.error(`[MT4 Lite NEW] ❌ Usuário não encontrado: ${email}`);
      return res.status(404).json({ success: false, error: "Usuário não encontrado" });
    }
    
    // Buscar conta
    const [account] = await db.select().from(tradingAccounts)
      .where(and(
        eq(tradingAccounts.userId, user.id),
        eq(tradingAccounts.accountNumber, accountNumber)
      ))
      .limit(1);
    
    if (!account) {
      console.error(`[MT4 Lite NEW] ❌ Conta não encontrada: ${accountNumber}`);
      return res.status(404).json({ success: false, error: "Conta não encontrada" });
    }
    
    // Buscar Telegram
    const [telegramUser] = await db.select().from(telegramUsers)
      .where(eq(telegramUsers.userId, user.id))
      .limit(1);
    
    if (!telegramUser || !telegramUser.chatId || !telegramUser.isActive) {
      console.log(`[MT4 Lite NEW] ⚠️ Telegram não ativo para usuário ${user.id}`);
      return res.json({ success: true, notificationSent: false, reason: 'telegram_not_active' });
    }
    
    // Buscar configurações
    const [settings] = await db.select().from(userSettings)
      .where(eq(userSettings.userId, user.id))
      .limit(1);
    
    const userCurrency = settings?.displayCurrency || user.currency || "USD";
    const language = user.language || "pt-BR";
    
    // PROCESSAR EVENTO
    if (eventType === "opened") {
      // ========== TRADE ABERTO ==========
      console.log(`[MT4 Lite NEW] 🟢 Enviando notificação de ABERTURA - Ticket: ${ticket}`);
      
      await telegramService.sendTradeOpened(
        telegramUser.chatId,
        accountNumber,
        {
          ticket: ticket.toString(),
          symbol,
          type,
          volume: parseFloat(volume.toString()) || 0,
          openPrice: parseFloat(openPrice.toString()) || 0,
          sl: sl ? parseFloat(sl.toString()) : undefined,
          tp: tp ? parseFloat(tp.toString()) : undefined
        },
        language,
        user.id
      );
      
      console.log(`[MT4 Lite NEW] ✅ Notificação de ABERTURA enviada com sucesso!`);
      
    } else if (eventType === "closed") {
      // ========== TRADE FECHADO ==========
      const profitValue = parseFloat(profit.toString()) || 0;
      const isCentAccount = account.isCentAccount || false;
      const adjustedProfit = isCentAccount ? profitValue / 100 : profitValue;
      
      console.log(`[MT4 Lite NEW] 🔴 Enviando notificação de FECHAMENTO - Ticket: ${ticket} | Profit: ${adjustedProfit}`);
      
      // Calcular conversão de moeda se necessário
      let profitConverted: number | undefined;
      let exchangeRate: number | undefined;
      
      if (userCurrency !== "USD") {
        try {
          const { convertCurrency } = await import("../services/currency-converter");
          profitConverted = await convertCurrency(adjustedProfit, "USD", userCurrency as any);
          exchangeRate = profitConverted / adjustedProfit;
          console.log(`[MT4 Lite NEW] 💱 Conversão: ${adjustedProfit} USD -> ${profitConverted} ${userCurrency}`);
        } catch (error) {
          console.error(`[MT4 Lite NEW] ❌ Erro ao converter moeda:`, error);
        }
      }
      
      // Enviar notificação (TP ou SL)
      if (adjustedProfit > 0) {
        // TAKE PROFIT
        await telegramService.sendTradeTakeProfit(
          telegramUser.chatId,
          accountNumber,
          {
            ticket: ticket.toString(),
            symbol,
            type,
            volume: parseFloat(volume.toString()) || 0,
            openPrice: parseFloat(openPrice.toString()) || 0,
            closePrice: parseFloat(closePrice.toString()) || 0,
            profit: adjustedProfit,
            profitConverted,
            exchangeRate
          },
          userCurrency,
          language,
          exchangeRate,
          user.id
        );
        console.log(`[MT4 Lite NEW] ✅ Notificação de TAKE PROFIT enviada!`);
      } else {
        // STOP LOSS
        await telegramService.sendTradeStopLoss(
          telegramUser.chatId,
          accountNumber,
          {
            ticket: ticket.toString(),
            symbol,
            type,
            volume: parseFloat(volume.toString()) || 0,
            openPrice: parseFloat(openPrice.toString()) || 0,
            closePrice: parseFloat(closePrice.toString()) || 0,
            profit: adjustedProfit, // Valor negativo (perda)
            profitConverted: profitConverted, // Já convertido
            exchangeRate
          },
          userCurrency,
          language,
          exchangeRate,
          user.id
        );
        console.log(`[MT4 Lite NEW] ✅ Notificação de STOP LOSS enviada!`);
      }
    }
    
    return res.json({ 
      success: true, 
      notificationSent: true,
      message: "Notificação enviada com sucesso!"
    });
    
  } catch (error) {
    console.error("[MT4 Lite NEW] ❌ ERRO:", error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    });
  }
});

export default router;
