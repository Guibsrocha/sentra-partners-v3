import { getDb } from '../db';
import { economicEvents } from '../../drizzle/schema';
import { getForexFactoryEvents } from '../forex-calendar';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Sincroniza eventos econômicos do Forex Factory para o banco de dados
 * Roda a cada 5 minutos via cron job
 */
export async function syncEconomicEvents() {
  console.log('[Sync Economic Events] Starting sync...');
  
  try {
    const db = await getDb();
    
    // Buscar eventos do Forex Factory
    const events = await getForexFactoryEvents();
    console.log(`[Sync Economic Events] Fetched ${events.length} events from Forex Factory`);
    
    if (events.length === 0) {
      console.log('[Sync Economic Events] No events to sync');
      return;
    }
    
    // Inserir ou atualizar eventos no banco
    let inserted = 0;
    let updated = 0;
    
    for (const event of events) {
      try {
        // Verificar se o evento já existe (mesmo nome e horário)
        // Converter corretamente a data e hora
        const eventTime = parseEventDateTime(event.date, event.time);
        
        if (!eventTime || isNaN(eventTime.getTime())) {
          console.error(`[Sync Economic Events] Invalid date for event:`, event);
          continue;
        }
        const existing = await db
          .select()
          .from(economicEvents)
          .where(
            and(
              eq(economicEvents.eventName, event.title),
              eq(economicEvents.currency, event.country)
            )
          )
          .limit(1);
        
        if (existing.length > 0) {
          // Atualizar evento existente
          await db
            .update(economicEvents)
            .set({
              eventTime: eventTime,
              impact: event.impact.toLowerCase() as "low" | "medium" | "high",
              forecastValue: event.forecast || null,
              previousValue: event.previous || null,
            })
            .where(eq(economicEvents.id, existing[0].id));
          
          updated++;
        } else {
          // Inserir novo evento
          await db.insert(economicEvents).values({
            eventTime: eventTime,
            currency: event.country,
            eventName: event.title,
            impact: event.impact.toLowerCase() as "low" | "medium" | "high",
            forecastValue: event.forecast || null,
            previousValue: event.previous || null,
            actualValue: null,
          });
          
          inserted++;
        }
      } catch (error) {
        console.error(`[Sync Economic Events] Error processing event:`, event, error);
      }
    }
    
    console.log(`[Sync Economic Events] Sync completed: ${inserted} inserted, ${updated} updated`);
    
  } catch (error) {
    console.error('[Sync Economic Events] Sync failed:', error);
    throw error;
  }
}

/**
 * Converte data e hora do evento para Date
 * @param dateStr - Data no formato ISO (YYYY-MM-DD)
 * @param timeStr - Hora no formato "9:00am" ou "3:30pm"
 */
function parseEventDateTime(dateStr: string, timeStr: string): Date {
  // Parse date (YYYY-MM-DD)
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Parse time (h:mm[am|pm])
  let hours = 0;
  let minutes = 0;
  
  if (timeStr) {
    const isPM = timeStr.toLowerCase().includes('pm');
    const isAM = timeStr.toLowerCase().includes('am');
    const timeOnly = timeStr.replace(/[ap]m/gi, '').trim();
    const [h, m] = timeOnly.split(':').map(Number);
    
    hours = h;
    minutes = m || 0;
    
    // Converter para 24h
    if (isPM && hours !== 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
  }
  
  return new Date(year, month - 1, day, hours, minutes, 0);
}

// Exportar para ser usado em outros arquivos
export default syncEconomicEvents;
