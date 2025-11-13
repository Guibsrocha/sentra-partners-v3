import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

// GET /api/landing-config - Buscar configuração completa da landing page
router.get("/", async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [rows]: any = await connection.execute(
      `SELECT * FROM landing_page_content WHERE section = 'config' LIMIT 1`
    );

    if (rows.length === 0) {
      // Retornar config padrão se não existir
      return res.json({
        success: true,
        config: {
          logoUrl: "/sentra-logo-horizontal.png",
          paymentGateway: "stripe",
          heroTitle: "Tudo que você sempre",
          heroHighlight: "quis saber",
          heroSubtitle: "...mas suas planilhas nunca te contaram.",
          heroDescription: "A Sentra Partners mostra as métricas que importam e os comportamentos que levam ao lucro com o poder do copy trading, expert advisors e análise avançada.",
          heroMetricProfit: "+$127K",
          heroMetricTrades: "2,847",
          heroMetricWinRate: "73%",
          heroMetricProfitFactor: "1.8",
          statTradesJournaled: "1.2B+",
          statBacktestedSessions: "50K+",
          statTradesShared: "2.5M+",
          statTradersOnBoard: "12K+",
          copyTradingTitle: "Copy Trading Poderoso e Automatizado",
          copyTradingDescription: "Você foca em operar enquanto nós focamos em te ajudar a melhorar. Com copy trading automatizado, fazemos o trabalho pesado por você.",
          analyticsTitle: "Analise suas estatísticas de trading",
          analyticsDescription: "Entenda quais erros você cometeu, se arriscou mais do que planejado e muito mais estatísticas específicas de cada trade.",
          footerCtaTitle: "Pronto para Transformar Seu Trading?",
          footerCtaDescription: "Junte-se a milhares de traders profissionais que já estão usando nossa plataforma"
        }
      });
    }

    const config = JSON.parse(rows[0].content);

    res.json({
      success: true,
      config
    });
  } catch (error: any) {
    console.error('[Landing Config] Erro ao buscar configuração:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /api/landing-config - Salvar configuração completa da landing page
router.post("/", async (req, res) => {
  try {
    const config = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Configuração é obrigatória'
      });
    }

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    // Verificar se já existe
    const [existing]: any = await connection.execute(
      `SELECT id FROM landing_page_content WHERE section = 'config' LIMIT 1`
    );

    if (existing.length > 0) {
      // Atualizar
      await connection.execute(
        `UPDATE landing_page_content SET content = ?, updated_at = NOW() WHERE section = 'config'`,
        [JSON.stringify(config)]
      );
    } else {
      // Inserir
      await connection.execute(
        `INSERT INTO landing_page_content (section, content) VALUES ('config', ?)`,
        [JSON.stringify(config)]
      );
    }

    res.json({
      success: true,
      message: 'Configuração salva com sucesso'
    });
  } catch (error: any) {
    console.error('[Landing Config] Erro ao salvar configuração:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
