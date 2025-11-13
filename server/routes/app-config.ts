import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

// GET /api/app-config - Buscar configurações globais da aplicação
router.get("/", async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [rows]: any = await connection.execute(
      `SELECT * FROM app_config WHERE id = 1 LIMIT 1`
    );

    if (rows.length === 0) {
      // Retornar config padrão
      return res.json({
        success: true,
        config: {
          logoUrl: "/sentra-logo-horizontal.png",
          appName: "Sentra Partners"
        }
      });
    }

    res.json({
      success: true,
      config: {
        logoUrl: rows[0].logo_url || "/sentra-logo-horizontal.png",
        appName: rows[0].app_name || "Sentra Partners"
      }
    });
  } catch (error: any) {
    console.error('[App Config] Erro ao buscar configuração:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /api/app-config - Salvar configurações globais
router.post("/", async (req, res) => {
  try {
    const { logoUrl, appName } = req.body;

    if (!logoUrl || !appName) {
      return res.status(400).json({
        success: false,
        error: 'logoUrl e appName são obrigatórios'
      });
    }

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    // Verificar se já existe
    const [existing]: any = await connection.execute(
      `SELECT id FROM app_config WHERE id = 1 LIMIT 1`
    );

    if (existing.length > 0) {
      // Atualizar
      await connection.execute(
        `UPDATE app_config SET logo_url = ?, app_name = ?, updated_at = NOW() WHERE id = 1`,
        [logoUrl, appName]
      );
    } else {
      // Inserir
      await connection.execute(
        `INSERT INTO app_config (id, logo_url, app_name) VALUES (1, ?, ?)`,
        [logoUrl, appName]
      );
    }

    res.json({
      success: true,
      message: 'Configuração salva com sucesso'
    });
  } catch (error: any) {
    console.error('[App Config] Erro ao salvar configuração:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
