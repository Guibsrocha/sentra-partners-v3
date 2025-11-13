const mysql = require('mysql2/promise');

async function addTimeColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Verificando se as colunas já existem...');
    
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_settings' 
      AND COLUMN_NAME IN ('dailyTime', 'weeklyTime')
    `, [process.env.DATABASE_NAME]);

    if (columns.length === 2) {
      console.log('✅ Colunas dailyTime e weeklyTime já existem!');
      return;
    }

    console.log('Adicionando colunas dailyTime e weeklyTime...');
    
    if (!columns.find(c => c.COLUMN_NAME === 'dailyTime')) {
      await connection.query(`
        ALTER TABLE user_settings 
        ADD COLUMN dailyTime varchar(5) DEFAULT '19:00'
      `);
      console.log('✅ Coluna dailyTime adicionada!');
    }

    if (!columns.find(c => c.COLUMN_NAME === 'weeklyTime')) {
      await connection.query(`
        ALTER TABLE user_settings 
        ADD COLUMN weeklyTime varchar(5) DEFAULT '08:00'
      `);
      console.log('✅ Coluna weeklyTime adicionada!');
    }

    console.log('🎉 Migration concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addTimeColumns();
