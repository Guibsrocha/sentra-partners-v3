import express from 'express';
import { getDb } from '../db';

const router = express.Router();

// ===== VPS PRODUCTS =====

// GET all VPS
router.get('/api/admin/vps', async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.execute(`
      SELECT * FROM vps_products ORDER BY price ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// UPDATE VPS
router.put('/api/admin/vps/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, ram, cpu, storage, bandwidth, eas_limit, active } = req.body;
    
    const db = await getDb();
    await db.execute(`
      UPDATE vps_products 
      SET name = ?, description = ?, price = ?, ram = ?, cpu = ?, storage = ?, 
          bandwidth = ?, eas_limit = ?, active = ?
      WHERE id = ?
    `, [name, description, price, ram, cpu, storage, bandwidth, eas_limit, active, id]);
    
    res.json({ success: true, message: 'VPS atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// CREATE VPS
router.post('/api/admin/vps', async (req, res) => {
  try {
    const { name, description, price, ram, cpu, storage, bandwidth, eas_limit, active } = req.body;
    
    const db = await getDb();
    const [result] = await db.execute(`
      INSERT INTO vps_products (name, description, price, ram, cpu, storage, bandwidth, eas_limit, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description, price, ram, cpu, storage, bandwidth, eas_limit, active ?? true]);
    
    res.json({ success: true, message: 'VPS criado com sucesso', id: (result as any).insertId });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// DELETE VPS
router.delete('/api/admin/vps/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.execute(`DELETE FROM vps_products WHERE id = ?`, [id]);
    res.json({ success: true, message: 'VPS deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ===== EXPERT ADVISORS =====

// GET all EAs
router.get('/api/admin/expert-advisors', async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.execute(`
      SELECT * FROM expert_advisors ORDER BY price ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// UPDATE EA
router.put('/api/admin/expert-advisors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, platform, strategy, timeframe, active } = req.body;
    
    const db = await getDb();
    await db.execute(`
      UPDATE expert_advisors 
      SET name = ?, description = ?, price = ?, platform = ?, strategy = ?, timeframe = ?, active = ?
      WHERE id = ?
    `, [name, description, price, platform, strategy, timeframe, active, id]);
    
    res.json({ success: true, message: 'EA atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// CREATE EA
router.post('/api/admin/expert-advisors', async (req, res) => {
  try {
    const { name, description, price, platform, strategy, timeframe, active } = req.body;
    
    const db = await getDb();
    const [result] = await db.execute(`
      INSERT INTO expert_advisors (name, description, price, platform, strategy, timeframe, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, description, price, platform, strategy, timeframe, active ?? true]);
    
    res.json({ success: true, message: 'EA criado com sucesso', id: (result as any).insertId });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// DELETE EA
router.delete('/api/admin/expert-advisors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.execute(`DELETE FROM expert_advisors WHERE id = ?`, [id]);
    res.json({ success: true, message: 'EA deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ===== SUBSCRIPTION PLANS =====

// GET all Plans
router.get('/api/admin/subscription-plans', async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.execute(`
      SELECT * FROM subscription_plans ORDER BY price ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// UPDATE Plan
router.put('/api/admin/subscription-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, price, features, popular, active } = req.body;
    
    const db = await getDb();
    await db.execute(`
      UPDATE subscription_plans 
      SET name = ?, slug = ?, price = ?, features = ?, popular = ?, active = ?
      WHERE id = ?
    `, [name, slug, price, JSON.stringify(features), popular, active, id]);
    
    res.json({ success: true, message: 'Plano atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// CREATE Plan
router.post('/api/admin/subscription-plans', async (req, res) => {
  try {
    const { name, slug, price, features, popular, active } = req.body;
    
    const db = await getDb();
    const [result] = await db.execute(`
      INSERT INTO subscription_plans (name, slug, price, features, popular, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, slug, price, JSON.stringify(features), popular ?? false, active ?? true]);
    
    res.json({ success: true, message: 'Plano criado com sucesso', id: (result as any).insertId });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// DELETE Plan
router.delete('/api/admin/subscription-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.execute(`DELETE FROM subscription_plans WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Plano deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
