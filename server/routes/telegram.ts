import express from "express";
import { getDb, getRawConnection } from "../db";
import { telegramUsers, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { telegramService } from "../services/telegram-notifications";
import crypto from "crypto";

const router = express.Router();

/**
 * POST /api/telegram/generate-token
 * Gera um token único para o usuário vincular o Telegram
 */
router.post("/generate-token", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId é obrigatório"
      });
    }

    console.log(`[Telegram API] Gerando token para usuário ${userId}`);

    const db = await getDb();
    if (!db) {
      console.error('[Telegram] Database não disponível');
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    // Verificar se usuário existe
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado"
      });
    }

    // Gerar token único
    const token = crypto.randomBytes(32).toString("hex");

    // Verificar se já existe registro
    const existing = await db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      // Atualizar token existente
      await db
        .update(telegramUsers)
        .set({
          telegramToken: token,
          updatedAt: new Date()
        })
        .where(eq(telegramUsers.userId, userId));

      console.log(`[Telegram API] ✅ Token atualizado para usuário ${userId}`);

      return res.json({
        success: true,
        token,
        botUsername: "SentraPartners_Bot"
      });
    }

    // Criar novo registro
    await db.insert(telegramUsers).values({
      userId,
      telegramToken: token,
      chatId: null,
      isActive: false // Só ativa quando vincular
    });

    console.log(`[Telegram API] ✅ Token gerado para usuário ${userId}`);

    res.json({
      success: true,
      token,
      botUsername: "SentraPartners_Bot"
    });
  } catch (error) {
    console.error("[Telegram API] Erro ao gerar token:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao gerar token"
    });
  }
});

/**
 * POST /api/telegram/link
 * Vincula um token ao chat_id do Telegram (chamado pelo bot)
 */
router.post("/link", async (req, res) => {
  try {
    const { token, chatId, username, firstName, lastName } = req.body;

    if (!token || !chatId) {
      return res.status(400).json({
        success: false,
        error: "token e chatId são obrigatórios"
      });
    }

    console.log(`[Telegram API] Vinculando token ${token} ao chat ${chatId}`);

    const db = await getDb();
    if (!db) {
      console.error('[Telegram] Database não disponível');
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    // Buscar registro pelo token
    const result = await db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.telegramToken, token))
      .limit(1);

    if (result.length === 0) {
      console.log(`[Telegram API] ❌ Token inválido: ${token}`);
      return res.status(404).json({
        success: false,
        error: "Token inválido ou expirado"
      });
    }

    const record = result[0];

    // Atualizar com chat_id
    await db
      .update(telegramUsers)
      .set({
        chatId,
        username,
        firstName,
        lastName,
        isActive: true,
        updatedAt: new Date(),
        lastUsedAt: new Date()
      })
      .where(eq(telegramUsers.telegramToken, token));

    console.log(`[Telegram API] ✅ Token ${token} vinculado ao chat ${chatId} (userId: ${record.userId})`);

    // Buscar dados do usuário
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, record.userId))
      .limit(1);

    const userName = user.length > 0 ? user[0].name : "Usuário";

    // Enviar mensagem de boas-vindas
    await telegramService.sendMessage(
      chatId,
      `🎉 <b>Bem-vindo, ${userName}!</b>\n\n✅ Telegram vinculado com sucesso!\n\nVocê receberá notificações sobre:\n• 📈 Trades abertos\n• 💰 Trades fechados (TP/SL)\n• 🔁 Copy trades\n• ⚠️ Alertas importantes\n\n<i>Notificações ativadas!</i> 🚀`
    );

    res.json({
      success: true,
      message: "Telegram vinculado com sucesso",
      userId: record.userId
    });
  } catch (error) {
    console.error("[Telegram API] Erro ao vincular:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao vincular Telegram"
    });
  }
});

/**
 * POST /api/telegram/unlink
 * Remove vinculação do Telegram
 */
