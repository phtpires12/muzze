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

  const goalMinutes = useMemo(() => 
    getDailyGoalMinutesForLevel(effectiveLevel),
    [effectiveLevel]
  );

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
