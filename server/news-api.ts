/**
 * API pública de notícias para EAs MT4/MT5
 * Endpoint: GET /api/news
 */

import express from 'express';
import { getForexFactoryEvents } from './forex-calendar';

const router = express.Router();

/**
 * GET /api/news
 * Retorna próximas notícias de alto impacto
 * 
 * Query params:
 * - hours: número de horas à frente (padrão: 24)
 * - impact: filtrar por impacto (High, Medium, Low)
 * - limit: número máximo de eventos (padrão: 100)
 */
router.get('/news', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const impactFilter = (req.query.impact as string)?.toLowerCase();
    const limit = parseInt(req.query.limit as string) || 100;

    // Buscar eventos do Forex Factory
    const allEvents = await getForexFactoryEvents();

    // Filtrar eventos futuros
    const now = new Date();
    const maxTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    let filteredEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date + ' ' + event.time);
      return eventDate >= now && eventDate <= maxTime;
    });

    // Filtrar por impacto se especificado
    if (impactFilter) {
      filteredEvents = filteredEvents.filter(event => 
        event.impact.toLowerCase() === impactFilter
      );
    }

    // Limitar quantidade
    filteredEvents = filteredEvents.slice(0, limit);

    // Formatar resposta para o EA
    const response = filteredEvents.map(event => ({
      time: event.date + ' ' + event.time,
      title: event.title,
      country: event.country,
      impact: event.impact,
      forecast: event.forecast || '',
      previous: event.previous || '',
    }));

    res.json({
      success: true,
      count: response.length,
      events: response,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[News API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news',
      events: [],
    });
  }
});

//====================================================
// GET /api/news/premium
// Calendário econômico completo - REQUISITA advancedAnalyticsEnabled
//====================================================
router.get('/news/premium', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'userId é obrigatório para acesso premium' 
      });
    }

    // === VERIFICAR SUBSCRICAO AVANCADA ===
    const { checkSubscription } = await import('./middleware/subscription-check');
    
    const mockReq = { userId } as any;
    const mockRes = {} as any;
    const mockNext = () => {};
    
    await checkSubscription(mockReq, mockRes, mockNext);
    
    if (!mockReq.subscription?.limits?.advancedAnalyticsEnabled) {
      return res.status(403).json({ 
        success: false,
        error: "Análises Avançadas não disponíveis no seu plano",
        message: "Faça upgrade para um plano Premium para acessar o calendário econômico completo.",
        code: "ADVANCED_ANALYTICS_NOT_ENABLED"
      });
    }

    // Buscar eventos completos com mais detalhes
    const hours = parseInt(req.query.hours as string) || 168; // 1 semana
    const limit = parseInt(req.query.limit as string) || 200;

    const allEvents = await getForexFactoryEvents();

    // Filtrar eventos futuros
    const now = new Date();
    const maxTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    let filteredEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date + ' ' + event.time);
      return eventDate >= now && eventDate <= maxTime;
    });

    // Limitar quantidade
    filteredEvents = filteredEvents.slice(0, limit);

    // Formatar resposta completa para premium
    const response = filteredEvents.map(event => ({
      time: event.date + ' ' + event.time,
      title: event.title,
      country: event.country,
      impact: event.impact,
      forecast: event.forecast || '',
      previous: event.previous || '',
      // Adicionar campos extras para premium
      isHighImpact: event.impact.toLowerCase() === 'high',
      riskLevel: event.impact.toLowerCase() === 'high' ? 'high' : 
                 event.impact.toLowerCase() === 'medium' ? 'medium' : 'low'
    }));

    console.log(`✅ [PREMIUM CALENDAR] User ${userId}: Advanced Analytics enabled, ${response.length} events`);

    res.json({
      success: true,
      count: response.length,
      events: response,
      userId,
      plan: 'premium',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Premium News API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch premium news',
      events: [],
    });
  }
});

/**
 * GET /api/news/high-impact
 * Retorna apenas notícias de alto impacto nas próximas 24h
 */
router.get('/news/high-impact', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const allEvents = await getForexFactoryEvents();

    const now = new Date();
    const maxTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const highImpactEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date + ' ' + event.time);
      return eventDate >= now && 
             eventDate <= maxTime && 
             event.impact.toLowerCase() === 'high';
    });

    const response = highImpactEvents.slice(0, 50).map(event => ({
      time: event.date + ' ' + event.time,
      title: event.title,
      country: event.country,
      impact: event.impact,
      forecast: event.forecast || '',
      previous: event.previous || '',
    }));

    res.json({
      success: true,
      count: response.length,
      events: response,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[News API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch high impact news',
      events: [],
    });
  }
});

export default router;

