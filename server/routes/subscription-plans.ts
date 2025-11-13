import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

// GET /api/subscription-plans - Listar todos os planos
router.get("/", async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [plans]: any = await connection.execute(
      `SELECT * FROM subscription_plans ORDER BY price ASC`
    );

    // Converter features de TEXT para array
    const plansWithFeatures = plans.map((plan: any) => ({
      ...plan,
      features: plan.features ? plan.features.split('\n').filter((f: string) => f.trim()) : []
    }));

    res.json({
      success: true,
      plans: plansWithFeatures
    });
  } catch (error: any) {
    console.error('[Subscription Plans] Erro ao listar planos:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /api/subscription-plans - Criar novo plano
router.post("/", async (req, res) => {
  try {
    const { 
      name, 
      slug, 
      description,
      price,
      priceQuarterly,
      priceSemestral, 
      priceYearly,
      priceLifetime,
      features,
      maxAccounts = 1,
      copyTradingEnabled = true,
      economicCalendarAccess = false,
      advancedAnalyticsEnabled = false,
      freeVpsEnabled = false,
      prioritySupport = false,
      maxMastersAllowed = 1,
      canCopyUnlimited = false,
      active = true,
      sortOrder = 0
    } = req.body;

    if (!name || !slug || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'name, slug e price são obrigatórios'
      });
    }

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    // Converter array de features para TEXT
    const featuresText = Array.isArray(features) ? features.join('\n') : features || '';

    const [result]: any = await connection.execute(
      `INSERT INTO subscription_plans (
        name, slug, description, price, priceQuarterly, priceSemestral, priceYearly, priceLifetime,
        features, maxAccounts, copyTradingEnabled, economicCalendarAccess, 
        advancedAnalyticsEnabled, freeVpsEnabled, prioritySupport,
        maxMastersAllowed, canCopyUnlimited, isActive, sortOrder
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, slug, description || '', price, priceQuarterly || null, priceSemestral || null,
        priceYearly || null, priceLifetime || null, featuresText, maxAccounts,
        copyTradingEnabled, economicCalendarAccess, advancedAnalyticsEnabled,
        freeVpsEnabled, prioritySupport, maxMastersAllowed, canCopyUnlimited, active, sortOrder
      ]
    );

    res.json({
      success: true,
      plan_id: result.insertId,
      message: 'Plano criado com sucesso',
      data: {
        name,
        slug,
        maxMastersAllowed,
        canCopyUnlimited,
        economicCalendarAccess,
        copyTradingEnabled
      }
    });
  } catch (error: any) {
    console.error('[Subscription Plans] Erro ao criar plano:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// PUT /api/subscription-plans/:id - Atualizar plano
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, slug, description, price, priceQuarterly, priceSemestral, priceYearly, priceLifetime,
      features, maxAccounts, copyTradingEnabled, economicCalendarAccess,
      advancedAnalyticsEnabled, freeVpsEnabled, prioritySupport,
      maxMastersAllowed, canCopyUnlimited, isActive, sortOrder, active
    } = req.body;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const updates: string[] = [];
    const params: any[] = [];

    // Campos básicos
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (slug !== undefined) {
      updates.push('slug = ?');
      params.push(slug);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (priceQuarterly !== undefined) {
      updates.push('priceQuarterly = ?');
      params.push(priceQuarterly);
    }
    if (priceSemestral !== undefined) {
      updates.push('priceSemestral = ?');
      params.push(priceSemestral);
    }
    if (priceYearly !== undefined) {
      updates.push('priceYearly = ?');
      params.push(priceYearly);
    }
    if (priceLifetime !== undefined) {
      updates.push('priceLifetime = ?');
      params.push(priceLifetime);
    }
    
    // Features
    if (features !== undefined) {
      const featuresText = Array.isArray(features) ? features.join('\n') : features;
      updates.push('features = ?');
      params.push(featuresText);
    }
    
    // Configurações de funcionalidade
    if (maxAccounts !== undefined) {
      updates.push('maxAccounts = ?');
      params.push(maxAccounts);
    }
    if (copyTradingEnabled !== undefined) {
      updates.push('copyTradingEnabled = ?');
      params.push(copyTradingEnabled);
    }
    if (economicCalendarAccess !== undefined) {
      updates.push('economicCalendarAccess = ?');
      params.push(economicCalendarAccess);
    }
    if (advancedAnalyticsEnabled !== undefined) {
      updates.push('advancedAnalyticsEnabled = ?');
      params.push(advancedAnalyticsEnabled);
    }
    if (freeVpsEnabled !== undefined) {
      updates.push('freeVpsEnabled = ?');
      params.push(freeVpsEnabled);
    }
    if (prioritySupport !== undefined) {
      updates.push('prioritySupport = ?');
      params.push(prioritySupport);
    }
    
    // Configurações de copy trading
    if (maxMastersAllowed !== undefined) {
      updates.push('maxMastersAllowed = ?');
      params.push(maxMastersAllowed);
    }
    if (canCopyUnlimited !== undefined) {
      updates.push('canCopyUnlimited = ?');
      params.push(canCopyUnlimited);
    }
    
    // Status
    if (active !== undefined) {
      updates.push('isActive = ?');
      params.push(active);
    }
    if (isActive !== undefined) {
      updates.push('isActive = ?');
      params.push(isActive);
    }
    if (sortOrder !== undefined) {
      updates.push('sortOrder = ?');
      params.push(sortOrder);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar'
      });
    }

    params.push(id);

    await connection.execute(
      `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Plano atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('[Subscription Plans] Erro ao atualizar plano:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// DELETE /api/subscription-plans/:id - Deletar plano
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    await connection.execute(
      `DELETE FROM subscription_plans WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Plano deletado com sucesso'
    });
  } catch (error: any) {
    console.error('[Subscription Plans] Erro ao deletar plano:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
