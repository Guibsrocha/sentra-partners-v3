import { Router } from "express";
import { COOKIE_NAME } from "@shared/const";
import { verifyToken, getUserById } from "../auth";
import { ntfyService } from "../services/ntfy-notifications";
import { getDb } from "../db";
import { userSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

console.log("[ntfy] Router ntfy carregado!");

// Middleware de autenticação usando JWT (igual ao tRPC)
async function authenticateRequest(req: any) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    
    if (!token) {
      console.log("[ntfy] Token não encontrado nos cookies");
      return null;
    }
    
    const payload = await verifyToken(token);
    
    if (!payload) {
      console.log("[ntfy] Token inválido");
      return null;
    }
    
    const user = await getUserById(payload.userId);
    
    if (!user) {
      console.log("[ntfy] Usuário não encontrado:", payload.userId);
      return null;
    }
    
    console.log("[ntfy] Usuário autenticado:", user.id, user.email);
    return user;
  } catch (error) {
    console.error("[ntfy] Erro de autenticação:", error);
    return null;
  }
}

// GET /api/ntfy/topic - Retorna o tópico único do usuário
router.get("/topic", async (req, res) => {
  console.log("[ntfy] GET /topic");
  
  try {
    const user = await authenticateRequest(req);
    
    if (!user) {
      console.log("[ntfy] Usuário não autenticado");
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const topic = ntfyService.getUserTopic(user.id);
    console.log("[ntfy] Tópico gerado:", topic);
    
    res.json({
      topic,
      appStoreUrl: "https://apps.apple.com/us/app/ntfy/id1625396347",
      googlePlayUrl: "https://play.google.com/store/apps/details?id=io.heckel.ntfy",
      instructions: [
        "1. Instale o app \"ntfy\" no seu celular",
        "2. Abra o app e clique em \"+\"",
        `3. Digite o tópico: ${topic}`,
        "4. Pronto! Você receberá notificações aqui",
      ],
    });
  } catch (error) {
    console.error("[ntfy] Erro ao obter tópico:", error);
    res.status(500).json({ error: "Erro ao obter tópico" });
  }
});

// GET /api/ntfy/settings - Retorna as configurações ntfy do usuário
router.get("/settings", async (req, res) => {
  console.log("[ntfy] GET /settings");
  
  try {
    const user = await authenticateRequest(req);
    
    if (!user) {
      console.log("[ntfy] Usuário não autenticado");
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const db = await getDb();
    if (!db) {
      throw new Error("Database não disponível");
    }
    
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, user.id))
      .limit(1);
    
    if (settings.length === 0) {
      return res.json({
        ntfyEnabled: false,
        ntfyTopic: null,
        ntfyDailyEnabled: true,
        ntfyWeeklyEnabled: true,
        ntfyTradesEnabled: true,
        ntfyDrawdownEnabled: true,
        ntfyConnectionEnabled: true,
      });
    }
    
    const s = settings[0];
    res.json({
      ntfyEnabled: s.ntfyEnabled || false,
      ntfyTopic: s.ntfyTopic,
      ntfyDailyEnabled: s.ntfyDailyEnabled ?? true,
      ntfyWeeklyEnabled: s.ntfyWeeklyEnabled ?? true,
      ntfyTradesEnabled: s.ntfyTradesEnabled ?? true,
      ntfyDrawdownEnabled: s.ntfyDrawdownEnabled ?? true,
      ntfyConnectionEnabled: s.ntfyConnectionEnabled ?? true,
    });
  } catch (error) {
    console.error("[ntfy] Erro ao obter configurações:", error);
    res.status(500).json({ error: "Erro ao obter configurações" });
  }
});

// POST /api/ntfy/settings - Atualiza as configurações ntfy do usuário
router.post("/settings", async (req, res) => {
  console.log("[ntfy] POST /settings");
  
  try {
    const user = await authenticateRequest(req);
    
    if (!user) {
      console.log("[ntfy] Usuário não autenticado");
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const {
      ntfyEnabled,
      ntfyDailyEnabled,
      ntfyWeeklyEnabled,
      ntfyTradesEnabled,
      ntfyDrawdownEnabled,
      ntfyConnectionEnabled,
    } = req.body;
    
    const db = await getDb();
    if (!db) {
      throw new Error("Database não disponível");
    }
    
    // Verificar se já existe configuração
    const existing = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, user.id))
      .limit(1);
    
    const updateData: any = {};
    if (ntfyEnabled !== undefined) updateData.ntfyEnabled = ntfyEnabled;
    if (ntfyDailyEnabled !== undefined) updateData.ntfyDailyEnabled = ntfyDailyEnabled;
    if (ntfyWeeklyEnabled !== undefined) updateData.ntfyWeeklyEnabled = ntfyWeeklyEnabled;
    if (ntfyTradesEnabled !== undefined) updateData.ntfyTradesEnabled = ntfyTradesEnabled;
    if (ntfyDrawdownEnabled !== undefined) updateData.ntfyDrawdownEnabled = ntfyDrawdownEnabled;
    if (ntfyConnectionEnabled !== undefined) updateData.ntfyConnectionEnabled = ntfyConnectionEnabled;
    
    if (existing.length === 0) {
      // Criar nova configuração
      const topic = ntfyService.getUserTopic(user.id);
      await db.insert(userSettings).values({
        userId: user.id,
        ntfyTopic: topic,
        ...updateData,
      });
      console.log("[ntfy] Configurações criadas para usuário:", user.id);
    } else {
      // Atualizar configuração existente
      await db
        .update(userSettings)
        .set(updateData)
        .where(eq(userSettings.userId, user.id));
      console.log("[ntfy] Configurações atualizadas para usuário:", user.id);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("[ntfy] Erro ao atualizar configurações:", error);
    res.status(500).json({ error: "Erro ao atualizar configurações" });
  }
});

// POST /api/ntfy/test - Envia uma notificação de teste
router.post("/test", async (req, res) => {
  console.log("[ntfy] POST /test");
  
  try {
    const user = await authenticateRequest(req);
    
    if (!user) {
      console.log("[ntfy] Usuário não autenticado");
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const success = await ntfyService.sendTestNotification(user.id);
    
    if (success) {
      console.log("[ntfy] Notificação de teste enviada para usuário:", user.id);
      res.json({ success: true, message: "Notificação de teste enviada!" });
    } else {
      console.error("[ntfy] Falha ao enviar notificação de teste para usuário:", user.id);
      res.status(500).json({ error: "Erro ao enviar notificação de teste" });
    }
  } catch (error) {
    console.error("[ntfy] Erro ao enviar notificação de teste:", error);
    res.status(500).json({ error: "Erro ao enviar notificação de teste" });
  }
});

export default router;
