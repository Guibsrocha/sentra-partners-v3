import { getDb } from "../db";
import { telegramUsers, userSettings, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { telegramService } from "./telegram-notifications";

/**
 * Helper para enviar notificações Telegram com verificação de configurações
 */

interface NotificationConfig {
  userId: number;
  type: 
    | "trade" 
    | "copyTrade" 
    | "drawdown" 
    | "connection" 
    | "vpsExpiring" 
    | "subscriptionExpiring" 
    | "eaExpiring" 
    | "daily" 
    | "weekly";
}

/**
 * Verifica se o usuário tem Telegram configurado e a notificação está habilitada
 */
async function canSendNotification(config: NotificationConfig): Promise<{
  canSend: boolean;
  chatId?: string;
  language?: string;
}> {
  try {
    const db = await getDb();

    // Buscar configurações do Telegram
    const [telegram] = await db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, config.userId))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      console.log(`[Telegram Helper] Usuário ${config.userId} não tem Telegram vinculado`);
      return { canSend: false };
    }

    // Buscar configurações de notificações
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, config.userId))
      .limit(1);

    // Verificar se a notificação específica está habilitada
    let isEnabled = true;
    
    if (settings) {
      switch (config.type) {
        case "trade":
          isEnabled = settings.ntfyTradesEnabled ?? true;
          break;
        case "copyTrade":
          isEnabled = settings.ntfyCopyTradeEnabled ?? true;
          break;
        case "drawdown":
          isEnabled = settings.ntfyDrawdownEnabled ?? true;
          break;
        case "connection":
          isEnabled = settings.ntfyConnectionEnabled ?? true;
          break;
        case "vpsExpiring":
          isEnabled = settings.ntfyVpsExpiringEnabled ?? true;
          break;
        case "subscriptionExpiring":
          isEnabled = settings.ntfySubscriptionExpiringEnabled ?? true;
          break;
        case "eaExpiring":
          isEnabled = settings.ntfyEaExpiringEnabled ?? true;
          break;
        case "daily":
          isEnabled = settings.ntfyDailyEnabled ?? true;
          break;
        case "weekly":
          isEnabled = settings.ntfyWeeklyEnabled ?? true;
          break;
      }
    }

    if (!isEnabled) {
      console.log(`[Telegram Helper] Notificação ${config.type} desabilitada para usuário ${config.userId}`);
      return { canSend: false };
    }

    // Buscar idioma do usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, config.userId))
      .limit(1);

    const language = user?.language || "pt-BR";

    return {
      canSend: true,
      chatId: telegram.chatId,
      language
    };
  } catch (error) {
    console.error(`[Telegram Helper] Erro ao verificar configurações:`, error);
    return { canSend: false };
  }
}

/**
 * Envia notificação de drawdown
 */
export async function sendDrawdownAlert(
  userId: number,
  data: {
    accountNumber: string;
    drawdownPercent: number;
    currentBalance: number;
    initialBalance: number;
  },
  currency: string = "USD",
  alertType: 'individual' | 'consolidated' = 'consolidated'
): Promise<boolean> {
  const check = await canSendNotification({ userId, type: "drawdown" });
  
  if (!check.canSend || !check.chatId) {
    return false;
  }

  return await telegramService.sendDrawdownAlert(
    check.chatId,
    data,
    currency,
    check.language || "pt-BR",
    userId,
    alertType
  );
}

/**
 * Envia notificação de conta conectada
 */
export async function sendAccountConnected(
  userId: number,
  data: {
    accountNumber: string;
    broker: string;
    platform: string;
  }
): Promise<boolean> {
  const check = await canSendNotification({ userId, type: "connection" });
  
  if (!check.canSend || !check.chatId) {
    return false;
  }

  return await telegramService.sendAccountConnected(
    check.chatId,
    data,
    check.language || "pt-BR"
  );
}

/**
 * Envia notificação de VPS expirando
 */
export async function sendVpsExpiring(
  userId: number,
  data: {
    vpsName: string;
    daysRemaining: number;
    expirationDate: string;
  }
): Promise<boolean> {
  const check = await canSendNotification({ userId, type: "vpsExpiring" });
  
  if (!check.canSend || !check.chatId) {
    return false;
  }

  return await telegramService.sendVpsExpiring(
    check.chatId,
    data,
    check.language || "pt-BR"
  );
}

/**
 * Envia notificação de assinatura expirando
 */
export async function sendSubscriptionExpiring(
  userId: number,
  data: {
    planName: string;
    daysRemaining: number;
    expirationDate: string;
  }
): Promise<boolean> {
  const check = await canSendNotification({ userId, type: "subscriptionExpiring" });
  
  if (!check.canSend || !check.chatId) {
    return false;
  }

  return await telegramService.sendSubscriptionExpiring(
    check.chatId,
    data,
    check.language || "pt-BR"
  );
}

