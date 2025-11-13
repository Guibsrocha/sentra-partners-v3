import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db';
import { userSubscriptions, subscriptionPlans, users, vpsSubscriptions, eaSubscriptions } from '../../drizzle/schema';
import { eq, and, gt } from 'drizzle-orm';

export interface SubscriptionInfo {
  hasActiveSubscription: boolean;
  plan?: any;
  subscription?: any;
  limits: {
    maxAccounts: number;
    copyTradingEnabled: boolean;
    advancedAnalyticsEnabled: boolean;
    freeVpsEnabled: boolean;
    prioritySupport: boolean;
  };
  // Verificações adicionais para funcionalidades pagas separadamente
  hasVpsAccess: boolean; // Tem VPS ativo (plano + assinatura separada)
  hasEAAccess: boolean;  // Tem EA ativo (plano + assinatura separada)
  separateSubscriptions: {
    vpsSubscriptions: number; // Número de VPS pagas separadamente
    eaSubscriptions: number;  // Número de EA pagas separadamente
  };
}

/**
 * Middleware para verificar se usuário tem assinatura ativa
 * Adiciona informações da assinatura em req.subscription
 */
export async function checkSubscription(
  req: Request & { subscription?: SubscriptionInfo },
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).userId || (req as any).user?.id;

    if (!userId) {
      req.subscription = {
        hasActiveSubscription: false,
        limits: {
          maxAccounts: 0,
          copyTradingEnabled: false,
          advancedAnalyticsEnabled: false,
          freeVpsEnabled: false,
          prioritySupport: false,
        },
        hasVpsAccess: false,
        hasEAAccess: false,
        separateSubscriptions: {
          vpsSubscriptions: 0,
          eaSubscriptions: 0,
        },
      };
      return next();
    }

    const db = getDb();

    // Buscar usuário para verificar permissões manuais
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Verificar permissões manuais
    let manualPermissions: any = null;
    if (userRecord?.manual_permissions) {
      try {
        manualPermissions = typeof userRecord.manual_permissions === 'string'
          ? JSON.parse(userRecord.manual_permissions)
          : userRecord.manual_permissions;
      } catch (e) {
        console.error('[Subscription Check] Erro ao parsear permissões manuais:', e);
      }
    }

    // Buscar assinatura ativa do usuário
    const [activeSubscription] = await db
      .select({
        subscription: userSubscriptions,
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .innerJoin(
        subscriptionPlans,
        eq(userSubscriptions.planId, subscriptionPlans.id)
      )
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active'),
          gt(userSubscriptions.endDate, new Date()) // Não expirada
        )
      )
      .limit(1);

    // Verificar assinaturas SEPARADAS de VPS e EA
    const [activeVpsSubscriptions] = await db
      .select()
      .from(vpsSubscriptions)
      .where(and(
        eq(vpsSubscriptions.userId, userId),
        eq(vpsSubscriptions.isActive, true)
      ));

    const [activeEASubscriptions] = await db
      .select()
      .from(eaSubscriptions)
      .where(and(
        eq(eaSubscriptions.userId, userId),
        eq(eaSubscriptions.isActive, true)
      ));

    const vpsCount = activeVpsSubscriptions.length;
    const eaCount = activeEASubscriptions.length;

    if (!activeSubscription) {
      // Se não tem assinatura, verificar permissões manuais
      if (manualPermissions) {
        req.subscription = {
          hasActiveSubscription: true, // Consideramos como "ativo" se tem permissões manuais
          limits: {
            maxAccounts: -1, // Ilimitado para permissões manuais
            copyTradingEnabled: manualPermissions.copy_trading || false,
            advancedAnalyticsEnabled: true, // Sempre habilitado para permissões manuais
            freeVpsEnabled: manualPermissions.vps || false,
            prioritySupport: true, // Sempre habilitado para permissões manuais
          },
          hasVpsAccess: vpsCount > 0 || manualPermissions.vps || false,
          hasEAAccess: eaCount > 0 || manualPermissions.ea || false,
          separateSubscriptions: {
            vpsSubscriptions: vpsCount,
            eaSubscriptions: eaCount,
          },
        };
      } else {
        // Usuário SEM plano principal e SEM permissões manuais
        // Se pagou VPS ou EA separadamente, APENAS essas funcionalidades funcionam
        // Todas as outras ficam BLOQUEADAS
        req.subscription = {
          hasActiveSubscription: false,
          limits: {
            maxAccounts: 0,
            copyTradingEnabled: false, // BLOQUEADO - não tem plano principal
            advancedAnalyticsEnabled: false, // BLOQUEADO - não tem plano principal
            freeVpsEnabled: false, // BLOQUEADO - não tem plano principal
            prioritySupport: false, // BLOQUEADO - não tem plano principal
          },
          // APENAS VPS e EA funcionam se foram pagos separadamente
          hasVpsAccess: vpsCount > 0,
          hasEAAccess: eaCount > 0,
          separateSubscriptions: {
            vpsSubscriptions: vpsCount,
            eaSubscriptions: eaCount,
          },
        };
      }
    } else {
      req.subscription = {
        hasActiveSubscription: true,
        plan: activeSubscription.plan,
        subscription: activeSubscription.subscription,
        limits: {
          maxAccounts: activeSubscription.plan.maxAccounts || 0,
          copyTradingEnabled: activeSubscription.plan.copyTradingEnabled || false,
          advancedAnalyticsEnabled: activeSubscription.plan.advancedAnalyticsEnabled || false,
          freeVpsEnabled: activeSubscription.plan.freeVpsEnabled || false,
          prioritySupport: activeSubscription.plan.prioritySupport || false,
        },
        // IMPORTANTE: Tem acesso se o plano permite OU se pagou separadamente
        hasVpsAccess: (activeSubscription.plan.freeVpsEnabled || false) || vpsCount > 0,
        hasEAAccess: eaCount > 0, // EA sempre disponível se foi comprado separadamente
        separateSubscriptions: {
          vpsSubscriptions: vpsCount,
          eaSubscriptions: eaCount,
        },
      };
    }

    next();
  } catch (error) {
    console.error('[Subscription Check] Erro:', error);
    // Em caso de erro, permitir acesso mas sem assinatura
    req.subscription = {
      hasActiveSubscription: false,
      limits: {
        maxAccounts: 0,
        copyTradingEnabled: false,
        advancedAnalyticsEnabled: false,
        freeVpsEnabled: false,
        prioritySupport: false,
      },
      hasVpsAccess: false,
      hasEAAccess: false,
      separateSubscriptions: {
        vpsSubscriptions: 0,
        eaSubscriptions: 0,
      },
    };
    next();
  }
}

