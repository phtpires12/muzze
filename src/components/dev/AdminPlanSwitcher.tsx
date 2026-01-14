import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/useUserRole';
import { usePlanCapabilities } from '@/contexts/PlanContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, AlertCircle, Database, User, RefreshCw } from 'lucide-react';

interface ProfileRow {
  user_id: string;
  plan_type: string | null;
  is_internal_tester: boolean | null;
}

export const AdminPlanSwitcher = () => {
  const { isDeveloper, isAdmin, isLoading: roleLoading } = useUserRole();
  const planCapabilities = usePlanCapabilities();
  
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);
  const [profileData, setProfileData] = useState<ProfileRow | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [settingPlan, setSettingPlan] = useState(false);

  // Fetch auth user and profile data
  const fetchData = async () => {
    setIsLoadingProfile(true);
    setProfileError(null);
    
    try {
      // Get auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setProfileError('Nenhum usuário autenticado');
        setIsLoadingProfile(false);
        return;
      }
      
      setAuthUser({ id: user.id, email: user.email || '(sem email)' });
      
      // Get profile data - direct query, no fallback
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, plan_type, is_internal_tester')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        setProfileError('Profile não encontrado para este user_id');
        setProfileData(null);
      } else {
        setProfileData(data);
      }
    } catch (err: any) {
      console.error('[AdminPlanSwitcher] Error:', err);
      setProfileError(err.message);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set plan via RPC
  const handleSetPlan = async (newPlan: 'free' | 'pro' | 'studio') => {
    if (!authUser?.id) {
      toast.error('User ID não disponível');
      return;
    }
    
    setSettingPlan(true);
    try {
      const { error } = await supabase.rpc('admin_set_plan_type', {
        target_user: authUser.id,
        new_plan: newPlan
      });
      
      if (error) throw error;
      
      toast.success(`Plano alterado para ${newPlan.toUpperCase()}`);
      
      // Refetch everything
      await Promise.all([
        fetchData(),
        planCapabilities.refetchAll()
      ]);
      
      toast.success('Dados atualizados!');
    } catch (err: any) {
      console.error('[AdminPlanSwitcher] Error setting plan:', err);
      toast.error(`Erro: ${err.message}`);
    } finally {
      setSettingPlan(false);
    }
  };

  // Only render for developers/admins
  if (roleLoading) {
    return <Skeleton className="h-48 w-full" />;
  }
  
  if (!isDeveloper && !isAdmin) {
    return null;
  }

  return (
    <Card className="border-violet-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-violet-500" />
          Admin Plan Switcher
        </CardTitle>
        <CardDescription>
          Alterar plano do usuário logado via RPC
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auth User Info */}
        <div className="p-3 bg-muted rounded space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">auth.uid():</span>
            {authUser ? (
              <code className="text-xs bg-background px-2 py-0.5 rounded border">
                {authUser.id}
              </code>
            ) : (
              <Skeleton className="h-4 w-48" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground ml-6">Email:</span>
            {authUser ? (
              <code className="text-xs bg-background px-2 py-0.5 rounded border">
                {authUser.email}
              </code>
            ) : (
              <Skeleton className="h-4 w-32" />
            )}
          </div>
        </div>

        {/* Profile Data from DB */}
        <div className="p-3 bg-muted rounded">
          <p className="text-sm text-muted-foreground mb-2">
            SELECT plan_type, is_internal_tester FROM profiles:
          </p>
          
          {isLoadingProfile ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : profileError ? (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {profileError}
            </div>
          ) : profileData ? (
            <div className="font-mono text-xs bg-background p-2 rounded border">
              <div>plan_type: <span className="text-primary font-semibold">{profileData.plan_type ?? 'NULL'}</span></div>
              <div>is_internal_tester: <span className="text-amber-600">{String(profileData.is_internal_tester)}</span></div>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">Nenhum dado</span>
          )}
        </div>

        {/* PlanContext Value */}
        <div className="p-3 bg-muted rounded">
          <p className="text-sm text-muted-foreground mb-2">PlanContext.planType:</p>
          <Badge variant="secondary" className="text-sm">
            {planCapabilities.loading ? 'loading...' : planCapabilities.planType.toUpperCase()}
          </Badge>
          {planCapabilities.isInternalTester && (
            <Badge variant="outline" className="ml-2 text-xs border-amber-500/50 text-amber-600">
              Internal Tester
            </Badge>
          )}
        </div>

        {/* Plan Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={() => handleSetPlan('free')}
            disabled={settingPlan || isLoadingProfile}
            variant={profileData?.plan_type === 'free' ? 'default' : 'outline'}
            size="sm"
          >
            {profileData?.plan_type === 'free' && <Check className="w-3 h-3 mr-1" />}
            Free
          </Button>
          <Button
            onClick={() => handleSetPlan('pro')}
            disabled={settingPlan || isLoadingProfile}
            variant={profileData?.plan_type === 'pro' ? 'default' : 'outline'}
            size="sm"
            className={profileData?.plan_type === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : ''}
          >
            {profileData?.plan_type === 'pro' && <Check className="w-3 h-3 mr-1" />}
            Pro
          </Button>
          <Button
            onClick={() => handleSetPlan('studio')}
            disabled={settingPlan || isLoadingProfile}
            variant={profileData?.plan_type === 'studio' ? 'default' : 'outline'}
            size="sm"
            className={profileData?.plan_type === 'studio' ? 'bg-violet-600 hover:bg-violet-700' : ''}
          >
            {profileData?.plan_type === 'studio' && <Check className="w-3 h-3 mr-1" />}
            Studio
          </Button>
        </div>

        {/* Refresh Button */}
        <Button
          onClick={fetchData}
          variant="outline"
          size="sm"
          className="w-full"
          disabled={isLoadingProfile}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingProfile ? 'animate-spin' : ''}`} />
          Atualizar dados
        </Button>

        <p className="text-xs text-muted-foreground">
          Usa RPC admin_set_plan_type e depois chama refetchAll() sem reload.
        </p>
      </CardContent>
    </Card>
  );
};