router.post("/unlink", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId é obrigatório"
      });
    }

    console.log(`[Telegram API] Removendo vinculação do usuário ${userId}`);

    const db = await getDb();
    if (!db) {
      console.error('[Telegram] Database não disponível');
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    // Buscar chat_id antes de desativar
    const result = await db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, userId))
      .limit(1);

    if (result.length > 0 && result[0].chatId) {
      // Enviar mensagem de despedida
      await telegramService.sendMessage(
        result[0].chatId,
        `👋 <b>Telegram desvinculado</b>\n\nVocê não receberá mais notificações.\n\nPara reativar, gere um novo token no site.\n\n<i>Até breve!</i>`
      );
    }

    // Desativar
    await db
      .update(telegramUsers)
      .set({
        isActive: false,
        chatId: null,
        updatedAt: new Date()
      })
      .where(eq(telegramUsers.userId, userId));

    console.log(`[Telegram API] ✅ Usuário ${userId} desvinculado`);

    res.json({
      success: true,
      message: "Telegram desvinculado com sucesso"
    });
  } catch (error) {
    console.error("[Telegram API] Erro ao desvincular:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao desvincular Telegram"
    });
  }
});

/**
 * GET /api/telegram/status/:userId
 * Verifica se usuário tem Telegram configurado
 */
router.get("/status/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: "userId inválido"
      });
    }

    const db = await getDb();
    if (!db) {
      console.error('[Telegram] Database não disponível');
      return res.status(500).json({ success: false, error: 'Database not available' });
    }

    const result = await db
      .select()
      .from(telegramUsers)
      .where(eq(telegramUsers.userId, userId))
      .limit(1);

    if (result.length === 0) {
      return res.json({
        success: true,
        configured: false,
        linked: false
      });
    }

    const record = result[0];

    res.json({
      success: true,
      configured: true,
      linked: record.chatId !== null && record.isActive,
      isActive: record.isActive,
      username: record.username,
      firstName: record.firstName,
      lastUsedAt: record.lastUsedAt
    });
  } catch (error) {
    console.error("[Telegram API] Erro ao verificar status:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao verificar status"
    });
  }
});

/**
 * POST /api/telegram/test
 * Envia notificação de teste
 */
router.post("/test", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId é obrigatório"
      });
    }

    console.log(`[Telegram API] Enviando notificação de teste para usuário ${userId}`);

    const chatId = await telegramService.getUserChatId(userId);

    if (!chatId) {
      return res.status(404).json({
        success: false,
        error: "Usuário não tem Telegram vinculado"
      });
    }

    const success = await telegramService.sendMessage(
      chatId,
      `🧪 <b>Notificação de Teste</b>\n\nSe você recebeu esta mensagem, as notificações estão funcionando perfeitamente! ✅\n\n<i>Sentra Partners</i>`
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        error: "Erro ao enviar notificação"
      });
    }

    res.json({
      success: true,
      message: "Notificação de teste enviada"
    });
  } catch (error) {
    console.error("[Telegram API] Erro ao enviar teste:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao enviar notificação de teste"
    });
  }
});

/**
 * POST /api/telegram/webhook
 * Webhook para receber updates do Telegram
 */
