import { useState, useEffect } from 'react';
import { useProfile } from '@/core/hooks/useProfile';
import { getCountryFromTimezone } from '@/core/constants/timezone-country-map';
import { getUpcomingVacationPeriod } from '@/core/constants/vacation-periods';

interface Holiday {
  date: string;
  localName: string;
  name: string;
  types: string[];
}

export interface HolidayAlert {
  id: string;
  type: 'holiday' | 'long_weekend' | 'vacation_approaching' | 'vacation_active';
  title: string;
  description: string;
  dates: string;
  daysAhead: number;
}

const DISMISS_PREFIX = 'muzze_holiday_dismissed_';
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isDismissed(alertId: string): boolean {
  try {
    const raw = localStorage.getItem(`${DISMISS_PREFIX}${alertId}`);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (Date.now() - dismissedAt > DISMISS_TTL_MS) {
      localStorage.removeItem(`${DISMISS_PREFIX}${alertId}`);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function dismissAlert(alertId: string) {
  localStorage.setItem(`${DISMISS_PREFIX}${alertId}`, Date.now().toString());
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatDateLocal(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
}

function detectLongWeekend(holiday: Holiday): { isLong: boolean; totalDays: number } {
  const [y, m, d] = holiday.date.split('-').map(Number);
  const holidayDate = new Date(y, m - 1, d);
  const dayOfWeek = holidayDate.getDay();
  
  // Check if holiday creates a long weekend (3+ consecutive days off)
  // Monday holiday = Sat+Sun+Mon = 3 days
  // Friday holiday = Fri+Sat+Sun = 3 days
  // Thursday holiday = Thu+Fri(bridge)+Sat+Sun = 4 days
  // Tuesday holiday = Sat+Sun+Mon(bridge)+Tue = 4 days
  
  if (dayOfWeek === 1) return { isLong: true, totalDays: 3 }; // Monday
  if (dayOfWeek === 5) return { isLong: true, totalDays: 3 }; // Friday
  if (dayOfWeek === 4) return { isLong: true, totalDays: 4 }; // Thursday
  if (dayOfWeek === 2) return { isLong: true, totalDays: 4 }; // Tuesday
  
  return { isLong: false, totalDays: 1 };
}

function buildHolidayAlert(holiday: Holiday, countryCode: string): HolidayAlert | null {
  const now = new Date();
  const [y, m, d] = holiday.date.split('-').map(Number);
  const holidayDate = new Date(y, m - 1, d);
  const diffMs = holidayDate.getTime() - now.getTime();
  const daysAhead = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysAhead < 0) return null;

  const { isLong, totalDays } = detectLongWeekend(holiday);
  const alertId = `holiday_${countryCode}_${holiday.date}`;

  if (isLong && daysAhead <= 7) {
    return {
      id: alertId,
      type: 'long_weekend',
      title: `Feriadão de ${holiday.localName || holiday.name}!`,
      description: `${totalDays} dias de folga chegando. Que tal adiantar seus conteúdos?`,
      dates: formatDateLocal(holiday.date),
      daysAhead,
    };
  }

  if (daysAhead <= 5) {
    return {
      id: alertId,
      type: 'holiday',
      title: `Feriado à vista!`,
      description: `${holiday.localName || holiday.name} (${formatDateLocal(holiday.date)}) está chegando. Programe seus conteúdos com antecedência!`,
      dates: formatDateLocal(holiday.date),
      daysAhead,
    };
  }

  return null;
}

export function useHolidayAlert() {
  const { profile } = useProfile();
  const [alert, setAlert] = useState<HolidayAlert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.timezone) {
      setLoading(false);
      return;
    }

    const countryCode = getCountryFromTimezone(profile.timezone);
    if (!countryCode) {
      setLoading(false);
      return;
    }

    const checkAlerts = async () => {
      try {
        // 1. Check vacation periods first (higher priority)
        const vacationAlert = getUpcomingVacationPeriod(countryCode, 14);
        if (vacationAlert) {
          const vacAlertObj: HolidayAlert = {
            id: vacationAlert.id,
            type: vacationAlert.type === 'active' ? 'vacation_active' : 'vacation_approaching',
            title: vacationAlert.type === 'active'
              ? 'Estamos em período de férias!'
              : 'Período de férias se aproxima!',
            description: vacationAlert.type === 'active'
              ? `${vacationAlert.name} está acontecendo. Mantenha seu ritmo ou adiante conteúdos!`
              : `${vacationAlert.name} começa em ${vacationAlert.daysUntilStart} dias. Que tal se programar?`,
            dates: `${vacationAlert.startDate.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })} - ${vacationAlert.endDate.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}`,
            daysAhead: vacationAlert.daysUntilStart,
          };

          if (!isDismissed(vacAlertObj.id)) {
            setAlert(vacAlertObj);
            setLoading(false);
            return;
          }
        }

        // 2. Check holidays via edge function
        const year = new Date().getFullYear();

        // Use fetch directly since invoke doesn't support query params well for GET
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-holidays?country_code=${countryCode}&year=${year}`;
        const response = await fetch(url, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });

        if (!response.ok) {
          setLoading(false);
          return;
        }

        const holidays: Holiday[] = await response.json();
        if (!Array.isArray(holidays)) {
          setLoading(false);
          return;
        }

        // Find the most relevant upcoming alert
        const alerts = holidays
          .map(h => buildHolidayAlert(h, countryCode))
          .filter((a): a is HolidayAlert => a !== null && !isDismissed(a.id))
          .sort((a, b) => a.daysAhead - b.daysAhead);

        setAlert(alerts[0] || null);
      } catch (error) {
        console.error('Error checking holiday alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAlerts();
  }, [profile?.timezone]);

  const dismiss = () => {
    if (alert) {
      dismissAlert(alert.id);
      setAlert(null);
    }
  };

  const remindLater = () => {
    setAlert(null);
  };

  return { alert, loading, dismiss, remindLater };
}
