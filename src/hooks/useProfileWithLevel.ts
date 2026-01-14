import { useMemo } from "react";
import { useProfileContext } from "@/contexts/ProfileContext";
import { 
  getEffectiveLevel, 
  getDailyGoalMinutesForLevel, 
  calculateFreezeCost 
} from "@/lib/gamification";

interface ProfileWithLevel {
  // Dados originais do profile
  profile: any;
  loading: boolean;
  updateProfile: (updates: Partial<any>) => Promise<void>;
  addXP: (amount: number) => Promise<number>;
  refetch: () => Promise<void>;
  
  // Valores derivados (calculados)
  effectiveLevel: number;
  goalMinutes: number;
  freezeCost: number;
}

export const useProfileWithLevel = (): ProfileWithLevel => {
  const { profile, loading, updateProfile, addXP, refetch } = useProfileContext();

  const effectiveLevel = useMemo(() => 
    getEffectiveLevel(profile?.xp_points || 0, profile?.highest_level || 1),
    [profile?.xp_points, profile?.highest_level]
  );

  // Meta final = máximo entre meta do nível e override manual do usuário
  // Isso permite que usuários configurem metas maiores que 25min se desejarem
  const goalMinutes = useMemo(() => {
    const levelGoal = getDailyGoalMinutesForLevel(effectiveLevel);
    const userOverride = profile?.min_streak_minutes || 0;
    return Math.max(levelGoal, userOverride);
  }, [effectiveLevel, profile?.min_streak_minutes]);

  const freezeCost = useMemo(() => 
    calculateFreezeCost(goalMinutes),
    [goalMinutes]
  );

  return {
    profile,
    loading,
    updateProfile,
    addXP,
    refetch,
    effectiveLevel,
    goalMinutes,
    freezeCost,
  };
};
