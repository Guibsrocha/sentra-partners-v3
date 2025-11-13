import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

// GET /api/vps-products - Listar todos os produtos VPS (guaranteed features)
router.get("/", async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [products]: any = await connection.execute(
      `SELECT 
        id, name, slug, description, price, 
        ram, cpu, storage, bandwidth,
        specifications, billing_cycle, location, provider,
        max_mt4_instances, max_mt5_instances, is_available, 
        stock_quantity, image_url, sort_order, features
       FROM vps_products 
       ORDER BY sort_order ASC, price ASC`
    );

    console.log('[VPS API] Processing', products.length, 'products - FIXED VERSION');
    
    // Always create features array from database fields
    const formattedProducts = products.map((product: any) => {
      console.log('[VPS API] Processing product:', product.name);
      
      const specifications = product.specifications ? JSON.parse(product.specifications) : {};
      
      // Create features array from individual fields
      const features = [
        product.cpu ? `${product.cpu} CPU` : '1 vCPU',
        product.ram ? `${product.ram} RAM` : '2GB RAM',
        product.storage ? `${product.storage} Storage` : '20GB Storage',
        product.bandwidth ? `${product.bandwidth} Bandwidth` : '1TB Bandwidth',
        `Local: ${product.location || 'São Paulo, Brasil'}`,
        `MT4: ${product.max_mt4_instances || 3} instancias`,
        `MT5: ${product.max_mt5_instances || 3} instancias`,
        `Provedor: ${product.provider || 'Sentra Partners'}`
      ];
      
      console.log('[VPS API] Created features for', product.name, ':', features);
      
      const formatted = {
        ...product,
        specifications,
        features,
        is_free: product.price <= 0,
        is_recommended: product.sort_order <= 2
      };
      
      return formatted;
    });

    console.log('[VPS API] Successfully returning', formattedProducts.length, 'products with features');
    
    res.json({
      success: true,
      products: formattedProducts,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[VPS Products] Erro ao listar produtos:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET /api/vps-products/with-features - Novo endpoint com features garantidas
router.get("/with-features", async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [products]: any = await connection.execute(
      `SELECT 
        id, name, slug, description, price, 
        ram, cpu, storage, bandwidth,
        specifications, billing_cycle, location, provider,
        max_mt4_instances, max_mt5_instances, is_available, 
        stock_quantity, image_url, sort_order, features
       FROM vps_products 
       ORDER BY sort_order ASC, price ASC`
    );

    console.log('[VPS API NEW] Processing', products.length, 'products');
    
    // Create products with features directly from database fields
    const formattedProducts = products.map((product: any) => {
      const specifications = product.specifications ? JSON.parse(product.specifications) : {};
      
      // Extract features directly
      let features = [];
      if (product.features) {
        try {
          features = JSON.parse(product.features);
          console.log('[VPS API NEW] Using DB features for', product.name);
        } catch (e) {
          console.error('[VPS API NEW] Error parsing features, creating from fields:', e);
        }
      }
      
      // If no features from DB, create from individual fields
      if (features.length === 0) {
        features = [
          product.cpu ? `${product.cpu} CPU` : '1 vCPU',
          product.ram ? `${product.ram} RAM` : '2GB RAM', 
          product.storage ? `${product.storage} Storage` : '20GB Storage',
          product.bandwidth ? `${product.bandwidth} Bandwidth` : '1TB Bandwidth',
          `Local: ${product.location || 'São Paulo, Brasil'}`,
          `MT4: ${product.max_mt4_instances || 3} instancias`,
          `MT5: ${product.max_mt5_instances || 3} instancias`,
          `Provedor: ${product.provider || 'Sentra Partners'}`
        ];
        console.log('[VPS API NEW] Created features from fields for', product.name);
      }
      
      console.log('[VPS API NEW] Final features for', product.name, ':', features);
      
      const formatted = {
        ...product,
        specifications,
        features,
        is_free: product.price <= 0,
        is_recommended: product.sort_order <= 2
      };
      
      return formatted;
    });

    console.log('[VPS API NEW] Returning', formattedProducts.length, 'products with features');
    
    res.json({
      success: true,
      products: formattedProducts,
      timestamp: new Date().toISOString(),
      version: 'with-features'
    });
  } catch (error: any) {
    console.error('[VPS Products NEW] Erro ao listar produtos:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /api/vps-products - Criar novo produto VPS
router.post("/", async (req, res) => {
  try {
    const { 
      name, 
      description,
      price, 
      ram, 
      cpu, 
      storage, 
      bandwidth,
      specifications,
      billing_cycle = 'monthly',
      location = 'São Paulo, Brasil',
      provider = 'Sentra Partners',
      max_mt4_instances = 5,
      max_mt5_instances = 5,
      is_available = true,
      stock_quantity = 100,
      image_url = null,
      sort_order = 0
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'name e price são obrigatórios'
      });
    }

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    // Gerar slug automaticamente
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Stringificar specifications se fornecido
    const specificationsJson = specifications ? JSON.stringify(specifications) : JSON.stringify({
      cpu: cpu || '1 vCPU',
      ram: ram || '2GB',
      storage: storage || '20GB SSD',
      bandwidth: bandwidth || '1TB'
    });

    const [result]: any = await connection.execute(
      `INSERT INTO vps_products 
       (name, slug, description, price, ram, cpu, storage, bandwidth, specifications, billing_cycle, location, provider, max_mt4_instances, max_mt5_instances, is_available, stock_quantity, image_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        description || `Servidor VPS ${name} otimizado para trading`, 
        price, 
        ram || null, 
        cpu || null, 
        storage || null, 
        bandwidth || null, 
        specificationsJson,
        billing_cycle,
        location,
        provider,
        max_mt4_instances || null, 
        max_mt5_instances || null, 
        is_available ? 1 : 0, 
        stock_quantity,
        image_url,
        sort_order
      ]
    );

    res.json({
      success: true,
      product_id: result.insertId,
      message: 'Produto VPS criado com sucesso'
    });
  } catch (error: any) {
    console.error('[VPS Products] Erro ao criar produto:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// PUT /api/vps-products/:id - Atualizar produto VPS
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      slug,
      description,
      price, 
      ram, 
      cpu, 
      storage, 
      bandwidth,
      specifications,
      billing_cycle,
      location,
      provider,
      max_mt4_instances,
      max_mt5_instances,
      is_available,
      stock_quantity,
      image_url,
      sort_order
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
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (ram !== undefined) {
      updates.push('ram = ?');
      params.push(ram);
    }
    if (cpu !== undefined) {
      updates.push('cpu = ?');
      params.push(cpu);
    }
    if (storage !== undefined) {
      updates.push('storage = ?');
      params.push(storage);
    }
    if (bandwidth !== undefined) {
      updates.push('bandwidth = ?');
      params.push(bandwidth);
    }
    if (specifications !== undefined) {
      updates.push('specifications = ?');
      params.push(JSON.stringify(specifications));
    }
    if (billing_cycle !== undefined) {
      updates.push('billing_cycle = ?');
      params.push(billing_cycle);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (provider !== undefined) {
      updates.push('provider = ?');
      params.push(provider);
    }
    if (max_mt4_instances !== undefined) {
      updates.push('max_mt4_instances = ?');
      params.push(max_mt4_instances);
    }
    if (max_mt5_instances !== undefined) {
      updates.push('max_mt5_instances = ?');
      params.push(max_mt5_instances);
    }
    if (is_available !== undefined) {
      updates.push('is_available = ?');
      params.push(is_available ? 1 : 0);
    }
    if (stock_quantity !== undefined) {
      updates.push('stock_quantity = ?');
      params.push(stock_quantity);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(image_url);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(sort_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar'
      });
    }

    params.push(id);

    await connection.execute(
      `UPDATE vps_products SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Produto VPS atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('[VPS Products] Erro ao atualizar produto:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// DELETE /api/vps-products/:id - Deletar produto VPS
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    await connection.execute(
      `DELETE FROM vps_products WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Produto VPS deletado com sucesso'
    });
  } catch (error: any) {
    console.error('[VPS Products] Erro ao deletar produto:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
