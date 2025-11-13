import { Router } from "express";
import { getDb } from "../db";
import { landingPagePixels } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

// GET - Buscar pixels da landing page
router.get("/api/landing-page-pixels", async (req, res) => {
  try {
    const db = await getDb();
    
    // Buscar pixels (sempre ID 1, pois é único)
    const pixels = await db.select().from(landingPagePixels).where(eq(landingPagePixels.id, 1)).limit(1);
    
    if (pixels.length === 0) {
      // Se não existir, criar com valores padrão
      await db.insert(landingPagePixels).values({
        id: 1,
        facebookPixelId: null,
        facebookPixelEnabled: false,
        googleAdsId: null,
        googleAdsEnabled: false,
        taboolaPixelId: null,
        taboolaPixelEnabled: false,
        kwaiPixelId: null,
        kwaiPixelEnabled: false,
        tiktokPixelId: null,
        tiktokPixelEnabled: false,
      });
      
      // Buscar novamente
      const newPixels = await db.select().from(landingPagePixels).where(eq(landingPagePixels.id, 1)).limit(1);
      return res.json(newPixels[0]);
    }
    
    res.json(pixels[0]);
  } catch (error: any) {
    console.error("Erro ao buscar pixels:", error);
    res.status(500).json({ error: "Erro ao buscar pixels" });
  }
});

// PUT - Salvar pixels da landing page (apenas admin)
router.put("/api/landing-page-pixels", async (req, res) => {
  try {
    // Verificar se é admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores podem configurar pixels." });
    }
    
    const db = await getDb();
    const {
      facebookPixelId,
      facebookPixelEnabled,
      googleAdsId,
      googleAdsEnabled,
      taboolaPixelId,
      taboolaPixelEnabled,
      kwaiPixelId,
      kwaiPixelEnabled,
      tiktokPixelId,
      tiktokPixelEnabled,
    } = req.body;
    
    // Verificar se já existe
    const existing = await db.select().from(landingPagePixels).where(eq(landingPagePixels.id, 1)).limit(1);
    
    if (existing.length === 0) {
      // Criar
      await db.insert(landingPagePixels).values({
        id: 1,
        facebookPixelId: facebookPixelId || null,
        facebookPixelEnabled: facebookPixelEnabled || false,
        googleAdsId: googleAdsId || null,
        googleAdsEnabled: googleAdsEnabled || false,
        taboolaPixelId: taboolaPixelId || null,
        taboolaPixelEnabled: taboolaPixelEnabled || false,
        kwaiPixelId: kwaiPixelId || null,
        kwaiPixelEnabled: kwaiPixelEnabled || false,
        tiktokPixelId: tiktokPixelId || null,
        tiktokPixelEnabled: tiktokPixelEnabled || false,
      });
    } else {
      // Atualizar
      await db.update(landingPagePixels)
        .set({
          facebookPixelId: facebookPixelId || null,
          facebookPixelEnabled: facebookPixelEnabled || false,
          googleAdsId: googleAdsId || null,
          googleAdsEnabled: googleAdsEnabled || false,
          taboolaPixelId: taboolaPixelId || null,
          taboolaPixelEnabled: taboolaPixelEnabled || false,
          kwaiPixelId: kwaiPixelId || null,
          kwaiPixelEnabled: kwaiPixelEnabled || false,
          tiktokPixelId: tiktokPixelId || null,
          tiktokPixelEnabled: tiktokPixelEnabled || false,
        })
        .where(eq(landingPagePixels.id, 1));
    }
    
    // Buscar e retornar
    const updated = await db.select().from(landingPagePixels).where(eq(landingPagePixels.id, 1)).limit(1);
    res.json(updated[0]);
  } catch (error: any) {
    console.error("Erro ao salvar pixels:", error);
    res.status(500).json({ error: "Erro ao salvar pixels: " + error.message });
  }
});

export default router;
