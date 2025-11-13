import express, { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { subscriptionPlans, userSubscriptions } from "../../drizzle/schema";
import { authenticateUser } from "../auth";

const router = express.Router();

/**
 * GET /api/economic-calendar/access
 * Verifica se o usuário tem acesso ao calendário econômico
 */
router.get("/access", authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = getDb();
    
    // Obter assinatura ativa do usuário
    const activeSubscription = await db
      .select({
        plan: subscriptionPlans
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, userSubscriptions.planId))
      .where(eq(userSubscriptions.userId, userId))
      .where(eq(userSubscriptions.status, "active"))
      .limit(1);
    
    if (!activeSubscription.length) {
      return res.json({
        success: true,
        data: {
          hasAccess: false,
          accessLevel: 'none',
          message: 'Nenhuma assinatura ativa encontrada',
          plan: null,
          requiredPlan: 'Assinatura Básica ou superior'
        }
      });
    }
    
    const plan = activeSubscription[0].plan;
    const hasAccess = plan?.economicCalendarAccess || false;
    
    // Log do acesso (opcional - para estatísticas)
    await db
      .insert("economic_calendar_access_logs")
      .values({
        userId: userId,
        planId: plan?.id || 0,
        hasAccess: hasAccess,
        accessLevel: hasAccess ? 'premium' : 'basic',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || ''
      });
    
    return res.json({
      success: true,
      data: {
        hasAccess,
        accessLevel: hasAccess ? 'premium' : 'basic',
        message: hasAccess ? 'Acesso concedido ao calendário econômico' : 'Acesso negado - assinatura insuficiente',
        plan: {
          id: plan?.id,
          name: plan?.name,
          economicCalendarAccess: plan?.economicCalendarAccess
        },
        requiredPlan: 'Plano com acesso ao calendário econômico'
      }
    });
    
  } catch (error) {
    console.error("[EconomicCalendar] Erro ao verificar acesso:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * GET /api/economic-calendar/events
 * Obtém eventos do calendário econômico (com controle de acesso)
 */
router.get("/events", authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currency, impact, limit = 50 } = req.query;
    const db = getDb();
    
    // Verificar acesso primeiro
    const accessCheck = await checkEconomicCalendarAccess(userId);
    
    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado ao calendário econômico",
        data: {
          requiredPlan: accessCheck.requiredPlan,
          userPlan: accessCheck.currentPlan
        }
      });
    }
    
    // Construir query base
    let query = `
      SELECT 
        id,
        eventTime,
        currency,
        eventName,
        impact,
        previousValue,
        forecastValue,
        actualValue,
        createdAt
      FROM economic_events 
      WHERE eventTime >= NOW()
    `;
    
    const queryParams = [];
    
    // Adicionar filtros se fornecidos
    if (currency && typeof currency === 'string' && currency !== 'all') {
      query += ` AND currency = ?`;
      queryParams.push(currency.toUpperCase());
    }
    
    if (impact && typeof impact === 'string' && impact !== 'all') {
      query += ` AND impact = ?`;
      queryParams.push(impact.toLowerCase());
    }
    
    // Ordenar por data e limitar
    query += ` ORDER BY eventTime ASC LIMIT ?`;
    queryParams.push(parseInt(limit as string) || 50);
    
    // Executar query
    const [events] = await db.execute(query, queryParams);
    
    // Log do acesso aos eventos
    await db
      .insert("economic_calendar_access_logs")
      .values({
        userId: userId,
        planId: accessCheck.planId,
        hasAccess: true,
        accessLevel: 'premium',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || ''
      });
    
    return res.json({
      success: true,
      data: {
        events,
        total: (events as any[]).length,
        filters: {
          currency: currency || 'all',
          impact: impact || 'all',
          limit: parseInt(limit as string) || 50
        },
        accessLevel: accessCheck.accessLevel
      }
    });
    
  } catch (error) {
    console.error("[EconomicCalendar] Erro ao obter eventos:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * GET /api/economic-calendar/events/:id
 * Obtém um evento específico do calendário econômico
 */
router.get("/events/:id", authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const db = getDb();
    
    // Verificar acesso
    const accessCheck = await checkEconomicCalendarAccess(userId);
    
    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado ao calendário econômico",
        data: {
          requiredPlan: accessCheck.requiredPlan,
          userPlan: accessCheck.currentPlan
        }
      });
    }
    
    // Obter evento específico
    const [event] = await db.execute(`
      SELECT 
        id,
        eventTime,
        currency,
        eventName,
        impact,
        previousValue,
        forecastValue,
        actualValue,
        createdAt
      FROM economic_events 
      WHERE id = ?
    `, [id]);
    
    if (!(event as any[]).length) {
      return res.status(404).json({
        success: false,
        error: "Evento não encontrado"
      });
    }
    
    return res.json({
      success: true,
      data: (event as any[])[0]
    });
    
  } catch (error) {
    console.error("[EconomicCalendar] Erro ao obter evento:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * Função auxiliar para verificar acesso ao calendário econômico
 */
async function checkEconomicCalendarAccess(userId: number): Promise<{
  hasAccess: boolean;
  accessLevel: string;
  planId: number;
  currentPlan: any;
  requiredPlan: string;
}> {
  const db = getDb();
  
  const activeSubscription = await db
    .select({
      plan: subscriptionPlans
    })
    .from(userSubscriptions)
    .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, userSubscriptions.planId))
    .where(eq(userSubscriptions.userId, userId))
    .where(eq(userSubscriptions.status, "active"))
    .limit(1);
  
  if (!activeSubscription.length) {
    return {
      hasAccess: false,
      accessLevel: 'none',
      planId: 0,
      currentPlan: null,
      requiredPlan: 'Assinatura Básica ou superior'
    };
  }
  
  const plan = activeSubscription[0].plan;
  const hasAccess = plan?.economicCalendarAccess || false;
  
  return {
    hasAccess,
    accessLevel: hasAccess ? 'premium' : 'basic',
    planId: plan?.id || 0,
    currentPlan: {
      id: plan?.id,
      name: plan?.name,
      economicCalendarAccess: plan?.economicCalendarAccess
    },
    requiredPlan: 'Plano com acesso ao calendário econômico'
  };
}

/**
 * POST /api/economic-calendar/subscribe-notifications
 * Assina notificações de eventos econômicos (requer acesso)
 */
router.post("/subscribe-notifications", authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currencies, impacts, notificationTime } = req.body;
    const db = getDb();
    
    // Verificar acesso
    const accessCheck = await checkEconomicCalendarAccess(userId);
    
    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado - assinatura insuficiente para notificações do calendário econômico"
      });
    }
    
    // Aqui você pode salvar as preferências de notificação
    // Por exemplo, na tabela userSettings ou uma nova tabela específica
    
    return res.json({
      success: true,
      message: "Notificações do calendário econômico configuradas com sucesso",
      data: {
        currencies: currencies || [],
        impacts: impacts || ['high'],
        notificationTime: notificationTime || 60, // minutos de antecedência
        accessLevel: accessCheck.accessLevel
      }
    });
    
  } catch (error) {
    console.error("[EconomicCalendar] Erro ao configurar notificações:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

export default router;