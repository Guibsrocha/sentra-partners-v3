import 'dotenv/config';
import { getRawConnection } from '../db';

async function checkTables() {
  const conn = await getRawConnection();
  
  try {
    console.log('📋 Verificando estrutura das tabelas...\n');
    
    // subscription_plans
    console.log('=== subscription_plans ===');
    const [plansCols] = await conn.query('DESCRIBE subscription_plans');
    console.log(plansCols);
    
    // expert_advisors
    console.log('\n=== expert_advisors ===');
    const [eaCols] = await conn.query('DESCRIBE expert_advisors');
    console.log(eaCols);
    
    // vps_products
    console.log('\n=== vps_products ===');
    const [vpsCols] = await conn.query('DESCRIBE vps_products');
    console.log(vpsCols);
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  } finally {
    await conn.end();
  }
}

checkTables();
