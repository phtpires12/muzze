import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TROPHIES, Trophy } from "@/lib/gamification";

export interface GamificationStats {
  totalXP: number;
  level: number;
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

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_points, streak_freezes')
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

      // Calculate unlocked trophies based on real data
      const currentStats = {
        totalXP: profile?.xp_points || 0,
        totalPoints: profile?.xp_points || 0, // Keep in sync with totalXP
        level: 1,
        streak: streak?.current_streak || 0,
        totalHours,
        scriptsCreated: scriptsCount || 0,
        ideasCreated: ideasCount || 0,
        shotListsCreated: 0,
        trophies: [],
      };

      const unlockedTrophies = TROPHIES
        .filter(trophy => trophy.requirement(currentStats))
        .map(t => t.id);

      setStats({
        totalXP: profile?.xp_points || 0,
        level: calculateLevelFromXP(profile?.xp_points || 0),
        streak: streak?.current_streak || 0,
        totalHours,
        scriptsCreated: scriptsCount || 0,
        ideasCreated: ideasCount || 0,
        trophies: unlockedTrophies,
        freezes: profile?.streak_freezes || 0,
      });
    } catch (error) {
      console.error('Error fetching gamification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchStats };
};

// Helper function to calculate level from XP
function calculateLevelFromXP(xp: number): number {
  const levels = [
    { level: 1, xpRequired: 0 },
    { level: 2, xpRequired: 1000 },
    { level: 3, xpRequired: 3000 },
    { level: 4, xpRequired: 7000 },
    { level: 5, xpRequired: 15000 },
    { level: 6, xpRequired: 30000 },
    { level: 7, xpRequired: 60000 },
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].xpRequired) {
      return levels[i].level;
    }
  }
  return 1;
}
