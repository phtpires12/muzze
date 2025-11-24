import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { POINTS, calculateXPFromMinutes } from "@/lib/gamification";

export type SessionStage = "idea" | "ideation" | "script" | "review" | "record" | "edit";

interface SessionState {
  isActive: boolean;
  isPaused: boolean;
  stage: SessionStage;
  elapsedSeconds: number; // Timer GLOBAL - não reseta ao mudar de etapa (para UI)
  stageElapsedSeconds: number; // Timer da etapa atual - reseta ao mudar (para estatísticas)
  startedAt: Date | null;
  sessionId: string | null;
  targetSeconds: number; // Meta fixa de 25 min (para streak)
  isStreakMode: boolean; // Modo ofensiva (após 25 min)
  dailyGoalMinutes: number; // Meta diária do usuário
}

export const useSession = () => {
  const { toast } = useToast();
  const [session, setSession] = useState<SessionState>({
    isActive: false,
    isPaused: false,
    stage: "ideation",
    elapsedSeconds: 0,
    stageElapsedSeconds: 0,
    startedAt: null,
    sessionId: null,
    targetSeconds: 25 * 60,
    isStreakMode: false,
    dailyGoalMinutes: 60,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentStageStartRef = useRef<Date | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer tick - increments both global and stage timers
  useEffect(() => {
    if (session.isActive && !session.isPaused) {
      intervalRef.current = setInterval(() => {
        setSession(prev => {
          const newElapsedSeconds = prev.elapsedSeconds + 1;
          const newStageElapsedSeconds = prev.stageElapsedSeconds + 1;
          const streakThreshold = 25 * 60;
          
          // Detectar entrada no modo streak
          const wasStreakMode = prev.isStreakMode;
          const isStreakMode = newElapsedSeconds >= streakThreshold;
          
          // Celebrar ao entrar em modo streak
          if (!wasStreakMode && isStreakMode) {
            triggerStreakMode();
          }
          
          return {
            ...prev,
            elapsedSeconds: newElapsedSeconds,
            stageElapsedSeconds: newStageElapsedSeconds,
            isStreakMode,
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session.isActive, session.isPaused]);

  const triggerStreakMode = useCallback(() => {
    toast({
      title: "🔥 Modo Ofensiva Ativado!",
      description: "Continue criando para bater sua meta diária!",
    });
  }, [toast]);

  const startSession = useCallback(async (initialStage: SessionStage = "ideation") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date();
      currentStageStartRef.current = now;

      // Buscar meta diária do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_goal_minutes')
        .eq('user_id', user.id)
        .single();

      setSession({
        isActive: true,
        isPaused: false,
        stage: initialStage,
        elapsedSeconds: 0,
        stageElapsedSeconds: 0,
        startedAt: now,
        sessionId: crypto.randomUUID(),
        targetSeconds: 25 * 60,
        isStreakMode: false,
        dailyGoalMinutes: profile?.daily_goal_minutes || 60,
      });

      // Track analytics
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'session_started',
        payload: { stage: initialStage }
      });

      toast({
        title: "Sessão iniciada",
        description: `Etapa: ${getStageLabel(initialStage)} • Meta: 25 minutos para streak`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao iniciar sessão",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const pauseSession = useCallback(() => {
    setSession(prev => ({ ...prev, isPaused: true }));
    toast({
      title: "Sessão pausada",
      description: "Continue quando estiver pronto",
    });
  }, [toast]);

  const resumeSession = useCallback(() => {
    setSession(prev => ({ ...prev, isPaused: false }));
    toast({
      title: "Sessão retomada",
      description: "Continue criando!",
    });
  }, [toast]);

  const changeStage = useCallback(async (newStage: SessionStage) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Salvar tempo da etapa ANTERIOR no banco
      if (currentStageStartRef.current) {
        const now = new Date();
        const durationSeconds = session.stageElapsedSeconds;

        await supabase.from('stage_times').insert({
          user_id: user.id,
          stage: session.stage,
          started_at: currentStageStartRef.current.toISOString(),
          ended_at: now.toISOString(),
          duration_seconds: durationSeconds,
          content_item_id: (window as any).__muzzeSessionContentId || null,
        });
      }

      // Mudar etapa - reseta APENAS o timer da etapa
      currentStageStartRef.current = new Date();
      setSession(prev => ({ 
        ...prev, 
        stage: newStage,
        stageElapsedSeconds: 0,
        // elapsedSeconds continua! (timer global não reseta)
        // isStreakMode continua! (modo streak persiste)
      }));

      toast({
        title: "Etapa alterada",
        description: `Agora você está em: ${getStageLabel(newStage)}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao mudar etapa",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [session.stage, session.stageElapsedSeconds, toast]);

  const endSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Salvar tempo da etapa atual (última antes de finalizar)
      if (currentStageStartRef.current) {
        const now = new Date();
        const durationSeconds = session.stageElapsedSeconds;

        await supabase.from('stage_times').insert({
          user_id: user.id,
          stage: session.stage,
          started_at: currentStageStartRef.current.toISOString(),
          ended_at: now.toISOString(),
          duration_seconds: durationSeconds,
          content_item_id: (window as any).__muzzeSessionContentId || null,
        });
      }

      // Calcular XP baseado no tempo TOTAL da sessão
      const totalMinutes = Math.floor(session.elapsedSeconds / 60);
      const xpGained = calculateXPFromMinutes(totalMinutes);

      // Get user and update XP in database
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_points')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ xp_points: (profile.xp_points || 0) + xpGained })
          .eq('user_id', user.id);
      }

      // Show XP gained toast
      if (xpGained > 0) {
        toast({
          title: `+${xpGained} XP`,
          description: `${totalMinutes} minutos de criação!`
        });
      }

      // Track analytics
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'session_completed',
        payload: { 
          duration_seconds: session.elapsedSeconds,
          final_stage: session.stage,
          xpGained
        }
      });

      // Update streak (se atingiu 25+ minutos)
      if (session.elapsedSeconds >= 25 * 60) {
        const streakResult = await updateStreak(user.id, totalMinutes);
        
        const summary = {
          duration: session.elapsedSeconds,
          stage: session.stage,
          xpGained,
          streakAchieved: streakResult.streakAchieved || false,
          newStreak: streakResult.newStreak,
          creativeMinutesToday: streakResult.creativeMinutesToday,
        };

        // Reset session
        setSession({
          isActive: false,
          isPaused: false,
          stage: "ideation",
          elapsedSeconds: 0,
          stageElapsedSeconds: 0,
          startedAt: null,
          sessionId: null,
          targetSeconds: 25 * 60,
          isStreakMode: false,
          dailyGoalMinutes: 60,
        });

        currentStageStartRef.current = null;

        return summary;
      } else {
        // Sessão muito curta, sem streak
        setSession({
          isActive: false,
          isPaused: false,
          stage: "ideation",
          elapsedSeconds: 0,
          stageElapsedSeconds: 0,
          startedAt: null,
          sessionId: null,
          targetSeconds: 25 * 60,
          isStreakMode: false,
          dailyGoalMinutes: 60,
        });

        currentStageStartRef.current = null;

        return {
          duration: session.elapsedSeconds,
          stage: session.stage,
          xpGained,
          streakAchieved: false,
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
  }, [session, toast]);

  const updateStreak = async (userId: string, sessionMinutes: number) => {
    try {
      // Get profile with timezone and goals
      const { data: profile } = await supabase
        .from('profiles')
        .select('min_streak_minutes, daily_goal_minutes, timezone')
        .eq('user_id', userId)
        .single();

      if (!profile) return { streakAchieved: false };

      const minStreak = profile.min_streak_minutes || 20;
      const dailyGoal = profile.daily_goal_minutes || 60;
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

      if (!streak) return { streakAchieved: false };

      const lastEvent = streak.last_event_date;
      let newCurrentStreak = streak.current_streak || 0;
      let streakAchieved = false;

      // Only update if this is the first completion today
      if (lastEvent !== today) {
        const yesterday = new Date(userDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastEvent === yesterdayStr) {
          // Consecutive day
          newCurrentStreak += 1;
          streakAchieved = true;
        } else if (!lastEvent || lastEvent < yesterdayStr) {
          // Streak broken, start new
          newCurrentStreak = 1;
          streakAchieved = true;
        }

        const newLongest = Math.max(streak.longest_streak || 0, newCurrentStreak);

        await supabase
          .from('streaks')
          .update({
            current_streak: newCurrentStreak,
            longest_streak: newLongest,
            last_event_date: today,
          })
          .eq('user_id', userId);

        // Track streak tick event
        await supabase.from('analytics_events').insert({
          user_id: userId,
          event: 'streak_tick',
          payload: {
            current_streak: newCurrentStreak,
            longest_streak: newLongest,
            creative_minutes_today: creativeMinutesToday,
            daily_goal: dailyGoal,
          }
        });

        // Award streak milestone XP to database
        if (newCurrentStreak % 7 === 0) {
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('xp_points')
            .eq('user_id', userId)
            .single();
          
          if (currentProfile) {
            await supabase
              .from('profiles')
              .update({ xp_points: (currentProfile.xp_points || 0) + POINTS.STREAK_MILESTONE })
              .eq('user_id', userId);
          }
        }

        return { 
          streakAchieved, 
          newStreak: newCurrentStreak,
          creativeMinutesToday 
        };
      }

      return { streakAchieved: false, creativeMinutesToday };
    } catch (error) {
      console.error('Error updating streak:', error);
      return { streakAchieved: false };
    }
  };

  return {
    session,
    startSession,
    pauseSession,
    resumeSession,
    changeStage,
    endSession,
  };
};

const getStageLabel = (stage: SessionStage): string => {
  const labels: Record<SessionStage, string> = {
    idea: "Ideia",
    ideation: "Ideação",
    script: "Roteiro",
    record: "Gravação",
    edit: "Edição",
    review: "Revisão",
  };
  return labels[stage];
};

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};