/**
 * Middleware para EXIGIR assinatura ativa
 * Bloqueia acesso se não tiver assinatura
 */
export function requireActiveSubscription(
  req: Request & { subscription?: SubscriptionInfo },
  res: Response,
  next: NextFunction
) {
  if (!req.subscription?.hasActiveSubscription) {
    return res.status(403).json({
      success: false,
      error: 'Assinatura ativa necessária',
      message: 'Você precisa de uma assinatura ativa para acessar este recurso. Por favor, renove sua assinatura.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }
  next();
}

/**
 * Middleware para exigir copy trading habilitado no plano
 */
export function requireCopyTrading(
  req: Request & { subscription?: SubscriptionInfo },
  res: Response,
  next: NextFunction
) {
  if (!req.subscription?.limits.copyTradingEnabled) {
    return res.status(403).json({
      success: false,
      error: 'Copy Trading não disponível no seu plano',
      message: 'Faça upgrade para um plano que inclui Copy Trading.',
      code: 'COPY_TRADING_NOT_ENABLED',
    });
  }
  next();
}

/**
 * Verificar se usuário atingiu limite de contas
 */
export async function checkAccountLimit(userId: number): Promise<{
  canAddAccount: boolean;
  currentCount: number;
  maxAccounts: number;
  message?: string;
}> {
  try {
    const db = getDb();

    // Buscar usuário para verificar permissões manuais
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Verificar permissões manuais
    let manualPermissions: any = null;
    if (userRecord?.manual_permissions) {
      try {
        manualPermissions = typeof userRecord.manual_permissions === 'string'
          ? JSON.parse(userRecord.manual_permissions)
          : userRecord.manual_permissions;
      } catch (e) {
        console.error('[Check Account Limit] Erro ao parsear permissões manuais:', e);
      }
    }

    // Buscar assinatura ativa
    const [activeSubscription] = await db
      .select({
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .innerJoin(
        subscriptionPlans,
        eq(userSubscriptions.planId, subscriptionPlans.id)
      )
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active'),
          gt(userSubscriptions.endDate, new Date())
        )
      )
      .limit(1);

    if (!activeSubscription) {
      // Se tem permissões manuais, permitir contas ilimitadas
      if (manualPermissions) {
        const { tradingAccounts } = await import('../../drizzle/schema');
        const accounts = await db
          .select()
          .from(tradingAccounts)
          .where(eq(tradingAccounts.userId, userId));
        
        return {
          canAddAccount: true,
          currentCount: accounts.length,
          maxAccounts: -1, // Ilimitado
        };
      }
      
      return {
        canAddAccount: false,
        currentCount: 0,
        maxAccounts: 0,
        message: 'Você precisa de uma assinatura ativa para adicionar contas.',
      };
    }

    const maxAccounts = activeSubscription.plan.maxAccounts || 0;

    // Contar contas atuais do usuário
    const { tradingAccounts } = await import('../../drizzle/schema');
    const accounts = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.userId, userId));

    const currentCount = accounts.length;

    // -1 significa ilimitado
    if (maxAccounts === -1) {
      return {
        canAddAccount: true,
        currentCount,
        maxAccounts: -1,
      };
    }

    if (currentCount >= maxAccounts) {
      return {
        canAddAccount: false,
        currentCount,
        maxAccounts,
        message: `Você atingiu o limite de ${maxAccounts} conta(s) do seu plano. Faça upgrade para adicionar mais contas.`,
      };
    }

    return {
      canAddAccount: true,
      currentCount,
      maxAccounts,
    };
  } catch (error) {
    console.error('[Check Account Limit] Erro:', error);
    return {
      canAddAccount: false,
      currentCount: 0,
      maxAccounts: 0,
      message: 'Erro ao verificar limite de contas.',
    };
  }
}