router.post("/webhook", async (req, res) => {
  try {
    const update = req.body;

    console.log(`[Telegram Webhook] Update recebido:`, JSON.stringify(update, null, 2));

    // Processar comando /start
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();
      
      console.log(`[Telegram Webhook] 🔍 Processando mensagem: "${text}" de chatId: ${chatId}`);

      // Comando /start
      if (text === "/start" || text === "/help") {
        const firstName = update.message.from.first_name;

        await telegramService.sendMessage(
          chatId,
          `👋 <b>Olá, ${firstName}!</b>

Para ativar as notificações:

1️⃣ Acesse o site <b>Sentra Partners</b>
2️⃣ Vá em <b>Configurações</b> → <b>Notificações</b>
3️⃣ Clique em <b>"Gerar Token"</b>
4️⃣ Copie o token
5️⃣ Envie o token aqui no chat

<b>Comandos disponíveis:</b>
• <code>/relatorio</code> - Relatório diário
• <code>/semanal</code> - Relatório semanal
• <code>/contas</code> - Listar suas contas

<i>Aguardamos você!</i> 🚀`
        );

        return res.json({ ok: true });
      }

      // Comando /diario - Relatório diário
      if (text === "/diario") {
        console.log(`[Telegram Webhook] Comando /diario recebido de ${chatId}`);

        // Buscar usuário vinculado
        const db = await getDb();
    if (!db) {
      console.error('[Telegram] Database não disponível');
      return res.status(500).json({ success: false, error: 'Database not available' });
    }
        const linkedUser = await db
          .select()
          .from(telegramUsers)
          .where(eq(telegramUsers.chatId, chatId.toString()))
          .limit(1);

        if (linkedUser.length === 0) {
          await telegramService.sendMessage(
            chatId,
            `❌ <b>Conta não vinculada</b>\n\nVocê precisa vincular sua conta primeiro!\n\nEnvie <code>/start</code> para ver instruções.`
          );
          return res.json({ ok: true });
        }

        const userId = linkedUser[0].userId;

        // Buscar idioma do usuário
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        const language = user.length > 0 ? user[0].language || "pt-BR" : "pt-BR";

        // Enviar relatório diário
        await telegramService.sendMessage(
          chatId,
          `⏳ <b>Gerando relatório diário...</b>\n\n<i>Aguarde alguns segundos.</i>`
        );

        try {
          const { sendDailyReportToUser } = await import("../services/telegram-helper");
          const sent = await sendDailyReportToUser(userId);

          if (!sent) {
            await telegramService.sendMessage(
              chatId,
              `⚠️ <b>Erro ao gerar relatório</b>\n\nNão foi possível gerar o relatório diário.\n\n<i>Tente novamente mais tarde.</i>`
            );
          }
        } catch (error) {
          console.error("[Telegram Webhook] Erro ao enviar relatório diário:", error);
          await telegramService.sendMessage(
            chatId,
            `❌ <b>Erro</b>\n\nOcorreu um erro ao gerar o relatório.\n\n<i>Tente novamente.</i>`
          );
        }

        return res.json({ ok: true });
      }

      // Comando /semanal - Relatório semanal
      if (text === "/semanal") {
        console.log(`[Telegram Webhook] Comando /semanal recebido de ${chatId}`);

        // Buscar usuário vinculado
        const db = await getDb();
    if (!db) {
      console.error('[Telegram] Database não disponível');
      return res.status(500).json({ success: false, error: 'Database not available' });
    }
        const linkedUser = await db
          .select()
          .from(telegramUsers)
          .where(eq(telegramUsers.chatId, chatId.toString()))
          .limit(1);

        if (linkedUser.length === 0) {
          await telegramService.sendMessage(
            chatId,
            `❌ <b>Conta não vinculada</b>\n\nVocê precisa vincular sua conta primeiro!\n\nEnvie <code>/start</code> para ver instruções.`
          );
          return res.json({ ok: true });
        }

        const userId = linkedUser[0].userId;

        // Buscar idioma do usuário
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        const language = user.length > 0 ? user[0].language || "pt-BR" : "pt-BR";

        // Enviar relatório semanal
        await telegramService.sendMessage(
          chatId,
          `⏳ <b>Gerando relatório semanal...</b>\n\n<i>Aguarde alguns segundos.</i>`
        );

        try {
          const { sendWeeklyReportToUser } = await import("../services/telegram-helper");
          const sent = await sendWeeklyReportToUser(userId);

          if (!sent) {
            await telegramService.sendMessage(
              chatId,
              `⚠️ <b>Erro ao gerar relatório</b>\n\nNão foi possível gerar o relatório semanal.\n\n<i>Tente novamente mais tarde.</i>`
            );
          }
        } catch (error) {
          console.error("[Telegram Webhook] Erro ao enviar relatório semanal:", error);
          await telegramService.sendMessage(
            chatId,
            `❌ <b>Erro</b>\n\nOcorreu um erro ao gerar o relatório.\n\n<i>Tente novamente.</i>`
          );
        }

        return res.json({ ok: true });
      }

      // Comando /mensal - Relatório mensal
      if (text === "/mensal") {
        console.log(`[Telegram Webhook] Comando /mensal recebido de ${chatId}`);

        // Buscar usuário vinculado
        const db = await getDb();
    if (!db) {
      console.error('[Telegram] Database não disponível');
      return res.status(500).json({ success: false, error: 'Database not available' });
    }
        const linkedUser = await db
          .select()
          .from(telegramUsers)
          .where(eq(telegramUsers.chatId, chatId.toString()))
          .limit(1);

        if (linkedUser.length === 0) {
          await telegramService.sendMessage(
            chatId,
            `❌ <b>Conta não vinculada</b>\n\nVocê precisa vincular sua conta primeiro!\n\nEnvie <code>/start</code> para ver instruções.`
          );
          return res.json({ ok: true });
        }

        const userId = linkedUser[0].userId;

        // Buscar idioma do usuário
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        const language = user.length > 0 ? user[0].language || "pt-BR" : "pt-BR";

        // Enviar relatório mensal
        await telegramService.sendMessage(
          chatId,
          `⏳ <b>Gerando relatório mensal...</b>\n\n<i>Aguarde alguns segundos.</i>`
        );

        try {
          const { sendMonthlyReportToUser } = await import("../services/telegram-helper");
          const sent = await sendMonthlyReportToUser(userId);

          if (!sent) {
            await telegramService.sendMessage(
              chatId,
              `⚠️ <b>Erro ao gerar relatório</b>\n\nNão foi possível gerar o relatório mensal.\n\n<i>Tente novamente mais tarde.</i>`
            );
          }
        } catch (error) {
          console.error("[Telegram Webhook] Erro ao enviar relatório mensal:", error);
          await telegramService.sendMessage(
            chatId,
            `❌ <b>Erro</b>\n\nOcorreu um erro ao gerar o relatório.\n\n<i>Tente novamente.</i>`
          );
        }

        return res.json({ ok: true });
      }

      // Comando /contas - Listar todas as contas
      if (text === "/contas") {
        console.log(`[Telegram Webhook] Comando /contas recebido de ${chatId}`);

        try {
          // Buscar usuário vinculado
          const db = await getDb();
          if (!db) {
            console.error('[Telegram] Database não disponível');
            await telegramService.sendMessage(
              chatId,
              `❌ <b>Erro no servidor</b>\n\nNão foi possível conectar ao banco de dados.`
            );
            return res.json({ ok: true });
          }

          const telegramUser = await db
            .select()
            .from(telegramUsers)
            .where(eq(telegramUsers.chatId, chatId.toString()))
            .limit(1);

          if (telegramUser.length === 0) {
            await telegramService.sendMessage(
              chatId,
              `❌ <b>Telegram não vinculado</b>\n\nVocê precisa vincular seu Telegram primeiro.\n\n1️⃣ Acesse o site\n2️⃣ Gere um token\n3️⃣ Envie aqui`
            );
            return res.json({ ok: true });
          }

          const userId = telegramUser[0].userId;

          // Buscar todas as contas do usuário usando conexão raw
          const connection = await getRawConnection();
          const [accounts] = await connection.query(`
            SELECT 
              a.id,
              a.accountNumber as login,
              a.broker,
              a.isActive as active,
              a.balance,
              a.openPositions as open_positions,
              a.last_trade_at,
              CASE 
                WHEN a.openPositions > 0 THEN 0
                WHEN a.last_trade_at IS NULL THEN 999
                ELSE DATEDIFF(NOW(), a.last_trade_at)
              END as days_inactive
            FROM trading_accounts a
            WHERE a.userId = ?
            ORDER BY a.isActive DESC, days_inactive ASC
          `, [userId]);
          await connection.end();

          const accountsList = accounts as any[];

        if (accountsList.length === 0) {
          await telegramService.sendMessage(
            chatId,
            `📊 <b>Suas Contas</b>\n\n❌ Você ainda não tem contas cadastradas.\n\n<i>Adicione uma conta no site!</i>`
          );
          return res.json({ ok: true });
        }

        // Formatar lista de contas
        let message = `📊 <b>Suas Contas (${accountsList.length})</b>\n\n`;

        for (const account of accountsList) {
          const status = account.active ? '✅' : '❌';
          const daysInactive = account.days_inactive === 999 ? '∞' : account.days_inactive;
          const inactiveWarning = account.days_inactive >= 3 && account.open_positions === 0 ? ' ⚠️' : '';
          
          message += `${status} <b>${account.login}</b> (${account.broker})\n`;
          message += `   💰 Saldo: $${account.balance || 0}\n`;
          message += `   📊 Operações: ${account.open_positions || 0}\n`;
          message += `   ⏱️ Inativo: ${daysInactive} dias${inactiveWarning}\n`;
          message += `\n`;
        }

          message += `<i>⚠️ = Conta inativa (3+ dias sem trades e sem operações)</i>`;

          await telegramService.sendMessage(chatId, message);
          return res.json({ ok: true });
        } catch (error: any) {
          console.error('[Telegram] Erro no comando /contas:', error);
          await telegramService.sendMessage(
            chatId,
            `❌ <b>Erro ao buscar contas</b>\n\n${error.message}`
          );
          return res.json({ ok: true });
        }
      }

      // Verificar se é um token (64 caracteres alfanuméricos)
      if (/^[A-Za-z0-9]{64}$/.test(text)) {
        const token = text; // Manter case-sensitive
        const username = update.message.from.username;
        const firstName = update.message.from.first_name;
        const lastName = update.message.from.last_name;

        console.log(`[Telegram Webhook] Token recebido: ${token}`);

        // Tentar vincular
        const db = await getDb();
        if (!db) {
          console.error('[Telegram Webhook] Database não disponível');
          await telegramService.sendMessage(
            chatId,
            `❌ <b>Erro no servidor</b>\n\nNão foi possível conectar ao banco de dados.\n\nTente novamente em alguns instantes.`
          );
          return res.json({ ok: true });
        }
        
        const result = await db
          .select()
          .from(telegramUsers)
          .where(eq(telegramUsers.telegramToken, token))
          .limit(1);

        if (result.length === 0) {
          await telegramService.sendMessage(
            chatId,
            `❌ <b>Token inválido</b>\n\nO token que você enviou não é válido ou já expirou.\n\nPor favor:\n1️⃣ Acesse o site Sentra Partners\n2️⃣ Gere um novo token\n3️⃣ Envie aqui\n\n<i>Tente novamente!</i>`
          );

          return res.json({ ok: true });
        }

        // Vincular
        await db
          .update(telegramUsers)
          .set({
            chatId: chatId.toString(),
            username,
            firstName,
            lastName,
            isActive: true,
            updatedAt: new Date(),
            lastUsedAt: new Date()
          })
          .where(eq(telegramUsers.telegramToken, token));

        // Buscar dados do usuário
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, result[0].userId))
          .limit(1);

        const userName = user.length > 0 ? user[0].name : "Usuário";

        await telegramService.sendMessage(
          chatId,
          `🎉 <b>Parabéns, ${userName}!</b>\n\n✅ <b>Telegram vinculado com sucesso!</b>\n\nVocê receberá notificações sobre:\n• 📈 Trades abertos\n• 💰 Trades fechados (TP/SL)\n• 🔁 Copy trades\n• ⚠️ Alertas importantes\n\n<i>Notificações ativadas!</i> 🚀`
        );

        console.log(`[Telegram Webhook] ✅ Token ${token} vinculado ao chat ${chatId}`);

        return res.json({ ok: true });
      }

          // Mensagem não reconhecida
      await telegramService.sendMessage(
        chatId,
        `❓ <b>Comando não reconhecido</b>

Comandos disponíveis:
• <code>/start</code> - Ver instruções
• <code>/relatorio</code> - Relatório diário
• <code>/semanal</code> - Relatório semanal
• <code>/contas</code> - Listar suas contas
• <code>seu_token</code> - Vincular conta

<i>Precisa de ajuda? Acesse o site!</i>`
      );
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Erro ao processar update:", error);
    res.json({ ok: false });
  }
});

export default router;
