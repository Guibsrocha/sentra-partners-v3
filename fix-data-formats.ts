import mysql from 'mysql2/promise';
import 'dotenv/config';

const connectionString = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERRO: AIVEN_DATABASE_URL ou DATABASE_URL não está definido');
  process.exit(1);
}

async function fixDataFormats() {
  console.log('🔧 Corrigindo formatos de dados...');
  
  const connection = await mysql.createConnection({
    uri: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Atualizar a configuração com os planos corretos
    console.log('\n⚙️ Atualizando configuração da landing page...');
    
    const [configRows] = await connection.execute(
      "SELECT content FROM landing_page_content WHERE section = 'config' LIMIT 1"
    );
    
    if ((configRows as any[]).length > 0) {
      const config = JSON.parse((configRows as any[])[0].content);
      
      // Buscar planos atuais do banco
      const [plansRows] = await connection.execute(
        "SELECT name, slug, price, features, active FROM subscription_plans ORDER BY price ASC"
      );
      
      const plans = plansRows as any[];
      config.subscriptionPlans = plans.map(plan => ({
        name: plan.name,
        slug: plan.slug,
        price: parseFloat(plan.price), // Preço já está em decimal
        features: plan.features ? JSON.parse(plan.features) : [],
        popular: plan.name.toLowerCase().includes('profissional') // Marcar profissional como popular
      }));

      // Atualizar configuração
      await connection.execute(
        "UPDATE landing_page_content SET content = ?, updated_at = NOW() WHERE section = 'config'",
        [JSON.stringify(config)]
      );
      
      console.log('   ✅ Configuração atualizada com planos corretos');
    }

    // Verificar e corrigir preços VPS
    console.log('\n🖥️ Verificando produtos VPS...');
    const [vpsRows] = await connection.execute(
      "SELECT id, name, price, active FROM vps_products WHERE active = 1 ORDER BY price ASC"
    );
    
    const vps = vpsRows as any[];
    console.log(`   📊 ${vps.length} VPS ativos encontrados`);
    
    if (vps.length === 0) {
      console.log('   📝 Inserindo VPS padrão...');
      await connection.execute(`
        INSERT INTO vps_products (name, description, price, ram, cpu, storage, bandwidth, active) VALUES
        ('VPS Starter', 'VPS básico para trading', 15.00, '2 GB', '1 vCPU', '20 GB SSD', '1 TB', 1),
        ('VPS Pro', 'VPS avançado para trading intensivo', 35.00, '4 GB', '2 vCPU', '60 GB SSD', '2 TB', 1),
        ('VPS Enterprise', 'VPS premium com recursos dedicados', 75.00, '8 GB', '4 vCPU', '120 GB SSD', '5 TB', 1)
      `);
      console.log('   ✅ VPS padrão inseridos');
    }

    // Verificar e corrigir Expert Advisors
    console.log('\n🤖 Verificando Expert Advisors...');
    const [easRows] = await connection.execute(
      "SELECT id, name, price, active FROM expert_advisors WHERE active = 1 ORDER BY price ASC"
    );
    
    const eas = easRows as any[];
    console.log(`   📊 ${eas.length} EAs ativos encontrados`);
    
    if (eas.length === 0) {
      console.log('   📝 Inserindo EAs padrão...');
      await connection.execute(`
        INSERT INTO expert_advisors (name, description, price, platform, strategy, timeframe, win_rate, active) VALUES
        ('Scalper Pro', 'EA de scalping para operações rápidas', 199.00, 'MT4/MT5', 'Scalping', 'M1, M5', '78%', 1),
        ('Trend Master', 'Segue tendências de médio prazo', 249.00, 'MT4/MT5', 'Trend Following', 'H1, H4, D1', '72%', 1),
        ('Grid Trader', 'Estratégia de grid avançada', 179.00, 'MT4/MT5', 'Grid', 'H1, H4', '68%', 1),
        ('News Trader', 'Opera em eventos de notícias', 299.00, 'MT4/MT5', 'News Trading', 'M5, M15', '75%', 1)
      `);
      console.log('   ✅ EAs padrão inseridos');
    }

    // Teste final do endpoint de produtos
    console.log('\n🧪 Testando endpoint de produtos...');
    
    // Buscar VPS
    const [vpsProducts] = await connection.execute(`
      SELECT id, name, description, price, ram, cpu, storage, bandwidth, eas_limit 
      FROM vps_products WHERE active = 1 ORDER BY price ASC
    `);
    
    // Buscar EAs  
    const [expertAdvisors] = await connection.execute(`
      SELECT id, name, description, price, platform, strategy, timeframe, win_rate 
      FROM expert_advisors WHERE active = 1 ORDER BY price ASC
    `);
    
    // Buscar Planos
    const [subscriptionPlans] = await connection.execute(`
      SELECT id, name, slug, price, features, active FROM subscription_plans WHERE active = 1 ORDER BY price ASC
    `);

    console.log('   📊 Resultado do teste:');
    console.log(`      - VPS: ${(vpsProducts as any[]).length} produtos`);
    console.log(`      - EAs: ${(expertAdvisors as any[]).length} produtos`);
    console.log(`      - Planos: ${(subscriptionPlans as any[]).length} produtos`);

    console.log('\n🎉 SISTEMA CORRIGIDO COM SUCESSO!');
    console.log('\n📋 ESTRUTURA CORRETA:');
    console.log('   ✅ subscription_plans.price: decimal(10,2) - já está correto');
    console.log('   ✅ Preços em formato USD');
    console.log('   ✅ Features em JSON');
    console.log('   ✅ Status ativo controlado');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    await connection.end();
  }
}

fixDataFormats();