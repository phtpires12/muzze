import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserStats } from "@/lib/gamification";

interface WeeklyData {
  day: string;
  hours: number;
}

interface Achievement {
  badge: string;
  title: string;
  description: string;
}

export const useStats = () => {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
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

      // Buscar conquistas do gamification
      const stats = getUserStats();
      const userAchievements: Achievement[] = [];

      if (stats.streak >= 7) {
        userAchievements.push({
          badge: "🔥",
          title: `Sequência de ${stats.streak} dias`,
          description: `Trabalhou ${stats.streak} dias seguidos`
        });
      }

      if (hours >= 100) {
        userAchievements.push({
          badge: "⭐",
          title: `${Math.floor(hours)} horas`,
          description: `Alcançou ${Math.floor(hours)} horas totais`
        });
      }

      const { data: scripts } = await supabase
        .from('scripts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((scripts as any) >= 10) {
        userAchievements.push({
          badge: "📝",
          title: "Escritor Dedicado",
          description: `Criou ${scripts} roteiros`
        });
      }

      setAchievements(userAchievements);
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
    achievements,
    loading,
    refetch: fetchStats
  };
};
