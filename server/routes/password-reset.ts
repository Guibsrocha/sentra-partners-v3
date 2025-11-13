import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { emailService } from '../services/email-service';

const router = Router();

// Armazenar tokens temporariamente (em produção, use Redis ou banco)
const resetTokens = new Map<string, { email: string; expires: number }>();

/**
 * POST /api/password-reset/request
 * Solicitar reset de senha
 */
router.post('/request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email é obrigatório' 
      });
    }
    
    // Verificar se usuário existe
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: 'Database not available' 
      });
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!user) {
      // Por segurança, não revelar se o email existe ou não
      return res.json({ 
        success: true, 
        message: 'Se o email existir, você receberá um link de reset' 
      });
    }
    
    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 hora
    
    // Armazenar token
    resetTokens.set(resetToken, {
      email: user.email,
      expires
    });
    
    // Enviar email
    await emailService.sendPasswordResetEmail({
      email: user.email,
      name: user.name || user.email.split('@')[0],
      resetToken
    });
    
    console.log('✅ [PASSWORD RESET] Token generated for:', email);
    
    return res.json({ 
      success: true, 
      message: 'Email de reset enviado com sucesso' 
    });
    
  } catch (error: any) {
    console.error('❌ [PASSWORD RESET ERROR]:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/password-reset/verify
 * Verificar se token é válido
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token é obrigatório' 
      });
    }
    
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }
    
    if (Date.now() > tokenData.expires) {
      resetTokens.delete(token);
      return res.status(400).json({ 
        success: false, 
        error: 'Token expirado' 
      });
    }
    
    return res.json({ 
      success: true, 
      email: tokenData.email 
    });
    
  } catch (error: any) {
    console.error('❌ [TOKEN VERIFY ERROR]:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/password-reset/reset
 * Redefinir senha
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token e nova senha são obrigatórios' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Senha deve ter no mínimo 6 caracteres' 
      });
    }
    
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }
    
    if (Date.now() > tokenData.expires) {
      resetTokens.delete(token);
      return res.status(400).json({ 
        success: false, 
        error: 'Token expirado' 
      });
    }
    
    // Atualizar senha
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: 'Database not available' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, tokenData.email));
    
    // Remover token usado
    resetTokens.delete(token);
    
    console.log('✅ [PASSWORD RESET] Password updated for:', tokenData.email);
    
    return res.json({ 
      success: true, 
      message: 'Senha redefinida com sucesso' 
    });
    
  } catch (error: any) {
    console.error('❌ [PASSWORD RESET ERROR]:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Limpar tokens expirados a cada hora
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of resetTokens.entries()) {
    if (now > data.expires) {
      resetTokens.delete(token);
    }
  }
}, 3600000); // 1 hora

export default router;
