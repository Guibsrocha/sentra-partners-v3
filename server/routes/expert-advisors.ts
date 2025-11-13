import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

// GET /api/expert-advisors - Listar todos os EAs
router.get("/", async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [eas]: any = await connection.execute(
      `SELECT 
        id, name, slug, description, long_description, price, platform,
        license_type, rental_period, features, strategy, version, 
        rating, review_count, sort_order, active
       FROM expert_advisors 
       ORDER BY sort_order ASC, price ASC`
    );

    // Parse features JSON
    const formattedEAs = eas.map((ea: any) => ({
      ...ea,
      features: ea.features ? JSON.parse(ea.features) : [],
      rating_percentage: ea.rating / 100, // Converter para percentagem
      download_url: `/api/expert-advisors/${ea.id}/download` // URL de download
    }));

    res.json({
      success: true,
      eas: formattedEAs
    });
  } catch (error: any) {
    console.error('[Expert Advisors] Erro ao listar EAs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /api/expert-advisors - Criar novo EA
router.post("/", async (req, res) => {
  try {
    const { 
      name, 
      description,
      long_description,
      price, 
      platform,
      license_type = 'single',
      rental_period = 0,
      features = [],
      strategy,
      version = '1.0.0',
      image_url = null,
      demo_url = null,
      video_url = null,
      is_exclusive = false,
      rating = 4000,
      review_count = 0,
      sort_order = 0,
      active = true 
    } = req.body;

    if (!name || price === undefined || !platform) {
      return res.status(400).json({
        success: false,
        error: 'name, price e platform são obrigatórios'
      });
    }

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    // Gerar slug automaticamente
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Stringificar features se fornecido
    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : '[]';

    const [result]: any = await connection.execute(
      `INSERT INTO expert_advisors 
       (name, slug, description, long_description, price, platform, license_type, rental_period, features, strategy, version, image_url, demo_url, video_url, is_exclusive, rating, review_count, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        description || `EA ${name} profissional para trading automatizado`, 
        long_description || description || null,
        price, 
        platform,
        license_type,
        rental_period,
        featuresJson,
        strategy || 'Estratégia avançada',
        version,
        image_url,
        demo_url,
        video_url,
        is_exclusive ? 1 : 0,
        rating,
        review_count,
        sort_order,
        active ? 1 : 0
      ]
    );

    res.json({
      success: true,
      ea_id: result.insertId,
      message: 'EA criado com sucesso'
    });
  } catch (error: any) {
    console.error('[Expert Advisors] Erro ao criar EA:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// PUT /api/expert-advisors/:id - Atualizar EA
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name,
      slug,
      description,
      long_description,
      price, 
      platform,
      license_type,
      rental_period,
      features,
      strategy,
      version,
      image_url,
      demo_url,
      video_url,
      is_exclusive,
      rating,
      review_count,
      sort_order,
      active 
    } = req.body;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
      // Atualizar slug se name foi alterado e slug não foi fornecido
      if (!slug) {
        const newSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        updates.push('slug = ?');
        params.push(newSlug);
      }
    }
    if (slug !== undefined) {
      updates.push('slug = ?');
      params.push(slug);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (long_description !== undefined) {
      updates.push('long_description = ?');
      params.push(long_description);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (platform !== undefined) {
      updates.push('platform = ?');
      params.push(platform);
    }
    if (license_type !== undefined) {
      updates.push('license_type = ?');
      params.push(license_type);
    }
    if (rental_period !== undefined) {
      updates.push('rental_period = ?');
      params.push(rental_period);
    }
    if (features !== undefined) {
      updates.push('features = ?');
      params.push(Array.isArray(features) ? JSON.stringify(features) : features);
    }
    if (strategy !== undefined) {
      updates.push('strategy = ?');
      params.push(strategy);
    }
    if (version !== undefined) {
      updates.push('version = ?');
      params.push(version);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(image_url);
    }
    if (demo_url !== undefined) {
      updates.push('demo_url = ?');
      params.push(demo_url);
    }
    if (video_url !== undefined) {
      updates.push('video_url = ?');
      params.push(video_url);
    }
    if (is_exclusive !== undefined) {
      updates.push('is_exclusive = ?');
      params.push(is_exclusive ? 1 : 0);
    }
    if (rating !== undefined) {
      updates.push('rating = ?');
      params.push(rating);
    }
    if (review_count !== undefined) {
      updates.push('review_count = ?');
      params.push(review_count);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(sort_order);
    }
    if (active !== undefined) {
      updates.push('active = ?');
      params.push(active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar'
      });
    }

    params.push(id);

    await connection.execute(
      `UPDATE expert_advisors SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'EA atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('[Expert Advisors] Erro ao atualizar EA:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// DELETE /api/expert-advisors/:id - Deletar EA (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    // Soft delete - marcar como inativo ao invés de deletar
    await connection.execute(
      `UPDATE expert_advisors SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'EA removido com sucesso'
    });
  } catch (error: any) {
    console.error('[Expert Advisors] Erro ao remover EA:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /api/expert-advisors/:id/download - Incrementar contador de downloads
router.post("/:id/download", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    await connection.execute(
      `UPDATE expert_advisors SET review_count = review_count + 1 WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Download registrado'
    });
  } catch (error: any) {
    console.error('[Expert Advisors] Erro ao registrar download:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET /api/expert-advisors/:id - Buscar EA específico
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [results]: any = await connection.execute(
      `SELECT * FROM expert_advisors WHERE id = ? LIMIT 1`,
      [id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'EA não encontrado'
      });
    }

    const ea = results[0];
    ea.features = ea.features ? JSON.parse(ea.features) : [];
    ea.rating_percentage = ea.rating / 100;

    res.json({
      success: true,
      ea
    });
  } catch (error: any) {
    console.error('[Expert Advisors] Erro ao buscar EA:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
