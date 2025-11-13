import { Router } from 'express';
import { getDb } from '../db';
import { tradingAccounts, clientVMs } from '../../drizzle/schema';
import { eq, isNull } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/vm-accounts/my-vms
 * Lista as VMs do usuário com as contas vinculadas
 */
router.get('/my-vms', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      });
    }

    const db = getDb();

    // Buscar VMs do usuário
    const vms = await db
      .select({
        id: clientVMs.id,
        hostname: clientVMs.hostname,
        ipAddress: clientVMs.ipAddress,
        username: clientVMs.username,
        status: clientVMs.status,
        cpu: clientVMs.cpu,
        ram: clientVMs.ram,
        storage: clientVMs.storage,
        os: clientVMs.os,
        createdAt: clientVMs.createdAt,
        expiresAt: clientVMs.expiresAt,
      })
      .from(clientVMs)
      .where(eq(clientVMs.userId, user.id));

    // Para cada VM, buscar as contas vinculadas
    const vmsWithAccounts = await Promise.all(
      vms.map(async (vm) => {
        const accounts = await db
          .select({
            id: tradingAccounts.id,
            accountNumber: tradingAccounts.accountNumber,
            broker: tradingAccounts.broker,
            platform: tradingAccounts.platform,
            accountType: tradingAccounts.accountType,
            balance: tradingAccounts.balance,
            equity: tradingAccounts.equity,
            status: tradingAccounts.status,
            lastHeartbeat: tradingAccounts.lastHeartbeat,
            vmLabel: tradingAccounts.vmLabel,
            linkedAt: tradingAccounts.linkedAt,
          })
          .from(tradingAccounts)
          .where(eq(tradingAccounts.vmId, vm.id));

        return {
          ...vm,
          accounts
        };
      })
    );

    res.json({
      success: true,
      vms: vmsWithAccounts
    });
  } catch (error: any) {
    console.error('[VM Accounts] Erro ao listar VMs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vm-accounts/my-accounts
 * Lista as contas do usuário que NÃO estão vinculadas a nenhuma VM
 */
router.get('/my-accounts', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      });
    }

    const db = getDb();

    // Buscar contas que não estão vinculadas a nenhuma VM
    const accounts = await db
      .select({
        id: tradingAccounts.id,
        accountNumber: tradingAccounts.accountNumber,
        broker: tradingAccounts.broker,
        platform: tradingAccounts.platform,
        accountType: tradingAccounts.accountType,
        balance: tradingAccounts.balance,
        equity: tradingAccounts.equity,
        status: tradingAccounts.status,
        lastHeartbeat: tradingAccounts.lastHeartbeat,
        vmLabel: tradingAccounts.vmLabel,
        linkedAt: tradingAccounts.linkedAt,
      })
      .from(tradingAccounts)
      .where(eq(tradingAccounts.userId, user.id))
      .where(isNull(tradingAccounts.vmId));

    res.json({
      success: true,
      accounts
    });
  } catch (error: any) {
    console.error('[VM Accounts] Erro ao listar contas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vm-accounts/link
 * Vincula uma conta a uma VM
 */
router.post('/link', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      });
    }

    const { vmId, accountId, label } = req.body;

    if (!vmId || !accountId) {
      return res.status(400).json({
        success: false,
        error: 'vmId e accountId são obrigatórios'
      });
    }

    const db = getDb();

    // Verificar se a VM pertence ao usuário
    const vm = await db
      .select()
      .from(clientVMs)
      .where(eq(clientVMs.id, vmId))
      .then(rows => rows[0]);

    if (!vm || vm.userId !== user.id) {
      return res.status(404).json({
        success: false,
        error: 'VM não encontrada ou não pertence ao usuário'
      });
    }

    // Verificar se a conta pertence ao usuário
    const account = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, accountId))
      .then(rows => rows[0]);

    if (!account || account.userId !== user.id) {
      return res.status(404).json({
        success: false,
        error: 'Conta não encontrada ou não pertence ao usuário'
      });
    }

    // Verificar se a conta já está vinculada a outra VM
    if (account.vmId && account.vmId !== vmId) {
      return res.status(400).json({
        success: false,
        error: 'Esta conta já está vinculada a outra VM'
      });
    }

    // Vincular conta à VM com label e data
    const updateData: any = { 
      vmId,
      linkedAt: new Date()
    };
    
    if (label) {
      updateData.vmLabel = label;
    }
    
    await db
      .update(tradingAccounts)
      .set(updateData)
      .where(eq(tradingAccounts.id, accountId));

    console.log(`[VM Accounts] Conta ${account.accountNumber} vinculada à VM ${vm.hostname}`);

    res.json({
      success: true,
      message: 'Conta vinculada à VM com sucesso'
    });
  } catch (error: any) {
    console.error('[VM Accounts] Erro ao vincular conta:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vm-accounts/unlink
 * Remove a vinculação de uma conta com a VM
 */
router.post('/unlink', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      });
    }

    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'accountId é obrigatório'
      });
    }

    const db = getDb();

    // Verificar se a conta pertence ao usuário
    const account = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.id, accountId))
      .then(rows => rows[0]);

    if (!account || account.userId !== user.id) {
      return res.status(404).json({
        success: false,
        error: 'Conta não encontrada ou não pertence ao usuário'
      });
    }

    // Remover vinculação
    await db
      .update(tradingAccounts)
      .set({ vmId: null })
      .where(eq(tradingAccounts.id, accountId));

    console.log(`[VM Accounts] Conta ${account.accountNumber} desvinculada da VM`);

    res.json({
      success: true,
      message: 'Conta desvinculada da VM com sucesso'
    });
  } catch (error: any) {
    console.error('[VM Accounts] Erro ao desvincular conta:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;