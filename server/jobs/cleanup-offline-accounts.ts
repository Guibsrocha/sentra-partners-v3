import { getRawConnection } from '../db';

/**
 * Remove contas Master e Slave que estão offline há mais de 48 horas
 */
export async function cleanupOfflineAccounts() {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      console.error('[Cleanup] ❌ Conexão com banco de dados não disponível');
      return;
    }

    const OFFLINE_THRESHOLD_HOURS = 48;
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - OFFLINE_THRESHOLD_HOURS);

    console.log(`[Cleanup] 🧹 Iniciando limpeza de contas offline há mais de ${OFFLINE_THRESHOLD_HOURS}h...`);

    // Deletar contas Master offline
    const [masterResult]: any = await connection.execute(
      `DELETE FROM master_accounts WHERE last_heartbeat < ?`,
      [thresholdDate]
    );

    const deletedMasters = masterResult.affectedRows || 0;

    // Deletar contas Slave offline
    const [slaveResult]: any = await connection.execute(
      `DELETE FROM slave_accounts WHERE last_heartbeat < ?`,
      [thresholdDate]
    );

    const deletedSlaves = slaveResult.affectedRows || 0;

    // Deletar configurações órfãs (sem master ou slave correspondente)
    await connection.execute(
      `DELETE FROM copy_trading_settings 
       WHERE master_account_id NOT IN (SELECT account_id FROM master_accounts)
       OR slave_account_id NOT IN (SELECT account_id FROM slave_accounts)`
    );

    console.log(`[Cleanup] ✅ Limpeza concluída: ${deletedMasters} Masters e ${deletedSlaves} Slaves removidos`);

    return {
      deletedMasters,
      deletedSlaves
    };

  } catch (error: any) {
    console.error('[Cleanup] ❌ Erro ao limpar contas offline:', error);
    throw error;
  }
}
