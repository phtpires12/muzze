import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MyProgressData {
  totalScripts: number;
  completedShots: number;
  currentStreak: number;
  monthlyGoalHours: number;
  monthlyProgressHours: number;
  monthlyPercentage: number;
}

export const useMyProgress = () => {
  const [data, setData] = useState<MyProgressData>({
    totalScripts: 0,
    completedShots: 0,
    currentStreak: 0,
    monthlyGoalHours: 0,
    monthlyProgressHours: 0,
    monthlyPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Total de roteiros criados
      const { count: totalScripts } = await supabase
        .from('scripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 2. Shots completos (iterar shot_list)
      const { data: scripts } = await supabase
        .from('scripts')
        .select('shot_list')
        .eq('user_id', user.id);

      const completedShots = scripts?.reduce((total, script) => {
        const shotList = script.shot_list || [];
        return total + shotList.filter((shot: any) => shot.isCompleted).length;
      }, 0) || 0;

      // 3. Sequência atual
      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      // 4. Meta mensal calculada
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_goal_minutes')
        .eq('user_id', user.id)
        .single();

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const dailyGoalMinutes = profile?.daily_goal_minutes || 60;
      const monthlyGoalHours = (dailyGoalMinutes * daysInMonth) / 60;

      // 5. Progresso mensal (tempo trabalhado no mês atual)
      const startOfMonth = new Date(year, month, 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: stageTimes } = await supabase
        .from('stage_times')
        .select('duration_seconds')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      const totalSeconds = stageTimes?.reduce((sum, st) => sum + (st.duration_seconds || 0), 0) || 0;
      const monthlyProgressHours = totalSeconds / 3600;
      const monthlyPercentage = monthlyGoalHours > 0 
        ? Math.round((monthlyProgressHours / monthlyGoalHours) * 100) 
        : 0;

      setData({
        totalScripts: totalScripts || 0,
        completedShots,
        currentStreak: streak?.current_streak || 0,
        monthlyGoalHours: Math.round(monthlyGoalHours * 10) / 10,
        monthlyProgressHours: Math.round(monthlyProgressHours * 10) / 10,
        monthlyPercentage: Math.min(monthlyPercentage, 100),
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return { ...data, loading, refetch: fetchProgress };
};
