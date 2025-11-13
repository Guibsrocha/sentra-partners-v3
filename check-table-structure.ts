import mysql from 'mysql2/promise';
import 'dotenv/config';

const connectionString = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERRO: AIVEN_DATABASE_URL ou DATABASE_URL não está definido');
  process.exit(1);
}

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura das tabelas...');
  
  const connection = await mysql.createConnection({
    uri: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Verificar estrutura da tabela subscription_plans
    console.log('\n📋 Estrutura da tabela subscription_plans:');
    const [columns] = await connection.execute("DESCRIBE subscription_plans");
    const cols = columns as any[];
    cols.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    // Verificar alguns dados de exemplo
    console.log('\n📊 Dados de exemplo da subscription_plans:');
    const [sampleData] = await connection.execute("SELECT * FROM subscription_plans LIMIT 3");
    const data = sampleData as any[];
    data.forEach((row, index) => {
      console.log(`   Registro ${index + 1}:`, Object.keys(row).reduce((acc, key) => {
        acc[key] = row[key];
        return acc;
      }, {} as any));
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await connection.end();
  }
}

checkTableStructure();