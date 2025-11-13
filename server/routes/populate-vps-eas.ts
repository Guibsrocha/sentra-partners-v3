import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

router.post('/api/admin/populate-vps-eas', async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }
    
    console.log('🚀 Populando VPS e EAs...');

    // Limpar dados existentes
    await connection.execute('DELETE FROM vps_products');
    await connection.execute('DELETE FROM expert_advisors');

    // VPS Products
    const vpsData = [
      {
        name: 'VPS Starter',
        slug: 'vps-starter',
        description: 'Perfeito para iniciantes. Ideal para executar até 3 EAs simultâneos com estabilidade garantida.',
        price: 29.00,
        ram: '2GB',
        cpu: '1 vCPU Intel',
        storage: '20GB SSD',
        bandwidth: '1TB',
        specifications: JSON.stringify({ cpu: '1 vCPU Intel', ram: '2GB', storage: '20GB SSD', bandwidth: '1TB' }),
        billing_cycle: 'monthly',
        location: 'São Paulo, Brasil',
        provider: 'Sentra Partners',
        max_mt4_instances: 3,
        max_mt5_instances: 3,
        is_available: 1,
        stock_quantity: 50,
        sort_order: 1
      },
      {
        name: 'VPS Professional',
        slug: 'vps-professional',
        description: 'Para traders ativos. Suporte para até 10 EAs com recursos avançados de monitoramento.',
        price: 49.00,
        ram: '4GB',
        cpu: '2 vCPU Intel',
        storage: '40GB SSD',
        bandwidth: '2TB',
        specifications: JSON.stringify({ cpu: '2 vCPU Intel', ram: '4GB', storage: '40GB SSD', bandwidth: '2TB' }),
        billing_cycle: 'monthly',
        location: 'São Paulo, Brasil',
        provider: 'Sentra Partners',
        max_mt4_instances: 10,
        max_mt5_instances: 10,
        is_available: 1,
        stock_quantity: 30,
        sort_order: 2
      },
      {
        name: 'VPS Enterprise',
        slug: 'vps-enterprise',
        description: 'Máxima performance. Ideal para gestoras e traders profissionais com até 25 EAs.',
        price: 89.00,
        ram: '8GB',
        cpu: '4 vCPU Intel',
        storage: '80GB SSD',
        bandwidth: '4TB',
        specifications: JSON.stringify({ cpu: '4 vCPU Intel', ram: '8GB', storage: '80GB SSD', bandwidth: '4TB' }),
        billing_cycle: 'monthly',
        location: 'São Paulo, Brasil',
        provider: 'Sentra Partners',
        max_mt4_instances: 25,
        max_mt5_instances: 25,
        is_available: 1,
        stock_quantity: 15,
        sort_order: 3
      },
      {
        name: 'VPS Ultimate',
        slug: 'vps-ultimate',
        description: 'O mais potente. Para operações complexas com suporte para até 50 EAs simultâneos.',
        price: 149.00,
        ram: '16GB',
        cpu: '8 vCPU Intel',
        storage: '160GB SSD',
        bandwidth: '8TB',
        specifications: JSON.stringify({ cpu: '8 vCPU Intel', ram: '16GB', storage: '160GB SSD', bandwidth: '8TB' }),
        billing_cycle: 'monthly',
        location: 'São Paulo, Brasil',
        provider: 'Sentra Partners',
        max_mt4_instances: 50,
        max_mt5_instances: 50,
        is_available: 1,
        stock_quantity: 10,
        sort_order: 4
      }
    ];

    for (const vps of vpsData) {
      await connection.execute(`
        INSERT INTO vps_products 
        (name, slug, description, price, ram, cpu, storage, bandwidth, specifications, billing_cycle, location, provider, max_mt4_instances, max_mt5_instances, is_available, stock_quantity, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        vps.name, vps.slug, vps.description, vps.price, vps.ram, vps.cpu, vps.storage, vps.bandwidth,
        vps.specifications, vps.billing_cycle, vps.location, vps.provider, vps.max_mt4_instances, 
        vps.max_mt5_instances, vps.is_available, vps.stock_quantity, vps.sort_order
      ]);
    }

    // Expert Advisors
    const eaData = [
      {
        name: 'Sentra Scalper Pro',
        slug: 'sentra-scalper-pro',
        description: 'EA de scalping de alta frequência otimizado para spreads baixos.',
        long_description: 'O Sentra Scalper Pro é um Expert Advisor desenvolvido especificamente para operações de scalping em timeframes M1 e M5. Com algoritmos avançados de machine learning, identifica oportunidades de profit em movimentos micro do mercado.',
        price: 297.00,
        platform: 'MT5',
        license_type: 'single',
        features: JSON.stringify([
          'Scalping avançado M1/M5',
          'Gerenciamento de risco dinâmico',
          'Filtros de notícias econômicas',
          'Proteção contra spread widening',
          'Suporte técnico especializado',
          'Atualizações gratuitas por 1 ano'
        ]),
        strategy: 'Scalping de Alta Frequência',
        version: '2.1.0',
        rating: 4800,
        review_count: 89,
        sort_order: 1,
        active: 1
      },
      {
        name: 'Sentra Trend Master',
        slug: 'sentra-trend-master',
        description: 'Seguidor de tendências com IA para operações de médio e longo prazo.',
        long_description: 'O Sentra Trend Master utiliza inteligência artificial para identificar e seguir tendências predominantes no mercado. Funciona perfeitamente em timeframes H1, H4 e D1.',
        price: 397.00,
        platform: 'MT4/MT5',
        license_type: 'single',
        features: JSON.stringify([
          'Trend Following com IA',
          'Análise de momentum',
          'Filtros de volume',
          'Adaptação automática à volatilidade',
          'Stop Loss e Take Profit dinâmicos',
          'Dashboard de monitoramento em tempo real'
        ]),
        strategy: 'Trend Following Inteligente',
        version: '1.8.5',
        rating: 4650,
        review_count: 156,
        sort_order: 2,
        active: 1
      },
      {
        name: 'Sentra Grid Master',
        slug: 'sentra-grid-master',
        description: 'Sistema grid automático com recuperação inteligente de drawdowns.',
        long_description: 'Especializado em mercados laterais, o Sentra Grid Master implementa uma estratégia de grid otimizada com algoritmos de recuperação inteligente.',
        price: 197.00,
        platform: 'MT4/MT5',
        license_type: 'single',
        features: JSON.stringify([
          'Grid automático inteligente',
          'Recuperação de drawdown otimizada',
          'Filtros estatísticos avançados',
          'Adaptação à volatilidade do mercado',
          'Gestão de liquidez integrada',
          'Múltiplos pares de moedas suportados'
        ]),
        strategy: 'Grid Trading Inteligente',
        version: '1.5.2',
        rating: 4200,
        review_count: 67,
        sort_order: 3,
        active: 1
      },
      {
        name: 'Sentra News Trader',
        slug: 'sentra-news-trader',
        description: 'EA especializado em trading durante notícias de alto impacto.',
        long_description: 'Desenvolvido para capturar movimentos extremos gerados por notícias econômicas de alto impacto. Utiliza análise semântica de calendários econômicos.',
        price: 247.00,
        platform: 'MT5',
        license_type: 'rental',
        rental_period: 30,
        features: JSON.stringify([
          'Trading automático de notícias',
          'Análise semântica de calendário econômico',
          'Timing automático de entrada',
          'Proteção contra slippage',
          'Suporte a múltiplos currencies',
          'Backtest com 5 anos de dados históricos'
        ]),
        strategy: 'News Trading Automatizado',
        version: '1.2.8',
        rating: 3900,
        review_count: 34,
        sort_order: 4,
        active: 1
      },
      {
        name: 'Sentra Crypto Arbitrage',
        slug: 'sentra-crypto-arbitrage',
        description: 'Sistema de arbitragem para pares de criptomoedas com spreads variáveis.',
        long_description: 'Primeiro EA da plataforma focado exclusivamente em arbitragem de criptomoedas. Monitore múltiplos exchanges simultaneamente.',
        price: 497.00,
        platform: 'MT5',
        license_type: 'single',
        features: JSON.stringify([
          'Arbitragem multi-exchange',
          'Monitoramento de liquidez em tempo real',
          'Proteção contra riscos operacionais',
          'Suporte a Bitcoin, Ethereum e altcoins',
          'Alertas de oportunidades em tempo real',
          'API connections com exchanges principais'
        ]),
        strategy: 'Arbitragem Cripto',
        version: '1.0.3',
        rating: 4400,
        review_count: 23,
        sort_order: 5,
        active: 1
      }
    ];

    for (const ea of eaData) {
      await connection.execute(`
        INSERT INTO expert_advisors 
        (name, slug, description, long_description, price, platform, license_type, rental_period, features, strategy, version, rating, review_count, sort_order, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ea.name, ea.slug, ea.description, ea.long_description, ea.price, ea.platform, ea.license_type,
        ea.rental_period, ea.features, ea.strategy, ea.version, ea.rating, ea.review_count, ea.sort_order, ea.active
      ]);
    }

    console.log('✅ VPS e EAs criados com sucesso!');

    res.json({
      success: true,
      message: '4 VPS e 5 EAs criados com sucesso!',
      data: {
        vps: vpsData.map(v => ({ name: v.name, price: v.price })),
        eas: eaData.map(e => ({ name: e.name, price: e.price }))
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao popular VPS e EAs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
