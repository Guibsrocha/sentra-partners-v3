import { getRawConnection } from '../db';

async function populateLandingData() {
  const conn = await getRawConnection();
  
  try {
    console.log('🚀 Iniciando população de dados...');
    
    // 1. Atualizar configuração da landing page
    console.log('📝 Atualizando configuração da landing page...');
    
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
      faqSectionDescription: 'Tire suas dúvidas com as perguntas mais frequentes',
      vpsSectionTitle: 'VPS de Alta Performance',
      vpsSectionDescription: 'Execute seus EAs 24/7 com latência ultra-baixa',
      easSectionTitle: 'Expert Advisors Profissionais',
      easSectionDescription: 'Robôs de trading desenvolvidos por especialistas',
      
      // Copy Trading
      copyTradingTitle: 'Copy Trading Poderoso e Automatizado',
      copyTradingDescription: 'Você foca em operar enquanto nós focamos em te ajudar a melhorar.',
      
      // Analytics
      analyticsTitle: 'Analise suas estatísticas de trading',
      analyticsDescription: 'Entenda quais erros você cometeu e muito mais.',
      
      // Footer CTA
      footerCtaTitle: 'Pronto para Transformar Seu Trading?',
      footerCtaDescription: 'Junte-se a milhares de traders profissionais',
      
      // Resource Cards
      resourceCards: [
        {
          icon: 'Copy',
          title: 'Copy Trading Automatizado',
          description: 'Configure em minutos e copie trades de traders profissionais para múltiplas contas'
        },
        {
          icon: 'BarChart3',
          title: 'Análise Avançada',
          description: 'Métricas detalhadas, histórico completo e monitoramento em tempo real'
        },
        {
          icon: 'Bot',
          title: 'Expert Advisors Profissionais',
          description: 'Robôs de trading desenvolvidos e testados por traders experientes'
        },
        {
          icon: 'Server',
          title: 'VPS de Alta Performance',
          description: 'Execute seus EAs 24/7 com latência ultra-baixa e uptime de 99.9%'
        }
      ],
      
      // How It Works Steps
      howItWorksSteps: [
        {
          step: '1',
          title: 'Crie sua conta',
          description: 'Cadastre-se gratuitamente e configure suas preferências'
        },
        {
          step: '2',
          title: 'Conecte suas contas',
          description: 'Vincule suas contas MT4/MT5 de forma segura'
        },
        {
          step: '3',
          title: 'Escolha sua estratégia',
          description: 'Escolha traders para copiar ou configure seus EAs'
        },
        {
          step: '4',
          title: 'Acompanhe resultados',
          description: 'Acompanhe métricas em tempo real e otimize'
        }
      ],
      
      // FAQ Items
      faqItems: [
        {
          question: 'O que é Copy Trading?',
          answer: 'Copy Trading permite copiar automaticamente operações de traders experientes para suas contas MT4/MT5.'
        },
        {
          question: 'Como funciona o sistema de Expert Advisors?',
          answer: 'Nossos EAs são robôs desenvolvidos por profissionais que operam automaticamente seguindo estratégias testadas.'
        },
        {
          question: 'Preciso de VPS para usar a plataforma?',
          answer: 'Não é obrigatório, mas é recomendado para garantir funcionamento 24/7 sem interrupções.'
        },
        {
          question: 'Posso cancelar minha assinatura a qualquer momento?',
          answer: 'Sim! Você pode cancelar a qualquer momento sem taxas. Seu acesso continua até o fim do período pago.'
        },
        {
          question: 'Quais corretoras são compatíveis?',
          answer: 'Qualquer corretora que ofereça MetaTrader 4 ou 5. Isso inclui a maioria das corretoras do mercado.'
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
    
    await conn.query(
      'UPDATE landing_page_config SET config = ?, updated_at = NOW() WHERE id = 1',
      [JSON.stringify(landingConfig)]
    );
    
    console.log('✅ Configuração da landing page atualizada!');
    
    // 2. Criar planos de assinatura
    console.log('💳 Criando planos de assinatura...');
    
    await conn.query(`
      INSERT INTO subscription_plans (name, price, billing_cycle, features, max_accounts, is_active, created_at, updated_at)
      VALUES 
        ('Básico', 47.00, 'monthly', ?, 1, 1, NOW(), NOW()),
        ('Profissional', 97.00, 'monthly', ?, 999, 1, NOW(), NOW()),
        ('Enterprise', 197.00, 'monthly', ?, 999, 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        price = VALUES(price),
        features = VALUES(features),
        updated_at = NOW()
    `, [
      JSON.stringify(['Copy Trading (1 conta master)', 'Dashboard básico', 'Suporte por email', 'Atualizações mensais']),
      JSON.stringify(['Copy Trading (ilimitado)', 'Dashboard avançado', 'Todos os EAs inclusos', 'Suporte prioritário 24/7', 'Análise de risco avançada']),
      JSON.stringify(['Tudo do Profissional', 'VPS Starter incluído', 'Consultoria mensal 1h', 'EA customizado', 'API access'])
    ]);
    
    console.log('✅ Planos de assinatura criados!');
    
    // 3. Criar Expert Advisors
    console.log('🤖 Criando Expert Advisors...');
    
    await conn.query(`
      INSERT INTO expert_advisors (name, description, version, price, file_path, is_active, category, strategy_type, created_at, updated_at)
      VALUES 
        ('Sentra Scalper Pro', 'EA especializado em scalping com gestão de risco avançada. Ideal para pares com alta liquidez.', '2.1.5', 147.00, '/eas/sentra-scalper-pro.ex4', 1, 'Scalping', 'Momentum + Volatility', NOW(), NOW()),
        ('Sentra Trend Follower', 'Robô que identifica e segue tendências de médio e longo prazo. Perfeito para operações conservadoras.', '3.0.2', 197.00, '/eas/sentra-trend-follower.ex4', 1, 'Trend Following', 'Moving Averages + Volume', NOW(), NOW()),
        ('Sentra Grid Master', 'Sistema de grid trading inteligente com proteção contra drawdown. Recomendado para mercados laterais.', '1.8.9', 127.00, '/eas/sentra-grid-master.ex4', 1, 'Grid Trading', 'Grid System + Risk Management', NOW(), NOW()),
        ('Sentra News Trader', 'EA especializado em operar eventos de notícias econômicas. Para traders experientes.', '2.5.0', 177.00, '/eas/sentra-news-trader.ex4', 1, 'News Trading', 'Event-Driven + Volatility', NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        version = VALUES(version),
        price = VALUES(price),
        updated_at = NOW()
    `);
    
    console.log('✅ Expert Advisors criados!');
    
    // 4. Criar produtos VPS
    console.log('💻 Criando produtos VPS...');
    
    await conn.query(`
      INSERT INTO vps_products (name, description, price, billing_cycle, cpu_cores, ram_gb, storage_gb, bandwidth_gb, is_active, created_at, updated_at)
      VALUES 
        ('VPS Starter', 'Ideal para 1-2 EAs rodando simultaneamente', 29.00, 'monthly', 2, 2, 40, 1000, 1, NOW(), NOW()),
        ('VPS Professional', 'Perfeito para múltiplos EAs e copy trading', 49.00, 'monthly', 4, 4, 80, 2000, 1, NOW(), NOW()),
        ('VPS Enterprise', 'Máxima performance para operações em larga escala', 89.00, 'monthly', 8, 8, 160, 5000, 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        price = VALUES(price),
        updated_at = NOW()
    `);
    
    console.log('✅ Produtos VPS criados!');
    
    console.log('\n🎉 Todos os dados foram populados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao popular dados:', error);
    throw error;
  } finally {
    await conn.end();
  }
}

populateLandingData()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
