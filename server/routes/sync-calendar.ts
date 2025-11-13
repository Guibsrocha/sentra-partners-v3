import { Router } from "express";
import { syncEconomicEvents } from "../jobs/sync-economic-events";

const router = Router();

/**
 * Endpoint para forçar sincronização manual do calendário econômico
 * GET /api/admin/sync-calendar
 */
router.post("/api/admin/sync-calendar", async (req, res) => {
  try {
    console.log("[Sync Calendar] Manual sync requested");
    await syncEconomicEvents();
    
    res.json({
      success: true,
      message: "Calendário econômico sincronizado com sucesso!",
    });
  } catch (error: any) {
    console.error("[Sync Calendar] Manual sync failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
