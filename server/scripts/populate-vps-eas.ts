import 'dotenv/config';
import { getDb } from '../db';

async function populateVPSandEAs() {
  console.log('🚀 Populando VPS e Expert Advisors...\n');

  const db = await getDb();
  if (!db) {
    console.error('❌ Erro: Banco de dados não disponível');
    return;
  }

  try {
    // ========== VPS PLANS ==========
    console.log('💻 Criando planos VPS...');
    
    const vpsPlans = [
      {
        name: 'VPS Starter',
        description: 'Servidor VPS básico para até 3 EAs simultâneos',
        price: 29.00,
        ram: '2GB',
        cpu: '1 vCPU',
        storage: '20GB SSD',
        bandwidth: '1TB',
        eas_limit: 3,
        active: true
      },
      {
        name: 'VPS Professional',
        description: 'Servidor VPS avançado para até 10 EAs simultâneos',
        price: 49.00,
        ram: '4GB',
        cpu: '2 vCPU',
        storage: '40GB SSD',
        bandwidth: '2TB',
        eas_limit: 10,
        active: true
      }
    ];

    for (const vps of vpsPlans) {
      await db.execute(`
        INSERT INTO vps_products (name, description, price, ram, cpu, storage, bandwidth, eas_limit, active)
        VALUES (
          '${vps.name}',
          '${vps.description}',
          ${vps.price},
          '${vps.ram}',
          '${vps.cpu}',
          '${vps.storage}',
          '${vps.bandwidth}',
          ${vps.eas_limit},
          ${vps.active}
        )
        ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          price = VALUES(price),
          ram = VALUES(ram),
          cpu = VALUES(cpu),
          storage = VALUES(storage),
          bandwidth = VALUES(bandwidth),
          eas_limit = VALUES(eas_limit),
          active = VALUES(active)
      `);
      console.log(`  ✓ ${vps.name} - $${vps.price}/mês`);
    }

    // ========== EXPERT ADVISORS ==========
    console.log('\n🤖 Criando Expert Advisors...');
    
    const eas = [
      {
        name: 'Sentra Scalper Pro',
        description: 'EA de scalping otimizado para M1/M5 com gerenciamento de risco avançado',
        price: 147.00,
        platform: 'MT5',
        strategy: 'Scalping',
        timeframe: 'M1, M5',
        active: true
      },
      {
        name: 'Sentra Trend Master',
        description: 'EA seguidor de tendências para operações de médio prazo com alto win rate',
        price: 197.00,
        platform: 'MT4/MT5',
        strategy: 'Trend Following',
        timeframe: 'H1, H4',
        active: true
      }
    ];

    for (const ea of eas) {
      await db.execute(`
        INSERT INTO expert_advisors (name, description, price, platform, strategy, timeframe, active)
        VALUES (
          '${ea.name}',
          '${ea.description}',
          ${ea.price},
          '${ea.platform}',
          '${ea.strategy}',
          '${ea.timeframe}',
          ${ea.active}
        )
        ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          price = VALUES(price),
          platform = VALUES(platform),
          strategy = VALUES(strategy),
          timeframe = VALUES(timeframe),
          active = VALUES(active)
      `);
      console.log(`  ✓ ${ea.name} - $${ea.price}`);
    }

    console.log('\n✅ VPS e EAs criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao popular:', error);
  }
}

populateVPSandEAs().catch(console.error);
