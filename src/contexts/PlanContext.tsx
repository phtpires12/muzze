import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { getWeekBoundsUTC, getWeekStartKey, getWeekEndKey, daysUntilWeekReset, isDateInCurrentWeek } from "@/lib/timezone-utils";

interface ProfileWithPlanFields {
  user_id: string;
  plan_type: string | null;
  is_internal_tester: boolean | null;
  extra_workspaces_packs: number | null;
  timezone: string | null;
}

interface PlanLimits {
  weeklyScripts: number;      // -1 = ilimitado
  cardsPerContent: number;
  canScheduleFuture: boolean;
  canInviteUsers: boolean;
  maxGuests: number;
  maxWorkspaces: number;
}

interface PlanUsage {
  scriptsThisWeek: number;
  weekStartDate: string;
  weekEndDate: string;
  ownedWorkspacesCount: number;
}

interface PlanCapabilities {
  planType: 'free' | 'pro' | 'studio';
  limits: PlanLimits;
  usage: PlanUsage;
  loading: boolean;
  isInternalTester: boolean;
  
  // Funções de verificação
  canCreateScript: () => boolean;
  canScheduleToDate: (targetDateKey: string) => boolean;
  remainingWeeklySlots: () => number;
  
  // Workspace capabilities (novo)
  canCreateWorkspace: () => boolean;
  canInviteGuest: (currentGuestCount: number) => boolean;
  totalWorkspacesLimit: () => number;
  remainingWorkspaceSlots: () => number;
  getExtraWorkspacesPacks: () => number;
  
  // Feedback contextual
  getBlockReason: (action: 'create_script' | 'schedule_future' | 'create_workspace' | 'invite_guest') => string | null;
  
  // Refetch após ações
  refetchUsage: () => Promise<void>;
  
  // Admin: simular plano
  setSimulatedPlan: (plan: 'free' | 'pro' | 'studio' | null) => void;
}

const DEFAULT_LIMITS: PlanLimits = {
  weeklyScripts: 3,
  cardsPerContent: 3,
  canScheduleFuture: false,
  canInviteUsers: false,
  maxGuests: 0,
  maxWorkspaces: 1,
};

const PlanContext = createContext<PlanCapabilities | undefined>(undefined);

