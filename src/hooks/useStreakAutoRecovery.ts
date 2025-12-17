import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

interface RecoveryResult {
  corrected: boolean;
  previousStreak: number;
  newStreak: number;
  daysRecovered: number;
  qualifyingDays: string[];
}

export const useStreakAutoRecovery = () => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const { profile } = useProfile();

  const recoverMissedStreaks = useCallback(async (): Promise<RecoveryResult | null> => {
    if (hasChecked) return null;
    
    try {
      setIsRecovering(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const timezone = profile?.timezone || 'America/Sao_Paulo';

      // Get current streak data
      const { data: currentStreak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get last 30 days of stage_times
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: stageTimes, error } = await supabase
        .from('stage_times')
        .select('created_at, duration_seconds')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error || !stageTimes || stageTimes.length === 0) {
        setHasChecked(true);
        return null;
      }

      // Group by day in user's timezone and sum duration
      const dailyTotals = new Map<string, number>();
      
      for (const entry of stageTimes) {
        const date = new Date(entry.created_at);
        // Format date in user's timezone
        const dayKey = date.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
        const current = dailyTotals.get(dayKey) || 0;
        dailyTotals.set(dayKey, current + (entry.duration_seconds || 0));
      }

      // Filter days with 25+ minutes (1500 seconds)
      const MIN_SECONDS_FOR_STREAK = 25 * 60;
      const qualifyingDays: string[] = [];
      
      for (const [day, totalSeconds] of dailyTotals.entries()) {
        if (totalSeconds >= MIN_SECONDS_FOR_STREAK) {
          qualifyingDays.push(day);
        }
      }

      if (qualifyingDays.length === 0) {
        setHasChecked(true);
        return null;
      }

      // Sort chronologically
      qualifyingDays.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      // Get today and yesterday in user's timezone
      const now = new Date();
      const today = now.toLocaleDateString('en-CA', { timeZone: timezone });
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-CA', { timeZone: timezone });

      // Calculate correct streak from qualifying days
      let calculatedStreak = 0;
      let lastQualifyingDate: string | null = null;

      // Start from most recent qualifying day and count backwards
      for (let i = qualifyingDays.length - 1; i >= 0; i--) {
        const day = qualifyingDays[i];
        
        if (!lastQualifyingDate) {
          // First qualifying day (most recent)
          // Only count if it's today or yesterday
          if (day === today || day === yesterday) {
            calculatedStreak = 1;
            lastQualifyingDate = day;
          } else {
            // Most recent qualifying day is too old, streak is broken
            break;
          }
        } else {
          // Check if this day is consecutive to the last
          const lastDate = new Date(lastQualifyingDate);
          const currentDate = new Date(day);
          const diffDays = Math.round((lastDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));
          
          if (diffDays === 1) {
            calculatedStreak++;
            lastQualifyingDate = day;
          } else {
            // Gap found, stop counting
            break;
          }
        }
      }

      const previousStreak = currentStreak?.current_streak || 0;
      
      // Only update if we found a better streak
      if (calculatedStreak > previousStreak) {
        const mostRecentQualifyingDay = qualifyingDays[qualifyingDays.length - 1];
        const newLongestStreak = Math.max(
          calculatedStreak, 
          currentStreak?.longest_streak || 0
        );

        await supabase
          .from('streaks')
          .update({
            current_streak: calculatedStreak,
            longest_streak: newLongestStreak,
            last_event_date: mostRecentQualifyingDay,
          })
          .eq('user_id', user.id);

        setHasChecked(true);

        return {
          corrected: true,
          previousStreak,
          newStreak: calculatedStreak,
          daysRecovered: calculatedStreak - previousStreak,
          qualifyingDays,
        };
      }

      setHasChecked(true);
      return {
        corrected: false,
        previousStreak,
        newStreak: previousStreak,
        daysRecovered: 0,
        qualifyingDays,
      };

    } catch (error) {
      console.error('Error recovering streaks:', error);
      setHasChecked(true);
      return null;
    } finally {
      setIsRecovering(false);
    }
  }, [hasChecked, profile?.timezone]);

  return {
    recoverMissedStreaks,
    isRecovering,
    hasChecked,
  };
};
