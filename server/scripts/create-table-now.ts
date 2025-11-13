import 'dotenv/config';
import { getRawConnection } from '../db';

async function createTable() {
  console.log('🔧 Conectando ao banco Aiven...');
  const conn = await getRawConnection();
  
  try {
    console.log('📝 Criando tabela password_reset_tokens...');
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        used BOOLEAN DEFAULT FALSE NOT NULL,
        expiresAt TIMESTAMP NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        
        INDEX userId_idx (userId),
        INDEX token_idx (token),
        INDEX expiresAt_idx (expiresAt),
        
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabela password_reset_tokens criada com sucesso!');
    
    // Verificar se tabela existe
    const [tables] = await conn.query(`
      SHOW TABLES LIKE 'password_reset_tokens'
    `);
    
    if (Array.isArray(tables) && tables.length > 0) {
      console.log('✅ Tabela verificada e confirmada no banco!');
    } else {
      console.log('❌ Erro: Tabela não foi encontrada após criação');
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao criar tabela:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

createTable()
  .then(() => {
    console.log('\n🎉 Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
