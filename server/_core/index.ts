import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cron from "node-cron";
import net from "net";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import mtApiRouter from "../mt-api";
import newsApiRouter from "../news-api";
import eaLicenseRouter from "../routes/ea-license";
import checkoutRouter from "../routes/checkout";
import subscriptionsRouter from "../routes/subscriptions";
import mt4Router from "../routes/mt4";
import uploadRouter from "../routes/upload";
import settingsRouter from "../routes/settings";
import copyTradingRouter from "../routes/copy-trading";
import copyTradingSettingsRouter from "../routes/copy-trading-settings";
import copyTradingAutoRegisterRouter from "../routes/copy-trading-auto-register";
import signalProvidersRouter from "../routes/signal-providers";
import migrationsRouter from "../routes/migrations";
import websocketTestRouter from "../routes/websocket-test";
import vpsManagementRouter from "../routes/vps-management";
import adminVMsRouter from "../routes/admin-vms";
import vmAccountsRouter from "../routes/vm-accounts";
import copyTradingLimitsRouter from "../routes/copy-trading-limits";
import economicCalendarRouter from "../routes/economic-calendar";
import subscriptionPlansRouter from "../routes/subscription-plans";
import vpsProductsRouter from "../routes/vps-products";
import expertAdvisorsRouter from "../routes/expert-advisors";
import landingPageRouter from "../routes/landing-page";
import landingPagePixelsRouter from "../routes/landing-page-pixels";
import landingConfigRouter from "../routes/landing-config";
import appConfigRouter from "../routes/app-config";
import mt4LiteRouter from "../routes/mt4-lite";
import ensureTablesRouter from "../routes/ensure-tables";
import executeSqlRouter from "../routes/execute-sql";
import providerEarningsRouter from "../routes/provider-earnings";
import telegramRouter from "../routes/telegram";
import telegramNotifierRouter from "../routes/telegram-notifier";
import populateDataRouter from "../routes/populate-data";
import populateVpsEasRouter from "../routes/populate-vps-eas";
import landingProductsRouter from "../routes/landing-products";
import editLandingProductsRouter from "../routes/edit-landing-products";
import passwordResetRouter from "../routes/password-reset";
import createPasswordResetTableRouter from "../routes/create-password-reset-table";
import addLastTradeFieldRouter from "../routes/add-last-trade-field";
import listTablesRouter from "../routes/list-tables";
import syncCalendarRouter from "../routes/sync-calendar";
import nowPaymentsWebhookRouter from "../src/routes/nowpayments-webhook";
// import ntfyRouter from "../routes/ntfy"; // REMOVIDO - Agora usa tRPC
import { setupCopyTradingWebSocket } from "../websocket/copyTradingWs";

// import mt4ConnectorRouter from "../routes/mt4-connector";

