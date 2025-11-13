import { getDb } from "../db";
import { notificationHistory } from "../../drizzle/schema";
import { and, eq, gte } from "drizzle-orm";

/**
 * Verifica se pode enviar alerta de drawdown
 * Permite no máximo 2 alertas por dia, espaçados por 12 horas
 */
export async function canSendDrawdownAlert(
  userId: number,
  accountNumber: string,
  alertType: 'individual' | 'consolidated'
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Buscar últimos alertas de drawdown nas últimas 24 horas
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const recentAlerts = await db
      .select()
      .from(notificationHistory)
      .where(
        and(
          eq(notificationHistory.userId, userId),
          eq(notificationHistory.type, 'drawdown_alert'),
          eq(notificationHistory.accountNumber, accountNumber),
          eq(notificationHistory.eventType, alertType),
          gte(notificationHistory.sentAt, yesterday)
        )
      )
      .orderBy(notificationHistory.sentAt);

    // Se não tem alertas, pode enviar
    if (recentAlerts.length === 0) {
      return true;
    }

    // Se já enviou 2 ou mais alertas nas últimas 24h, não pode enviar
    if (recentAlerts.length >= 2) {
      return false;
    }

    // Se enviou 1 alerta, verifica se já passaram 12 horas
    const lastAlert = recentAlerts[recentAlerts.length - 1];
    const hoursSinceLastAlert = (Date.now() - lastAlert.sentAt.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastAlert >= 12;
  } catch (error) {
    console.error('[DrawdownAlert] Erro ao verificar se pode enviar alerta:', error);
    return false;
  }
}
