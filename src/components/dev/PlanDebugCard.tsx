import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Copy, RefreshCw, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePlanCapabilities } from "@/contexts/PlanContext";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

interface DebugFetchResult {
  data: any;
  error: any;
  foundRow: boolean;
  status?: number;
}

export const PlanDebugCard = () => {
  const { isDeveloper, isAdmin } = useUserRole();
  const planCapabilities = usePlanCapabilities();
  
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);
  const [profileFetch, setProfileFetch] = useState<DebugFetchResult | null>(null);
  const [limitsFetch, setLimitsFetch] = useState<DebugFetchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Environment info
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'N/A';
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'N/A';
  const projectRef = supabaseUrl.includes('supabase.co') 
    ? supabaseUrl.split('//')[1]?.split('.')[0] || 'unknown'
    : 'local';

  // Fetch all debug data
  const fetchDebugData = async () => {
    setLoading(true);
    
    try {
      // 1. Get auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setAuthUser(null);
        setProfileFetch({ data: null, error: authError || 'No user', foundRow: false });
        setLimitsFetch({ data: null, error: 'No auth', foundRow: false });
        setLoading(false);
        return;
      }
      
      setAuthUser({ id: user.id, email: user.email || 'N/A' });
      
      // 2. Fetch profile (raw query)
      const profileResult = await supabase
        .from('profiles')
        .select('user_id, plan_type, is_internal_tester, extra_workspaces_packs, timezone')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setProfileFetch({
        data: profileResult.data,
        error: profileResult.error,
        foundRow: !!profileResult.data,
        status: profileResult.status,
      });
      
      // 3. Get the resolved plan type to check limits
      const rawPlanType = (profileResult.data as any)?.plan_type || 'free';
      const isSimulating = planCapabilities.isInternalTester && 
        localStorage.getItem('muzze_simulated_plan_type');
      const effectivePlan = isSimulating 
        ? localStorage.getItem('muzze_simulated_plan_type') 
        : rawPlanType;
      
      // 4. Fetch limits for the effective plan
      const limitsResult = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_type', effectivePlan)
        .maybeSingle();
      
      setLimitsFetch({
        data: limitsResult.data,
        error: limitsResult.error,
        foundRow: !!limitsResult.data,
        status: limitsResult.status,
      });
      
    } catch (err) {
      console.error('[PlanDebugCard] Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDebugData();
  }, []);
  
  // Visibility check
  const isAllowedUser = authUser?.email === 'phtpires12@gmail.com';
  const shouldShow = isDeveloper || isAdmin || isAllowedUser;
  
  if (!shouldShow) return null;
  
  // Copy debug info to clipboard
  const handleCopy = () => {
    const debugInfo = {
      env: { supabaseUrl: supabaseUrl.substring(0, 40) + '...', projectRef },
      authUser,
      profileFetch,
      limitsFetch,
      planContext: {
        planType: planCapabilities.planType,
        isInternalTester: planCapabilities.isInternalTester,
        loading: planCapabilities.loading,
        limits: planCapabilities.limits,
        usage: planCapabilities.usage,
      },
      localStorage: {
        simulatedPlan: localStorage.getItem('muzze_simulated_plan_type'),
      },
    };
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Resolution trace
  const rawPlanFromDB = (profileFetch?.data as any)?.plan_type;
  const simulatedPlan = localStorage.getItem('muzze_simulated_plan_type');
  const isTester = (profileFetch?.data as any)?.is_internal_tester === true;
  
  const resolutionTrace = {
    rawPlanFromDB,
    isInternalTester: isTester,
    simulatedPlanFromLocalStorage: simulatedPlan,
    effectivePlanType: planCapabilities.planType,
    planContextLoading: planCapabilities.loading,
  };
  
  // Determine if there's an issue
  const hasAuthIssue = !authUser;
  const hasProfileIssue = !profileFetch?.foundRow || profileFetch?.error;
  const hasLimitsIssue = !limitsFetch?.foundRow || limitsFetch?.error;
  const planMismatch = rawPlanFromDB && rawPlanFromDB !== planCapabilities.planType && !simulatedPlan;
  
  const hasAnyIssue = hasAuthIssue || hasProfileIssue || hasLimitsIssue || planMismatch;
  
  return (
    <Card className={cn(
      "border-2",
      hasAnyIssue ? "border-red-500/50 bg-red-500/5" : "border-green-500/50 bg-green-500/5"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {hasAnyIssue ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            🔍 Plan Debug Card
          </span>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchDebugData}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopy}
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs font-mono">
        {/* Environment */}
        <div>
          <p className="font-semibold text-muted-foreground mb-1">📡 Ambiente</p>
          <div className="bg-background/50 rounded p-2 space-y-1">
            <p><span className="text-muted-foreground">Project Ref:</span> <Badge variant="outline">{projectRef}</Badge></p>
            <p><span className="text-muted-foreground">URL:</span> {supabaseUrl.substring(0, 35)}...</p>
          </div>
        </div>
        
        {/* Auth User */}
        <div>
          <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-2">
            👤 Auth User
            {hasAuthIssue ? <XCircle className="w-3 h-3 text-red-500" /> : <CheckCircle className="w-3 h-3 text-green-500" />}
          </p>
          <div className="bg-background/50 rounded p-2 space-y-1">
            {authUser ? (
              <>
                <p><span className="text-muted-foreground">user.id:</span> {authUser.id.substring(0, 8)}...</p>
                <p><span className="text-muted-foreground">user.email:</span> <span className="text-primary">{authUser.email}</span></p>
              </>
            ) : (
              <p className="text-red-400">❌ No authenticated user</p>
            )}
          </div>
        </div>
        
        {/* Profile Fetch */}
        <div>
          <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-2">
            📋 Profile Fetch
            {hasProfileIssue ? <XCircle className="w-3 h-3 text-red-500" /> : <CheckCircle className="w-3 h-3 text-green-500" />}
          </p>
          <div className="bg-background/50 rounded p-2 space-y-1">
            <p><span className="text-muted-foreground">foundRow:</span> {profileFetch?.foundRow ? '✅ true' : '❌ false'}</p>
            {profileFetch?.error && (
              <p className="text-red-400">error: {JSON.stringify(profileFetch.error)}</p>
            )}
            {profileFetch?.data && (
              <>
                <p>
                  <span className="text-muted-foreground">plan_type:</span>{' '}
                  <Badge className={cn(
                    "text-xs",
                    (profileFetch.data as any).plan_type === 'studio' && "bg-violet-500",
                    (profileFetch.data as any).plan_type === 'pro' && "bg-amber-500",
                  )}>
                    {(profileFetch.data as any).plan_type || 'null'}
                  </Badge>
                </p>
                <p><span className="text-muted-foreground">is_internal_tester:</span> {(profileFetch.data as any).is_internal_tester ? '✅ true' : 'false'}</p>
                <p><span className="text-muted-foreground">extra_workspaces_packs:</span> {(profileFetch.data as any).extra_workspaces_packs || 0}</p>
              </>
            )}
          </div>
        </div>
        
        {/* Limits Fetch */}
        <div>
          <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-2">
            📊 Plan Limits (for "{planCapabilities.planType}")
            {hasLimitsIssue ? <XCircle className="w-3 h-3 text-red-500" /> : <CheckCircle className="w-3 h-3 text-green-500" />}
          </p>
          <div className="bg-background/50 rounded p-2 space-y-1">
            <p><span className="text-muted-foreground">foundRow:</span> {limitsFetch?.foundRow ? '✅ true' : '❌ false'}</p>
            {limitsFetch?.error && (
              <p className="text-red-400">error: {JSON.stringify(limitsFetch.error)}</p>
            )}
            {limitsFetch?.data && (
              <pre className="text-[10px] overflow-x-auto">{JSON.stringify(limitsFetch.data, null, 2)}</pre>
            )}
          </div>
        </div>
        
        {/* Resolution Trace */}
        <div>
          <p className="font-semibold text-muted-foreground mb-1">🧩 Resolution Trace</p>
          <div className="bg-background/50 rounded p-2 space-y-1">
            <p><span className="text-muted-foreground">rawPlanFromDB:</span> {resolutionTrace.rawPlanFromDB || 'null'}</p>
            <p><span className="text-muted-foreground">isInternalTester:</span> {resolutionTrace.isInternalTester ? 'true' : 'false'}</p>
            <p><span className="text-muted-foreground">simulatedPlan (localStorage):</span> {resolutionTrace.simulatedPlanFromLocalStorage || 'null'}</p>
            <p>
              <span className="text-muted-foreground">effectivePlanType:</span>{' '}
              <Badge className={cn(
                "text-xs",
                resolutionTrace.effectivePlanType === 'studio' && "bg-violet-500",
                resolutionTrace.effectivePlanType === 'pro' && "bg-amber-500",
              )}>
                {resolutionTrace.effectivePlanType}
              </Badge>
            </p>
            {planMismatch && (
              <p className="text-amber-400">⚠️ Plan mismatch: DB says "{rawPlanFromDB}" but context uses "{planCapabilities.planType}"</p>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          {simulatedPlan && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                localStorage.removeItem('muzze_simulated_plan_type');
                window.location.reload();
              }}
            >
              🔄 Reset Simulation
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              planCapabilities.refetchUsage();
              fetchDebugData();
            }}
          >
            🔁 Refetch All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
