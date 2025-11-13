import { db } from './server/_core/db/index.js';
import { sql } from 'drizzle-orm';

await db.execute(sql`
  UPDATE landing_page_content 
  SET logo_url = '/sentra-logo.png'
  WHERE id = 1
`);

console.log('✅ Logo atualizada para /sentra-logo.png');
process.exit(0);
