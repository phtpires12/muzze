import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveLevel, getDailyGoalMinutesForLevel } from "@/lib/gamification";

interface StageBreakdown {
  ideation: number;
  script: number;
  review: number;
  record: number;
  edit: number;
}

interface WeeklyData {
  day: string;
  hours: number;
  date: Date;
  stageBreakdown: StageBreakdown;
}

interface DailyGoalProgress {
  goalMinutes: number;
  actualMinutes: number;
  percentageProgress: number;
  isAbove: boolean;
}

interface WeeklyGoalStats {
  weeklyTotalMinutes: number;
  weeklyGoalMinutes: number;
  weeklyProductivityPercentage: number;
}

interface PreviousWeekStats {
  weeklyTotalMinutes: number;
  weeklyProductivityPercentage: number;
}

interface GamificationStats {
  xp: number;
  level: number;
  streak: number;
  totalHours: number;
  scriptsCreated: number;
  ideasCreated: number;
  trophies: string[];
}

interface StatsPageData {
  weeklyData: WeeklyData[];
  totalSessions: number;
  totalHours: number;
  weeklyAverage: number;
  weeklyGoalStats: WeeklyGoalStats;
  previousWeekStats: PreviousWeekStats;
  dailyGoal: DailyGoalProgress;
  profile: {
    xp_points: number;
    daily_goal_minutes: number;
  } | null;
  gamificationStats: GamificationStats;
  loading: boolean;
}

const XP_LEVELS = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 250 },
  { level: 4, xpRequired: 500 },
  { level: 5, xpRequired: 1000 },
  { level: 6, xpRequired: 2000 },
  { level: 7, xpRequired: 3500 },
  { level: 8, xpRequired: 5500 },
  { level: 9, xpRequired: 8000 },
  { level: 10, xpRequired: 12000 },
];

const calculateLevelFromXP = (xp: number): number => {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      return XP_LEVELS[i].level;
    }
  }
  return 1;
};

