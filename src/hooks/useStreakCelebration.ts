import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TROPHIES, checkNewTrophies, UserStats } from "@/lib/gamification";
import { startOfWeek, addDays, format, isSameDay, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface WeekDay {
  date: Date;
  dayName: string;
  status: 'completed' | 'freeze' | 'missed' | 'future' | 'today';
}

export interface CelebrationData {
  showStreakCelebration: boolean;
  showTrophyCelebration: boolean;
  streakCount: number;
  weekDays: WeekDay[];
  unlockedTrophies: Trophy[];
  currentTrophy: Trophy | null;
  xpGained: number;
}

export const useStreakCelebration = () => {
  const [celebrationData, setCelebrationData] = useState<CelebrationData>({
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
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

      const weekDays: WeekDay[] = [];

      for (let i = 0; i < 7; i++) {
        const currentDay = addDays(weekStart, i);
        const dayName = format(currentDay, 'EEE', { locale: ptBR });
        
        // Future days
        if (isAfter(currentDay, today)) {
          weekDays.push({
            date: currentDay,
            dayName,
            status: 'future'
          });
          continue;
        }

        // Today
        if (isSameDay(currentDay, today)) {
          weekDays.push({
            date: currentDay,
            dayName,
            status: 'today'
          });
          continue;
        }

        // Past days - check if completed or freeze
        const dayStart = new Date(currentDay);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDay);
        dayEnd.setHours(23, 59, 59, 999);

        // Check for freeze usage
        const { data: freezeUsage } = await supabase
          .from('streak_freeze_usage')
          .select('*')
          .eq('user_id', userId)
          .gte('used_at', dayStart.toISOString())
          .lte('used_at', dayEnd.toISOString())
          .maybeSingle();

        if (freezeUsage) {
          weekDays.push({
            date: currentDay,
            dayName,
            status: 'freeze'
          });
          continue;
        }

        // Check for session completion
        const { data: sessions } = await supabase
          .from('stage_times')
          .select('duration_seconds')
          .eq('user_id', userId)
          .gte('started_at', dayStart.toISOString())
          .lte('started_at', dayEnd.toISOString());

        const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60 || 0;
        
        if (totalMinutes >= 25) {
          weekDays.push({
            date: currentDay,
            dayName,
            status: 'completed'
          });
        } else {
          weekDays.push({
            date: currentDay,
            dayName,
            status: 'missed'
          });
        }
      }

      return weekDays;
    } catch (error) {
      console.error('Error fetching week progress:', error);
      return [];
    }
  };

  const checkForNewTrophies = async (userId: string): Promise<Trophy[]> => {
    try {
      // Fetch user stats from Supabase
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

      // Get already unlocked trophies from localStorage (or we could store in DB)
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

      // Save newly unlocked trophies
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

  const triggerCelebration = async (streakCount: number, xpGained: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const weekDays = await fetchWeekProgress(user.id);
    const newTrophies = await checkForNewTrophies(user.id);

    setCelebrationData({
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
    // Move to trophy celebration if there are trophies
    if (celebrationData.unlockedTrophies.length > 0) {
      setCelebrationData(prev => ({
        ...prev,
        showStreakCelebration: false,
        showTrophyCelebration: true,
        currentTrophy: prev.unlockedTrophies[0],
      }));
    } else {
      // No trophies, dismiss everything
      setCelebrationData(prev => ({
        ...prev,
        showStreakCelebration: false,
      }));
    }
  };

  const dismissTrophyCelebration = () => {
    const remainingTrophies = celebrationData.unlockedTrophies.slice(1);
    
    if (remainingTrophies.length > 0) {
      // Show next trophy
      setCelebrationData(prev => ({
        ...prev,
        currentTrophy: remainingTrophies[0],
        unlockedTrophies: remainingTrophies,
      }));
    } else {
      // All done
      setCelebrationData(prev => ({
        ...prev,
        showTrophyCelebration: false,
        currentTrophy: null,
        unlockedTrophies: [],
      }));
    }
  };

  return {
    celebrationData,
    triggerCelebration,
    dismissStreakCelebration,
    dismissTrophyCelebration,
  };
};
