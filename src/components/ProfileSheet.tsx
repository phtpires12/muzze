import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Check, LogOut, Pencil, Crown, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface ProfileSheetProps {
  onClose?: () => void;
}

export const ProfileSheet = ({ onClose }: ProfileSheetProps) => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { activeWorkspace, activeRole, allWorkspaces, switchWorkspace } = useWorkspaceContext();
  const [email, setEmail] = useState<string>('');

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
    // TODO: Implement real subscription check
    return { label: 'Ativo', variant: 'default' as const };
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

  const handleSwitchWorkspace = async (workspaceId: string) => {
    await switchWorkspace(workspaceId);
    toast.success('Workspace alterado');
    onClose?.();
    // Reload to refresh all data with new workspace context
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

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="text-left">
        <SheetTitle>Perfil</SheetTitle>
        <SheetDescription>Gerencie sua conta e workspaces</SheetDescription>
      </SheetHeader>

      {/* User Info Section */}
      <div className="flex flex-col items-center py-6">
        <Avatar className="h-20 w-20 mb-4">
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl font-semibold">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold text-foreground">{getDisplayName()}</h3>
        <p className="text-sm text-muted-foreground">{email}</p>
        <Badge variant={subscriptionStatus.variant} className="mt-2">
          ✓ Assinatura {subscriptionStatus.label.toLowerCase()}
        </Badge>
      </div>

      <Separator />

      {/* Workspaces Section */}
      <div className="flex-1 py-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3 px-1">WORKSPACES</h4>
        <div className="space-y-2">
          {allWorkspaces.map(({ workspace, role }) => {
            const isActive = activeWorkspace?.id === workspace.id;
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
                    {workspace.name}
                  </span>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {getRoleIcon(role)}
                  {getRoleLabel(role)}
                </Badge>
              </button>
            );
          })}
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
    </div>
  );
};
