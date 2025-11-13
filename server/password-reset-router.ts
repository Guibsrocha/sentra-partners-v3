import { router, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { emailService } from './services/email-service';

export const passwordResetRouter = router({
  // Solicitar reset de senha
  requestReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Verificar se usuário existe
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        // Não revelar se o email existe ou não (segurança)
        return {
          success: true,
          message: 'Se o email existir, você receberá um link de redefinição.',
        };
      }

      // Gerar token único
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hora

      // Salvar token no banco
      await db.execute(`
        INSERT INTO password_reset_tokens (userId, token, expiresAt)
        VALUES (${user.id}, '${token}', '${expiresAt.toISOString().slice(0, 19).replace('T', ' ')}')
      `);

      // Enviar email usando Resend
      try {
        await emailService.sendPasswordResetEmail({
          email: input.email,
          name: user.name || input.email.split('@')[0],
          resetToken: token
        });
      } catch (error) {
        console.error('Erro ao enviar email:', error);
        throw new Error('Erro ao enviar email de redefinição');
      }

      return {
        success: true,
        message: 'Email de redefinição enviado com sucesso!',
      };
    }),

  // Validar token
  validateToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      const result = await db.execute(`
        SELECT *
        FROM password_reset_tokens
        WHERE token = '${input.token}'
          AND used = FALSE
          AND expiresAt > NOW()
        LIMIT 1
      `);

      const rows = result[0] as any[];
      if (!rows || rows.length === 0) {
        return {
          valid: false,
          message: 'Token inválido ou expirado',
        };
      }

      const tokenData = rows[0];
      return {
        valid: true,
        email: tokenData.email,
      };
    }),

  // Redefinir senha
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Validar token
      const result = await db.execute(`
        SELECT *
        FROM password_reset_tokens
        WHERE token = '${input.token}'
          AND used = FALSE
          AND expiresAt > NOW()
        LIMIT 1
      `);

      const rows = result[0] as any[];
      if (!rows || rows.length === 0) {
        throw new Error('Token inválido ou expirado');
      }

      const tokenData = rows[0];
      const userId = tokenData.userId;
      console.log('🔐 [PASSWORD RESET] userId:', userId);
      console.log('🔐 [PASSWORD RESET] tokenData:', tokenData);

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      console.log('🔐 [PASSWORD RESET] hashedPassword generated:', hashedPassword.substring(0, 20) + '...');

      // Atualizar senha
      const updateResult = await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));
      
      console.log('🔐 [PASSWORD RESET] Update result:', updateResult);
      
      // Verificar se senha foi atualizada
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      console.log('🔐 [PASSWORD RESET] Updated user password hash:', updatedUser?.password?.substring(0, 20) + '...');

      // Marcar token como usado
      await db.execute(`
        UPDATE password_reset_tokens
        SET used = TRUE
        WHERE token = '${input.token}'
      `);

      return {
        success: true,
        message: 'Senha redefinida com sucesso!',
      };
    }),
});

