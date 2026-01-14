import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TROPHIES, checkNewTrophies, UserStats, getEffectiveLevel, getDailyGoalMinutesForLevel } from "@/lib/gamification";
import { startOfWeek, addDays, format, isSameDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDayKey, getDayBoundsUTC, getTodayKey } from "@/lib/timezone-utils";

export interface WeekDay {
  date: Date;
  dayName: string;
  status: 'completed' | 'freeze' | 'missed' | 'future' | 'today';
}

export interface SessionSummaryData {
  duration: number;
  xpGained: number;
  stage: string;
}

export interface CelebrationData {
  // Session Summary
  showSessionSummary: boolean;
  sessionSummary: SessionSummaryData | null;
  // Streak Celebration
  showStreakCelebration: boolean;
  streakCount: number;
  weekDays: WeekDay[];
  // Trophy Celebration
  showTrophyCelebration: boolean;
  unlockedTrophies: Trophy[];
  currentTrophy: Trophy | null;
  xpGained: number;
}

export const useStreakCelebration = () => {
  const [celebrationData, setCelebrationData] = useState<CelebrationData>({
    showSessionSummary: false,
    sessionSummary: null,
    showStreakCelebration: false,
    showTrophyCelebration: false,
    streakCount: 0,
    weekDays: [],
    unlockedTrophies: [],
    currentTrophy: null,
    xpGained: 0,
  });

  const fetchWeekProgress = async (userId: string): Promise<WeekDay[]> => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekDays: WeekDay[] = [];

      // Buscar perfil para calcular meta dinâmica e timezone
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_points, highest_level, timezone')
        .eq('user_id', userId)
        .single();

      const timezone = profile?.timezone || 'America/Sao_Paulo';
      const effectiveLevel = getEffectiveLevel(profile?.xp_points || 0, profile?.highest_level || 1);
      const goalMinutes = getDailyGoalMinutesForLevel(effectiveLevel);
      const todayKey = getTodayKey(timezone);

      for (let i = 0; i < 7; i++) {
        const currentDay = addDays(weekStart, i);
        const dayName = format(currentDay, 'EEE', { locale: ptBR });
        const dayKey = getDayKey(currentDay, timezone);

        if (isAfter(currentDay, today)) {
          weekDays.push({ date: currentDay, dayName, status: 'future' });
          continue;
        }

        if (dayKey === todayKey) {
          weekDays.push({ date: currentDay, dayName, status: 'today' });
          continue;
        }

        // Usar getDayBoundsUTC para queries corretas
        const { startUTC, endUTC } = getDayBoundsUTC(dayKey, timezone);

        const { data: freezeUsage } = await supabase
          .from('streak_freeze_usage')
          .select('*')
          .eq('user_id', userId)
          .gte('used_at', startUTC.toISOString())
          .lte('used_at', endUTC.toISOString())
          .maybeSingle();

        if (freezeUsage) {
          weekDays.push({ date: currentDay, dayName, status: 'freeze' });
          continue;
        }

        const { data: sessions } = await supabase
          .from('stage_times')
          .select('duration_seconds')
          .eq('user_id', userId)
          .gte('created_at', startUTC.toISOString())
          .lte('created_at', endUTC.toISOString());

        const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60 || 0;

        weekDays.push({
          date: currentDay,
          dayName,
          status: totalMinutes >= goalMinutes ? 'completed' : 'missed'
        });
      }

      return weekDays;
    } catch (error) {
      console.error('Error fetching week progress:', error);
      return [];
    }
  };

  const checkForNewTrophies = async (userId: string): Promise<Trophy[]> => {
    try {
      // 1. Buscar troféus já desbloqueados do banco
      const { data: userTrophies } = await supabase
        .from('user_trophies')
        .select('trophy_id, shown')
        .eq('user_id', userId);

      const unlockedTrophyIds = (userTrophies || []).map(t => t.trophy_id);

      // 2. Buscar stats atuais
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_points')
        .eq('user_id', userId)
        .single();

      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', userId)
        .single();

      const { data: scripts } = await supabase
        .from('scripts')
        .select('id')
        .eq('user_id', userId);

      const { data: stageTimes } = await supabase
        .from('stage_times')
        .select('duration_seconds')
        .eq('user_id', userId);

      const totalHours = stageTimes?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 3600 || 0;

      const stats: UserStats = {
        totalPoints: profile?.xp_points || 0,
        totalXP: profile?.xp_points || 0,
        level: 1,
        streak: streak?.current_streak || 0,
        longestStreak: streak?.longest_streak || 0,
        totalHours,
        scriptsCreated: scripts?.length || 0,
        scriptsCompleted: 0,
        shotListsCreated: 0,
        ideasCreated: 0,
        ideasOrganized: 0,
        trophies: unlockedTrophyIds,
        sessionsOver25Min: 0,
        sessionsWithoutPause: 0,
        sessionsWithoutAbandon: 0,
        usedStages: [],
        hadStreakReset: false,
      };

      // 3. Verificar novos troféus
      const newTrophies = checkNewTrophies(stats);

      // 4. Salvar novos troféus no banco
      if (newTrophies.length > 0) {
        await supabase.from('user_trophies').insert(
          newTrophies.map(t => ({
            user_id: userId,
            trophy_id: t.id,
            shown: false,
          }))
        );
      }

      // 5. Filtrar apenas troféus não mostrados ainda
      const trophiesToShow = newTrophies.filter(t => {
        const existing = userTrophies?.find(ut => ut.trophy_id === t.id);
        return !existing?.shown;
      });

      // 6. Marcar como mostrados no banco
      if (trophiesToShow.length > 0) {
        await supabase
          .from('user_trophies')
          .update({ shown: true })
          .eq('user_id', userId)
          .in('trophy_id', trophiesToShow.map(t => t.id));
      }

      return trophiesToShow;
    } catch (error) {
      console.error('Error checking trophies:', error);
      return [];
    }
  };

  // New: Trigger full celebration flow starting with session summary
  const triggerFullCelebration = async (
    sessionSummary: SessionSummaryData,
    streakCount: number,
    xpGained: number
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const weekDays = await fetchWeekProgress(user.id);
    const newTrophies = await checkForNewTrophies(user.id);

    setCelebrationData({
      showSessionSummary: true,
      sessionSummary,
      showStreakCelebration: false,
      showTrophyCelebration: false,
      streakCount,
      weekDays,
      unlockedTrophies: newTrophies,
      currentTrophy: null,
      xpGained,
    });
  };

  // Dismiss session summary and move to streak celebration
  const dismissSessionSummary = () => {
    const { streakCount, unlockedTrophies } = celebrationData;

    if (streakCount > 0) {
      // Move to streak celebration
      setCelebrationData(prev => ({
        ...prev,
        showSessionSummary: false,
        showStreakCelebration: true,
      }));
    } else if (unlockedTrophies.length > 0) {
      // Skip streak, go to trophy celebration
      setCelebrationData(prev => ({
        ...prev,
        showSessionSummary: false,
        showTrophyCelebration: true,
        currentTrophy: unlockedTrophies[0],
      }));
    } else {
      // No celebrations left, reset everything
      resetCelebrations();
    }
  };

  // Legacy: Trigger streak celebration directly (for backwards compatibility)
  const triggerCelebration = async (streakCount: number, xpGained: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const weekDays = await fetchWeekProgress(user.id);
    const newTrophies = await checkForNewTrophies(user.id);

    setCelebrationData({
      showSessionSummary: false,
      sessionSummary: null,
      showStreakCelebration: true,
      showTrophyCelebration: false,
      streakCount,
      weekDays,
      unlockedTrophies: newTrophies,
      currentTrophy: null,
      xpGained,
    });
  };

  const dismissStreakCelebration = () => {
    if (celebrationData.unlockedTrophies.length > 0) {
      setCelebrationData(prev => ({
        ...prev,
        showStreakCelebration: false,
        showTrophyCelebration: true,
        currentTrophy: prev.unlockedTrophies[0],
      }));
    } else {
      resetCelebrations();
    }
  };

  const dismissTrophyCelebration = () => {
    const remainingTrophies = celebrationData.unlockedTrophies.slice(1);

    if (remainingTrophies.length > 0) {
      setCelebrationData(prev => ({
        ...prev,
        currentTrophy: remainingTrophies[0],
        unlockedTrophies: remainingTrophies,
      }));
    } else {
      resetCelebrations();
    }
  };

  const resetCelebrations = () => {
    setCelebrationData({
      showSessionSummary: false,
      sessionSummary: null,
      showStreakCelebration: false,
      showTrophyCelebration: false,
      streakCount: 0,
      weekDays: [],
      unlockedTrophies: [],
      currentTrophy: null,
      xpGained: 0,
    });
  };

  const triggerTrophyDirectly = (trophy: Trophy, xpGained: number) => {
    setCelebrationData({
      showSessionSummary: false,
      sessionSummary: null,
      showStreakCelebration: false,
      showTrophyCelebration: true,
      streakCount: 0,
      weekDays: [],
      unlockedTrophies: [trophy],
      currentTrophy: trophy,
      xpGained,
    });
  };

  return {
    celebrationData,
    triggerFullCelebration,
    triggerCelebration,
    triggerTrophyDirectly,
    dismissSessionSummary,
    dismissStreakCelebration,
    dismissTrophyCelebration,
    resetCelebrations,
  };
};
