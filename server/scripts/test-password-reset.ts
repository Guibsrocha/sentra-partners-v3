import 'dotenv/config';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function testPasswordReset() {
  console.log('🔐 Testando sistema de reset de senha...\n');

  const db = await getDb();
  if (!db) {
    console.error('❌ Erro: Banco de dados não disponível');
    return;
  }

  // 1. Buscar usuário de teste
  const testEmail = 'sentrapartners@gmail.com'; // Substitua pelo seu email
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, testEmail))
    .limit(1);

  if (!user) {
    console.error(`❌ Usuário ${testEmail} não encontrado`);
    return;
  }

  console.log(`✅ Usuário encontrado: ${user.email} (ID: ${user.id})`);
  console.log(`   Senha atual (hash): ${user.password?.substring(0, 30)}...`);

  // 2. Testar hash de senha
  const testPassword = 'NovaSenh@123';
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  
  console.log(`\n🔐 Testando nova senha: "${testPassword}"`);
  console.log(`   Hash gerado: ${hashedPassword.substring(0, 30)}...`);

  // 3. Atualizar senha no banco
  console.log(`\n📝 Atualizando senha no banco...`);
  
  const updateResult = await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, user.id));

  console.log(`   Resultado do UPDATE:`, updateResult);

  // 4. Verificar se foi atualizada
  const [updatedUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  console.log(`\n✅ Senha após UPDATE:`);
  console.log(`   Hash no banco: ${updatedUser.password?.substring(0, 30)}...`);
  
  // 5. Testar comparação
  const isMatch = await bcrypt.compare(testPassword, updatedUser.password!);
  console.log(`\n🔍 Teste de comparação:`);
  console.log(`   bcrypt.compare("${testPassword}", hash) = ${isMatch}`);

  if (isMatch) {
    console.log(`\n✅ SUCESSO! A senha foi atualizada corretamente!`);
    console.log(`\n📋 Agora você pode fazer login com:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Senha: ${testPassword}`);
  } else {
    console.log(`\n❌ ERRO! A senha não foi atualizada corretamente!`);
  }
}

testPasswordReset().catch(console.error);
