import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionContext, SessionStage } from "@/contexts/SessionContext";
import { calculateXPFromMinutes, calculateLevelByXP, getLevelInfo } from "@/lib/gamification";

export type { SessionStage };

interface UseSessionOptions {
  attachBeforeUnloadListener?: boolean;
}

export const useSession = (options: UseSessionOptions = {}) => {
  const { attachBeforeUnloadListener = false } = options;
  const { toast } = useToast();
  
  // Usar o timer global do contexto
  const { 
    timer, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    resetTimer, 
    changeTimerStage,
    setContentId,
    saveStageTime,
  } = useSessionContext();

  // Handler para beforeunload - CONDICIONAL
  useEffect(() => {
    if (!attachBeforeUnloadListener) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timer.isActive && timer.stageElapsedSeconds > 30) {
        e.preventDefault();
        e.returnValue = 'Você tem uma sessão ativa com dados não salvos.';
        saveStageTime();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [attachBeforeUnloadListener, timer.isActive, timer.stageElapsedSeconds, saveStageTime]);

  // Wrapper para startSession que usa o timer global
  const startSession = useCallback(async (initialStage: SessionStage = "ideation") => {
    await startTimer(initialStage);
    
    toast({
      title: "Sessão iniciada",
      description: `Etapa: ${getStageLabel(initialStage)} • Meta: 25 minutos para streak`,
    });
  }, [startTimer, toast]);

  // Wrapper para pauseSession
  const pauseSession = useCallback(() => {
    pauseTimer();
  }, [pauseTimer]);

  // Wrapper para resumeSession
  const resumeSession = useCallback(() => {
    resumeTimer();
  }, [resumeTimer]);

  // Wrapper para changeStage que usa o timer global
  const changeStage = useCallback(async (newStage: SessionStage) => {
    await changeTimerStage(newStage);
    
    toast({
      title: "Etapa alterada",
      description: `Agora você está em: ${getStageLabel(newStage)}`,
    });
  }, [changeTimerStage, toast]);

  // endSession - finaliza e calcula XP/streak
  const endSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Salvar tempo da etapa atual (última antes de finalizar)
      await saveStageTime();

      // Calcular XP baseado no tempo TOTAL da sessão
      const totalMinutes = Math.floor(timer.elapsedSeconds / 60);
      const xpGained = calculateXPFromMinutes(totalMinutes);

      // Get user and update XP in database
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_points, highest_level')
        .eq('user_id', user.id)
        .single();

      const previousXP = profile?.xp_points || 0;
      const newXP = previousXP + xpGained;
      const currentHighestLevel = profile?.highest_level || 1;

      // Calculate levels before and after XP update
      const previousLevel = calculateLevelByXP(previousXP);
      const newLevel = calculateLevelByXP(newXP);

      // Prepare updates - always update xp_points, and highest_level if new level is higher
      const updates: any = { xp_points: newXP };
      if (newLevel > currentHighestLevel) {
        updates.highest_level = newLevel;
        console.log(`🎯 Subiu de nível! highest_level: ${currentHighestLevel} → ${newLevel}`);
      }

      if (profile) {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', user.id);
      }

      // Dispatch level up celebration if user leveled up
      if (newLevel > previousLevel) {
        const levelInfo = getLevelInfo(newLevel);
        window.dispatchEvent(new CustomEvent('levelUp', { 
          detail: { level: newLevel, levelInfo } 
        }));
      }

      // XP toast removed - SessionSummary component now displays XP visually

      // Track analytics
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'session_completed',
        payload: { 
          duration_seconds: timer.elapsedSeconds,
          final_stage: timer.stage,
          xpGained
        }
      });

      // Update streak (se atingiu 25+ minutos)
      if (timer.elapsedSeconds >= 25 * 60) {
        const streakResult = await updateStreak(user.id, totalMinutes);
        
        const summary = {
          duration: timer.elapsedSeconds,
          stage: timer.stage,
          xpGained,
          streakAchieved: streakResult.streakAchieved || false,
          newStreak: streakResult.newStreak,
          creativeMinutesToday: streakResult.creativeMinutesToday,
          shouldShowCelebration: true,
        };

        // Reset timer global
        resetTimer();

        return summary;
      } else {
        // Sessão muito curta, sem streak
        resetTimer();

        return {
          duration: timer.elapsedSeconds,
          stage: timer.stage,
          xpGained,
          streakAchieved: false,
          shouldShowCelebration: false,
        };
      }
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar sessão",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [timer, toast, saveStageTime, resetTimer]);

  // updateStreak - lógica de streak
  const updateStreak = async (userId: string, sessionMinutes: number) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('min_streak_minutes, daily_goal_minutes, timezone')
        .eq('user_id', userId)
        .single();

      if (!profile) return { streakAchieved: false };

      const timezone = profile.timezone || 'America/Sao_Paulo';

      // Get today's date in user's timezone
      const now = new Date();
      const userDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const today = userDate.toISOString().split('T')[0];

      // Calculate total creative minutes today
      const startOfDay = new Date(userDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(userDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: todaySessions } = await supabase
        .from('stage_times')
        .select('duration_seconds')
        .eq('user_id', userId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      const creativeMinutesToday = (todaySessions || []).reduce(
        (sum, session) => sum + (session.duration_seconds / 60), 
        0
      );

      // Check if day is fulfilled (25 min fixos para manter ofensiva)
      const dayFulfilled = creativeMinutesToday >= 25;

      if (!dayFulfilled) {
        return { streakAchieved: false, creativeMinutesToday };
      }

      // Get current streak data
      const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!streak) {
        // Create new streak record
        await supabase.from('streaks').insert({
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_event_date: today,
        });
        return { streakAchieved: true, newStreak: 1, creativeMinutesToday };
      }

      const lastEventDate = streak.last_event_date;
      const currentStreak = streak.current_streak || 0;
      const longestStreak = streak.longest_streak || 0;

      // Check if already counted today
      if (lastEventDate === today) {
        return { 
          streakAchieved: true, 
          newStreak: currentStreak, 
          creativeMinutesToday,
          alreadyCounted: true 
        };
      }

      // Check if yesterday (consecutive) or gap
      const yesterday = new Date(userDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak: number;
      if (lastEventDate === yesterdayStr) {
        // Consecutive day
        newStreak = currentStreak + 1;
      } else {
        // Gap - streak resets
        newStreak = 1;
      }

      const newLongest = Math.max(longestStreak, newStreak);

      await supabase
        .from('streaks')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_event_date: today,
        })
        .eq('user_id', userId);

      return { 
        streakAchieved: true, 
        newStreak, 
        creativeMinutesToday,
        isNewRecord: newStreak > longestStreak 
      };
    } catch (error) {
      console.error('[useSession] Error updating streak:', error);
      return { streakAchieved: false };
    }
  };

  // saveCurrentStageTime - wrapper para saveStageTime
  const saveCurrentStageTime = useCallback(async () => {
    await saveStageTime();
  }, [saveStageTime]);

  // Retornar formato compatível com o hook anterior
  return {
    session: {
      isActive: timer.isActive,
      isPaused: timer.isPaused,
      stage: timer.stage,
      elapsedSeconds: timer.elapsedSeconds,
      stageElapsedSeconds: timer.stageElapsedSeconds,
      startedAt: timer.startedAt,
      sessionId: timer.sessionId,
      targetSeconds: timer.targetSeconds,
      isStreakMode: timer.isStreakMode,
      dailyGoalMinutes: timer.dailyGoalMinutes,
    },
    startSession,
    pauseSession,
    resumeSession,
    changeStage,
    endSession,
    saveCurrentStageTime,
    setContentId,
    resetTimer,
  };
};

// Helper function
export const getStageLabel = (stage: SessionStage): string => {
  const labels: Record<SessionStage, string> = {
    idea: "Ideação",
    ideation: "Ideação",
    script: "Roteiro",
    review: "Revisão",
    record: "Gravação",
    edit: "Edição",
  };
  return labels[stage] || stage;
};

export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};
