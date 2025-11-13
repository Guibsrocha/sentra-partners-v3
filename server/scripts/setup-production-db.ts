import 'dotenv/config';
import { getRawConnection } from '../db';

async function setupDatabase() {
  console.log('🔧 Conectando ao banco Aiven...');
  const conn = await getRawConnection();
  
  try {
    // 1. Criar tabela landing_page_config
    console.log('📝 Criando tabela landing_page_config...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS landing_page_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        heroTitle TEXT,
        heroHighlight TEXT,
        heroSubtitle TEXT,
        stat1Value VARCHAR(50),
        stat1Label VARCHAR(100),
        stat2Value VARCHAR(50),
        stat2Label VARCHAR(100),
        stat3Value VARCHAR(50),
        stat3Label VARCHAR(100),
        stat4Value VARCHAR(50),
        stat4Label VARCHAR(100),
        copyTradingTitle TEXT,
        copyTradingSubtitle TEXT,
        analyticsTitle TEXT,
        analyticsSubtitle TEXT,
        vpsTitle TEXT,
        vpsSubtitle TEXT,
        easTitle TEXT,
        easSubtitle TEXT,
        ctaTitle TEXT,
        ctaSubtitle TEXT,
        ctaButtonText VARCHAR(100),
        resourcesSectionTitle TEXT,
        resourcesSectionDescription TEXT,
        howItWorksSectionTitle TEXT,
        howItWorksSectionDescription TEXT,
        resultsSectionTitle TEXT,
        resultsSectionDescription TEXT,
        faqSectionTitle TEXT,
        faqSectionDescription TEXT,
        plansSectionTitle TEXT,
        plansSectionDescription TEXT,
        resourceCards JSON,
        howItWorksSteps JSON,
        faqItems JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela landing_page_config criada!');

    // 2. Criar tabela subscription_plans
    console.log('📝 Criando tabela subscription_plans...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        billingCycle VARCHAR(20) DEFAULT 'monthly',
        features JSON,
        isPopular BOOLEAN DEFAULT FALSE,
        isActive BOOLEAN DEFAULT TRUE,
        stripePriceId VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela subscription_plans criada!');

    // 3. Criar tabela expert_advisors
    console.log('📝 Criando tabela expert_advisors...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS expert_advisors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        features JSON,
        strategy VARCHAR(50),
        timeframe VARCHAR(20),
        minDeposit DECIMAL(10,2),
        isActive BOOLEAN DEFAULT TRUE,
        downloadUrl VARCHAR(500),
        imageUrl VARCHAR(500),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela expert_advisors criada!');

    // 4. Criar tabela vps_products
    console.log('📝 Criando tabela vps_products...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS vps_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        billingCycle VARCHAR(20) DEFAULT 'monthly',
        cpu VARCHAR(50),
        ram VARCHAR(50),
        storage VARCHAR(50),
        bandwidth VARCHAR(50),
        features JSON,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela vps_products criada!');

    // 5. Popular landing_page_config
    console.log('📝 Populando landing_page_config...');
    await conn.query(`
      INSERT INTO landing_page_config (
        heroTitle, heroHighlight, heroSubtitle,
        stat1Value, stat1Label, stat2Value, stat2Label,
        stat3Value, stat3Label, stat4Value, stat4Label,
        copyTradingTitle, copyTradingSubtitle,
        analyticsTitle, analyticsSubtitle,
        vpsTitle, vpsSubtitle,
        easTitle, easSubtitle,
        ctaTitle, ctaSubtitle, ctaButtonText,
        resourcesSectionTitle, resourcesSectionDescription,
        howItWorksSectionTitle, howItWorksSectionDescription,
        resultsSectionTitle, resultsSectionDescription,
        faqSectionTitle, faqSectionDescription,
        plansSectionTitle, plansSectionDescription,
        resourceCards, howItWorksSteps, faqItems
      ) VALUES (
        'Tudo que você sempre quis saber',
        'sempre quis',
        'A Sentra Partners mostra as métricas que importam e os comportamentos que levam ao lucro com o poder do copy trading, expert advisors e análise avançada.',
        '+$127K', 'Lucro Total',
        '2,847', 'Trades',
        '73%', 'Win Rate',
        '1.8', 'Profit Factor',
        'Copy Trading 3.0 está disponível',
        'Copie automaticamente as operações dos melhores traders profissionais',
        'Análise Avançada em Tempo Real',
        'Dashboard completo com métricas detalhadas de performance',
        'VPS de Alta Performance',
        'Servidores otimizados para trading 24/7 com latência ultra-baixa',
        'Expert Advisors Profissionais',
        'Robôs de trading testados e otimizados para máxima rentabilidade',
        'Pronto para Transformar Seu Trading?',
        'Junte-se a milhares de traders profissionais que já estão usando nossa plataforma',
        'Começar Agora',
        'Por que escolher a Sentra Partners?',
        'Oferecemos as melhores ferramentas e tecnologia para traders sérios',
        'Como Funciona',
        'Comece a operar em 4 passos simples',
        'Nossos Resultados',
        'Métricas reais de performance da nossa comunidade',
        'Perguntas Frequentes',
        'Tire suas dúvidas sobre a plataforma',
        'Escolha Seu Plano',
        'Planos flexíveis para todos os perfis de trader',
        '[
          {
            "icon": "📊",
            "title": "Copy Trading Automatizado",
            "description": "Copie as operações dos melhores traders automaticamente em tempo real"
          },
          {
            "icon": "📈",
            "title": "Análise Avançada",
            "description": "Dashboard completo com métricas detalhadas e relatórios de performance"
          },
          {
            "icon": "🤖",
            "title": "Expert Advisors Profissionais",
            "description": "Robôs de trading testados e otimizados para máxima rentabilidade"
          },
          {
            "icon": "⚡",
            "title": "VPS de Alta Performance",
            "description": "Servidores dedicados com latência ultra-baixa para trading 24/7"
          }
        ]',
        '[
          {
            "step": "1",
            "title": "Crie sua conta",
            "description": "Cadastro rápido e simples em menos de 2 minutos"
          },
          {
            "step": "2",
            "title": "Escolha seu plano",
            "description": "Selecione o plano que melhor se adequa ao seu perfil"
          },
          {
            "step": "3",
            "title": "Configure sua estratégia",
            "description": "Escolha traders para copiar ou ative Expert Advisors"
          },
          {
            "step": "4",
            "title": "Comece a operar",
            "description": "Deixe a plataforma trabalhar por você 24/7"
          }
        ]',
        '[
          {
            "question": "Como funciona o Copy Trading?",
            "answer": "O Copy Trading permite que você copie automaticamente as operações de traders profissionais em tempo real. Basta escolher um trader, definir o valor a investir e a plataforma replica todas as operações dele na sua conta."
          },
          {
            "question": "Preciso ter experiência em trading?",
            "answer": "Não! Nossa plataforma foi desenvolvida tanto para iniciantes quanto para traders experientes. Com o Copy Trading, você pode começar copiando profissionais enquanto aprende."
          },
          {
            "question": "Qual o valor mínimo para começar?",
            "answer": "O valor mínimo depende do plano escolhido. Nosso plano Básico começa em $47/mês e você pode começar a operar com qualquer valor em sua corretora."
          },
          {
            "question": "Os Expert Advisors são seguros?",
            "answer": "Sim! Todos os nossos EAs passam por rigorosos testes de backtest e forward test antes de serem disponibilizados. Além disso, você tem controle total sobre gerenciamento de risco."
          },
          {
            "question": "Posso cancelar a qualquer momento?",
            "answer": "Sim, você pode cancelar sua assinatura a qualquer momento sem taxas ou multas. Seu acesso continuará até o final do período pago."
          }
        ]'
      )
    `);
    console.log('✅ Landing page config populada!');

    // 6. Popular subscription_plans
    console.log('📝 Populando subscription_plans...');
    await conn.query(`
      INSERT INTO subscription_plans (name, description, price, features, isPopular) VALUES
      ('Básico', 'Ideal para iniciantes', 47.00, '["Copy Trading", "1 EA incluído", "Suporte por email", "Dashboard básico"]', false),
      ('Profissional', 'Para traders sérios', 97.00, '["Copy Trading ilimitado", "3 EAs incluídos", "VPS grátis", "Suporte prioritário", "Dashboard avançado", "Análise em tempo real"]', true),
      ('Enterprise', 'Para traders profissionais', 197.00, '["Tudo do Profissional", "EAs ilimitados", "VPS dedicado", "Suporte 24/7", "API access", "Gerente de conta dedicado"]', false)
    `);
    console.log('✅ Planos de assinatura populados!');

    // 7. Popular expert_advisors
    console.log('📝 Populando expert_advisors...');
    await conn.query(`
      INSERT INTO expert_advisors (name, description, price, features, strategy, timeframe, minDeposit) VALUES
      ('Sentra Scalper Pro', 'EA de scalping de alta frequência otimizado para pares principais', 147.00, '["Scalping automatizado", "Win rate 68%", "Gerenciamento de risco integrado", "Múltiplos pares"]', 'Scalping', 'M1-M5', 500.00),
      ('Sentra Trend Follower', 'Segue tendências de médio prazo com alta precisão', 197.00, '["Análise de tendência", "Win rate 72%", "Trailing stop inteligente", "Filtros de volatilidade"]', 'Trend Following', 'H1-H4', 1000.00),
      ('Sentra Grid Master', 'Sistema de grid trading para mercados laterais', 127.00, '["Grid automatizado", "Recuperação de drawdown", "Gestão de risco avançada", "Múltiplos níveis"]', 'Grid Trading', 'M15-H1', 800.00),
      ('Sentra News Trader', 'Aproveita movimentos de notícias econômicas', 177.00, '["Trading de notícias", "Calendário econômico integrado", "Execução ultra-rápida", "Proteção de slippage"]', 'News Trading', 'M1-M15', 1500.00)
    `);
    console.log('✅ Expert Advisors populados!');

    // 8. Popular vps_products
    console.log('📝 Populando vps_products...');
    await conn.query(`
      INSERT INTO vps_products (name, description, price, cpu, ram, storage, bandwidth, features) VALUES
      ('VPS Starter', 'Ideal para 1-2 EAs', 29.00, '2 vCPU', '2 GB', '40 GB SSD', 'Ilimitado', '["Windows Server", "MT4/MT5 pré-instalado", "Latência <1ms", "Uptime 99.9%"]'),
      ('VPS Professional', 'Para múltiplos EAs', 49.00, '4 vCPU', '4 GB', '80 GB SSD', 'Ilimitado', '["Windows Server", "MT4/MT5 pré-instalado", "Latência <1ms", "Uptime 99.9%", "Backup diário", "Suporte prioritário"]'),
      ('VPS Enterprise', 'Máxima performance', 89.00, '8 vCPU', '8 GB', '160 GB SSD', 'Ilimitado', '["Windows Server", "MT4/MT5 pré-instalado", "Latência <0.5ms", "Uptime 99.99%", "Backup em tempo real", "Suporte 24/7", "IP dedicado"]')
    `);
    console.log('✅ Produtos VPS populados!');

    console.log('\n🎉 BANCO DE DADOS CONFIGURADO COM SUCESSO!');
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

setupDatabase()
  .then(() => {
    console.log('\n✅ Setup concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
