import mysql from 'mysql2/promise';
import 'dotenv/config';

const connectionString = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERRO: AIVEN_DATABASE_URL ou DATABASE_URL não está definido');
  process.exit(1);
}

async function fixLandingPageSystem() {
  console.log('🔧 Iniciando correção do sistema de Landing Page...');
  
  const connection = await mysql.createConnection({
    uri: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Verificar se as tabelas existem
    console.log('\n📋 Verificando tabelas do sistema...');
    const [tables] = await connection.execute('SHOW TABLES');
    const tableList = tables as any[];
    
    const requiredTables = [
      'landing_page_content',
      'vps_products', 
      'expert_advisors',
      'subscription_plans'
    ];

    for (const table of requiredTables) {
      const exists = tableList.some((t: any) => Object.values(t)[0] === table);
      console.log(`   ${exists ? '✅' : '❌'} Tabela ${table}: ${exists ? 'Encontrada' : 'Não existe'}`);
    }

    // 2. Criar tabela landing_page_content se não existir
    console.log('\n🗄️ Verificando tabela landing_page_content...');
    const [landingTableExists] = await connection.execute(
      "SHOW TABLES LIKE 'landing_page_content'"
    );
    
    if ((landingTableExists as any[]).length === 0) {
      console.log('   📝 Criando tabela landing_page_content...');
      await connection.execute(`
        CREATE TABLE landing_page_content (
          id INT AUTO_INCREMENT PRIMARY KEY,
          section VARCHAR(255) NOT NULL UNIQUE,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✅ Tabela landing_page_content criada');
    }

    // 3. Popular dados padrão na configuração
    console.log('\n⚙️ Configurando dados padrão...');
    
    // Verificar se já existe configuração
    const [existingConfig] = await connection.execute(
      "SELECT content FROM landing_page_content WHERE section = 'config' LIMIT 1"
    );

    if ((existingConfig as any[]).length === 0) {
      console.log('   📝 Inserindo configuração padrão...');
      
      const defaultConfig = {
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
        footerCtaDescription: "Junte-se a milhares de traders profissionais que já estão usando nossa plataforma",
        vpsSectionTitle: "VPS de Alta Performance",
        vpsSectionDescription: "Servidores otimizados para trading 24/7",
        easSectionTitle: "Expert Advisors Profissionais", 
        easSectionDescription: "Robôs de trading testados e otimizados",
        plansSectionTitle: "Planos de Assinatura",
        plansSectionDescription: "Acesso completo à plataforma de copy trading",
        resourcesSectionTitle: "Por que escolher a Sentra Partners?",
        resourcesSectionDescription: "Tudo que você precisa para dominar o mercado",
        resourceCards: [
          { title: "Copy Trading Automatizado", description: "Configure em minutos e copie trades de traders profissionais para múltiplas contas simultaneamente", icon: "bot" },
          { title: "Análise Avançada", description: "Métricas detalhadas, histórico completo e monitoramento em tempo real de todas as suas operações", icon: "chart" },
          { title: "Expert Advisors Profissionais", description: "Robôs de trading desenvolvidos e testados por traders experientes com estratégias comprovadas", icon: "trending" },
          { title: "VPS de Alta Performance", description: "Execute seus EAs 24/7 com latência ultra-baixa e garantia de uptime de 99.9%", icon: "shield" }
        ],
        howItWorksSectionTitle: "Com a Sentra Partners, trading fica simples",
        howItWorksSectionDescription: "Veja o passo a passo abaixo",
        howItWorksSteps: [
          { step: "Etapa - 1", title: "Crie sua Conta", description: "Cadastre-se gratuitamente e configure suas preferências de trading" },
          { step: "Etapa - 2", title: "Conecte suas Contas", description: "Vincule suas contas MT4/MT5 de forma segura e rápida" },
          { step: "Etapa - 3", title: "Configure Copy Trading", description: "Escolha traders para copiar ou configure seus próprios EAs" },
          { step: "Etapa - 4", title: "Monitore Resultados", description: "Acompanhe métricas em tempo real e otimize sua estratégia" }
        ],
        resultsSectionTitle: "Nossos Resultados",
        resultsSectionDescription: "Confira alguns de nossos números",
        faqSectionTitle: "Perguntas Frequentes",
        faqSectionDescription: "Tire suas dúvidas com as perguntas mais frequentes sobre a Sentra Partners",
        faqItems: [
          { question: "O que é Copy Trading e como funciona?", answer: "Copy Trading é um sistema que permite copiar automaticamente as operações de traders experientes para sua conta. Na Sentra Partners, você configura em minutos e pode copiar para múltiplas contas simultaneamente, com suporte para MT4 e MT5." },
          { question: "Quais são os diferenciais da Sentra Partners?", answer: "Oferecemos uma solução completa: copy trading automatizado, análise avançada com métricas detalhadas, expert advisors profissionais, VPS de alta performance e suporte 24/7. Tudo integrado em uma única plataforma." },
          { question: "Como funciona a análise de trades?", answer: "Nossa plataforma fornece métricas detalhadas como win rate, profit factor, drawdown e muito mais. Você acompanha o histórico completo de todas as operações em tempo real, com filtros avançados para análise profunda." },
          { question: "O que está incluído nos planos?", answer: "Cada plano oferece diferentes níveis de recursos. O Básico inclui copy trading para 1 conta master, o Profissional oferece copy trading ilimitado com todos os EAs inclusos, e o Enterprise adiciona VPS, consultoria e EA customizado." },
          { question: "Como funciona o suporte?", answer: "Oferecemos suporte por email no plano Básico e suporte prioritário 24/7 nos planos Profissional e Enterprise. Nossa equipe está sempre pronta para ajudar você a maximizar seus resultados." }
        ]
      };

      await connection.execute(
        "INSERT INTO landing_page_content (section, content) VALUES ('config', ?)",
        [JSON.stringify(defaultConfig)]
      );
      console.log('   ✅ Configuração padrão inserida');
    }

    // 4. Verificar e popular produtos VPS
    console.log('\n🖥️ Verificando produtos VPS...');
    const [vpsExists] = await connection.execute("SHOW TABLES LIKE 'vps_products'");
    if ((vpsExists as any[]).length === 0) {
      console.log('   📝 Criando tabela vps_products...');
      await connection.execute(`
        CREATE TABLE vps_products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          ram VARCHAR(50),
          cpu VARCHAR(50),
          storage VARCHAR(50),
          bandwidth VARCHAR(50),
          eas_limit INT DEFAULT 3,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Inserir VPS padrão
      await connection.execute(`
        INSERT INTO vps_products (name, description, price, ram, cpu, storage, bandwidth, eas_limit) VALUES
        ('VPS Starter', 'VPS básico para trading', 15.00, '2 GB', '1 vCPU', '20 GB SSD', '1 TB', 3),
        ('VPS Pro', 'VPS avançado para trading intensivo', 35.00, '4 GB', '2 vCPU', '60 GB SSD', '2 TB', 5),
        ('VPS Enterprise', 'VPS premium com recursos dedicados', 75.00, '8 GB', '4 vCPU', '120 GB SSD', '5 TB', 10)
      `);
      console.log('   ✅ Tabela vps_products criada e populada');
    } else {
      const [vpsCount] = await connection.execute("SELECT COUNT(*) as count FROM vps_products WHERE active = TRUE");
      console.log(`   📊 ${(vpsCount as any[])[0].count} VPS ativos encontrados`);
    }

    // 5. Verificar e popular Expert Advisors
    console.log('\n🤖 Verificando Expert Advisors...');
    const [easExists] = await connection.execute("SHOW TABLES LIKE 'expert_advisors'");
    if ((easExists as any[]).length === 0) {
      console.log('   📝 Criando tabela expert_advisors...');
      await connection.execute(`
        CREATE TABLE expert_advisors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          platform VARCHAR(50) DEFAULT 'MT4/MT5',
          strategy VARCHAR(255),
          timeframe VARCHAR(100),
          win_rate VARCHAR(10),
          features TEXT,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Inserir EAs padrão
      await connection.execute(`
        INSERT INTO expert_advisors (name, description, price, platform, strategy, timeframe, win_rate) VALUES
        ('Scalper Pro', 'EA de scalping para operações rápidas', 199.00, 'MT4/MT5', 'Scalping', 'M1, M5', '78%'),
        ('Trend Master', 'Segue tendências de médio prazo', 249.00, 'MT4/MT5', 'Trend Following', 'H1, H4, D1', '72%'),
        ('Grid Trader', 'Estratégia de grid avançada', 179.00, 'MT4/MT5', 'Grid', 'H1, H4', '68%'),
        ('News Trader', 'Opera em eventos de notícias', 299.00, 'MT4/MT5', 'News Trading', 'M5, M15', '75%')
      `);
      console.log('   ✅ Tabela expert_advisors criada e populada');
    } else {
      const [easCount] = await connection.execute("SELECT COUNT(*) as count FROM expert_advisors WHERE active = TRUE");
      console.log(`   📊 ${(easCount as any[])[0].count} EAs ativos encontrados`);
    }

    // 6. Verificar e popular Planos de Assinatura
    console.log('\n💳 Verificando planos de assinatura...');
    const [plansExists] = await connection.execute("SHOW TABLES LIKE 'subscription_plans'");
    if ((plansExists as any[]).length === 0) {
      console.log('   📝 Criando tabela subscription_plans...');
      await connection.execute(`
        CREATE TABLE subscription_plans (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          price INT NOT NULL,
          features TEXT,
          popular BOOLEAN DEFAULT FALSE,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Inserir planos padrão (preços em centavos)
      const basicFeatures = JSON.stringify([
        "Copy Trading (1 conta master)",
        "Dashboard básico", 
        "Suporte por email",
        "Atualizações mensais"
      ]);
      
      const proFeatures = JSON.stringify([
        "Copy Trading (ilimitado)",
        "Dashboard avançado",
        "Todos os EAs inclusos", 
        "Suporte prioritário 24/7",
        "Análise de risco avançada"
      ]);
      
      const enterpriseFeatures = JSON.stringify([
        "Tudo do Profissional",
        "VPS Starter incluído",
        "Consultoria mensal 1h",
        "EA customizado",
        "API access"
      ]);

      await connection.execute(`
        INSERT INTO subscription_plans (name, slug, price, features, popular) VALUES
        ('Básico', 'basico', 4700, ?, FALSE),
        ('Profissional', 'profissional', 9700, ?, TRUE),
        ('Enterprise', 'enterprise', 19700, ?, FALSE)
      `, [basicFeatures, proFeatures, enterpriseFeatures]);
      
      console.log('   ✅ Tabela subscription_plans criada e populada');
    } else {
      const [plansCount] = await connection.execute("SELECT COUNT(*) as count FROM subscription_plans WHERE active = TRUE");
      console.log(`   📊 ${(plansCount as any[])[0].count} planos ativos encontrados`);
    }

    console.log('\n🎉 Sistema de Landing Page corrigido com sucesso!');
    console.log('\n📋 Resumo das ações:');
    console.log('   ✅ Tabelas criadas/verificadas');
    console.log('   ✅ Configuração padrão inserida');
    console.log('   ✅ Produtos VPS populados');
    console.log('   ✅ Expert Advisors populados');
    console.log('   ✅ Planos de assinatura populados');
    
    console.log('\n🚀 Próximos passos:');
    console.log('   1. Reinicie o servidor');
    console.log('   2. Acesse a landing page: /start');
    console.log('   3. Acesse o editor: /admin/landing-editor');
    console.log('   4. Teste a edição de preços e conteúdo');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    await connection.end();
  }
}

fixLandingPageSystem();