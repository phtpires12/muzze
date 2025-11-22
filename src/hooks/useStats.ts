import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserStats } from "@/lib/gamification";

interface WeeklyData {
  day: string;
  hours: number;
}

interface WeeklyGoalStats {
  weeklyTotalMinutes: number;
  weeklyGoalMinutes: number;
  weeklyProductivityPercentage: number;
}

export const useStats = () => {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [weeklyGoalStats, setWeeklyGoalStats] = useState<WeeklyGoalStats>({
    weeklyTotalMinutes: 0,
    weeklyGoalMinutes: 0,
    weeklyProductivityPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar dados das últimas 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data: stageTimes } = await supabase
        .from('stage_times')
        .select('duration_seconds, created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Agrupar por dia da semana
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const weekData: WeeklyData[] = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayName = dayNames[date.getDay()];
        
        const dayTotal = stageTimes?.filter(st => {
          const stDate = new Date(st.created_at);
          return stDate.toDateString() === date.toDateString();
        }).reduce((sum, st) => sum + (st.duration_seconds || 0), 0) || 0;
        
        weekData.push({
          day: dayName,
          hours: Math.round((dayTotal / 3600) * 10) / 10
        });
      }
      
      setWeeklyData(weekData);

      // Calcular total de sessões
      const { count } = await supabase
        .from('stage_times')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setTotalSessions(count || 0);

      // Buscar total de horas
      const { data: allStageTimes } = await supabase
        .from('stage_times')
        .select('duration_seconds')
        .eq('user_id', user.id);

      const totalSeconds = allStageTimes?.reduce((sum, st) => sum + (st.duration_seconds || 0), 0) || 0;
      const hours = Math.round((totalSeconds / 3600) * 10) / 10;
      setTotalHours(hours);

      // Média semanal
      const weekTotal = weekData.reduce((sum, d) => sum + d.hours, 0);
      setWeeklyAverage(Math.round(weekTotal * 10) / 10);

      // Calcular estatísticas de meta semanal
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_goal_minutes')
        .eq('user_id', user.id)
        .single();

      const dailyGoalMinutes = profile?.daily_goal_minutes || 60;
      const weeklyGoalMinutes = dailyGoalMinutes * 7;
      
      const weeklyTotalSeconds = stageTimes?.reduce(
        (sum, st) => sum + (st.duration_seconds || 0), 0
      ) || 0;
      const weeklyTotalMinutes = Math.floor(weeklyTotalSeconds / 60);

      const weeklyProductivityPercentage = weeklyGoalMinutes > 0
        ? Math.round(((weeklyTotalMinutes - weeklyGoalMinutes) / weeklyGoalMinutes) * 100)
        : 0;

      setWeeklyGoalStats({
        weeklyTotalMinutes,
        weeklyGoalMinutes,
        weeklyProductivityPercentage,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    weeklyData,
    totalSessions,
    totalHours,
    weeklyAverage,
    weeklyGoalStats,
    loading,
    refetch: fetchStats
  };
};
