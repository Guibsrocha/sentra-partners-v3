/**
 * Sistema de deduplicação de notificações em memória
 * 
 * Previne notificações duplicadas do mesmo ticket em curto período
 * sem bloquear notificações legítimas.
 */

interface CacheEntry {
  timestamp: number;
  eventType: string;
}

// Cache em memória: Map<chave, entrada>
// Chave: "userId:accountNumber:ticket:eventType"
const notificationCache = new Map<string, CacheEntry>();

// Tempo de expiração: 30 segundos (30000ms)
// Reduzido para bloquear duplicatas mais efetivamente
const EXPIRATION_TIME = 30 * 1000;

// Intervalo de limpeza: a cada 10 minutos
const CLEANUP_INTERVAL = 10 * 60 * 1000;

/**
 * Verifica se uma notificação já foi enviada recentemente
 * @returns true se é duplicada, false se pode enviar
 */
export function isDuplicate(
  userId: number,
  accountNumber: string,
  ticket: string | number,
  eventType: 'opened' | 'closed'
): boolean {
  const key = `${userId}:${accountNumber}:${ticket}:${eventType}`;
  const now = Date.now();
  
  const cached = notificationCache.get(key);
  
  if (cached) {
    const age = now - cached.timestamp;
    
    // Se ainda está dentro do período de expiração, é duplicata
    if (age < EXPIRATION_TIME) {
      console.log(`[Dedup] ⚠️ Notificação duplicada bloqueada: ${key} (idade: ${Math.round(age/1000)}s)`);
      return true;
    }
  }
  
  // Não é duplicata, registrar no cache
  notificationCache.set(key, {
    timestamp: now,
    eventType
  });
  
  console.log(`[Dedup] ✅ Notificação permitida: ${key} (cache size: ${notificationCache.size})`);
  return false;
}

/**
 * Limpa entradas expiradas do cache
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  let removedCount = 0;
  
  for (const [key, entry] of notificationCache.entries()) {
    const age = now - entry.timestamp;
    
    if (age >= EXPIRATION_TIME) {
      notificationCache.delete(key);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`[Dedup] 🧹 Limpeza: ${removedCount} entradas expiradas removidas (cache size: ${notificationCache.size})`);
  }
}

/**
 * Força limpeza completa do cache (útil para testes)
 */
export function clearCache(): void {
  const size = notificationCache.size;
  notificationCache.clear();
  console.log(`[Dedup] 🗑️ Cache limpo: ${size} entradas removidas`);
}

/**
 * Retorna estatísticas do cache
 */
export function getCacheStats() {
  return {
    size: notificationCache.size,
    expirationTime: EXPIRATION_TIME,
    cleanupInterval: CLEANUP_INTERVAL
  };
}

// Iniciar limpeza automática periódica
setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);

console.log(`[Dedup] 🚀 Sistema de deduplicação iniciado (expiração: ${EXPIRATION_TIME/1000}s, limpeza: ${CLEANUP_INTERVAL/1000}s)`);