/**
 * Envia notificação de EA expirando
 */
export async function sendEaExpiring(
  userId: number,
  data: {
    eaName: string;
    daysRemaining: number;
    expirationDate: string;
  }
): Promise<boolean> {
  const check = await canSendNotification({ userId, type: "eaExpiring" });
  
  if (!check.canSend || !check.chatId) {
    return false;
  }

  return await telegramService.sendEaExpiring(
    check.chatId,
    data,
    check.language || "pt-BR"
  );
}

/**
 * Envia alerta genérico
 */
export async function sendAlertNotification(
  userId: number,
  data: {
    title: string;
    message: string;
    priority?: "low" | "default" | "high" | "urgent";
  }
): Promise<boolean> {
  const check = await canSendNotification({ userId, type: "trade" }); // Usa config de trades para alertas genéricos
  
  if (!check.canSend || !check.chatId) {
    return false;
  }

  return await telegramService.sendAlertNotification(
    check.chatId,
    data,
    check.language || "pt-BR"
  );
}


/**
 * Envia notificação para administradores
 * Busca todos os usuários com role 'admin' e envia notificação
 */
async function sendToAdmins(
  notificationFn: (chatId: string, language: string) => Promise<boolean>
): Promise<number> {
  try {
    const db = await getDb();

    // Buscar todos os admins
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));

    if (admins.length === 0) {
      console.log("[Telegram Helper] Nenhum admin encontrado");
      return 0;
    }

    let sentCount = 0;

    for (const admin of admins) {
      // Buscar Telegram do admin
      const [telegram] = await db
        .select()
        .from(telegramUsers)
        .where(eq(telegramUsers.userId, admin.id))
        .limit(1);

      if (!telegram || !telegram.chatId || !telegram.isActive) {
        console.log(`[Telegram Helper] Admin ${admin.id} não tem Telegram vinculado`);
        continue;
      }

      const success = await notificationFn(telegram.chatId, admin.language || "pt-BR");
      if (success) {
        sentCount++;
      }
    }

    console.log(`[Telegram Helper] Notificação enviada para ${sentCount}/${admins.length} admins`);
    return sentCount;
  } catch (error) {
    console.error(`[Telegram Helper] Erro ao enviar notificação para admins:`, error);
    return 0;
  }
}

/**
 * Envia notificação de nova compra para admins
 */
export async function sendAdminNewPurchase(data: {
  userName: string;
  userEmail: string;
  productName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}): Promise<number> {
  return await sendToAdmins(async (chatId, language) => {
    return await telegramService.sendAdminNewPurchase(chatId, data, language);
  });
}

/**
 * Envia notificação de assinatura renovada para admins
 */
export async function sendAdminSubscriptionRenewed(data: {
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  currency: string;
  renewalDate: string;
}): Promise<number> {
  return await sendToAdmins(async (chatId, language) => {
    return await telegramService.sendAdminSubscriptionRenewed(chatId, data, language);
  });
}

/**
 * Envia notificação de nova assinatura para admins
 */
export async function sendAdminNewSubscription(data: {
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  currency: string;
  startDate: string;
}): Promise<number> {
  return await sendToAdmins(async (chatId, language) => {
    return await telegramService.sendAdminNewSubscription(chatId, data, language);
  });
}

/**
 * Envia relatório diário para um usuário específico
 */
export async function sendDailyReportToUser(userId: number): Promise<boolean> {
  try {
    const db = await getDb();

    // Buscar chat ID do usuário
    const [telegramUser] = await db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, userId))
      .limit(1);

    if (!telegramUser || !telegramUser.chatId || !telegramUser.isActive) {
      console.log(`[Telegram Helper] Usuário ${userId} não tem Telegram vinculado`);
      return false;
    }

    // Buscar idioma e moeda do usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const language = user?.language || "pt-BR";
    
    // Buscar moeda preferida do usuário
    const { userSettings } = await import("../../drizzle/schema");
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    
    const currency = settings?.displayCurrency || "USD";

    // Calcular estatísticas do dia
    const { trades: tradesTable } = await import("../../drizzle/schema");
    const { and, gte, lt } = await import("drizzle-orm");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const trades = await db
      .select()
      .from(tradesTable)
      .where(
        and(
          eq(tradesTable.userId, userId),
          gte(tradesTable.openTime, today),
          lt(tradesTable.openTime, tomorrow)
        )
      );

    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.profit && t.profit > 0).length;
    const losingTrades = trades.filter(t => t.profit && t.profit < 0).length;
    const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0) / 100; // Converter de centavos para reais
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    console.log(`[Telegram Helper] Relatório diário - Trades: ${totalTrades}, Ganhos: ${winningTrades}, Perdas: ${losingTrades}, Lucro: ${totalProfit}, WinRate: ${winRate}%`);

    // Enviar relatório
    return await telegramService.sendDailyReport(
      telegramUser.chatId,
      {
        totalTrades,
        winningTrades,
        losingTrades,
        totalProfit,
        winRate
      },
      currency,
      language
    );
  } catch (error) {
    console.error(`[Telegram Helper] Erro ao enviar relatório diário para usuário ${userId}:`, error);
    return false;
  }
}

