/**
 * Script de teste para notificações de Trade Normal
 * Simula abertura e fechamento de um trade manual
 */

import { telegramService } from "./server/services/telegram-notifications";
import { getDb } from "./server/db";
import { telegramUsers } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function testTradeNormal() {
  console.log("\n🧪 ===== TESTE DE TRADE NORMAL =====\n");

  try {
    const database = await getDb();
    if (!database) {
      throw new Error("Database não disponível");
    }

    // Buscar primeiro usuário com Telegram ativo
    const [telegram] = await database
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.isActive, true))
      .limit(1);

    if (!telegram) {
      console.error("❌ Nenhum usuário com Telegram ativo encontrado");
      console.log("\nPor favor, vincule seu Telegram primeiro:");
      console.log("1. Acesse a página de Alertas");
      console.log("2. Clique em 'Gerar Novo Token'");
      console.log("3. Envie o token para @SentraPartners_Bot");
      return;
    }

    console.log(`✅ Usuário encontrado: ID ${telegram.userId}`);
    console.log(`📱 Chat ID: ${telegram.chatId}\n`);

    // Dados do trade de teste
    const tradeData = {
      ticket: "TEST" + Date.now(),
      symbol: "EURUSD",
      type: "BUY",
      volume: 0.1,
      openPrice: 1.0850,
      sl: 1.0800,
      tp: 1.0900,
    };

    console.log("📊 Dados do trade:");
    console.log(JSON.stringify(tradeData, null, 2));
    console.log();

    // 1. ABERTURA DO TRADE
    console.log("🔵 Enviando notificação de ABERTURA...");
    const openResult = await telegramService.sendTradeOpened(
      telegram.userId,
      "TESTE-12345",
      tradeData,
      "pt-BR"
    );

    if (openResult) {
      console.log("✅ Notificação de abertura enviada com sucesso!");
    } else {
      console.error("❌ Falha ao enviar notificação de abertura");
    }

    // Aguardar 3 segundos
    console.log("\n⏳ Aguardando 3 segundos...\n");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. FECHAMENTO COM TAKE PROFIT
    console.log("💰 Enviando notificação de FECHAMENTO (Take Profit)...");
    const closeData = {
      ticket: tradeData.ticket,
      symbol: tradeData.symbol,
      type: tradeData.type,
      profit: 50.00,
      closePrice: 1.0900,
    };

    const closeResult = await telegramService.sendTradeTakeProfit(
      telegram.userId,
      "TESTE-12345",
      closeData,
      "pt-BR"
    );

    if (closeResult) {
      console.log("✅ Notificação de fechamento enviada com sucesso!");
    } else {
      console.error("❌ Falha ao enviar notificação de fechamento");
    }

    console.log("\n✅ ===== TESTE CONCLUÍDO =====");
    console.log("\n📱 Verifique seu Telegram para ver as notificações!");
    console.log("\nVocê deve ter recebido:");
    console.log("  1. 🔵 TRADE MANUAL ABERTO");
    console.log("  2. 💰 TRADE MANUAL FECHADO - TAKE PROFIT\n");

  } catch (error) {
    console.error("\n❌ Erro durante o teste:", error);
  }

  process.exit(0);
}

// Executar teste
testTradeNormal();
