import { getDb } from "../db";
import { economicEvents, users, userSettings, telegramUsers, economicEventNotifications } from "../../drizzle/schema";
import { gte, lte, eq, and } from "drizzle-orm";
import { telegramService } from "./telegram-notifications";
import nodemailer from "nodemailer";

/**
 * Serviço de notificações de calendário econômico
 * Envia alertas de eventos HIGH impact via Telegram e Email
 */

interface EconomicEventNotification {
  eventId: number;
  eventTime: Date;
  currency: string;
  eventName: string;
  impact: string;
  previousValue: string | null;
  forecastValue: string | null;
}

/**
 * Busca eventos econômicos de alto impacto nas próximas horas
 */
export async function getUpcomingHighImpactEvents(
  hoursAhead: number = 1
): Promise<EconomicEventNotification[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  try {
    const events = await db
      .select()
      .from(economicEvents)
      .where(
        and(
          eq(economicEvents.impact, "high"),
          gte(economicEvents.eventTime, now),
          lte(economicEvents.eventTime, futureTime)
        )
      );

    return events.map(event => ({
      eventId: event.id,
      eventTime: event.eventTime,
      currency: event.currency,
      eventName: event.eventName,
      impact: event.impact,
      previousValue: event.previousValue,
      forecastValue: event.forecastValue,
    }));
  } catch (error) {
    console.error("[Economic Calendar] Erro ao buscar eventos:", error);
    return [];
  }
}

/**
 * Formata mensagem de alerta de evento econômico
 */
function formatEconomicEventMessage(
  event: EconomicEventNotification,
  language: string = "pt-BR",
  minutesAhead: number = 60
): string {
  const timeStr = event.eventTime.toLocaleString(language, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo", // GMT-3
  });

  const dateStr = event.eventTime.toLocaleDateString(language, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  const messages = {
    "pt-BR": `
🔴 <b>ALERTA DE EVENTO ECONÔMICO</b>

<b>Evento:</b> ${event.eventName}
<b>Moeda:</b> ${event.currency}
<b>Impacto:</b> ⚠️ ALTO
<b>Horário:</b> ${timeStr} (${dateStr})
<b>Em:</b> ${minutesAhead} minutos

${event.previousValue ? `<b>Anterior:</b> ${event.previousValue}` : ""}
${event.forecastValue ? `<b>Previsão:</b> ${event.forecastValue}` : ""}

<i>⚠️ Prepare-se! Este evento pode causar alta volatilidade no mercado.</i>
    `.trim(),
    "en-US": `
🔴 <b>ECONOMIC EVENT ALERT</b>

<b>Event:</b> ${event.eventName}
<b>Currency:</b> ${event.currency}
<b>Impact:</b> ⚠️ HIGH
<b>Time:</b> ${timeStr} (${dateStr})
<b>In:</b> ${minutesAhead} minutes

${event.previousValue ? `<b>Previous:</b> ${event.previousValue}` : ""}
${event.forecastValue ? `<b>Forecast:</b> ${event.forecastValue}` : ""}

<i>⚠️ Get ready! This event may cause high market volatility.</i>
    `.trim(),
    "es-ES": `
🔴 <b>ALERTA DE EVENTO ECONÓMICO</b>

<b>Evento:</b> ${event.eventName}
<b>Moneda:</b> ${event.currency}
<b>Impacto:</b> ⚠️ ALTO
<b>Hora:</b> ${timeStr} (${dateStr})
<b>En:</b> ${minutesAhead} minutos

${event.previousValue ? `<b>Anterior:</b> ${event.previousValue}` : ""}
${event.forecastValue ? `<b>Pronóstico:</b> ${event.forecastValue}` : ""}

<i>⚠️ ¡Prepárate! Este evento puede causar alta volatilidad en el mercado.</i>
    `.trim(),
  };

  return messages[language as keyof typeof messages] || messages["pt-BR"];
}

/**
 * Envia notificação via Telegram
 */
async function sendTelegramNotification(
  userId: number,
  event: EconomicEventNotification,
  minutesAhead: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Buscar configurações do Telegram
    const [telegram] = await db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, userId))
      .limit(1);

    if (!telegram || !telegram.chatId || !telegram.isActive) {
      console.log(`[Economic Calendar] Usuário ${userId} não tem Telegram configurado`);
      return false;
    }

    // Buscar idioma do usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const language = user?.language || "pt-BR";
    const message = formatEconomicEventMessage(event, language, minutesAhead);

    // Enviar via Telegram
    return await telegramService.sendMessage(telegram.chatId, message, "HTML");
  } catch (error) {
    console.error(`[Economic Calendar] Erro ao enviar Telegram para userId ${userId}:`, error);
    return false;
  }
}

/**
 * Envia notificação via Email
 */
