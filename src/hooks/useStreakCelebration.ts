import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TROPHIES, checkNewTrophies, UserStats } from "@/lib/gamification";
import { startOfWeek, addDays, format, isSameDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

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

      for (let i = 0; i < 7; i++) {
        const currentDay = addDays(weekStart, i);
        const dayName = format(currentDay, 'EEE', { locale: ptBR });

        if (isAfter(currentDay, today)) {
          weekDays.push({ date: currentDay, dayName, status: 'future' });
          continue;
        }

        if (isSameDay(currentDay, today)) {
          weekDays.push({ date: currentDay, dayName, status: 'today' });
          continue;
        }

        const dayStart = new Date(currentDay);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDay);
        dayEnd.setHours(23, 59, 59, 999);

        const { data: freezeUsage } = await supabase
          .from('streak_freeze_usage')
          .select('*')
          .eq('user_id', userId)
          .gte('used_at', dayStart.toISOString())
          .lte('used_at', dayEnd.toISOString())
          .maybeSingle();

        if (freezeUsage) {
          weekDays.push({ date: currentDay, dayName, status: 'freeze' });
          continue;
        }

        const { data: sessions } = await supabase
          .from('stage_times')
          .select('duration_seconds')
          .eq('user_id', userId)
          .gte('started_at', dayStart.toISOString())
          .lte('started_at', dayEnd.toISOString());

        const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60 || 0;

        weekDays.push({
          date: currentDay,
          dayName,
          status: totalMinutes >= 25 ? 'completed' : 'missed'
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_points')
        .eq('user_id', userId)
        .single();

      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak')
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

      const unlockedTrophiesStr = localStorage.getItem('unlocked_trophies') || '[]';
      const unlockedTrophies: string[] = JSON.parse(unlockedTrophiesStr);

      const stats: UserStats = {
        totalPoints: profile?.xp_points || 0,
        totalXP: profile?.xp_points || 0,
        level: 1,
        streak: streak?.current_streak || 0,
        totalHours,
        scriptsCreated: scripts?.length || 0,
        shotListsCreated: 0,
        ideasCreated: 0,
        trophies: unlockedTrophies,
      };

      const newTrophies = checkNewTrophies(stats);

      if (newTrophies.length > 0) {
        const updatedTrophies = [...unlockedTrophies, ...newTrophies.map(t => t.id)];
        localStorage.setItem('unlocked_trophies', JSON.stringify(updatedTrophies));
      }

      return newTrophies;
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
