import { Router } from 'express';
import { getRawConnection } from '../db';

const router = Router();

/**
 * POST /api/admin/populate-data
 * Popula o banco de dados com todos os dados da landing page
 * ENDPOINT PERMANENTE - Dados reais de produção
 */
router.post('/populate-data', async (req, res) => {
  const conn = await getRawConnection();
  
  try {
    console.log('🚀 Iniciando população de dados...');
    
    // 1. Configuração completa da landing page
    const landingConfig = {
      logoUrl: '/sentra-logo-horizontal.png',
      paymentGateway: 'stripe',
      
      // Hero Section
      heroTitle: 'Tudo que você sempre',
      heroHighlight: 'quis saber sobre trading',
      heroSubtitle: '...mas suas planilhas nunca te contaram.',
      heroDescription: 'A Sentra Partners mostra as métricas que importam e os comportamentos que levam ao lucro com o poder do copy trading, expert advisors e análise avançada.',
      heroMetricProfit: '+$127K',
      heroMetricTrades: '2,847',
      heroMetricWinRate: '73%',
      heroMetricProfitFactor: '1.8',
      
      // Stats
      statTradesJournaled: '1.2B+',
      statBacktestedSessions: '50K+',
      statTradesShared: '2.5M+',
      statTradersOnBoard: '12K+',
      
      // Section Titles
      resourcesSectionTitle: 'Por que escolher a Sentra Partners?',
      resourcesSectionDescription: 'Tudo que você precisa para dominar o mercado',
      howItWorksSectionTitle: 'Com a Sentra Partners, trading fica simples',
      howItWorksSectionDescription: 'Veja o passo a passo abaixo',
      resultsSectionTitle: 'Nossos Resultados',
      resultsSectionDescription: 'Confira alguns de nossos números',
      plansSectionTitle: 'Escolha seu plano',
      plansSectionDescription: 'Planos flexíveis para todas as necessidades',
      faqSectionTitle: 'FAQ - Alguma Dúvida?',
      faqSectionDescription: 'Tire suas dúvidas com as perguntas mais frequentes sobre a Sentra Partners',
      vpsSectionTitle: 'VPS de Alta Performance',
      vpsSectionDescription: 'Execute seus EAs 24/7 com latência ultra-baixa',
      easSectionTitle: 'Expert Advisors Profissionais',
      easSectionDescription: 'Robôs de trading desenvolvidos por especialistas',
      
      // Copy Trading
      copyTradingTitle: 'Copy Trading Poderoso e Automatizado',
      copyTradingDescription: 'Você foca em operar enquanto nós focamos em te ajudar a melhorar. Com copy trading automatizado, fazemos o trabalho pesado por você.',
      
      // Analytics
      analyticsTitle: 'Analise suas estatísticas de trading',
      analyticsDescription: 'Entenda quais erros você cometeu, se arriscou mais do que planejado e muito mais estatísticas específicas de cada trade.',
      
      // Footer CTA
      footerCtaTitle: 'Pronto para Transformar Seu Trading?',
      footerCtaDescription: 'Junte-se a milhares de traders profissionais que já estão usando nossa plataforma',
      
      // Resource Cards
      resourceCards: [
        {
          icon: 'Copy',
          title: 'Copy Trading Automatizado',
          description: 'Configure em minutos e copie trades de traders profissionais para múltiplas contas simultaneamente'
        },
        {
          icon: 'BarChart3',
          title: 'Análise Avançada',
          description: 'Métricas detalhadas, histórico completo e monitoramento em tempo real de todas as suas operações'
        },
        {
          icon: 'Bot',
          title: 'Expert Advisors Profissionais',
          description: 'Robôs de trading desenvolvidos e testados por traders experientes com estratégias comprovadas'
        },
        {
          icon: 'Server',
          title: 'VPS de Alta Performance',
          description: 'Execute seus EAs 24/7 com latência ultra-baixa e garantia de uptime de 99.9%'
        }
      ],
      
      // How It Works Steps
      howItWorksSteps: [
        {
          step: '1',
          title: 'Crie sua conta',
          description: 'Cadastre-se gratuitamente e configure suas preferências de trading'
        },
        {
          step: '2',
          title: 'Conecte suas contas',
          description: 'Vincule suas contas MT4/MT5 de forma segura e rápida'
        },
        {
          step: '3',
          title: 'Escolha sua estratégia',
          description: 'Escolha traders para copiar ou configure seus próprios EAs'
        },
        {
          step: '4',
          title: 'Acompanhe resultados',
          description: 'Acompanhe métricas em tempo real e otimize sua estratégia'
        }
      ],
      
      // FAQ Items
      faqItems: [
        {
          question: 'O que é Copy Trading?',
          answer: 'Copy Trading é uma funcionalidade que permite copiar automaticamente as operações de traders experientes para suas contas MT4/MT5. Você escolhe quais traders seguir e todas as operações são replicadas em tempo real.'
        },
        {
          question: 'Como funciona o sistema de Expert Advisors?',
          answer: 'Nossos Expert Advisors (EAs) são robôs de trading desenvolvidos por profissionais. Você pode ativá-los em suas contas e eles operarão automaticamente seguindo estratégias pré-programadas e testadas.'
        },
        {
          question: 'Preciso de VPS para usar a plataforma?',
          answer: 'Não é obrigatório, mas é altamente recomendado para garantir que seus EAs e copy trading funcionem 24/7 sem interrupções. Oferecemos VPS otimizado com latência ultra-baixa.'
        },
        {
          question: 'Posso cancelar minha assinatura a qualquer momento?',
          answer: 'Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas de cancelamento. Seu acesso continuará ativo até o fim do período pago.'
        },
        {
          question: 'Quais corretoras são compatíveis?',
          answer: 'Nossa plataforma é compatível com qualquer corretora que ofereça MetaTrader 4 (MT4) ou MetaTrader 5 (MT5). Isso inclui a maioria das corretoras do mercado.'
        }
      ],
      
      // Subscription Plans
      subscriptionPlans: [
        {
          name: 'Básico',
          price: 47,
          features: [
            'Copy Trading (1 conta master)',
            'Dashboard básico',
            'Suporte por email',
            'Atualizações mensais'
          ],
          popular: false
        },
        {
          name: 'Profissional',
          price: 97,
          features: [
            'Copy Trading (ilimitado)',
            'Dashboard avançado',
            'Todos os EAs inclusos',
            'Suporte prioritário 24/7',
            'Análise de risco avançada'
          ],
          popular: true
        },
        {
          name: 'Enterprise',
          price: 197,
          features: [
            'Tudo do Profissional',
            'VPS Starter incluído',
            'Consultoria mensal 1h',
            'EA customizado',
            'API access'
          ],
          popular: false
        }
      ]
    };
    
    // Atualizar ou inserir configuração
    await conn.query(`
      INSERT INTO landing_page_config (id, config, created_at, updated_at)
      VALUES (1, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE config = VALUES(config), updated_at = NOW()
    `, [JSON.stringify(landingConfig)]);
    
    console.log('✅ Landing page config atualizada');
    
    // 2. Criar planos de assinatura
    await conn.query(`
      INSERT INTO subscription_plans (name, price, billing_cycle, features, max_accounts, is_active, created_at, updated_at)
      VALUES 
        ('Básico', 47.00, 'monthly', ?, 1, 1, NOW(), NOW()),
        ('Profissional', 97.00, 'monthly', ?, 999, 1, NOW(), NOW()),
        ('Enterprise', 197.00, 'monthly', ?, 999, 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        price = VALUES(price),
        features = VALUES(features),
        max_accounts = VALUES(max_accounts),
        updated_at = NOW()
    `, [
      JSON.stringify(['Copy Trading (1 conta master)', 'Dashboard básico', 'Suporte por email', 'Atualizações mensais']),
      JSON.stringify(['Copy Trading (ilimitado)', 'Dashboard avançado', 'Todos os EAs inclusos', 'Suporte prioritário 24/7', 'Análise de risco avançada']),
      JSON.stringify(['Tudo do Profissional', 'VPS Starter incluído', 'Consultoria mensal 1h', 'EA customizado', 'API access'])
    ]);
    
    console.log('✅ Planos de assinatura criados');
    
    // 3. Criar Expert Advisors
    await conn.query(`
      INSERT INTO expert_advisors (name, description, version, price, file_path, is_active, category, strategy_type, created_at, updated_at)
      VALUES 
        ('Sentra Scalper Pro', 'Expert Advisor especializado em scalping com gestão de risco avançada. Utiliza indicadores de momentum e volatilidade para identificar oportunidades de curto prazo. Ideal para pares de moedas com alta liquidez.', '2.1.5', 147.00, '/eas/sentra-scalper-pro.ex4', 1, 'Scalping', 'Momentum + Volatility', NOW(), NOW()),
        ('Sentra Trend Follower', 'Robô que identifica e segue tendências de médio e longo prazo. Usa médias móveis adaptativas e análise de volume para confirmar direção. Perfeito para traders que preferem operações mais conservadoras.', '3.0.2', 197.00, '/eas/sentra-trend-follower.ex4', 1, 'Trend Following', 'Moving Averages + Volume', NOW(), NOW()),
        ('Sentra Grid Master', 'Sistema de grid trading inteligente com proteção contra drawdown. Abre posições em níveis estratégicos e gerencia automaticamente o risco. Recomendado para mercados laterais.', '1.8.9', 127.00, '/eas/sentra-grid-master.ex4', 1, 'Grid Trading', 'Grid System + Risk Management', NOW(), NOW()),
        ('Sentra News Trader', 'EA especializado em operar eventos de notícias econômicas. Monitora calendário econômico e executa ordens baseadas em volatilidade pós-notícia. Para traders experientes.', '2.5.0', 177.00, '/eas/sentra-news-trader.ex4', 1, 'News Trading', 'Event-Driven + Volatility', NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        version = VALUES(version),
        price = VALUES(price),
        updated_at = NOW()
    `);
    
    console.log('✅ Expert Advisors criados');
    
    // 4. Criar produtos VPS
    await conn.query(`
      INSERT INTO vps_products (name, description, price, billing_cycle, cpu_cores, ram_gb, storage_gb, bandwidth_gb, is_active, created_at, updated_at)
      VALUES 
        ('VPS Starter', 'Ideal para 1-2 EAs rodando simultaneamente', 29.00, 'monthly', 2, 2, 40, 1000, 1, NOW(), NOW()),
        ('VPS Professional', 'Perfeito para múltiplos EAs e copy trading', 49.00, 'monthly', 4, 4, 80, 2000, 1, NOW(), NOW()),
        ('VPS Enterprise', 'Máxima performance para operações em larga escala', 89.00, 'monthly', 8, 8, 160, 5000, 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        price = VALUES(price),
        cpu_cores = VALUES(cpu_cores),
        ram_gb = VALUES(ram_gb),
        storage_gb = VALUES(storage_gb),
        bandwidth_gb = VALUES(bandwidth_gb),
        updated_at = NOW()
    `);
    
    console.log('✅ Produtos VPS criados');
    
    res.json({
      success: true,
      message: 'Todos os dados foram populados com sucesso!',
      data: {
        landingConfig: 'Atualizado',
        subscriptionPlans: '3 planos criados',
        expertAdvisors: '4 EAs criados',
        vpsProducts: '3 produtos VPS criados'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao popular dados:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await conn.end();
  }
});

export default router;
