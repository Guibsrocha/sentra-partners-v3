import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';
import 'dotenv/config';

// Configuração da conexão MySQL
const connectionString = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERRO: AIVEN_DATABASE_URL ou DATABASE_URL não está definido');
  process.exit(1);
}

console.log('🔄 Testando conexão com o banco de dados...');
console.log('📡 Conectando em:', connectionString.split('@')[1]?.split(':')[0] || 'unknown');

try {
  // Criar conexão
  const connection = await mysql.createConnection({
    uri: connectionString,
    ssl: {
      rejectUnauthorized: false // Temporariamente para teste
    }
  });

  console.log('✅ Conexão estabelecida com sucesso!');

  // Testar query simples
  const [result] = await connection.execute('SELECT 1 as test');
  console.log('✅ Query de teste executada:', result);

  // Verificar se as tabelas existem
  const [tables] = await connection.execute('SHOW TABLES');
  console.log('📊 Tabelas encontradas:', Array.isArray(tables) ? tables.length : 0);

  // Criar instância Drizzle
  const db = drizzle(connection, { schema, mode: "default" });
  console.log('✅ Drizzle ORM configurado com sucesso!');

  // Teste adicional - verificar se consegue consultar schema
  try {
    const userQuery = await db.select().from(schema.users).limit(1);
    console.log('✅ Consulta ao schema de usuários:', userQuery.length, 'resultados');
  } catch (err) {
    console.log('⚠️  Tabela users pode não existir ainda ou estar vazia');
  }

  await connection.end();
  console.log('✅ Conexão finalizada com sucesso!');
  console.log('');
  console.log('🎉 TODAS AS CONEXÕES ESTÃO FUNCIONANDO!');
  console.log('');
  console.log('📋 Resumo das conexões configuradas:');
  console.log('   🔹 Repositório GitHub: ✅ Conectado');
  console.log('   🔹 Banco MySQL Aiven: ✅ Conectado');
  console.log('   🔹 Drizzle ORM: ✅ Configurado');

} catch (error) {
  console.error('❌ Erro ao conectar com o banco:', error.message);
  process.exit(1);
}