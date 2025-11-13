import 'dotenv/config';
import { getRawConnection } from '../db';

async function populateData() {
  console.log('🔧 Conectando ao banco Aiven...');
  const conn = await getRawConnection();
  
  try {
    // 1. Popular subscription_plans
    console.log('📝 Populando subscription_plans...');
    await conn.query(`
      INSERT INTO subscription_plans (
        name, slug, description, price, features,
        copyTradingEnabled, advancedAnalyticsEnabled, freeVpsEnabled,
        prioritySupport, isActive, sortOrder
      ) VALUES
      (
        'Básico',
        'basico',
        'Ideal para iniciantes que querem começar no copy trading',
        4700,
        '["Copy Trading", "1 EA incluído", "Suporte por email", "Dashboard básico"]',
        true, false, false, false, true, 1
      ),
      (
        'Profissional',
        'profissional',
        'Para traders sérios que buscam resultados consistentes',
        9700,
        '["Copy Trading ilimitado", "3 EAs incluídos", "VPS grátis", "Suporte prioritário", "Dashboard avançado", "Análise em tempo real"]',
        true, true, true, true, true, 2
      ),
      (
        'Enterprise',
        'enterprise',
        'Para traders profissionais e institucionais',
        19700,
        '["Tudo do Profissional", "EAs ilimitados", "VPS dedicado", "Suporte 24/7", "API access", "Gerente de conta dedicado"]',
        true, true, true, true, true, 3
      )
    `);
    console.log('✅ Planos de assinatura populados!');

    // 2. Popular expert_advisors
    console.log('📝 Populando expert_advisors...');
    await conn.query(`
      INSERT INTO expert_advisors (name, description, price, features, strategy, timeframe, minDeposit, isActive) VALUES
      (
        'Sentra Scalper Pro',
        'EA de scalping de alta frequência otimizado para pares principais',
        14700,
        '["Scalping automatizado", "Win rate 68%", "Gerenciamento de risco integrado", "Múltiplos pares"]',
        'Scalping',
        'M1-M5',
        50000,
        true
      ),
      (
        'Sentra Trend Follower',
        'Segue tendências de médio prazo com alta precisão',
        19700,
        '["Análise de tendência", "Win rate 72%", "Trailing stop inteligente", "Filtros de volatilidade"]',
        'Trend Following',
        'H1-H4',
        100000,
        true
      ),
      (
        'Sentra Grid Master',
        'Sistema de grid trading para mercados laterais',
        12700,
        '["Grid automatizado", "Recuperação de drawdown", "Gestão de risco avançada", "Múltiplos níveis"]',
        'Grid Trading',
        'M15-H1',
        80000,
        true
      ),
      (
        'Sentra News Trader',
        'Aproveita movimentos de notícias econômicas',
        17700,
        '["Trading de notícias", "Calendário econômico integrado", "Execução ultra-rápida", "Proteção de slippage"]',
        'News Trading',
        'M1-M15',
        150000,
        true
      )
    `);
    console.log('✅ Expert Advisors populados!');

    // 3. Popular vps_products
    console.log('📝 Populando vps_products...');
    await conn.query(`
      INSERT INTO vps_products (name, description, price, cpu, ram, storage, bandwidth, features, isActive) VALUES
      (
        'VPS Starter',
        'Ideal para 1-2 EAs rodando simultaneamente',
        2900,
        '2 vCPU',
        '2 GB',
        '40 GB SSD',
        'Ilimitado',
        '["Windows Server", "MT4/MT5 pré-instalado", "Latência <1ms", "Uptime 99.9%"]',
        true
      ),
      (
        'VPS Professional',
        'Para múltiplos EAs e copy trading avançado',
        4900,
        '4 vCPU',
        '4 GB',
        '80 GB SSD',
        'Ilimitado',
        '["Windows Server", "MT4/MT5 pré-instalado", "Latência <1ms", "Uptime 99.9%", "Backup diário", "Suporte prioritário"]',
        true
      ),
      (
        'VPS Enterprise',
        'Máxima performance para operações profissionais',
        8900,
        '8 vCPU',
        '8 GB',
        '160 GB SSD',
        'Ilimitado',
        '["Windows Server", "MT4/MT5 pré-instalado", "Latência <0.5ms", "Uptime 99.99%", "Backup em tempo real", "Suporte 24/7", "IP dedicado"]',
        true
      )
    `);
    console.log('✅ Produtos VPS populados!');

    console.log('\n🎉 DADOS POPULADOS COM SUCESSO!');
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

populateData()
  .then(() => {
    console.log('\n✅ População concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
