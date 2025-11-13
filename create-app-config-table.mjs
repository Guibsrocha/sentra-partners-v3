import { getRawConnection } from './server/db/index.js';

const connection = await getRawConnection();

await connection.execute(`
  CREATE TABLE IF NOT EXISTS app_config (
    id INT PRIMARY KEY DEFAULT 1,
    logo_url VARCHAR(500) DEFAULT '/sentra-logo-horizontal.png',
    app_name VARCHAR(100) DEFAULT 'Sentra Partners',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);

await connection.execute(`
  INSERT IGNORE INTO app_config (id, logo_url, app_name) 
  VALUES (1, '/sentra-logo-horizontal.png', 'Sentra Partners')
`);

console.log('✅ Tabela app_config criada com sucesso');
process.exit(0);
