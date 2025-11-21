import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addXP, POINTS, getUserStats, saveUserStats, checkAndAwardTrophies, calculateXPFromMinutes } from "@/lib/gamification";

export type SessionStage = "idea" | "ideation" | "script" | "review" | "record" | "edit";

interface SessionState {
  isActive: boolean;
  isPaused: boolean;
  stage: SessionStage;
  elapsedSeconds: number; // Timer for current stage only
  totalElapsedSeconds: number; // Timer for entire session
  startedAt: Date | null;
  sessionId: string | null;
  targetSeconds: number | null; // Target time based on average of last 3 sessions for current stage
  isOvertime: boolean; // Whether user exceeded the target time for current stage
}

export const useSession = () => {
  const { toast } = useToast();
  const [session, setSession] = useState<SessionState>({
    isActive: false,
    isPaused: false,
    stage: "ideation",
    elapsedSeconds: 0,
    totalElapsedSeconds: 0,
    startedAt: null,
    sessionId: null,
    targetSeconds: null,
    isOvertime: false,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentStageStartRef = useRef<Date | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer tick - increments both stage timer and total session timer
  useEffect(() => {
    if (session.isActive && !session.isPaused) {
      intervalRef.current = setInterval(() => {
        setSession(prev => {
          const newElapsedSeconds = prev.elapsedSeconds + 1;
          const newTotalElapsedSeconds = prev.totalElapsedSeconds + 1;
          const isOvertime = prev.targetSeconds !== null && newElapsedSeconds > prev.targetSeconds;
          
          // Trigger alarm when just crossed the target time
          if (isOvertime && !prev.isOvertime && prev.targetSeconds !== null && newElapsedSeconds === prev.targetSeconds + 1) {
            triggerAlarm();
          }
          
          return {
            ...prev,
            elapsedSeconds: newElapsedSeconds,
            totalElapsedSeconds: newTotalElapsedSeconds,
            isOvertime,
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
  }, [session.isActive, session.isPaused, session.targetSeconds, session.isOvertime]);

  const triggerAlarm = useCallback(() => {
    // Visual alarm via toast
    toast({
      title: "⏰ Tempo esgotado!",
      description: "Você atingiu o tempo limite para esta etapa",
      variant: "destructive",
    });

    // Audio alarm
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
    }
    audioRef.current.play().catch(err => console.log('Audio play failed:', err));
  }, [toast]);

  const startSession = useCallback(async (initialStage: SessionStage = "ideation") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date();
      currentStageStartRef.current = now;

      // Calculate average time from last 3 sessions for this stage
      const { data: recentSessions } = await supabase
        .from('stage_times')
        .select('duration_seconds')
        .eq('user_id', user.id)
        .eq('stage', initialStage)
        .order('created_at', { ascending: false })
        .limit(3);

      // Default recommended times (in seconds) for each stage
      const defaultTimes: Record<SessionStage, number> = {
        idea: 10 * 60,        // 10 minutes
        ideation: 15 * 60,    // 15 minutes
        script: 45 * 60,      // 45 minutes
        review: 30 * 60,      // 30 minutes
        record: 50 * 60,      // 50 minutes
        edit: 120 * 60,       // 2 hours
      };

      let targetSeconds: number | null = null;
      if (recentSessions && recentSessions.length > 0) {
        const totalSeconds = recentSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
        targetSeconds = Math.floor(totalSeconds / recentSessions.length);
      } else {
        // Use default time if no history
        targetSeconds = defaultTimes[initialStage];
      }

      setSession({
        isActive: true,
        isPaused: false,
        stage: initialStage,
        elapsedSeconds: 0,
        totalElapsedSeconds: 0,
        startedAt: now,
        sessionId: crypto.randomUUID(),
        targetSeconds,
        isOvertime: false,
      });

      // Track analytics
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'session_started',
        payload: { stage: initialStage, target_seconds: targetSeconds }
      });

      toast({
        title: "Sessão iniciada",
        description: `Etapa: ${getStageLabel(initialStage)} • Tempo recomendado: ${formatTime(targetSeconds || 0)}`,
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

      // Save previous stage time
      if (currentStageStartRef.current) {
        const now = new Date();
        const durationSeconds = Math.floor((now.getTime() - currentStageStartRef.current.getTime()) / 1000);

        await supabase.from('stage_times').insert({
          user_id: user.id,
          stage: session.stage,
          started_at: currentStageStartRef.current.toISOString(),
          ended_at: now.toISOString(),
          duration_seconds: durationSeconds,
          content_item_id: (window as any).__muzzeSessionContentId || null,
        });
      }

      // Default recommended times (in seconds) for each stage
      const defaultTimes: Record<SessionStage, number> = {
        idea: 10 * 60,        // 10 minutes
        ideation: 15 * 60,    // 15 minutes
        script: 45 * 60,      // 45 minutes
        review: 30 * 60,      // 30 minutes
        record: 50 * 60,      // 50 minutes
        edit: 120 * 60,       // 2 hours
      };

      // Calculate average time for new stage
      const { data: recentSessions } = await supabase
        .from('stage_times')
        .select('duration_seconds')
        .eq('user_id', user.id)
        .eq('stage', newStage)
        .order('created_at', { ascending: false })
        .limit(3);

      let targetSeconds: number | null = null;
      if (recentSessions && recentSessions.length > 0) {
        const totalSeconds = recentSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
        targetSeconds = Math.floor(totalSeconds / recentSessions.length);
      } else {
        // Use default time if no history
        targetSeconds = defaultTimes[newStage];
      }

      // Start new stage - reset stage timer but keep total session timer running
      currentStageStartRef.current = new Date();
      setSession(prev => ({ 
        ...prev, 
        stage: newStage,
        elapsedSeconds: 0, // Reset stage timer
        // totalElapsedSeconds keeps running
        targetSeconds,
        isOvertime: false,
      }));

      // XP for stage change is now tracked automatically through session duration

      toast({
        title: "Etapa alterada",
        description: `Agora você está em: ${getStageLabel(newStage)} • Tempo recomendado: ${formatTime(targetSeconds || 0)}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao mudar etapa",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [session.stage, toast]);

  const endSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Save final stage time
      if (currentStageStartRef.current) {
        const now = new Date();
        const durationSeconds = Math.floor((now.getTime() - currentStageStartRef.current.getTime()) / 1000);

        await supabase.from('stage_times').insert({
          user_id: user.id,
          stage: session.stage,
          started_at: currentStageStartRef.current.toISOString(),
          ended_at: now.toISOString(),
          duration_seconds: durationSeconds,
          content_item_id: (window as any).__muzzeSessionContentId || null,
        });
      }

      // Calculate XP from time spent (2 XP per minute)
      const durationMinutes = Math.floor(session.totalElapsedSeconds / 60);
      const xpGained = calculateXPFromMinutes(durationMinutes);

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
          description: `${durationMinutes} minutos de criação!`
        });
      }

      // Track analytics
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'session_completed',
        payload: { 
          duration_seconds: session.totalElapsedSeconds,
          final_stage: session.stage,
          xpGained
        }
      });

      // Update streak and check if achieved
      const sessionMinutes = session.totalElapsedSeconds / 60;
      const streakResult = await updateStreak(user.id, sessionMinutes);

      const summary = {
        duration: session.totalElapsedSeconds,
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
        totalElapsedSeconds: 0,
        startedAt: null,
        sessionId: null,
        targetSeconds: null,
        isOvertime: false,
      });

      currentStageStartRef.current = null;

      return summary;
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

      // Check if day is fulfilled (at least min_streak_minutes AND met daily_goal_minutes)
      const dayFulfilled = creativeMinutesToday >= minStreak && creativeMinutesToday >= dailyGoal;

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
