import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { awardPoints, POINTS, getUserStats, saveUserStats } from "@/lib/gamification";

export type SessionStage = "ideation" | "script" | "record" | "edit" | "review";

interface SessionState {
  isActive: boolean;
  isPaused: boolean;
  stage: SessionStage;
  elapsedSeconds: number;
  startedAt: Date | null;
  sessionId: string | null;
}

export const useSession = () => {
  const { toast } = useToast();
  const [session, setSession] = useState<SessionState>({
    isActive: false,
    isPaused: false,
    stage: "ideation",
    elapsedSeconds: 0,
    startedAt: null,
    sessionId: null,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentStageStartRef = useRef<Date | null>(null);

  // Timer tick
  useEffect(() => {
    if (session.isActive && !session.isPaused) {
      intervalRef.current = setInterval(() => {
        setSession(prev => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
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

  const startSession = useCallback(async (initialStage: SessionStage = "ideation") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date();
      currentStageStartRef.current = now;

      setSession({
        isActive: true,
        isPaused: false,
        stage: initialStage,
        elapsedSeconds: 0,
        startedAt: now,
        sessionId: crypto.randomUUID(),
      });

      // Track analytics
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'session_started',
        payload: { stage: initialStage }
      });

      toast({
        title: "Sessão iniciada",
        description: `Etapa: ${getStageLabel(initialStage)}`,
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
        });
      }

      // Start new stage
      currentStageStartRef.current = new Date();
      setSession(prev => ({ ...prev, stage: newStage }));

      // Award points for stage change
      awardPoints(POINTS.CREATE_IDEA, `Mudou para etapa: ${newStage}`);

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
        });
      }

      // Award XP based on session duration
      const stats = getUserStats();
      const sessionMinutes = session.elapsedSeconds / 60;
      
      // Add to total hours
      stats.totalHours += sessionMinutes / 60;
      
      // Award points for completing session
      const updatedStats = awardPoints(POINTS.COMPLETE_SESSION, "Sessão concluída");
      
      // Calculate XP based on daily goal
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_goal_minutes')
        .eq('user_id', user.id)
        .single();

      const dailyGoal = profile?.daily_goal_minutes || 60;
      const xpGained = Math.min(100, (sessionMinutes / dailyGoal) * 100);
      updatedStats.totalPoints += Math.floor(xpGained);
      
      saveUserStats(updatedStats);

      // Track analytics
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'session_completed',
        payload: { 
          duration_seconds: session.elapsedSeconds,
          final_stage: session.stage,
          xp_gained: Math.floor(xpGained)
        }
      });

      // Update streak and check if achieved
      const streakResult = await updateStreak(user.id, sessionMinutes);

      const summary = {
        duration: session.elapsedSeconds,
        stage: session.stage,
        xpGained: Math.floor(xpGained),
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
        startedAt: null,
        sessionId: null,
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

        // Award streak milestone points
        if (newCurrentStreak % 7 === 0) {
          awardPoints(POINTS.STREAK_MILESTONE, `${newCurrentStreak} dias de sequência!`);
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
    ideation: "Ideação",
    script: "Roteiro",
    record: "Gravação",
    edit: "Edição",
    review: "Revisão",
  };
  return labels[stage];
};
