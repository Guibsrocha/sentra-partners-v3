import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

router.get('/api/admin/list-tables', async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }
    
    const [rows] = await connection.query('SHOW TABLES');
    
    res.json({ 
      success: true, 
      tables: rows 
    });
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
});

export default router;
