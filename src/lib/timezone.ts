/**
 * Utilitários para lidar com timezone de forma consistente em todo o app.
 * Usa Intl.DateTimeFormat para garantir precisão independente do dispositivo.
 */

/**
 * Retorna a chave do dia (YYYY-MM-DD) de uma Date no timezone especificado.
 * Usa 'en-CA' que formata nativamente como YYYY-MM-DD.
 */
export function getDayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Retorna a chave do dia atual (YYYY-MM-DD) no timezone especificado.
 */
export function getTodayKey(timeZone: string): string {
  return getDayKey(new Date(), timeZone);
}

/**
 * Compara duas chaves de dia lexicograficamente.
 * Retorna negativo se a < b, 0 se iguais, positivo se a > b.
 */
export function compareDayKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

/**
 * Verifica se a chave do dia é "hoje" no timezone especificado.
 */
export function isDayKeyToday(dayKey: string, timeZone: string): boolean {
  return dayKey === getTodayKey(timeZone);
}

/**
 * Verifica se a chave do dia é no futuro no timezone especificado.
 */
export function isDayKeyFuture(dayKey: string, timeZone: string): boolean {
  return dayKey > getTodayKey(timeZone);
}

/**
 * Retorna o ano, mês e dia de uma Date no timezone especificado.
 */
export function getDateParts(date: Date, timeZone: string): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  
  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
  
  return { year, month, day };
}