export const PlanContextProvider = ({ children }: { children: ReactNode }) => {
  const { allWorkspaces, activeWorkspace } = useWorkspaceContext();
  
  const [profileData, setProfileData] = useState<ProfileWithPlanFields | null>(null);
  const [simulatedPlan, setSimulatedPlan] = useState<'free' | 'pro' | 'studio' | null>(null);
  const [limits, setLimits] = useState<PlanLimits>(DEFAULT_LIMITS);
  const [usage, setUsage] = useState<PlanUsage>({
    scriptsThisWeek: 0,
    weekStartDate: '',
    weekEndDate: '',
    ownedWorkspacesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch profile data directly with explicit field selection
  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Query with explicit field selection and type casting
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, plan_type, is_internal_tester, extra_workspaces_packs, timezone')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile for plan context:', error);
        return;
      }
      
      if (data) {
        // Cast to our interface since types.ts might not have these fields yet
        setProfileData(data as unknown as ProfileWithPlanFields);
      }
    };
    
    fetchProfileData();
  }, []);
  
  // Determinar planType com override para internal testers e simulação
  const rawPlanType = (profileData?.plan_type || 'free') as 'free' | 'pro' | 'studio';
  const isInternalTester = profileData?.is_internal_tester === true;
  
  // Se está simulando, usa o plano simulado; se é tester sem simulação, usa studio; senão, usa o plano real
  const planType = simulatedPlan 
    ? simulatedPlan 
    : (isInternalTester ? 'studio' : rawPlanType);
  
  const timezone = profileData?.timezone || 'America/Sao_Paulo';
  const extraWorkspacesPacks = profileData?.extra_workspaces_packs || 0;

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
          maxWorkspaces: data.max_workspaces,
        });
      }
    } catch (error) {
      console.error('Error fetching plan limits:', error);
    }
  }, [planType]);

  // Fetch usage (scripts created this week + owned workspaces count)
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

      // Fetch scripts count this week
      const { count: scriptCount, error: scriptError } = await supabase
        .from('scripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('workspace_id', activeWorkspace.id)
        .gte('created_at', startUTC.toISOString())
        .lt('created_at', endUTC.toISOString());

      if (scriptError) {
        console.error('Error fetching script count:', scriptError);
      }

      // Count owned workspaces
      const ownedCount = allWorkspaces?.filter(w => w.role === 'owner').length || 0;

      setUsage({
        scriptsThisWeek: scriptCount || 0,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        ownedWorkspacesCount: ownedCount,
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id, timezone, allWorkspaces]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Limite total de workspaces (base + extras)
  const totalWorkspacesLimit = useCallback(() => {
    return limits.maxWorkspaces + (extraWorkspacesPacks * 5);
  }, [limits.maxWorkspaces, extraWorkspacesPacks]);

  // Funções de verificação
  const canCreateScript = useCallback(() => {
    if (limits.weeklyScripts === -1 || limits.weeklyScripts >= 999999) return true; // ilimitado
    return usage.scriptsThisWeek < limits.weeklyScripts;
  }, [limits.weeklyScripts, usage.scriptsThisWeek]);

  const canScheduleToDate = useCallback((targetDateKey: string) => {
    if (limits.canScheduleFuture) return true; // Pro/Studio
    return isDateInCurrentWeek(targetDateKey, timezone);
  }, [limits.canScheduleFuture, timezone]);

  const remainingWeeklySlots = useCallback(() => {
    if (limits.weeklyScripts === -1 || limits.weeklyScripts >= 999999) return Infinity;
    return Math.max(0, limits.weeklyScripts - usage.scriptsThisWeek);
  }, [limits.weeklyScripts, usage.scriptsThisWeek]);

  const canCreateWorkspace = useCallback(() => {
    return usage.ownedWorkspacesCount < totalWorkspacesLimit();
  }, [usage.ownedWorkspacesCount, totalWorkspacesLimit]);

  const canInviteGuest = useCallback((currentGuestCount: number) => {
    if (!limits.canInviteUsers) return false;
    return currentGuestCount < limits.maxGuests;
  }, [limits.canInviteUsers, limits.maxGuests]);

  const remainingWorkspaceSlots = useCallback(() => {
    return Math.max(0, totalWorkspacesLimit() - usage.ownedWorkspacesCount);
  }, [totalWorkspacesLimit, usage.ownedWorkspacesCount]);

  const getExtraWorkspacesPacks = useCallback(() => {
    return extraWorkspacesPacks;
  }, [extraWorkspacesPacks]);

  const getBlockReason = useCallback((action: 'create_script' | 'schedule_future' | 'create_workspace' | 'invite_guest') => {
    if (action === 'create_script') {
      if (canCreateScript()) return null;
      const daysLeft = daysUntilWeekReset(timezone);
      return `Você já criou ${limits.weeklyScripts} conteúdos esta semana. A semana reseta em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}.`;
    }
    
    if (action === 'schedule_future') {
      if (limits.canScheduleFuture) return null;
      return 'No plano Free, você só consegue planejar dentro da semana atual.';
    }

    if (action === 'create_workspace') {
      if (canCreateWorkspace()) return null;
      return `Você atingiu o limite de ${totalWorkspacesLimit()} workspaces do seu plano.`;
    }

    if (action === 'invite_guest') {
      if (limits.canInviteUsers) return null;
      return 'Seu plano não permite convidar pessoas para o workspace.';
    }
    
    return null;
  }, [canCreateScript, canCreateWorkspace, limits.weeklyScripts, limits.canScheduleFuture, limits.canInviteUsers, timezone, totalWorkspacesLimit]);

  const value: PlanCapabilities = {
    planType,
    limits,
    usage,
    loading,
    isInternalTester,
    canCreateScript,
    canScheduleToDate,
    remainingWeeklySlots,
    canCreateWorkspace,
    canInviteGuest,
    totalWorkspacesLimit,
    remainingWorkspaceSlots,
    getExtraWorkspacesPacks,
    getBlockReason,
    refetchUsage: fetchUsage,
    setSimulatedPlan,
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
