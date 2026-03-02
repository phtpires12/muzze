import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DailyGoalProgress {
  goalMinutes: number;
  actualMinutes: number;
  percentageProgress: number;
  isAbove: boolean;
}

interface UseDailyGoalProgressParams {
  goalMinutes: number;
}

export const useDailyGoalProgress = ({ goalMinutes }: UseDailyGoalProgressParams) => {
  const [progress, setProgress] = useState<DailyGoalProgress>({
    goalMinutes: 0,
    actualMinutes: 0,
    percentageProgress: 0,
    isAbove: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchDailyProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calcular minutos de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: stageTimes } = await supabase
        .from("stage_times")
        .select("duration_seconds")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString());

      const totalSeconds = stageTimes?.reduce(
        (sum, stage) => sum + (stage.duration_seconds || 0),
        0
      ) || 0;

      const actualMinutes = Math.floor(totalSeconds / 60);

      // Calcular porcentagem
      let percentageProgress = 0;
      let isAbove = false;

      if (goalMinutes > 0) {
        percentageProgress = Math.round(((actualMinutes - goalMinutes) / goalMinutes) * 100);
        isAbove = actualMinutes >= goalMinutes;
      }

      setProgress({
        goalMinutes,
        actualMinutes,
        percentageProgress,
        isAbove,
      });
    } catch (error) {
      console.error("Error fetching daily goal progress:", error);
    } finally {
      setLoading(false);
    }
  }, [goalMinutes]);

  useEffect(() => {
    if (goalMinutes > 0) {
      fetchDailyProgress();
    }
  }, [goalMinutes, fetchDailyProgress]);

  return { progress, loading, refetch: fetchDailyProgress };
};
