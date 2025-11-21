import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DailyGoalProgress {
  goalMinutes: number;
  actualMinutes: number;
  percentageProgress: number;
  isAbove: boolean;
}

export const useDailyGoalProgress = () => {
  const [progress, setProgress] = useState<DailyGoalProgress>({
    goalMinutes: 0,
    actualMinutes: 0,
    percentageProgress: 0,
    isAbove: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyProgress();
  }, []);

  const fetchDailyProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar meta diária do perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("daily_goal_minutes")
        .eq("user_id", user.id)
        .single();

      const goalMinutes = profile?.daily_goal_minutes || 60;

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
  };

  return { progress, loading, refetch: fetchDailyProgress };
};
