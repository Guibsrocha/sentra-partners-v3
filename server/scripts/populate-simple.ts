import 'dotenv/config';
import { getRawConnection } from '../db';

async function populateSimple() {
  console.log('🔧 Conectando ao banco Aiven...');
  const conn = await getRawConnection();
  
  try {
    // 1. Popular subscription_plans (usando colunas que existem)
    console.log('📝 Populando subscription_plans...');
    await conn.query(`
      INSERT INTO subscription_plans (name, slug, price, features, active) VALUES
      ('Básico', 'basico', 47.00, '["Copy Trading", "1 EA incluído", "Suporte por email"]', true),
      ('Profissional', 'profissional', 97.00, '["Copy Trading ilimitado", "3 EAs", "VPS grátis", "Suporte prioritário"]', true),
      ('Enterprise', 'enterprise', 197.00, '["Tudo do Profissional", "EAs ilimitados", "VPS dedicado", "Suporte 24/7"]', true)
    `);
    console.log('✅ Planos populados!');

    // 2. Popular expert_advisors
    console.log('📝 Populando expert_advisors...');
    await conn.query(`
      INSERT INTO expert_advisors (name, description, price, features, strategy, timeframe, minDeposit, isActive) VALUES
      ('Sentra Scalper Pro', 'EA de scalping de alta frequência', 147.00, '["Scalping automatizado", "Win rate 68%"]', 'Scalping', 'M1-M5', 500.00, true),
      ('Sentra Trend Follower', 'Segue tendências de médio prazo', 197.00, '["Análise de tendência", "Win rate 72%"]', 'Trend Following', 'H1-H4', 1000.00, true),
      ('Sentra Grid Master', 'Sistema de grid trading', 127.00, '["Grid automatizado", "Gestão de risco"]', 'Grid Trading', 'M15-H1', 800.00, true),
      ('Sentra News Trader', 'Trading de notícias econômicas', 177.00, '["Trading de notícias", "Execução rápida"]', 'News Trading', 'M1-M15', 1500.00, true)
    `);
    console.log('✅ EAs populados!');

    // 3. Popular vps_products
    console.log('📝 Populando vps_products...');
    await conn.query(`
      INSERT INTO vps_products (name, description, price, cpu, ram, storage, bandwidth, features, isActive) VALUES
      ('VPS Starter', 'Ideal para 1-2 EAs', 29.00, '2 vCPU', '2 GB', '40 GB SSD', 'Ilimitado', '["Windows Server", "MT4/MT5", "Latência <1ms"]', true),
      ('VPS Professional', 'Para múltiplos EAs', 49.00, '4 vCPU', '4 GB', '80 GB SSD', 'Ilimitado', '["Windows Server", "MT4/MT5", "Backup diário"]', true),
      ('VPS Enterprise', 'Máxima performance', 89.00, '8 vCPU', '8 GB', '160 GB SSD', 'Ilimitado', '["Windows Server", "MT4/MT5", "Suporte 24/7"]', true)
    `);
    console.log('✅ VPS populados!');

    console.log('\n🎉 DADOS POPULADOS!');
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

populateSimple()
  .then(() => {
    console.log('\n✅ Concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });
