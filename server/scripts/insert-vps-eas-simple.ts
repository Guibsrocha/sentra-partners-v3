import 'dotenv/config';
import mysql from 'mysql2/promise';

async function insertData() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log('🚀 Inserindo VPS e EAs...\n');

  try {
    // VPS 1
    await connection.execute(`
      INSERT INTO vps_products (name, description, price, ram, cpu, storage, bandwidth, eas_limit, active)
      VALUES ('VPS Starter', 'Servidor VPS básico para até 3 EAs simultâneos', 29.00, '2GB', '1 vCPU', '20GB SSD', '1TB', 3, true)
      ON DUPLICATE KEY UPDATE price = 29.00
    `);
    console.log('✓ VPS Starter criado');

    // VPS 2
    await connection.execute(`
      INSERT INTO vps_products (name, description, price, ram, cpu, storage, bandwidth, eas_limit, active)
      VALUES ('VPS Professional', 'Servidor VPS avançado para até 10 EAs simultâneos', 49.00, '4GB', '2 vCPU', '40GB SSD', '2TB', 10, true)
      ON DUPLICATE KEY UPDATE price = 49.00
    `);
    console.log('✓ VPS Professional criado');

    // EA 1
    await connection.execute(`
      INSERT INTO expert_advisors (name, description, price, platform, strategy, timeframe, active)
      VALUES ('Sentra Scalper Pro', 'EA de scalping otimizado para M1/M5 com gerenciamento de risco avançado', 147.00, 'MT5', 'Scalping', 'M1, M5', true)
      ON DUPLICATE KEY UPDATE price = 147.00
    `);
    console.log('✓ Sentra Scalper Pro criado');

    // EA 2
    await connection.execute(`
      INSERT INTO expert_advisors (name, description, price, platform, strategy, timeframe, active)
      VALUES ('Sentra Trend Master', 'EA seguidor de tendências para operações de médio prazo com alto win rate', 197.00, 'MT4/MT5', 'Trend Following', 'H1, H4', true)
      ON DUPLICATE KEY UPDATE price = 197.00
    `);
    console.log('✓ Sentra Trend Master criado');

    console.log('\n✅ Todos os produtos criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await connection.end();
  }
}

insertData();
