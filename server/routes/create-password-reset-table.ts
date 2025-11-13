import { Router, Request, Response } from 'express';
import { getRawConnection } from '../db';

const router = Router();

/**
 * POST /api/admin/create-password-reset-table
 * Cria a tabela password_reset_tokens no banco de dados
 */
router.post('/create-password-reset-table', async (req: Request, res: Response) => {
  const conn = await getRawConnection();
  
  try {
    console.log('🔧 Criando tabela password_reset_tokens...');
    
    // Criar tabela
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
    
    res.json({
      success: true,
      message: 'Tabela password_reset_tokens criada com sucesso!',
      tableExists: Array.isArray(tables) && tables.length > 0
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao criar tabela:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await conn.end();
  }
});

export default router;
