import cron from "node-cron";
import { sendEconomicEventAlerts } from "../services/economic-calendar-notifications";

/**
 * Cron job para verificar e enviar alertas de eventos econômicos
 * Executa a cada 15 minutos
 */

let cronJob: cron.ScheduledTask | null = null;

export function startEconomicCalendarCron() {
  // Parar cron anterior se existir
  if (cronJob) {
    cronJob.stop();
  }

  // Executar a cada 15 minutos: */15 * * * *
  // Formato: minuto hora dia mês dia-da-semana
  cronJob = cron.schedule("*/15 * * * *", async () => {
    console.log("[Cron] Verificando eventos econômicos...");
    try {
      await sendEconomicEventAlerts();
      console.log("[Cron] Verificação de eventos econômicos concluída");
    } catch (error) {
      console.error("[Cron] Erro ao verificar eventos econômicos:", error);
    }
  });

  console.log("[Cron] Economic Calendar Cron iniciado (a cada 15 minutos)");
}

export function stopEconomicCalendarCron() {
  if (cronJob) {
    cronJob.stop();
    console.log("[Cron] Economic Calendar Cron parado");
  }
}
