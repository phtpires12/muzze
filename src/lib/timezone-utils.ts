/**
 * Utilitários centrais para manipulação de timezone
 * 
 * IMPORTANTE: Todo cálculo de "dia" para streaks e ofensiva deve usar essas funções
 * para garantir consistência entre frontend e backend.
 * 
 * Timezone padrão: America/Sao_Paulo
 */

/**
 * Retorna a chave do dia no formato 'YYYY-MM-DD' para uma data em uma timezone específica
 */
export function getDayKey(date: Date, timezone: string): string {
  return date.toLocaleDateString('en-CA', { timeZone: timezone });
}

/**
 * Retorna a chave do dia atual na timezone especificada
 */
export function getTodayKey(timezone: string): string {
  return getDayKey(new Date(), timezone);
}

/**
 * Retorna a chave do dia anterior na timezone especificada
 */
export function getYesterdayKey(timezone: string): string {
  const now = new Date();
  const todayKey = getTodayKey(timezone);
  const [year, month, day] = todayKey.split('-').map(Number);
  
  // Criar data no meio do dia para evitar problemas de DST
  const todayNoon = new Date(year, month - 1, day, 12, 0, 0);
  todayNoon.setDate(todayNoon.getDate() - 1);
  
  // Retornar como YYYY-MM-DD
  return `${todayNoon.getFullYear()}-${String(todayNoon.getMonth() + 1).padStart(2, '0')}-${String(todayNoon.getDate()).padStart(2, '0')}`;
}

/**
 * Converte um dayKey (YYYY-MM-DD) em uma timezone para bounds UTC
 * Útil para queries no Supabase que usam timestamps UTC
 * 
 * @returns { startUTC, endUTC } - Início e fim do dia em UTC
 */
export function getDayBoundsUTC(dayKey: string, timezone: string): { startUTC: Date; endUTC: Date } {
  const [year, month, day] = dayKey.split('-').map(Number);
  
  // Criar uma data no início do dia na timezone local
  // Usamos o Intl.DateTimeFormat para calcular o offset correto
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Criar data de referência ao meio-dia para evitar problemas de DST
  const refDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  // Calcular offset da timezone
  const parts = formatter.formatToParts(refDate);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';
  
  // Reconstruir a data na timezone local
  const localYear = parseInt(getPart('year'));
  const localMonth = parseInt(getPart('month'));
  const localDay = parseInt(getPart('day'));
  const localHour = parseInt(getPart('hour'));
  
  // Calcular diferença para encontrar offset
  const utcHours = refDate.getUTCHours();
  let offsetHours = utcHours - localHour;
  
  // Ajustar para mudança de dia
  if (localDay !== day) {
    offsetHours += (localDay > day ? -24 : 24);
  }
  
  // Criar início do dia: 00:00:00 na timezone → UTC
  const startUTC = new Date(Date.UTC(year, month - 1, day, 0 + offsetHours, 0, 0, 0));
  
  // Criar fim do dia: 23:59:59.999 na timezone → UTC
  const endUTC = new Date(Date.UTC(year, month - 1, day, 23 + offsetHours, 59, 59, 999));
  
  return { startUTC, endUTC };
}

/**
 * Calcula a diferença em dias entre dois dayKeys
 */
export function diffDays(dayKey1: string, dayKey2: string): number {
  const [y1, m1, d1] = dayKey1.split('-').map(Number);
  const [y2, m2, d2] = dayKey2.split('-').map(Number);
  
  const date1 = new Date(y1, m1 - 1, d1, 12, 0, 0);
  const date2 = new Date(y2, m2 - 1, d2, 12, 0, 0);
  
  const diffTime = date2.getTime() - date1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se dois dayKeys são consecutivos (day2 = day1 + 1)
 */
export function areConsecutiveDays(dayKey1: string, dayKey2: string): boolean {
  return diffDays(dayKey1, dayKey2) === 1;
}

/**
 * Retorna um array de dayKeys para um intervalo de datas
 */
export function getDayKeysInRange(startDayKey: string, endDayKey: string): string[] {
  const [sy, sm, sd] = startDayKey.split('-').map(Number);
  const [ey, em, ed] = endDayKey.split('-').map(Number);
  
  const startDate = new Date(sy, sm - 1, sd, 12, 0, 0);
  const endDate = new Date(ey, em - 1, ed, 12, 0, 0);
  
  const days: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

/**
 * Converte um dayKey para um Date no início do dia (00:00:00) como local
 * Útil para comparações e exibição
 */
export function dayKeyToLocalDate(dayKey: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Retorna o primeiro dayKey do mês atual na timezone especificada
 */
export function getMonthStartKey(referenceDate: Date, timezone: string): string {
  const refKey = getDayKey(referenceDate, timezone);
  const [year, month] = refKey.split('-').map(Number);
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/**
 * Retorna o último dayKey do mês atual na timezone especificada
 */
export function getMonthEndKey(referenceDate: Date, timezone: string): string {
  const refKey = getDayKey(referenceDate, timezone);
  const [year, month] = refKey.split('-').map(Number);
  
  // Último dia do mês
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

// ============= VERSÕES PARA DENO/EDGE FUNCTIONS =============
// Essas são idênticas mas exportadas separadamente para facilitar copy/paste

/**
 * Versão Deno-compatible do getDayKey
 */
export const getDayKeyDeno = getDayKey;

/**
 * Versão Deno-compatible do getDayBoundsUTC
 */
export const getDayBoundsUTCDeno = getDayBoundsUTC;

/**
 * Versão Deno-compatible do getTodayKey
 */
export const getTodayKeyDeno = getTodayKey;

/**
 * Versão Deno-compatible do getYesterdayKey
 */
export const getYesterdayKeyDeno = getYesterdayKey;