import { startCryptoPaymentMonitoring } from "../services/cryptoPaymentMonitor";
import { scheduleNotificationCleanup } from "../services/notification-cleanup";
import { scheduleAutomatedReports } from "../services/automated-reports";
import { initNotificationCron } from "../notification-cron";
import { scheduleProviderCleanup } from "../services/cleanup-inactive-providers";
import { scheduleSubscriptionChecks } from "../services/subscription-manager";
import { startHeartbeatChecker } from "../heartbeat-checker";
import { startEconomicCalendarCron } from "../cron/economic-calendar-cron";
// import { startExpirationCron } from "../cron/expiration-cron"; // TODO: Implementar tabelas de expiração
// import { runMigrations } from "../scripts/runMigrations";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Cookie parser middleware
  app.use(cookieParser());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // MT4/MT5 API endpoints (LEGACY - mantido para compatibilidade)
  // app.use("/api/mt", mtApiRouter);
  // News API endpoints (public)
  app.use("/api", newsApiRouter);
  // VM Accounts management endpoints
  app.use("/api/vm-accounts", vmAccountsRouter);
  // Copy Trading limits management endpoints
  app.use("/api/copy-trading", copyTradingLimitsRouter);
  // Economic Calendar access control endpoints
  app.use("/api/economic-calendar", economicCalendarRouter);
  // EA License validation endpoints
  app.use("/api/ea-license", eaLicenseRouter);
  // Checkout and payment endpoints
  app.use("/api/checkout", checkoutRouter);
  // Subscription management endpoints
  app.use("/api/subscriptions", subscriptionsRouter);
  // MT4 Connector endpoints
  app.use("/api/mt4", mt4Router);
  // Upload endpoints
  app.use("/api/upload", uploadRouter);
  // System settings endpoints
  app.use("/api/settings", settingsRouter);
  // Alias para compatibilidade com EAs antigos
  app.use("/api/settings", settingsRouter);

  app.use("/api/mt", mt4Router);
  app.use("/api/mt/copy", copyTradingRouter);
  app.use("/api/mt/copy", copyTradingSettingsRouter);
  app.use("/api/mt/copy", copyTradingAutoRegisterRouter);
  app.use("/api/signal-providers", signalProvidersRouter);
  app.use("/api/migrations", migrationsRouter);
  app.use("/api/websocket", websocketTestRouter);
  app.use("/api/vps", vpsManagementRouter);
  app.use("/api/vps-management", vpsManagementRouter);
  app.use("/api/admin/vms", adminVMsRouter);
  app.use("/api/subscription-plans", subscriptionPlansRouter);
  app.use("/api/vps-products", vpsProductsRouter);
  app.use("/api/expert-advisors", expertAdvisorsRouter);
  app.use("/api/landing-page", landingPageRouter);
  app.use("/api/landing-config", landingConfigRouter);
  app.use(landingProductsRouter);  // Endpoint para buscar produtos da landing page
  app.use(editLandingProductsRouter);  // Endpoints para editar produtos da landing page
  app.use("/api/app-config", appConfigRouter);
  app.use(landingPagePixelsRouter);
  app.use("/api/mt", mt4LiteRouter);
  app.use("/api/ensure-tables", ensureTablesRouter);
  app.use("/api/execute-sql", executeSqlRouter);
  app.use("/api/provider-earnings", providerEarningsRouter);
  app.use("/api/telegram", telegramRouter);
  app.use("/api/telegram", telegramNotifierRouter);  // Endpoint para EA Sentra Telegram Notifier
  app.use("/api/admin", populateDataRouter);  // Endpoint para popular dados da landing page
  app.use("/api/admin", populateVpsEasRouter);  // Endpoint para popular VPS e EAs
  app.use("/api/admin", createPasswordResetTableRouter);  // Endpoint para criar tabela de reset de senha
  app.use(addLastTradeFieldRouter);  // Endpoint para adicionar campo last_trade_at
  app.use(listTablesRouter);  // Endpoint para listar tabelas
  app.use(syncCalendarRouter);  // Endpoint para sincronizar calendário
  app.use("/api/password-reset", passwordResetRouter);  // Endpoints de reset de senha
  app.use("/", nowPaymentsWebhookRouter);  // NowPayments webhook endpoint
  // app.use("/api/ntfy", ntfyRouter); // REMOVIDO - Agora usa tRPC
  // Wallet authentication endpoints

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Configurar WebSocket para Copy Trading
  setupCopyTradingWebSocket(server);
  console.log("🔌 WebSocket Copy Trading configurado em /ws/copy-trading");

  server.listen(port, '0.0.0.0', async () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    
    // Migrations removed - no longer needed
    
    // TEMPORARIAMENTE DESABILITADO: Aguardando correção do schema do banco
    // startCryptoPaymentMonitoring();
    // console.log("💰 Monitoramento de pagamentos cripto iniciado");

    // Iniciar serviços automáticos após 5 segundos (aguardar DB estar pronto)
    setTimeout(() => {
      scheduleNotificationCleanup();
      console.log("🧹 Limpeza automática de notificações iniciada");

      scheduleAutomatedReports();
      console.log("📊 Relatórios automáticos iniciados");

      initNotificationCron();
      
      scheduleSubscriptionChecks();
      console.log("💳 Gerenciador de assinaturas iniciado");
      console.log("🔔 Notificações Bark agendadas iniciadas");

      scheduleProviderCleanup();
      console.log("🧹 Limpeza automática de provedores inativos iniciada");

      // Sincronizar eventos econômicos a cada 5 minutos
      const { syncEconomicEvents } = require("../jobs/sync-economic-events");
      syncEconomicEvents(); // Executar imediatamente
      setInterval(syncEconomicEvents, 5 * 60 * 1000);
      console.log("📅 Sincronização de eventos econômicos iniciada (a cada 5 minutos)");

      // Limpar eventos antigos mensalmente usando cron (todo dia 1 às 3h)
      const { cleanupOldEvents } = require("../jobs/cleanup-old-events");
      cron.schedule('0 3 1 * *', cleanupOldEvents); // Todo dia 1 do mês às 3h
      console.log("🧹 Limpeza de eventos econômicos antigos agendada (dia 1 de cada mês às 3h)");

      startHeartbeatChecker();
      console.log("💓 Heartbeat Checker iniciado (sistema robusto de conexão)");
      
      startEconomicCalendarCron();
      console.log("📅 Alertas de Calendário Econômico iniciados (verificação a cada 15 minutos)");

      const { startInactivityMonitor } = require("../jobs/check-inactive-accounts");
      startInactivityMonitor();
      console.log("🔍 Monitoramento de contas inativas iniciado (verificação a cada 6 horas)");

      const { startCleanupSchedule } = require("../jobs/cleanup-old-notifications");
      startCleanupSchedule();
      console.log("🧹 Limpeza automática de notificações antigas iniciada (a cada 15 horas)");

      // const { scheduleDataCleanup } = require("../services/subscription-data-manager");
      // scheduleDataCleanup();
      // console.log("🧹 Limpeza automática de dados sem assinatura iniciada (30 dias)");

      // startExpirationCron(); // TODO: Implementar tabelas de expiração
      // console.log("⏰ Verificação de expirações iniciada (VPS, Assinaturas, EAs)");
    }, 5000);
  });
}

startServer().catch(console.error);
