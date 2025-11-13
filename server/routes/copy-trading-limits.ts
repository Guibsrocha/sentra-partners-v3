import express, { Request, Response } from "express";
import { and, eq, gt, count } from "drizzle-orm";
import { getDb } from "../db";
import { tradingAccounts, copyTradingConfigs, copyTradingLimits, copyTradingFollowers, subscriptionPlans, userSubscriptions } from "../../drizzle/schema";
import { authenticateUser } from "../auth";
import { getActiveSubscriptionPlan } from "../middleware/subscription-check";

const router = express.Router();

/**
 * Verifica o plano atual do usuário e suas limitações
 */
async function getUserPlanInfo(userId: number) {
  const db = getDb();
  
  // Obter assinatura ativa
  const activeSubscription = await db
    .select({
      subscription: userSubscriptions,
      plan: subscriptionPlans
    })
    .from(userSubscriptions)
    .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, userSubscriptions.planId))
    .where(and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.status, "active")
    ))
    .limit(1);
  
  if (!activeSubscription.length) {
    // Usuário sem plano ativo - NÃO pode usar copy trading
    return {
      planId: 0,
      planName: 'no-plan',
      planLevel: 'no-plan',
      maxMastersAllowed: 0,
      canCopyUnlimited: false,
      hasCalendarAccess: false,
      copyTradingEnabled: false // BLOQUEADO - não tem plano principal
    };
  }
  
  const subscription = activeSubscription[0];
  const plan = subscription.plan || { maxMastersAllowed: 1, canCopyUnlimited: false, economicCalendarAccess: false, copyTradingEnabled: true };
  
  return {
    planId: subscription.subscription.planId,
    planName: plan.name || 'unknown',
    planLevel: plan.slug || 'basic',
    maxMastersAllowed: plan.maxMastersAllowed || 1,
    canCopyUnlimited: plan.canCopyUnlimited || false,
    hasCalendarAccess: plan.economicCalendarAccess || false,
    copyTradingEnabled: plan.copyTradingEnabled !== false
  };
}

/**
 * Conta quantas contas master o usuário está copiando atualmente
 */
async function countActiveMasters(userId: number): Promise<number> {
  const db = getDb();
  
  const result = await db
    .select({ count: count() })
    .from(copyTradingConfigs)
    .where(and(
      eq(copyTradingConfigs.targetAccountId, userId),
      eq(copyTradingConfigs.isActive, true)
    ));
  
  return result[0]?.count || 0;
}

/**
 * GET /api/copy-trading/limits/:accountId
 * Obtém informações sobre limites de uma conta específica
 */