export const useStatsPage = (): StatsPageData => {
  const [data, setData] = useState<StatsPageData>({
    weeklyData: [],
    totalSessions: 0,
    totalHours: 0,
    weeklyAverage: 0,
    weeklyGoalStats: {
      weeklyTotalMinutes: 0,
      weeklyGoalMinutes: 0,
      weeklyProductivityPercentage: 0,
    },
    previousWeekStats: {
      weeklyTotalMinutes: 0,
      weeklyProductivityPercentage: 0,
    },
    dailyGoal: {
      goalMinutes: 60,
      actualMinutes: 0,
      percentageProgress: 0,
      isAbove: false,
    },
    profile: null,
    gamificationStats: {
      xp: 0,
      level: 1,
      streak: 0,
      totalHours: 0,
      scriptsCreated: 0,
      ideasCreated: 0,
      trophies: [],
    },
    loading: true,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      // Calcular datas necessárias
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
      fourteenDaysAgo.setHours(0, 0, 0, 0);

      // EXECUTAR TODAS AS QUERIES EM PARALELO
      const [
        profileResult,
        streakResult,
        allStageTimesCountResult,
        allStageTimesSumResult,
        weeklyStageTimesResult,
        previousWeekStageTimesResult,
        todayStageTimesResult,
        scriptsCountResult,
        ideasCountResult,
      ] = await Promise.all([
        // Profile (inclui xp_points, daily_goal_minutes, highest_level)
        supabase
          .from('profiles')
          .select('xp_points, daily_goal_minutes, highest_level')
          .eq('user_id', user.id)
          .single(),
        
        // Streak
        supabase
          .from('streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .single(),
        
        // ALL stage_times count (para total de sessões - contagem exata)
        supabase
          .from('stage_times')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // ALL stage_times sum (para total de horas - precisamos dos valores)
        supabase
          .from('stage_times')
          .select('duration_seconds')
          .eq('user_id', user.id),
        
        // Weekly stage_times (com stage para breakdown)
        supabase
          .from('stage_times')
          .select('duration_seconds, created_at, stage')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString()),
        
        // Previous week stage_times (14 to 7 days ago)
        supabase
          .from('stage_times')
          .select('duration_seconds, created_at')
          .eq('user_id', user.id)
          .gte('created_at', fourteenDaysAgo.toISOString())
          .lt('created_at', sevenDaysAgo.toISOString()),
        
        // Today stage_times
        supabase
          .from('stage_times')
          .select('duration_seconds')
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString()),
        
        // Total scripts count
        supabase
          .from('scripts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Ideas count (draft_idea status)
        supabase
          .from('scripts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'draft_idea'),
      ]);

      // Processar dados localmente
      const profile = profileResult.data;
      const xpPoints = profile?.xp_points || 0;
      
      // Meta dinâmica baseada no nível efetivo
      const effectiveLevel = getEffectiveLevel(xpPoints, profile?.highest_level || 1);
      const dailyGoalMinutes = getDailyGoalMinutesForLevel(effectiveLevel);
      
      const streak = streakResult.data?.current_streak || 0;
      const allStageTimesForSum = allStageTimesSumResult.data || [];
      const weeklyStageTimes = weeklyStageTimesResult.data || [];
      const previousWeekStageTimes = previousWeekStageTimesResult.data || [];
      const todayStageTimes = todayStageTimesResult.data || [];
      const scriptsCount = scriptsCountResult.count || 0;
      const ideasCount = ideasCountResult.count || 0;

      // Calcular total de sessões (contagem exata do banco)
      const totalSessions = allStageTimesCountResult.count || 0;
      // Calcular total de horas (soma dos valores retornados - limitado a 1000, mas ok para horas)
      const totalSeconds = allStageTimesForSum.reduce((sum, st) => sum + (st.duration_seconds || 0), 0);
      const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

      // Calcular dados semanais (gráfico) com breakdown por estágio
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const weeklyData: WeeklyData[] = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayName = dayNames[date.getDay()];
        
        const dayRecords = weeklyStageTimes.filter(st => {
          const stDate = new Date(st.created_at!);
          return stDate.toDateString() === date.toDateString();
        });
        
        const dayTotal = dayRecords.reduce((sum, st) => sum + (st.duration_seconds || 0), 0);
        
        // Agrupar por estágio
        const stageBreakdown: StageBreakdown = {
          ideation: 0,
          script: 0,
          review: 0,
          record: 0,
          edit: 0,
        };
        
        dayRecords.forEach(record => {
          const stage = record.stage as keyof StageBreakdown;
          if (stage && stage in stageBreakdown) {
            stageBreakdown[stage] += Math.round((record.duration_seconds || 0) / 60);
          }
        });
        
        weeklyData.push({
          day: dayName,
          hours: Math.round((dayTotal / 3600) * 10) / 10,
          date: new Date(date),
          stageBreakdown,
        });
      }

      // Média semanal
      const weeklyAverage = Math.round(weeklyData.reduce((sum, d) => sum + d.hours, 0) * 10) / 10;

      // Weekly goal stats
      const weeklyTotalSeconds = weeklyStageTimes.reduce((sum, st) => sum + (st.duration_seconds || 0), 0);
      const weeklyTotalMinutes = Math.floor(weeklyTotalSeconds / 60);
      const weeklyGoalMinutes = dailyGoalMinutes * 7;
      const weeklyProductivityPercentage = weeklyGoalMinutes > 0
        ? Math.round(((weeklyTotalMinutes - weeklyGoalMinutes) / weeklyGoalMinutes) * 100)
        : 0;

      // Previous week stats
      const previousWeekTotalSeconds = previousWeekStageTimes.reduce(
        (sum, st) => sum + (st.duration_seconds || 0), 0
      );
      const previousWeekTotalMinutes = Math.floor(previousWeekTotalSeconds / 60);
      const previousWeekProductivityPercentage = weeklyGoalMinutes > 0
        ? Math.round(((previousWeekTotalMinutes - weeklyGoalMinutes) / weeklyGoalMinutes) * 100)
        : 0;

      // Daily goal progress
      const todayTotalSeconds = todayStageTimes.reduce((sum, st) => sum + (st.duration_seconds || 0), 0);
      const actualMinutes = Math.floor(todayTotalSeconds / 60);
      const percentageProgress = dailyGoalMinutes > 0
        ? Math.round((actualMinutes / dailyGoalMinutes) * 100)
        : 0;
      const isAbove = actualMinutes >= dailyGoalMinutes;

      // Calcular troféus desbloqueados
      const trophies: string[] = [];
      
      if (scriptsCount >= 1) trophies.push('first_script');
      if (scriptsCount >= 10) trophies.push('scripts_10');
      if (scriptsCount >= 50) trophies.push('scripts_50');
      if (ideasCount >= 20) trophies.push('ideas_20');
      if (streak >= 7) trophies.push('streak_7');
      if (streak >= 30) trophies.push('streak_30');
      if (totalHours >= 10) trophies.push('hours_10');
      if (totalHours >= 50) trophies.push('hours_50');
      if (totalHours >= 100) trophies.push('hours_100');

      setData({
        weeklyData,
        totalSessions,
        totalHours,
        weeklyAverage,
        weeklyGoalStats: {
          weeklyTotalMinutes,
          weeklyGoalMinutes,
          weeklyProductivityPercentage,
        },
        previousWeekStats: {
          weeklyTotalMinutes: previousWeekTotalMinutes,
          weeklyProductivityPercentage: previousWeekProductivityPercentage,
        },
        dailyGoal: {
          goalMinutes: dailyGoalMinutes,
          actualMinutes,
          percentageProgress,
          isAbove,
        },
        profile: {
          xp_points: xpPoints,
          daily_goal_minutes: dailyGoalMinutes,
        },
        gamificationStats: {
          xp: xpPoints,
          level: calculateLevelFromXP(xpPoints),
          streak,
          totalHours,
          scriptsCreated: scriptsCount,
          ideasCreated: ideasCount,
          trophies,
        },
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  return data;
};