async function sendEmailNotification(
  userId: number,
  event: EconomicEventNotification,
  minutesAhead: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Buscar email do usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.email) {
      console.log(`[Economic Calendar] Usuário ${userId} não tem email configurado`);
      return false;
    }

    // Configurar transporter (usar variáveis de ambiente)
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const timeStr = event.eventTime.toLocaleString(user.language || "pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });

    const dateStr = event.eventTime.toLocaleDateString(user.language || "pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    });

    const subject = `🔴 Alerta: ${event.eventName} em ${minutesAhead} minutos`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🔴 ALERTA DE EVENTO ECONÔMICO</h2>
        
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
          <p style="margin: 8px 0;"><strong>Evento:</strong> ${event.eventName}</p>
          <p style="margin: 8px 0;"><strong>Moeda:</strong> ${event.currency}</p>
          <p style="margin: 8px 0;"><strong>Impacto:</strong> ⚠️ ALTO</p>
          <p style="margin: 8px 0;"><strong>Horário:</strong> ${timeStr} (${dateStr})</p>
          <p style="margin: 8px 0;"><strong>Em:</strong> ${minutesAhead} minutos</p>
          
          ${event.previousValue ? `<p style="margin: 8px 0;"><strong>Anterior:</strong> ${event.previousValue}</p>` : ""}
          ${event.forecastValue ? `<p style="margin: 8px 0;"><strong>Previsão:</strong> ${event.forecastValue}</p>` : ""}
        </div>
        
        <p style="color: #dc2626; font-weight: bold;">
          ⚠️ Prepare-se! Este evento pode causar alta volatilidade no mercado.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        
        <p style="color: #6b7280; font-size: 12px;">
          Sentra Partners - Sistema de Alertas de Calendário Econômico
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Sentra Partners" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject,
      html,
    });

    console.log(`[Economic Calendar] Email enviado para ${user.email}`);
    return true;
  } catch (error) {
    console.error(`[Economic Calendar] Erro ao enviar email para userId ${userId}:`, error);
    return false;
  }
}

/**
 * Envia alertas de eventos econômicos para todos os usuários
 */
export async function sendEconomicEventAlerts(): Promise<void> {
  console.log("[Economic Calendar] Verificando eventos econômicos...");

  const db = await getDb();
  if (!db) {
    console.error("[Economic Calendar] Database não disponível");
    return;
  }

  try {
    // Buscar todos os usuários ativos
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.isActive, true));

    console.log(`[Economic Calendar] Encontrados ${allUsers.length} usuários ativos`);

    for (const user of allUsers) {
      // Buscar configurações do usuário
      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, user.id))
        .limit(1);

      // Tempo de antecedência configurado (padrão: 60 minutos)
      const minutesAhead = settings?.ntfyEconomicNewsTime || 60;
      const hoursAhead = minutesAhead / 60;

      // Verificar se alertas econômicos estão habilitados
      const economicAlertsEnabled = settings?.ntfyEconomicNewsEnabled ?? true;

      if (!economicAlertsEnabled) {
        console.log(`[Economic Calendar] Alertas desabilitados para usuário ${user.id}`);
        continue;
      }

      // Buscar eventos nas próximas X horas
      const events = await getUpcomingHighImpactEvents(hoursAhead);

      if (events.length === 0) {
        console.log(`[Economic Calendar] Nenhum evento encontrado para usuário ${user.id}`);
        continue;
      }

      console.log(`[Economic Calendar] ${events.length} eventos encontrados para usuário ${user.id}`);

      // Enviar notificações para cada evento
      for (const event of events) {
        // Verificar se já foi notificado (evitar duplicatas)
        const [existingNotification] = await db
          .select()
          .from(economicEventNotifications)
          .where(
            and(
              eq(economicEventNotifications.userId, user.id),
              eq(economicEventNotifications.eventId, event.eventId)
            )
          )
          .limit(1);

        if (existingNotification) {
          console.log(
            `[Economic Calendar] ⚠️ Notificação duplicada bloqueada: ` +
            `userId=${user.id}, eventId=${event.eventId}, ` +
            `notificado em ${existingNotification.notifiedAt}`
          );
          continue; // Pular este evento
        }

        // Telegram
        const telegramSent = await sendTelegramNotification(user.id, event, minutesAhead);
        
        // Email
        const emailSent = await sendEmailNotification(user.id, event, minutesAhead);

        // Registrar notificação enviada
        if (telegramSent || emailSent) {
          await db.insert(economicEventNotifications).values({
            userId: user.id,
            eventId: event.eventId,
            eventTime: event.eventTime,
            eventName: event.eventName,
            currency: event.currency,
          });
        }

        console.log(
          `[Economic Calendar] Notificações enviadas para userId ${user.id}, evento ${event.eventId}: ` +
          `Telegram=${telegramSent}, Email=${emailSent}`
        );
      }
    }
  } catch (error) {
    console.error("[Economic Calendar] Erro ao processar alertas:", error);
  }
}
