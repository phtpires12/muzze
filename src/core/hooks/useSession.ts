import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/core/hooks/use-toast';
import { useSessionContext } from '@/core/contexts/SessionContext';
import { SessionStage } from '@/core/hooks/useInProgressProjects';
import { calculateXPWithStreakBonus, calculateLevelByXP, getLevelInfo, getEffectiveLevel, getDailyGoalMinutesForLevel } from '@/core/services/gamification';
import { getTodayKey, getYesterdayKey, getDayBoundsUTC } from '@/core/utils/timezone-utils';

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
  const startSession = useCallback(async (initialStage: SessionStage = "idea") => {
    // Normalizar: "ideation" é sinônimo de "idea"
    const normalizedStage: SessionStage = initialStage === "ideation" ? "idea" : initialStage;
    
    await startTimer(normalizedStage);
    
    // timer.targetSeconds já contém a meta correta baseada no nível
    const goalMinutes = Math.floor(timer.targetSeconds / 60);
    toast({
      title: "Sessão iniciada",
      description: `Etapa: ${getStageLabel(normalizedStage)} • Meta: ${goalMinutes} minutos para ofensiva`,
    });
  }, [startTimer, toast, timer.targetSeconds]);

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

  // endSession - finaliza e calcula XP/streak com bônus progressivo
  const endSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Salvar tempo da etapa atual (última antes de finalizar)
      await saveStageTime();

      // Buscar streak atual ANTES de calcular XP (para aplicar bônus)
      const { data: currentStreak } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      const streakDays = currentStreak?.current_streak || 0;

      // Calcular XP com bônus de streak
      const totalMinutes = Math.floor(timer.elapsedSeconds / 60);
      const { baseXP, bonusXP, totalXP, bonusPercent } = calculateXPWithStreakBonus(totalMinutes, streakDays);

      // Get user and update XP in database
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_points, highest_level')
        .eq('user_id', user.id)
        .single();

      const previousXP = profile?.xp_points || 0;
      const newXP = previousXP + totalXP;
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
          baseXP,
          bonusXP,
          totalXP,
          streakBonusPercent: bonusPercent
        }
      });

      // SEMPRE chamar updateStreak - a função verifica internamente se o dia foi cumprido
      // baseado nos stage_times REAIS do banco, não no timer.elapsedSeconds (que pode ter sido resetado)
      const streakResult = await updateStreak(user.id, totalMinutes);
      
      const summary = {
        duration: timer.elapsedSeconds,
        stage: timer.stage,
        xpGained: totalXP,
        baseXP,
        bonusXP,
        streakBonusPercent: bonusPercent,
        streakAchieved: streakResult.streakAchieved || false,
        newStreak: streakResult.newStreak,
        creativeMinutesToday: streakResult.creativeMinutesToday,
        shouldShowCelebration: streakResult.streakAchieved || false,
        alreadyCounted: streakResult.alreadyCounted || false,
      };

      // Reset timer global
      resetTimer();

      return summary;
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar sessão",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [timer, toast, saveStageTime, resetTimer]);

  // updateStreak - lógica de streak com timezone corrigido
  const updateStreak = async (userId: string, sessionMinutes: number) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('min_streak_minutes, daily_goal_minutes, timezone, xp_points, highest_level')
        .eq('user_id', userId)
        .single();

      if (!profile) return { streakAchieved: false };

      const timezone = profile.timezone || 'America/Sao_Paulo';

      // Calcular meta de ofensiva baseada no nível do usuário
      const effectiveLevel = getEffectiveLevel(profile?.xp_points || 0, profile?.highest_level || 1);
      const streakGoalMinutes = getDailyGoalMinutesForLevel(effectiveLevel);

      // Usar utilitários centrais de timezone
      const todayKey = getTodayKey(timezone);
      const yesterdayKey = getYesterdayKey(timezone);
      const { startUTC, endUTC } = getDayBoundsUTC(todayKey, timezone);

      console.log(`[updateStreak] timezone: ${timezone}, todayKey: ${todayKey}, level: ${effectiveLevel}, goal: ${streakGoalMinutes}min`);
      console.log(`[updateStreak] Query range: ${startUTC.toISOString()} to ${endUTC.toISOString()}`);

      // CORREÇÃO: Usar started_at em vez de created_at para determinar "qual dia" a sessão pertence
      const { data: todaySessions } = await supabase
        .from('stage_times')
        .select('duration_seconds, started_at')
        .eq('user_id', userId)
        .gte('started_at', startUTC.toISOString())
        .lte('started_at', endUTC.toISOString());

      const creativeMinutesToday = (todaySessions || []).reduce(
        (sum, session) => sum + (session.duration_seconds / 60), 
        0
      );

      console.log(`[updateStreak] creativeMinutesToday: ${creativeMinutesToday.toFixed(2)}min`);

      // Check if day is fulfilled usando meta dinâmica por nível
      const dayFulfilled = creativeMinutesToday >= streakGoalMinutes;

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
          last_event_date: todayKey,
        });
        return { streakAchieved: true, newStreak: 1, creativeMinutesToday };
      }

      const lastEventDate = streak.last_event_date;
      const currentStreak = streak.current_streak || 0;
      const longestStreak = streak.longest_streak || 0;

      // Check if already counted today
      if (lastEventDate === todayKey) {
        return { 
          streakAchieved: true, 
          newStreak: currentStreak, 
          creativeMinutesToday,
          alreadyCounted: true 
        };
      }

      // Check if yesterday (consecutive) or gap
      let newStreak: number;
      if (lastEventDate === yesterdayKey) {
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
          last_event_date: todayKey,
        })
        .eq('user_id', userId);

      console.log(`[updateStreak] Streak updated: ${currentStreak} -> ${newStreak}, lastEventDate: ${lastEventDate} -> ${todayKey}`);

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
      isFrozen: timer.isFrozen, // NOVO: estado congelado
      frozenSince: timer.frozenSince, // NOVO: quando congelou
      stage: timer.stage,
      elapsedSeconds: timer.elapsedSeconds,
      stageElapsedSeconds: timer.stageElapsedSeconds,
      startedAt: timer.startedAt,
      sessionId: timer.sessionId,
      targetSeconds: timer.targetSeconds,
      isStreakMode: timer.isStreakMode,
      dailyGoalMinutes: timer.dailyGoalMinutes,
      savedSecondsThisSession: timer.savedSecondsThisSession,
      dailyBaselineSeconds: timer.dailyBaselineSeconds, // Snapshot do início da sessão
      contentId: timer.contentId, // ID do conteúdo associado à sessão
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