router.get("/limits/:accountId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const userId = req.user!.id;
    
    const db = getDb();
    
    // Verificar se a conta pertence ao usuário
    const account = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, parseInt(accountId)))
      .limit(1);
    
    if (!account.length) {
      return res.status(404).json({
        success: false,
        error: "Conta não encontrada"
      });
    }
    
    if (account[0].userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado a esta conta"
      });
    }
    
    // Obter limite da conta
    const limits = await db
      .select()
      .from(copyTradingLimits)
      .where(eq(copyTradingLimits.masterAccountId, parseInt(accountId)))
      .limit(1);
    
    const limit = limits.length ? limits[0] : {
      masterAccountId: parseInt(accountId),
      userId: userId,
      maxFollowers: account[0].maxFollowers || 10,
      currentFollowers: account[0].currentFollowers || 0,
      isActive: true
    };
    
    return res.json({
      success: true,
      data: {
        accountId: parseInt(accountId),
        maxFollowers: limit.maxFollowers,
        currentFollowers: limit.currentFollowers,
        remainingFollowers: limit.maxFollowers - limit.currentFollowers,
        isActive: limit.isActive,
        limitStatus: limit.currentFollowers >= limit.maxFollowers ? 'reached' : 'available'
      }
    });
    
  } catch (error) {
    console.error("[CopyTrading] Erro ao obter limites:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * POST /api/copy-trading/limits/:accountId
 * Atualiza limite de followers de uma conta
 */
router.post("/limits/:accountId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { maxFollowers } = req.body;
    const userId = req.user!.id;
    
    if (!maxFollowers || maxFollowers < 1 || maxFollowers > 100) {
      return res.status(400).json({
        success: false,
        error: "Limite deve estar entre 1 e 100"
      });
    }
    
    const db = getDb();
    
    // Verificar se a conta pertence ao usuário
    const account = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, parseInt(accountId)))
      .limit(1);
    
    if (!account.length) {
      return res.status(404).json({
        success: false,
        error: "Conta não encontrada"
      });
    }
    
    if (account[0].userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado a esta conta"
      });
    }
    
    // Atualizar ou criar limite
    const existingLimit = await db
      .select()
      .from(copyTradingLimits)
      .where(eq(copyTradingLimits.masterAccountId, parseInt(accountId)))
      .limit(1);
    
    if (existingLimit.length) {
      // Atualizar limite existente
      await db
        .update(copyTradingLimits)
        .set({ 
          maxFollowers,
          updatedAt: new Date()
        })
        .where(eq(copyTradingLimits.masterAccountId, parseInt(accountId)));
    } else {
      // Criar novo limite
      await db
        .insert(copyTradingLimits)
        .values({
          masterAccountId: parseInt(accountId),
          userId: userId,
          maxFollowers,
          currentFollowers: account[0].currentFollowers || 0,
          isActive: true
        });
    }
    
    // Atualizar também na tabela trading_accounts
    await db
      .update(tradingAccounts)
      .set({ maxFollowers })
      .where(eq(tradingAccounts.id, parseInt(accountId)));
    
    return res.json({
      success: true,
      message: "Limite atualizado com sucesso",
      data: {
        accountId: parseInt(accountId),
        maxFollowers,
        currentFollowers: account[0].currentFollowers || 0,
        remainingFollowers: maxFollowers - (account[0].currentFollowers || 0)
      }
    });
    
  } catch (error) {
    console.error("[CopyTrading] Erro ao atualizar limite:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * GET /api/copy-trading/followers/:accountId
 * Lista followers de uma conta específica
 */
router.get("/followers/:accountId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const userId = req.user!.id;
    
    const db = getDb();
    
    // Verificar se a conta pertence ao usuário
    const account = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, parseInt(accountId)))
      .limit(1);
    
    if (!account.length) {
      return res.status(404).json({
        success: false,
        error: "Conta não encontrada"
      });
    }
    
    if (account[0].userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado a esta conta"
      });
    }
    
    // Obter followers ativos
    const followers = await db
      .select({
        id: copyTradingFollowers.id,
        followerAccountId: copyTradingFollowers.followerAccountId,
        followerUserId: copyTradingFollowers.followerUserId,
        configId: copyTradingFollowers.configId,
        startedAt: copyTradingFollowers.startedAt,
        followerAccount: tradingAccounts
      })
      .from(copyTradingFollowers)
      .leftJoin(tradingAccounts, eq(tradingAccounts.id, copyTradingFollowers.followerAccountId))
      .where(eq(copyTradingFollowers.masterAccountId, parseInt(accountId)))
      .where(eq(copyTradingFollowers.isActive, true));
    
    return res.json({
      success: true,
      data: followers.map(f => ({
        followerAccountId: f.followerAccountId,
        followerAccountNumber: f.followerAccount?.accountNumber || 'N/A',
        followerAccountName: f.followerAccount?.terminalId || 'Conta Desconhecida',
        followerUserId: f.followerUserId,
        configId: f.configId,
        startedAt: f.startedAt
      }))
    });
    
  } catch (error) {
    console.error("[CopyTrading] Erro ao obter followers:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * POST /api/copy-trading/validate-follow
 * Valida se uma conta pode seguir outra (verifica limites por plano e por conta)
 */
router.post("/validate-follow", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { masterAccountId, followerAccountId } = req.body;
    const userId = req.user!.id;
    
    if (!masterAccountId || !followerAccountId) {
      return res.status(400).json({
        success: false,
        error: "IDs das contas são obrigatórios"
      });
    }
    
    if (masterAccountId === followerAccountId) {
      return res.status(400).json({
        success: false,
        error: "Uma conta não pode copiar a si mesma"
      });
    }
    
    const db = getDb();
    
    // Verificar se a conta master existe e pertence ao sistema
    const masterAccount = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, masterAccountId))
      .limit(1);
    
    if (!masterAccount.length) {
      return res.status(404).json({
        success: false,
        error: "Conta master não encontrada"
      });
    }
    
    // Verificar se a conta follower existe e pertence ao usuário
    const followerAccount = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, followerAccountId))
      .limit(1);
    
    if (!followerAccount.length) {
      return res.status(404).json({
        success: false,
        error: "Conta follower não encontrada"
      });
    }
    
    if (followerAccount[0].userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado à conta follower"
      });
    }
    
    // Verificar se já existe uma configuração ativa
    const existingConfig = await db
      .select()
      .from(copyTradingConfigs)
      .where(eq(copyTradingConfigs.sourceAccountId, masterAccountId))
      .where(eq(copyTradingConfigs.targetAccountId, followerAccountId))
      .where(eq(copyTradingConfigs.isActive, true))
      .limit(1);
    
    if (existingConfig.length) {
      return res.status(400).json({
        success: false,
        error: "Já existe uma configuração ativa entre essas contas"
      });
    }
    
    // NOVA LÓGICA: Verificar limitações por PLANO do usuário
    const userPlanInfo = await getUserPlanInfo(userId);
    const currentMastersCount = await countActiveMasters(userId);
    
    // Verificar se o plano permite copy trading
    if (!userPlanInfo.copyTradingEnabled) {
      return res.status(403).json({
        success: false,
        error: "Seu plano atual não permite copy trading"
      });
    }
    
    // Verificar se usuário atingiu limite de masters
    if (!userPlanInfo.canCopyUnlimited && currentMastersCount >= userPlanInfo.maxMastersAllowed) {
      return res.status(400).json({
        success: false,
        error: `Seu plano ${userPlanInfo.planLevel} permite copiar no máximo ${userPlanInfo.maxMastersAllowed} contas master. Você já está copiando ${currentMastersCount} conta(s).`,
        data: {
          currentPlanLevel: userPlanInfo.planLevel,
          maxMastersAllowed: userPlanInfo.maxMastersAllowed,
          currentMastersCount,
          remainingMasters: Math.max(0, userPlanInfo.maxMastersAllowed - currentMastersCount),
          canCopyUnlimited: userPlanInfo.canCopyUnlimited,
          planUpgradeNeeded: currentMastersCount >= userPlanInfo.maxMastersAllowed
        }
      });
    }
    
    // Verificar limite da CONTA master
    const masterLimit = await db
      .select()
      .from(copyTradingLimits)
      .where(eq(copyTradingLimits.masterAccountId, masterAccountId))
      .limit(1);
    
    const maxFollowers = masterLimit.length ? masterLimit[0].maxFollowers : (masterAccount[0].maxFollowers || 10);
    const currentFollowers = masterLimit.length ? masterLimit[0].currentFollowers : (masterAccount[0].currentFollowers || 0);
    
    if (currentFollowers >= maxFollowers) {
      return res.status(400).json({
        success: false,
        error: `Conta master atingiu limite máximo de ${maxFollowers} followers`,
        data: {
          maxFollowers,
          currentFollowers,
          remainingFollowers: 0
        }
      });
    }
    
    return res.json({
      success: true,
      message: "Follow validado com sucesso",
      data: {
        masterAccountId,
        followerAccountId,
        maxFollowers,
        currentFollowers,
        remainingFollowers: maxFollowers - currentFollowers,
        // Informações do plano
        userPlan: {
          planLevel: userPlanInfo.planLevel,
          maxMastersAllowed: userPlanInfo.maxMastersAllowed,
          currentMastersCount,
          remainingMasters: userPlanInfo.canCopyUnlimited ? -1 : (userPlanInfo.maxMastersAllowed - currentMastersCount),
          canCopyUnlimited: userPlanInfo.canCopyUnlimited,
          hasCalendarAccess: userPlanInfo.hasCalendarAccess
        },
        canFollow: true
      }
    });
    
  } catch (error) {
    console.error("[CopyTrading] Erro ao validar follow:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * GET /api/copy-trading/my-plan-limits
 * Obtém informações sobre limitações de copy trading baseado no plano do usuário
 */
router.get("/my-plan-limits", authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Obter informações do plano
    const userPlanInfo = await getUserPlanInfo(userId);
    const currentMastersCount = await countActiveMasters(userId);
    
    // Obter resumo das configurações ativas
    const db = getDb();
    const activeConfigs = await db
      .select({
        config: copyTradingConfigs,
        masterAccount: tradingAccounts
      })
      .from(copyTradingConfigs)
      .leftJoin(tradingAccounts, eq(tradingAccounts.id, copyTradingConfigs.sourceAccountId))
      .where(eq(copyTradingConfigs.targetAccountId, userId))
      .where(eq(copyTradingConfigs.isActive, true));
    
    return res.json({
      success: true,
      data: {
        // Informações do plano
        plan: {
          planLevel: userPlanInfo.planLevel,
          planName: userPlanInfo.planName,
          hasCalendarAccess: userPlanInfo.hasCalendarAccess,
          copyTradingEnabled: userPlanInfo.copyTradingEnabled
        },
        // Limitações de plano
        planLimits: {
          maxMastersAllowed: userPlanInfo.maxMastersAllowed,
          canCopyUnlimited: userPlanInfo.canCopyUnlimited,
          currentMastersCount,
          remainingMasters: userPlanInfo.canCopyUnlimited ? -1 : (userPlanInfo.maxMastersAllowed - currentMastersCount)
        },
        // Lista de masters ativos
        activeMasters: activeConfigs.map(config => ({
          configId: config.config.id,
          masterAccountId: config.config.sourceAccountId,
          masterAccountNumber: config.masterAccount?.accountNumber || 'N/A',
          masterAccountName: config.masterAccount?.terminalId || 'Conta Master',
          startedAt: config.config.createdAt
        })),
        // Recomendações
        recommendations: {
          canUpgrade: currentMastersCount >= userPlanInfo.maxMastersAllowed && !userPlanInfo.canCopyUnlimited,
          upgradeMessage: currentMastersCount >= userPlanInfo.maxMastersAllowed && !userPlanInfo.canCopyUnlimited 
            ? `Você já está usando ${currentMastersCount} de ${userPlanInfo.maxMastersAllowed} Masters disponíveis. Considere fazer upgrade para acessar mais Masters.` 
            : null
        }
      }
    });
    
  } catch (error) {
    console.error("[CopyTrading] Erro ao obter limites do plano:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

export default router;