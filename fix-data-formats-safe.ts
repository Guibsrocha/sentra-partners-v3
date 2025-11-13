import mysql from 'mysql2/promise';
import 'dotenv/config';

const connectionString = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERRO: AIVEN_DATABASE_URL ou DATABASE_URL não está definido');
  process.exit(1);
}

async function fixDataFormats() {
  console.log('🔧 Corrigindo formatos de dados (versão robusta)...');
  
  const connection = await mysql.createConnection({
    uri: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Limpar e recriar configuração com dados corretos
    console.log('\n⚙️ Recriando configuração da landing page...');
    
    // Buscar planos atuais do banco
    const [plansRows] = await connection.execute(
      "SELECT name, slug, price, features, active FROM subscription_plans ORDER BY price ASC"
    );
    
    const plans = plansRows as any[];
    const safePlans = plans.map(plan => {
      let features = [];
      try {
        if (plan.features) {
          features = JSON.parse(plan.features);
          if (!Array.isArray(features)) features = [];
        }
      } catch (e) {
        console.log(`   ⚠️ Features inválidas para plano ${plan.name}, usando array vazio`);
        features = [];
      }
      
      return {
        name: plan.name,
        slug: plan.slug,
        price: parseFloat(plan.price),
        features: features,
        popular: plan.name.toLowerCase().includes('profissional')
      };
    });

    const config = {
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
      subscriptionPlans: safePlans
    };

    // Inserir/Atualizar configuração
    const [existing] = await connection.execute(
      "SELECT id FROM landing_page_content WHERE section = 'config' LIMIT 1"
    );

    if ((existing as any[]).length > 0) {
      await connection.execute(
        "UPDATE landing_page_content SET content = ?, updated_at = NOW() WHERE section = 'config'",
        [JSON.stringify(config)]
      );
      console.log('   ✅ Configuração atualizada');
    } else {
      await connection.execute(
        "INSERT INTO landing_page_content (section, content) VALUES ('config', ?)",
        [JSON.stringify(config)]
      );
      console.log('   ✅ Configuração criada');
    }

    console.log(`   📊 ${safePlans.length} planos carregados:`);
    safePlans.forEach((plan, index) => {
      console.log(`      ${index + 1}. ${plan.name} - R$ ${plan.price.toFixed(2)} - ${plan.popular ? '⭐ Popular' : ''}`);
    });

    // Verificar VPS
    console.log('\n🖥️ Verificando VPS...');
    const [vpsRows] = await connection.execute(
      "SELECT COUNT(*) as count FROM vps_products WHERE active = 1"
    );
    const vpsCount = (vpsRows as any[])[0].count;
    
    if (vpsCount === 0) {
      console.log('   📝 Inserindo VPS padrão...');
      await connection.execute(`
        INSERT INTO vps_products (name, description, price, ram, cpu, storage, bandwidth, active) VALUES
        ('VPS Starter', 'VPS básico para trading', 15.00, '2 GB', '1 vCPU', '20 GB SSD', '1 TB', 1),
        ('VPS Pro', 'VPS avançado para trading intensivo', 35.00, '4 GB', '2 vCPU', '60 GB SSD', '2 TB', 1),
        ('VPS Enterprise', 'VPS premium com recursos dedicados', 75.00, '8 GB', '4 vCPU', '120 GB SSD', '5 TB', 1)
      `);
      console.log('   ✅ VPS padrão inseridos');
    } else {
      console.log(`   ✅ ${vpsCount} VPS ativos encontrados`);
    }

    // Verificar EAs
    console.log('\n🤖 Verificando EAs...');
    const [easRows] = await connection.execute(
      "SELECT COUNT(*) as count FROM expert_advisors WHERE active = 1"
    );
    const easCount = (easRows as any[])[0].count;
    
    if (easCount === 0) {
      console.log('   📝 Inserindo EAs padrão...');
      await connection.execute(`
        INSERT INTO expert_advisors (name, description, price, platform, strategy, timeframe, win_rate, active) VALUES
        ('Scalper Pro', 'EA de scalping para operações rápidas', 199.00, 'MT4/MT5', 'Scalping', 'M1, M5', '78%', 1),
        ('Trend Master', 'Segue tendências de médio prazo', 249.00, 'MT4/MT5', 'Trend Following', 'H1, H4, D1', '72%', 1),
        ('Grid Trader', 'Estratégia de grid avançada', 179.00, 'MT4/MT5', 'Grid', 'H1, H4', '68%', 1),
        ('News Trader', 'Opera em eventos de notícias', 299.00, 'MT4/MT5', 'News Trading', 'M5, M15', '75%', 1)
      `);
      console.log('   ✅ EAs padrão inseridos');
    } else {
      console.log(`   ✅ ${easCount} EAs ativos encontrados`);
    }

    console.log('\n🎉 SISTEMA TOTALMENTE CORRIGIDO!');
    console.log('\n📋 RESUMO FINAL:');
    console.log('   ✅ Configuração da landing page atualizada');
    console.log('   ✅ Planos de assinatura carregados');
    console.log('   ✅ VPS verificados/inseridos');
    console.log('   ✅ Expert Advisors verificados/inseridos');
    console.log('   ✅ Formatos de dados corrigidos');

    console.log('\n🚀 TESTE FINAL - Acesse:');
    console.log('   📄 Landing Page: /start');
    console.log('   🛠️ Editor: /admin/landing-editor');
    console.log('   📡 API: /api/landing-products');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
  } finally {
    await connection.end();
  }
}

fixDataFormats();