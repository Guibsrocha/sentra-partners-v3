import express from 'express';
import { getDb } from '../db';

const router = express.Router();

router.get('/api/landing-products', async (req, res) => {
  try {
    const db = await getDb();
    
    // Buscar VPS (com tratamento de erro se tabela não existir)
    let vpsRows: any[] = [];
    try {
      const [rows] = await db.execute(`
        SELECT id, name, description, price, ram, cpu, storage, bandwidth, eas_limit, active
        FROM vps_products
        WHERE active = true
        ORDER BY price ASC
      `);
      vpsRows = rows as any[];
    } catch (err) {
      console.log('⚠️ Tabela vps_products não existe ou erro ao buscar');
    }

    // Buscar Expert Advisors (com tratamento de erro se tabela não existir)
    let easRows: any[] = [];
    try {
      const [rows] = await db.execute(`
        SELECT id, name, description, price, platform, strategy, timeframe, active
        FROM expert_advisors
        WHERE active = true
        ORDER BY price ASC
      `);
      easRows = rows as any[];
    } catch (err) {
      console.log('⚠️ Tabela expert_advisors não existe ou erro ao buscar');
    }

    // Buscar Planos de Assinatura (com tratamento de erro se tabela não existir)
    let plansRows: any[] = [];
    try {
      const [rows] = await db.execute(`
        SELECT id, name, slug, price, features, popular, active
        FROM subscription_plans
        WHERE active = true
        ORDER BY price ASC
      `);
      plansRows = rows as any[];
    } catch (err) {
      console.log('⚠️ Tabela subscription_plans não existe ou erro ao buscar');
    }

    // Formatar dados
    const vpsProducts = (vpsRows as any[]).map(vps => ({
      id: vps.id,
      name: vps.name,
      description: vps.description,
      price: vps.price,
      specs: {
        ram: vps.ram,
        cpu: vps.cpu,
        storage: vps.storage,
        bandwidth: vps.bandwidth,
        easLimit: vps.eas_limit
      }
    }));

    const expertAdvisors = (easRows as any[]).map(ea => ({
      id: ea.id,
      name: ea.name,
      description: ea.description,
      price: ea.price,
      platform: ea.platform,
      strategy: ea.strategy,
      timeframe: ea.timeframe
    }));

    const subscriptionPlans = (plansRows as any[]).map(plan => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      price: plan.price, // Preços já estão em dólares no banco
      features: JSON.parse(plan.features || '[]'),
      popular: Boolean(plan.popular)
    }));

    res.json({
      success: true,
      data: {
        vpsProducts,
        expertAdvisors,
        subscriptionPlans
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
