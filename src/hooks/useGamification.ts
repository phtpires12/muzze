import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveLevel } from "@/lib/gamification";

export interface GamificationStats {
  totalXP: number;
  level: number;
  highestLevel: number;
  streak: number;
  totalHours: number;
  scriptsCreated: number;
  ideasCreated: number;
  trophies: string[];
  freezes: number;
}

export const useGamification = () => {
  const [stats, setStats] = useState<GamificationStats>({
    totalXP: 0,
    level: 1,
    highestLevel: 1,
    streak: 0,
    totalHours: 0,
    scriptsCreated: 0,
    ideasCreated: 0,
    trophies: [],
    freezes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Setup realtime listeners
    const profileChannel = supabase
      .channel('gamification-profile')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        () => fetchStats()
      )
      .subscribe();

    const streakChannel = supabase
      .channel('gamification-streak')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streaks'
        },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(streakChannel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile data (including highest_level for non-regressive levels)
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_points, streak_freezes, highest_level')
        .eq('user_id', user.id)
        .single();

      // Get streak data
      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      // Get scripts count
      const { count: scriptsCount } = await supabase
        .from('scripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get ideas count (scripts with status 'draft_idea')
      const { count: ideasCount } = await supabase
        .from('scripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'draft_idea');

      // Get total hours from stage_times
      const { data: stageTimes } = await supabase
        .from('stage_times')
        .select('duration_seconds')
        .eq('user_id', user.id);

      const totalHours = (stageTimes || []).reduce(
        (sum, st) => sum + (st.duration_seconds || 0) / 3600,
        0
      );

      // Buscar troféus do banco em vez de calcular dinamicamente
      const { data: userTrophies } = await supabase
        .from('user_trophies')
        .select('trophy_id')
        .eq('user_id', user.id);

      const unlockedTrophies = (userTrophies || []).map(t => t.trophy_id);

      const xpPoints = profile?.xp_points || 0;
      const highestLevel = profile?.highest_level || 1;
      // Usa nível efetivo: nunca menor que highest_level
      const effectiveLevel = getEffectiveLevel(xpPoints, highestLevel);

      const newStats = {
        totalXP: xpPoints,
        level: effectiveLevel,
        highestLevel: highestLevel,
        streak: streak?.current_streak || 0,
        totalHours,
        scriptsCreated: scriptsCount || 0,
        ideasCreated: ideasCount || 0,
        trophies: unlockedTrophies,
        freezes: profile?.streak_freezes || 0,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching gamification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchStats };
};

// Helper function removida - usar getEffectiveLevel de gamification.ts
