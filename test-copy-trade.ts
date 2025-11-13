/**
 * Script de teste para notificações de Copy Trade
 * Simula execução e encerramento de um copy trade
 */

import { telegramService } from "./server/services/telegram-notifications";
import { getDb } from "./server/db";
import { telegramUsers } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function testCopyTrade() {
  console.log("\n🧪 ===== TESTE DE COPY TRADE =====\n");

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

    // Dados do copy trade de teste
    const copyTradeData = {
      providerName: "John Trader Pro",
      symbol: "GBPUSD",
      type: "SELL",
      volume: 0.5,
      accounts: ["CONTA-001", "CONTA-002", "CONTA-003"], // Múltiplas contas
    };

    console.log("📊 Dados do copy trade:");
    console.log(JSON.stringify(copyTradeData, null, 2));
    console.log();

    // 1. EXECUÇÃO DO COPY TRADE
    console.log("🔁 Enviando notificação de EXECUÇÃO...");
    const openResult = await telegramService.sendCopyTradeExecuted(
      telegram.userId,
      "CONTA-001",
      copyTradeData,
      "pt-BR"
    );

    if (openResult) {
      console.log("✅ Notificação de execução enviada com sucesso!");
    } else {
      console.error("❌ Falha ao enviar notificação de execução");
    }

    // Aguardar 3 segundos
    console.log("\n⏳ Aguardando 3 segundos...\n");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. ENCERRAMENTO DO COPY TRADE (com lucros por conta)
    console.log("💰 Enviando notificação de ENCERRAMENTO...");
    const closeData = {
      providerName: copyTradeData.providerName,
      symbol: copyTradeData.symbol,
      type: copyTradeData.type,
      profit: 150.00, // Lucro total
      accountsProfits: [
        { account: "CONTA-001", profit: 50.00, profitConverted: 250.00 },
        { account: "CONTA-002", profit: 50.00, profitConverted: 250.00 },
        { account: "CONTA-003", profit: 50.00, profitConverted: 250.00 },
      ],
      currency: "BRL",
      exchangeRate: 5.0,
    };

    const closeResult = await telegramService.sendCopyTradeClosed(
      telegram.userId,
      "CONTA-001",
      closeData,
      "pt-BR"
    );

    if (closeResult) {
      console.log("✅ Notificação de encerramento enviada com sucesso!");
    } else {
      console.error("❌ Falha ao enviar notificação de encerramento");
    }

    console.log("\n✅ ===== TESTE CONCLUÍDO =====");
    console.log("\n📱 Verifique seu Telegram para ver as notificações!");
    console.log("\nVocê deve ter recebido:");
    console.log("  1. 🔁 COPY TRADE ABERTO");
    console.log("  2. 💰 COPY TRADE FECHADO (com lucros por conta)\n");

  } catch (error) {
    console.error("\n❌ Erro durante o teste:", error);
  }

  process.exit(0);
}

// Executar teste
testCopyTrade();
