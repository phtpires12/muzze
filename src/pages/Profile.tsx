import { useState, useEffect } from "react";
import { User, Mail, Wrench, Users, Crown, Building2, Sparkles } from "lucide-react";
import { usePlanCapabilities } from "@/contexts/PlanContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

type MenuItemWithPath = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
};

type FallbackData = {
  isOwnerWorkspace: boolean;
  isAdminMember: boolean;
  foundWorkspaceId: string | null;
};

const Profile = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { isDeveloper, isAdmin } = useUserRole();
  const planCapabilities = usePlanCapabilities();
  const { activeWorkspace, activeRole, isLoading: workspaceLoading, refetch } = useWorkspaceContext();
  const [userEmail, setUserEmail] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [fallbackData, setFallbackData] = useState<FallbackData | null>(null);
  const [fallbackLoading, setFallbackLoading] = useState(true);

  // Fetch user email + direct fallback query
  useEffect(() => {
    const fetchUserAndFallback = async () => {
      setFallbackLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
          setFallbackLoading(false);
          return;
        }

        setUserEmail(user.email || "");
        setCurrentUserId(user.id);

        // Fallback: Query direta - sou owner de algum workspace?
        const { data: ownedWorkspace } = await supabase
          .from('workspaces')
          .select('id, owner_id')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle();

        let isOwnerWorkspace = !!ownedWorkspace;
        let foundWorkspaceId = ownedWorkspace?.id || null;

        // Se não é owner, verificar se é admin em algum workspace
        let isAdminMember = false;
        if (!isOwnerWorkspace) {
          const { data: adminMembership } = await supabase
            .from('workspace_members')
            .select('role, workspace_id')
            .eq('user_id', user.id)
            .in('role', ['owner', 'admin'])
            .limit(1)
            .maybeSingle();
          
          isAdminMember = !!adminMembership;
          foundWorkspaceId = adminMembership?.workspace_id || null;
        }

        setFallbackData({ isOwnerWorkspace, isAdminMember, foundWorkspaceId });
      } catch (error) {
        console.error('[Profile] Fallback query error:', error);
        setFallbackData({ isOwnerWorkspace: false, isAdminMember: false, foundWorkspaceId: null });
      } finally {
        setFallbackLoading(false);
      }
    };
    fetchUserAndFallback();
  }, []);

  // Auto-heal: se fallback encontrou workspace mas contexto falhou
  useEffect(() => {
    if (
      fallbackData?.foundWorkspaceId &&
      !activeWorkspace &&
      !workspaceLoading &&
      !fallbackLoading
    ) {
      console.log('[Profile] Auto-heal: triggering context refetch');
      refetch();
    }
  }, [fallbackData, activeWorkspace, workspaceLoading, fallbackLoading, refetch]);

  // Context-based permission
  const canManageGuestsFromContext =
    activeRole === "owner" ||
    activeRole === "admin" ||
    (activeWorkspace?.owner_id != null && activeWorkspace.owner_id === currentUserId);

  // Fallback-based permission
  const canManageGuestsFallback = 
    fallbackData?.isOwnerWorkspace || fallbackData?.isAdminMember || false;

  // Final combined permission - works even if context fails
  const canManageGuestsFinal = canManageGuestsFromContext || canManageGuestsFallback;

  const displayName = profile?.username || userEmail.split('@')[0] || "Usuário";

  // Base menu items (always shown)
  const baseMenuItems: MenuItemWithPath[] = [
    { icon: User, label: "Editar perfil", path: "/edit-profile" },
    { icon: Crown, label: "Gerenciar Assinatura", path: "/my-plan" },
    { icon: User, label: "Configurações", path: "/settings" },
  ];

  // Guests menu item (only for owners/admins)
  const guestsMenuItem: MenuItemWithPath = {
    icon: Users,
    label: "Gerenciar Convidados",
    path: "/guests",
  };

  // Other menu items
  const otherMenuItems: MenuItemWithPath[] = [
    { icon: Mail, label: "Mandar sugestões", path: "/send-suggestions" },
    { icon: User, label: "Ajuda", path: "/help" },
    { icon: User, label: "Termos de Uso", path: "/terms" },
    { icon: User, label: "Política de Privacidade", path: "/privacy" },
  ];

  // Dev Tools menu item (only for developers/admins)
  const devMenuItem: MenuItemWithPath[] = (isDeveloper || isAdmin) 
    ? [{ icon: Wrench, label: "Dev Tools", path: "/dev-tools" }]
    : [];

  // Build final menu - guests item ALWAYS included (disabled if no permission)
  const allMenuItems: MenuItemWithPath[] = [
    ...baseMenuItems,
    guestsMenuItem, // Always visible
    ...otherMenuItems,
    ...devMenuItem,
  ];

  // Handle menu item click - check permission for guests
  const handleMenuClick = (item: MenuItemWithPath) => {
    if (item.path === "/guests" && !canManageGuestsFinal) {
      toast.error("Você não tem permissão para gerenciar convidados neste workspace.");
      return;
    }
    navigate(item.path);
  };

  // Expor debug para DevTools via window (apenas runtime)
  useEffect(() => {
    (window as any).__MUZZE_DEBUG__ = {
      workspace: {
        activeRole,
        activeWorkspaceId: activeWorkspace?.id || null,
        activeWorkspaceOwnerId: activeWorkspace?.owner_id || null,
        workspaceLoading,
        currentUserId,
        canManageGuestsFinal,
        fallback: fallbackData,
      }
    };
  }, [activeRole, activeWorkspace, workspaceLoading, currentUserId, canManageGuestsFinal, fallbackData]);

  // Debug overlay só para developers com toggle ativo
  const showDebugOverlay = (isDeveloper || isAdmin) && 
    typeof window !== 'undefined' && 
    localStorage.getItem('muzze_debug_overlay') === '1';

  // Show loading skeleton while workspace context OR fallback is loading
  if (workspaceLoading || fallbackLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div 
          className="max-w-2xl mx-auto px-4 py-6"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          <Skeleton className="h-40 w-full mb-6 rounded-xl" />
          <div className="space-y-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Profile Header Section */}
      <section className="bg-background py-6">
        <div 
          className="max-w-2xl mx-auto px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
        >
          {/* Debug overlay apenas para devs com toggle ativo */}
          {showDebugOverlay && (
            <div className="text-[10px] text-muted-foreground mb-4 font-mono bg-amber-500/10 p-3 rounded-lg border border-amber-500/30">
              <div className="font-bold text-amber-600 mb-1">🔧 DEV OVERLAY</div>
              <div>ctx: role={activeRole || 'null'} | ws={activeWorkspace?.id?.slice(0,8) || 'null'} | owner={activeWorkspace?.owner_id?.slice(0,8) || 'null'}</div>
              <div>fallback: isOwner={String(fallbackData?.isOwnerWorkspace)} | isAdmin={String(fallbackData?.isAdminMember)}</div>
              <div>user: {currentUserId?.slice(0,8) || 'null'}</div>
              <div className="text-green-600">canManageGuestsFinal: {String(canManageGuestsFinal)}</div>
            </div>
          )}

          <Card className="border border-border rounded-xl bg-background">
            <CardContent className="pt-8 pb-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">{displayName}</h1>
                <p className="text-sm text-muted-foreground mb-4">{userEmail}</p>
                {(() => {
                  const getPlanBadge = () => {
                    switch (planCapabilities.planType) {
                      case 'studio':
                        return {
                          text: 'Muzze Studio',
                          className: 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer',
                          Icon: Building2
                        };
                      case 'pro':
                        return {
                          text: 'Muzze Pro',
                          className: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 cursor-pointer',
                          Icon: Crown
                        };
                      default:
                        return {
                          text: 'Muzze Free',
                          className: 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer',
                          Icon: Sparkles
                        };
                    }
                  };
                  const planBadge = getPlanBadge();
                  return (
                    <Badge 
                      variant="secondary" 
                      className={`${planBadge.className} rounded-lg px-3 py-1`}
                      onClick={() => navigate('/my-plan')}
                    >
                      <planBadge.Icon className="w-4 h-4 mr-1.5" />
                      {planBadge.text}
                    </Badge>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Menu Items Section */}
      <section className="bg-muted/30 py-6">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="border border-border rounded-xl bg-background overflow-hidden">
            <div className="divide-y divide-border">
              {allMenuItems.map((item, index) => {
                const isGuestsItem = item.path === "/guests";
                const isDisabled = isGuestsItem && !canManageGuestsFinal;
                
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className={`w-full justify-between h-auto py-4 px-5 rounded-none hover:bg-muted/50 ${isDisabled ? 'opacity-50' : ''}`}
                    onClick={() => handleMenuClick(item)}
                    disabled={false}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span className="text-muted-foreground text-lg">›</span>
                  </Button>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      {/* Logout Section */}
      <section className="bg-background py-6">
        <div className="max-w-2xl mx-auto px-4">
          <Button
            variant="outline"
            className="w-full h-12 rounded-lg text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive font-medium"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/auth");
            }}
          >
            Sair da conta
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Profile;
