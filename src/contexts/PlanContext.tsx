import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfileContext } from "@/contexts/ProfileContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { getWeekBoundsUTC, getWeekStartKey, getWeekEndKey, daysUntilWeekReset, isDateInCurrentWeek } from "@/lib/timezone-utils";

interface PlanLimits {
  weeklyScripts: number;      // -1 = ilimitado
  cardsPerContent: number;
  canScheduleFuture: boolean;
  canInviteUsers: boolean;
  maxGuests: number;
}

interface PlanUsage {
  scriptsThisWeek: number;
  weekStartDate: string;
  weekEndDate: string;
}

interface PlanCapabilities {
  planType: 'free' | 'pro' | 'team';
  limits: PlanLimits;
  usage: PlanUsage;
  loading: boolean;
  
  // Funções de verificação
  canCreateScript: () => boolean;
  canScheduleToDate: (targetDateKey: string) => boolean;
  remainingWeeklySlots: () => number;
  
  // Feedback contextual
  getBlockReason: (action: 'create_script' | 'schedule_future') => string | null;
  
  // Refetch após ações
  refetchUsage: () => Promise<void>;
}

const DEFAULT_LIMITS: PlanLimits = {
  weeklyScripts: 3,
  cardsPerContent: 3,
  canScheduleFuture: false,
  canInviteUsers: false,
  maxGuests: 0,
};

const PlanContext = createContext<PlanCapabilities | undefined>(undefined);

export const PlanContextProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useProfileContext();
  const { activeWorkspace } = useWorkspaceContext();
  
  const [limits, setLimits] = useState<PlanLimits>(DEFAULT_LIMITS);
  const [usage, setUsage] = useState<PlanUsage>({
    scriptsThisWeek: 0,
    weekStartDate: '',
    weekEndDate: '',
  });
  const [loading, setLoading] = useState(true);
  
  const planType = (profile?.plan_type || 'free') as 'free' | 'pro' | 'team';
  const timezone = profile?.timezone || 'America/Sao_Paulo';

  // Fetch plan limits from database
  const fetchLimits = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_type', planType)
        .single();
      
      if (error) {
        console.error('Error fetching plan limits:', error);
        return;
      }
      
      if (data) {
        setLimits({
          weeklyScripts: data.weekly_scripts,
          cardsPerContent: data.cards_per_content,
          canScheduleFuture: data.can_schedule_future,
          canInviteUsers: data.can_invite_users,
          maxGuests: data.max_guests,
        });
      }
    } catch (error) {
      console.error('Error fetching plan limits:', error);
    }
  }, [planType]);

  // Fetch usage (scripts created this week)
  const fetchUsage = useCallback(async () => {
    if (!activeWorkspace?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const weekStart = getWeekStartKey(timezone);
      const weekEnd = getWeekEndKey(timezone);
      const { startUTC, endUTC } = getWeekBoundsUTC(timezone);

      const { count, error } = await supabase
        .from('scripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('workspace_id', activeWorkspace.id)
        .gte('created_at', startUTC.toISOString())
        .lt('created_at', endUTC.toISOString());

      if (error) {
        console.error('Error fetching script count:', error);
        setLoading(false);
        return;
      }

      setUsage({
        scriptsThisWeek: count || 0,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id, timezone]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Funções de verificação
  const canCreateScript = useCallback(() => {
    if (limits.weeklyScripts === -1) return true; // ilimitado
    return usage.scriptsThisWeek < limits.weeklyScripts;
  }, [limits.weeklyScripts, usage.scriptsThisWeek]);

  const canScheduleToDate = useCallback((targetDateKey: string) => {
    if (limits.canScheduleFuture) return true; // Pro/Team
    return isDateInCurrentWeek(targetDateKey, timezone);
  }, [limits.canScheduleFuture, timezone]);

  const remainingWeeklySlots = useCallback(() => {
    if (limits.weeklyScripts === -1) return Infinity;
    return Math.max(0, limits.weeklyScripts - usage.scriptsThisWeek);
  }, [limits.weeklyScripts, usage.scriptsThisWeek]);

  const getBlockReason = useCallback((action: 'create_script' | 'schedule_future') => {
    if (action === 'create_script') {
      if (canCreateScript()) return null;
      const daysLeft = daysUntilWeekReset(timezone);
      return `Você já criou ${limits.weeklyScripts} conteúdos esta semana. A semana reseta em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}.`;
    }
    
    if (action === 'schedule_future') {
      if (limits.canScheduleFuture) return null;
      return 'No plano Free, você só consegue planejar dentro da semana atual.';
    }
    
    return null;
  }, [canCreateScript, limits.weeklyScripts, limits.canScheduleFuture, timezone]);

  const value: PlanCapabilities = {
    planType,
    limits,
    usage,
    loading,
    canCreateScript,
    canScheduleToDate,
    remainingWeeklySlots,
    getBlockReason,
    refetchUsage: fetchUsage,
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlanCapabilities = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlanCapabilities must be used within a PlanContextProvider');
  }
  return context;
};

// Hook opcional para usar em componentes que podem estar fora do provider
export const usePlanCapabilitiesOptional = () => {
  return useContext(PlanContext);
};
