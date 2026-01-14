import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { usePlanCapabilitiesOptional } from '@/contexts/PlanContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, LogOut, Pencil, Crown, Shield, User, Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Paywall } from '@/components/Paywall';

interface ProfileSheetProps {
  onClose?: () => void;
}

export const ProfileSheet = ({ onClose }: ProfileSheetProps) => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { activeWorkspace, activeRole, allWorkspaces, switchWorkspace } = useWorkspaceContext();
  const planCapabilities = usePlanCapabilitiesOptional();
  const { createWorkspace } = useWorkspace();
  const [email, setEmail] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const fetchEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    };
    fetchEmail();
  }, []);

  const getUserInitials = () => {
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    return profile?.username || email?.split('@')[0] || 'Usuário';
  };

  const getSubscriptionStatus = () => {
    const planType = planCapabilities?.planType || 'free';
    switch (planType) {
      case 'studio':
        return { label: 'Studio', variant: 'default' as const, color: 'text-violet-600' };
      case 'pro':
        return { label: 'Pro', variant: 'default' as const, color: 'text-amber-600' };
      default:
        return { label: 'Free', variant: 'secondary' as const, color: 'text-muted-foreground' };
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3" />;
      case 'admin':
        return <Shield className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      case 'collaborator':
        return 'Colaborador';
      default:
        return role;
    }
  };

  const getWorkspaceDisplayName = (workspaceName: string, role: string, ownerName?: string) => {
    if (role === 'owner') {
      return workspaceName;
    }
    if (ownerName) {
      return `${ownerName} Workspace`;
    }
    return workspaceName;
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    await switchWorkspace(workspaceId);
    toast.success('Workspace alterado');
    onClose?.();
    window.location.reload();
  };

  const handleEditProfile = () => {
    onClose?.();
    navigate('/edit-profile');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose?.();
    navigate('/auth');
  };

  const handleCreateWorkspaceClick = () => {
    // Check if user can create workspace
    if (planCapabilities && !planCapabilities.canCreateWorkspace()) {
      setShowPaywall(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Digite um nome para o workspace');
      return;
    }

    setIsCreating(true);
    const result = await createWorkspace(newWorkspaceName);
    setIsCreating(false);

    if (result.limitReached) {
      setShowCreateModal(false);
      setShowPaywall(true);
      return;
    }

    if (result.success) {
      setShowCreateModal(false);
      setNewWorkspaceName('');
      // Reload to refresh workspace list
      window.location.reload();
    }
  };

  const subscriptionStatus = getSubscriptionStatus();
  // Allow Pro and Studio users to see the create workspace button
  const canSeeCreateWorkspace = planCapabilities?.planType === 'studio' || planCapabilities?.planType === 'pro';
  const ownedWorkspaces = allWorkspaces.filter(w => w.role === 'owner').length;
  const workspaceLimit = planCapabilities?.totalWorkspacesLimit() || 1;

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="text-left">
        <SheetTitle>Perfil</SheetTitle>
        <SheetDescription>Gerencie sua conta e workspaces</SheetDescription>
      </SheetHeader>

      {/* User Info Section */}
      <div className="flex flex-col items-center py-6">
        <Avatar className="h-20 w-20 mb-4">
          {profile?.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt={profile?.username || "Avatar"} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl font-semibold">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold text-foreground">{getDisplayName()}</h3>
        <p className="text-sm text-muted-foreground">{email}</p>
        <Badge variant={subscriptionStatus.variant} className={`mt-2 ${subscriptionStatus.color}`}>
          ✓ Muzze {subscriptionStatus.label}
        </Badge>
      </div>

      <Separator />

      {/* Workspaces Section */}
      <div className="flex-1 py-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="text-sm font-medium text-muted-foreground">WORKSPACES</h4>
          {canSeeCreateWorkspace && (
            <span className="text-xs text-muted-foreground">
              {ownedWorkspaces}/{workspaceLimit}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {allWorkspaces.map(({ workspace, role, ownerName }) => {
            const isActive = activeWorkspace?.id === workspace.id;
            const displayName = getWorkspaceDisplayName(workspace.name, role, ownerName);
            return (
              <button
                key={workspace.id}
                onClick={() => !isActive && handleSwitchWorkspace(workspace.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'hover:bg-secondary/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isActive && <Check className="w-4 h-4 text-primary" />}
                  <span className={`font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {displayName}
                  </span>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {getRoleIcon(role)}
                  {getRoleLabel(role)}
                </Badge>
              </button>
            );
          })}

          {/* Create Workspace Button - Pro and Studio users */}
          {canSeeCreateWorkspace && (
            <button
              onClick={handleCreateWorkspaceClick}
              className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Criar Workspace</span>
            </button>
          )}
        </div>
      </div>

      <Separator />

      {/* Actions Section */}
      <div className="py-4 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleEditProfile}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Editar Perfil
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>

      {/* Create Workspace Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Criar Workspace
            </DialogTitle>
            <DialogDescription>
              Crie um novo workspace para gerenciar outro projeto ou cliente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Nome do workspace"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              disabled={isCreating}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
            />
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isCreating}>
              Cancelar
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={isCreating || !newWorkspaceName.trim()}>
              {isCreating ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paywall */}
      <Paywall
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        action="create_workspace"
        currentUsage={ownedWorkspaces}
        limit={workspaceLimit}
        context="profile_sheet"
      />
    </div>
  );
};