/**
 * Envia relatório semanal para um usuário específico
 */
export async function sendWeeklyReportToUser(userId: number): Promise<boolean> {
  try {
    const db = await getDb();

    // Buscar chat ID do usuário
    const [telegramUser] = await db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, userId))
      .limit(1);

    if (!telegramUser || !telegramUser.chatId || !telegramUser.isActive) {
      console.log(`[Telegram Helper] Usuário ${userId} não tem Telegram vinculado`);
      return false;
    }

    // Buscar idioma e moeda do usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const language = user?.language || "pt-BR";
    
    // Buscar moeda preferida do usuário
    const { userSettings } = await import("../../drizzle/schema");
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    
    const currency = settings?.displayCurrency || "USD";

    // Calcular estatísticas da semana
    const { trades: tradesTable } = await import("../../drizzle/schema");
    const { and, gte } = await import("drizzle-orm");
    
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const trades = await db
      .select()
      .from(tradesTable)
      .where(
        and(
          eq(tradesTable.userId, userId),
          gte(tradesTable.openTime, weekAgo)
        )
      );

    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.profit && t.profit > 0).length;
    const losingTrades = trades.filter(t => t.profit && t.profit < 0).length;
    const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0) / 100; // Converter de centavos para reais
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    console.log(`[Telegram Helper] Relatório semanal - Trades: ${totalTrades}, Ganhos: ${winningTrades}, Perdas: ${losingTrades}, Lucro: ${totalProfit}, WinRate: ${winRate}%`);

    // Enviar relatório
    return await telegramService.sendWeeklyReport(
      telegramUser.chatId,
      {
        totalTrades,
        winningTrades,
        losingTrades,
        totalProfit,
        winRate
      },
      currency,
      language
    );
  } catch (error) {
    console.error(`[Telegram Helper] Erro ao enviar relatório semanal para usuário ${userId}:`, error);
    return false;
  }
}

/**
 * Envia relatório mensal para um usuário específico (mês passado)
 */
export async function sendMonthlyReportToUser(userId: number): Promise<boolean> {
  try {
    const db = await getDb();

    // Buscar chat ID do usuário
    const [telegramUser] = await db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, userId))
      .limit(1);

    if (!telegramUser || !telegramUser.chatId || !telegramUser.isActive) {
      console.log(`[Telegram Helper] Usuário ${userId} não tem Telegram vinculado`);
      return false;
    }

    // Buscar idioma e moeda do usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const language = user?.language || "pt-BR";
    
    // Buscar moeda preferida do usuário
    const { userSettings } = await import("../../drizzle/schema");
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    
    const currency = settings?.displayCurrency || "USD";

    // Calcular estatísticas do mês passado
    const { trades: tradesTable } = await import("../../drizzle/schema");
    const { and, gte, lt } = await import("drizzle-orm");
    
    const today = new Date();
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const trades = await db
      .select()
      .from(tradesTable)
      .where(
        and(
          eq(tradesTable.userId, userId),
          gte(tradesTable.openTime, firstDayLastMonth),
          lt(tradesTable.openTime, firstDayThisMonth)
        )
      );

    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.profit && t.profit > 0).length;
    const losingTrades = trades.filter(t => t.profit && t.profit < 0).length;
    const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0) / 100; // Converter de centavos para reais
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    console.log(`[Telegram Helper] Relatório mensal - Trades: ${totalTrades}, Ganhos: ${winningTrades}, Perdas: ${losingTrades}, Lucro: ${totalProfit}, WinRate: ${winRate}%`);

    // Enviar relatório
    return await telegramService.sendMonthlyReport(
      telegramUser.chatId,
      {
        totalTrades,
        winningTrades,
        losingTrades,
        totalProfit,
        winRate
      },
      currency,
      language
    );
  } catch (error) {
    console.error(`[Telegram Helper] Erro ao enviar relatório mensal para usuário ${userId}:`, error);
    return false;
  }
}
