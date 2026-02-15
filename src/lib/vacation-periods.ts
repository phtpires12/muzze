/**
 * Períodos culturais de férias por país.
 * Esses não são feriados oficiais, mas períodos em que culturalmente
 * as pessoas tiram férias e reduzem atividades.
 */

export interface VacationPeriod {
  name: string;
  nameEn: string;
  startMonth: number; // 1-indexed
  startDay: number;
  endMonth: number;
  endDay: number;
}

const vacationPeriodsByCountry: Record<string, VacationPeriod[]> = {
  BR: [
    { name: 'Férias de julho', nameEn: 'July vacation', startMonth: 7, startDay: 1, endMonth: 7, endDay: 31 },
    { name: 'Recesso de fim de ano', nameEn: 'Year-end break', startMonth: 12, startDay: 20, endMonth: 1, endDay: 5 },
  ],
  US: [
    { name: 'Summer break', nameEn: 'Summer break', startMonth: 6, startDay: 15, endMonth: 8, endDay: 15 },
    { name: 'Holiday season', nameEn: 'Holiday season', startMonth: 12, startDay: 20, endMonth: 1, endDay: 2 },
  ],
  JP: [
    { name: 'ゴールデンウィーク', nameEn: 'Golden Week', startMonth: 4, startDay: 29, endMonth: 5, endDay: 5 },
    { name: 'お盆', nameEn: 'Obon', startMonth: 8, startDay: 13, endMonth: 8, endDay: 16 },
    { name: '年末年始', nameEn: 'Year-end / New Year', startMonth: 12, startDay: 28, endMonth: 1, endDay: 3 },
  ],
  PT: [
    { name: 'Férias de verão', nameEn: 'Summer vacation', startMonth: 7, startDay: 1, endMonth: 8, endDay: 31 },
  ],
  ES: [
    { name: 'Vacaciones de verano', nameEn: 'Summer vacation', startMonth: 7, startDay: 1, endMonth: 8, endDay: 31 },
    { name: 'Navidad', nameEn: 'Christmas break', startMonth: 12, startDay: 22, endMonth: 1, endDay: 6 },
  ],
  FR: [
    { name: 'Vacances d\'été', nameEn: 'Summer vacation', startMonth: 7, startDay: 1, endMonth: 8, endDay: 31 },
  ],
  DE: [
    { name: 'Sommerferien', nameEn: 'Summer vacation', startMonth: 7, startDay: 1, endMonth: 8, endDay: 31 },
    { name: 'Weihnachtsferien', nameEn: 'Christmas break', startMonth: 12, startDay: 23, endMonth: 1, endDay: 6 },
  ],
  IT: [
    { name: 'Ferragosto', nameEn: 'August vacation', startMonth: 8, startDay: 1, endMonth: 8, endDay: 31 },
  ],
  AR: [
    { name: 'Vacaciones de invierno', nameEn: 'Winter vacation', startMonth: 7, startDay: 10, endMonth: 7, endDay: 25 },
    { name: 'Vacaciones de verano', nameEn: 'Summer vacation', startMonth: 12, startDay: 20, endMonth: 2, endDay: 28 },
  ],
  AU: [
    { name: 'Summer holidays', nameEn: 'Summer holidays', startMonth: 12, startDay: 20, endMonth: 1, endDay: 31 },
  ],
  KR: [
    { name: '추석', nameEn: 'Chuseok period', startMonth: 9, startDay: 10, endMonth: 9, endDay: 20 },
  ],
  GB: [
    { name: 'Summer holidays', nameEn: 'Summer holidays', startMonth: 7, startDay: 20, endMonth: 8, endDay: 31 },
    { name: 'Christmas break', nameEn: 'Christmas break', startMonth: 12, startDay: 22, endMonth: 1, endDay: 2 },
  ],
  MX: [
    { name: 'Vacaciones de verano', nameEn: 'Summer vacation', startMonth: 7, startDay: 1, endMonth: 8, endDay: 15 },
    { name: 'Vacaciones de invierno', nameEn: 'Winter vacation', startMonth: 12, startDay: 20, endMonth: 1, endDay: 6 },
  ],
  CA: [
    { name: 'Summer break', nameEn: 'Summer break', startMonth: 6, startDay: 25, endMonth: 9, endDay: 1 },
    { name: 'Holiday season', nameEn: 'Holiday season', startMonth: 12, startDay: 20, endMonth: 1, endDay: 2 },
  ],
};

interface VacationAlert {
  id: string;
  type: 'approaching' | 'active';
  name: string;
  nameEn: string;
  startDate: Date;
  endDate: Date;
  daysUntilStart: number;
}

function getVacationDates(period: VacationPeriod, year: number): { start: Date; end: Date } {
  const start = new Date(year, period.startMonth - 1, period.startDay);
  let endYear = year;
  if (period.endMonth < period.startMonth) {
    endYear = year + 1;
  }
  const end = new Date(endYear, period.endMonth - 1, period.endDay);
  return { start, end };
}

/**
 * Retorna o próximo período de férias relevante para um país.
 * Verifica se estamos dentro de um período ou se um se aproxima.
 */
export function getUpcomingVacationPeriod(
  countryCode: string,
  daysAhead: number = 14
): VacationAlert | null {
  const periods = vacationPeriodsByCountry[countryCode];
  if (!periods) return null;

  const now = new Date();
  const currentYear = now.getFullYear();

  for (const period of periods) {
    // Check current year and next year (for year-crossing periods)
    for (const year of [currentYear - 1, currentYear, currentYear + 1]) {
      const { start, end } = getVacationDates(period, year);
      const diffMs = start.getTime() - now.getTime();
      const daysUntilStart = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Currently in period
      if (now >= start && now <= end) {
        return {
          id: `vacation_${countryCode}_${period.startMonth}_${year}`,
          type: 'active',
          name: period.name,
          nameEn: period.nameEn,
          startDate: start,
          endDate: end,
          daysUntilStart: 0,
        };
      }

      // Approaching
      if (daysUntilStart > 0 && daysUntilStart <= daysAhead) {
        return {
          id: `vacation_${countryCode}_${period.startMonth}_${year}`,
          type: 'approaching',
          name: period.name,
          nameEn: period.nameEn,
          startDate: start,
          endDate: end,
          daysUntilStart,
        };
      }
    }
  }

  return null;
}
