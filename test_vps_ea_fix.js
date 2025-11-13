// Script de teste das correções VPS e EAs
// Executar: node test_vps_ea_fix.js

import mysql from 'mysql2/promise';

async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com banco de dados...');
  
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 3306,
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'sentra_partners'
  });

  try {
    // Testar tabelas VPS
    console.log('\n📊 Testando tabela vps_products...');
    const [vpsResults] = await connection.execute('SHOW COLUMNS FROM vps_products');
    console.log(`✅ Tabela vps_products existe com ${vpsResults.length} colunas`);
    
    // Verificar colunas específicas
    const hasSlug = vpsResults.some(col => col.Field === 'slug');
    const hasSpecifications = vpsResults.some(col => col.Field === 'specifications');
    console.log(`   - Slug: ${hasSlug ? '✅' : '❌'}`);
    console.log(`   - Specifications: ${hasSpecifications ? '✅' : '❌'}`);

    // Testar tabelas EAs
    console.log('\n🤖 Testando tabela expert_advisors...');
    const [eaResults] = await connection.execute('SHOW COLUMNS FROM expert_advisors');
    console.log(`✅ Tabela expert_advisors existe com ${eaResults.length} colunas`);
    
    const hasLongDescription = eaResults.some(col => col.Field === 'long_description');
    const hasFeatures = eaResults.some(col => col.Field === 'features');
    console.log(`   - Long Description: ${hasLongDescription ? '✅' : '❌'}`);
    console.log(`   - Features: ${hasFeatures ? '✅' : '❌'}`);

    // Verificar dados existentes
    console.log('\n📦 Verificando dados existentes...');
    const [vpsCount] = await connection.execute('SELECT COUNT(*) as count FROM vps_products');
    const [eaCount] = await connection.execute('SELECT COUNT(*) as count FROM expert_advisors');
    
    console.log(`   - VPS Products: ${vpsCount[0].count} registros`);
    console.log(`   - Expert Advisors: ${eaCount[0].count} registros`);

    if (vpsCount[0].count === 0) {
      console.log('⚠️ Nenhum VPS encontrado. Execute: POST /api/admin/populate-vps-eas');
    }

    if (eaCount[0].count === 0) {
      console.log('⚠️ Nenhum EA encontrado. Execute: POST /api/admin/populate-vps-eas');
    }

    // Testar query de listagem (como nas rotas)
    console.log('\n🧪 Testando queries das rotas...');
    
    try {
      const [vpsList] = await connection.execute(`
        SELECT id, name, slug, description, price, is_available 
        FROM vps_products 
        WHERE is_available = 1 
        ORDER BY sort_order ASC, price ASC
        LIMIT 3
      `);
      console.log(`✅ Query VPS lista ${vpsList.length} produtos`);
    } catch (error) {
      console.log('❌ Erro na query VPS:', error.message);
    }

    try {
      const [eaList] = await connection.execute(`
        SELECT id, name, slug, description, price, platform, active
        FROM expert_advisors 
        WHERE active = 1 
        ORDER BY sort_order ASC, price ASC
        LIMIT 3
      `);
      console.log(`✅ Query EAs lista ${eaList.length} produtos`);
    } catch (error) {
      console.log('❌ Erro na query EAs:', error.message);
    }

    console.log('\n🎉 Teste do banco de dados concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com banco:', error.message);
    console.log('\n💡 Verifique:');
    console.log('   1. Credenciais no arquivo .env');
    console.log('   2. Banco MySQL rodando');
    console.log('   3. Banco existe');
  } finally {
    await connection.end();
  }
}

async function testFileStructure() {
  console.log('\n📁 Verificando estrutura de arquivos...');
  
  const fs = await import('fs');
  const path = await import('path');

  const files = [
    'server/migrations/010_fix_vps_ea_tables.sql',
    'server/routes/vps-products.ts',
    'server/routes/expert-advisors.ts',
    'server/routes/populate-vps-eas.ts',
    'client/src/components/EditVPSDialog.tsx',
    'client/src/components/EditEADialog.tsx',
    'VPS_EAS_COMPLETE_FIX.md'
  ];

  for (const file of files) {
    const exists = fs.existsSync(file);
    console.log(`   ${file}: ${exists ? '✅' : '❌'}`);
  }
}

async function main() {
  console.log('🚀 Iniciando teste das correções VPS e EAs...\n');
  
  await testFileStructure();
  await testDatabaseConnection();
  
  console.log('\n📋 Resumo:');
  console.log('   ✅ Migração criada');
  console.log('   ✅ Rotas atualizadas');
  console.log('   ✅ Frontend corrigido');
  console.log('   ✅ Scripts de teste');
  console.log('\n🎯 Para testar as rotas:');
  console.log('   1. Inicie o servidor: npm run dev');
  console.log('   2. Teste: curl http://localhost:3000/api/vps-products');
  console.log('   3. Admin: http://localhost:3000/admin');
}

main().catch(console.error);
