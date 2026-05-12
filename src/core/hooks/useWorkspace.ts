import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Workspace, 
  WorkspaceMember, 
  WorkspaceInvite, 
  WorkspaceRole, 
  StagePermissions,
  CreativeStage 
} from '@/types/workspace';
import { toast } from 'sonner';

export type EmailStatus = 'active_member' | 'pending_invite' | 'previous_invite' | null;

interface UseWorkspaceReturn {
  workspace: Workspace | null;
  myRole: WorkspaceRole | null;
  members: WorkspaceMember[];
  invites: WorkspaceInvite[];
  isLoading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  inviteMember: (email: string, role: WorkspaceRole, permissions: StagePermissions) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  updateMemberPermissions: (memberId: string, permissions: StagePermissions) => Promise<boolean>;
  cancelInvite: (inviteId: string) => Promise<boolean>;
  resendInvite: (inviteId: string) => Promise<boolean>;
  checkEmailStatus: (email: string) => Promise<EmailStatus>;
  createWorkspace: (name: string) => Promise<{ success: boolean; limitReached?: boolean; workspaceId?: string }>;
  refetch: () => Promise<void>;
}

export const useWorkspace = (): UseWorkspaceReturn => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [myRole, setMyRole] = useState<WorkspaceRole | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspace = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setIsLoading(false);
        return;
      }

      const userId = userData.user.id;

      // Buscar o workspace ativo do localStorage (ou primeiro próprio)
      const savedActiveId = localStorage.getItem('muzze_active_workspace');

      // Buscar todos os workspaces próprios
      const { data: ownWorkspaces } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', userId);

      // Buscar workspaces onde sou membro
      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('role, workspaces(*)')
        .eq('user_id', userId)
        .not('accepted_at', 'is', null);

      // Determinar qual workspace usar
      let activeWs: Workspace | null = null;
      let activeRole: WorkspaceRole | null = null;

      // Primeiro: tentar achar o workspace salvo
      if (savedActiveId) {
        const ownMatch = ownWorkspaces?.find(w => w.id === savedActiveId);
        if (ownMatch) {
          activeWs = ownMatch as Workspace;
          activeRole = 'owner';
        } else {
          const memberMatch = memberships?.find(m => (m.workspaces as any)?.id === savedActiveId);
          if (memberMatch?.workspaces) {
            activeWs = memberMatch.workspaces as unknown as Workspace;
            activeRole = memberMatch.role as WorkspaceRole;
          }
        }
      }

      // Fallback: primeiro workspace próprio
      if (!activeWs && ownWorkspaces && ownWorkspaces.length > 0) {
        activeWs = ownWorkspaces[0] as Workspace;
        activeRole = 'owner';
      }

      // Fallback: primeiro workspace como membro
      if (!activeWs && memberships && memberships.length > 0 && memberships[0].workspaces) {
        activeWs = memberships[0].workspaces as unknown as Workspace;
        activeRole = memberships[0].role as WorkspaceRole;
      }

      if (activeWs) {
        setWorkspace(activeWs);
        setMyRole(activeRole);

        // Buscar membros e convites apenas se sou owner
        if (activeRole === 'owner') {
          const { data: membersData } = await supabase
            .rpc('get_workspace_members_full', { _workspace_id: activeWs.id });

          if (membersData) {
            const memberIds = membersData.map(m => m.user_id);
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, username')
              .in('user_id', memberIds);

            const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);

            setMembers(membersData.map(m => ({
              ...m,
              role: m.role as WorkspaceRole,
              allowed_timer_stages: (m.allowed_timer_stages || []) as CreativeStage[],
              can_edit_stages: (m.can_edit_stages || []) as CreativeStage[],
              username: profileMap.get(m.user_id) || undefined,
              email: m.email || undefined,
            })));
          }

          const { data: invitesData } = await supabase
            .from('workspace_invites')
            .select('*')
            .eq('workspace_id', activeWs.id)
            .gt('expires_at', new Date().toISOString());

          if (invitesData) {
            setInvites(invitesData.map(i => ({
              ...i,
              role: i.role as WorkspaceRole,
              allowed_timer_stages: (i.allowed_timer_stages || []) as CreativeStage[],
              can_edit_stages: (i.can_edit_stages || []) as CreativeStage[],
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching workspace:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const checkEmailStatus = async (email: string): Promise<EmailStatus> => {
    if (!workspace) return null;

    const normalizedEmail = email.toLowerCase().trim();

    try {
      // 1. Verificar se já é membro ativo do workspace
      const { data: existingMembers } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('email', normalizedEmail)
        .not('accepted_at', 'is', null)
        .limit(1);

      if (existingMembers && existingMembers.length > 0) {
        return 'active_member';
      }

      // 2. Verificar se existe convite pendente (não expirado)
      const { data: pendingInvite } = await supabase
        .from('workspace_invites')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('email', normalizedEmail)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (pendingInvite) {
        return 'pending_invite';
      }

      // 3. Verificar se existe convite anterior (expirado)
      const { data: expiredInvite } = await supabase
        .from('workspace_invites')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (expiredInvite) {
        return 'previous_invite';
      }

      return null;
    } catch (error) {
      console.error('Error checking email status:', error);
      return null;
    }
  };

  const inviteMember = async (
    email: string, 
    role: WorkspaceRole, 
    permissions: StagePermissions
  ): Promise<boolean> => {
    if (!workspace) {
      toast.error('Nenhum workspace encontrado');
      return false;
    }

    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Verificar limite de convidados
      const { data: canInvite } = await supabase.rpc('can_invite_to_workspace', {
        _workspace_id: workspace.id
      });

      if (!canInvite) {
        toast.error('Limite de convidados atingido');
        return false;
      }

      // Verificar se já é membro ativo
      const { data: existingMembers } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('email', normalizedEmail)
        .not('accepted_at', 'is', null)
        .limit(1);

      if (existingMembers && existingMembers.length > 0) {
        toast.error('Este email já pertence a um membro ativo do workspace.');
        return false;
      }

      // Verificar se existe qualquer convite anterior (expirado ou não) e deletar
      const { data: existingInvite } = await supabase
        .from('workspace_invites')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingInvite) {
        await supabase
          .from('workspace_invites')
          .delete()
          .eq('id', existingInvite.id);
      }

      // Verificar se já é membro
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      // Inserir convite no banco
      const { data: inviteData, error } = await supabase.from('workspace_invites').insert({
        workspace_id: workspace.id,
        email: normalizedEmail,
        role,
        allowed_timer_stages: permissions.allowed_timer_stages,
        can_edit_stages: permissions.can_edit_stages,
        invited_by: userData.user.id,
      }).select().single();

      if (error) {
        throw error;
      }

      // Buscar dados do profile para pegar o nome do usuário que está convidando
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', userData.user.id)
        .single();

      const inviterName = profile?.username || userData.user.email?.split('@')[0] || 'Um usuário';

      const isResend = !!existingInvite;

      // Enviar email de convite via Edge Function
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
          body: {
            inviteId: inviteData.id,
            toEmail: normalizedEmail,
            inviterName,
            workspaceName: workspace.name,
            role,
          },
        });

        if (emailError) {
          console.error('Error sending invite email:', emailError);
          // Não falhar a operação se o email não for enviado
          toast.success(isResend 
            ? 'Convite reenviado! (Email pode demorar alguns minutos)' 
            : 'Convite criado! (Email pode demorar alguns minutos)');
        } else {
          toast.success(isResend 
            ? 'Convite reenviado por email!' 
            : 'Convite enviado por email!');
        }
      } catch (emailErr) {
        console.error('Error invoking email function:', emailErr);
        toast.success(isResend 
          ? 'Convite reenviado! (Email pode demorar alguns minutos)' 
          : 'Convite criado! (Email pode demorar alguns minutos)');
      }

      await fetchWorkspace();
      return true;
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Erro ao enviar convite');
      return false;
    }
  };

  const resendInvite = async (inviteId: string): Promise<boolean> => {
    if (!workspace) return false;

    try {
      // Buscar dados do convite
      const invite = invites.find(i => i.id === inviteId);
      if (!invite) {
        toast.error('Convite não encontrado');
        return false;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      // Buscar dados do profile para pegar o nome do usuário que está convidando
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', userData.user.id)
        .single();

      const inviterName = profile?.username || userData.user.email?.split('@')[0] || 'Um usuário';

      // Reenviar email de convite via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
        body: {
          inviteId: invite.id,
          toEmail: invite.email,
          inviterName,
          workspaceName: workspace.name,
          role: invite.role,
        },
      });

      if (emailError) {
        console.error('Error resending invite email:', emailError);
        toast.error('Erro ao reenviar email');
        return false;
      }

      toast.success('Convite reenviado por email!');
      return true;
    } catch (error) {
      console.error('Error resending invite:', error);
      toast.error('Erro ao reenviar convite');
      return false;
    }
  };

  const removeMember = async (memberId: string): Promise<boolean> => {
    if (!workspace) return false;

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)
        .eq('workspace_id', workspace.id);

      if (error) throw error;

      toast.success('Membro removido com sucesso');
      await fetchWorkspace();
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Erro ao remover membro');
      return false;
    }
  };

  const updateMemberPermissions = async (
    memberId: string, 
    permissions: StagePermissions
  ): Promise<boolean> => {
    if (!workspace) return false;

    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({
          allowed_timer_stages: permissions.allowed_timer_stages,
          can_edit_stages: permissions.can_edit_stages,
        })
        .eq('id', memberId)
        .eq('workspace_id', workspace.id);

      if (error) throw error;

      toast.success('Permissões atualizadas');
      await fetchWorkspace();
      return true;
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Erro ao atualizar permissões');
      return false;
    }
  };

  const cancelInvite = async (inviteId: string): Promise<boolean> => {
    if (!workspace) return false;

    try {
      const { error } = await supabase
        .from('workspace_invites')
        .delete()
        .eq('id', inviteId)
        .eq('workspace_id', workspace.id);

      if (error) throw error;

      toast.success('Convite cancelado');
      await fetchWorkspace();
      return true;
    } catch (error) {
      console.error('Error canceling invite:', error);
      toast.error('Erro ao cancelar convite');
      return false;
    }
  };

  // Create a new workspace (for Studio plan users)
  const createWorkspace = async (name: string): Promise<{ success: boolean; limitReached?: boolean; workspaceId?: string }> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Usuário não autenticado');
        return { success: false };
      }

      // Count current owned workspaces
      const { data: ownedWorkspaces, error: countError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', userData.user.id);

      if (countError) {
        console.error('Error counting workspaces:', countError);
        toast.error('Erro ao verificar limite');
        return { success: false };
      }

      const currentCount = ownedWorkspaces?.length || 0;

      // Get user's plan limits from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type, extra_workspaces_packs, is_internal_tester')
        .eq('user_id', userData.user.id)
        .single();

      // Use plan_type from DB directly - is_internal_tester is only for SIMULATING, not auto-upgrading
      const rawPlanType = (profile as any)?.plan_type || 'free';
      const extraPacks = (profile as any)?.extra_workspaces_packs || 0;
      
      // Check if user is simulating a plan
      const simulatedPlan = localStorage.getItem('muzze_simulated_plan_type');
      const isTester = (profile as any)?.is_internal_tester === true;
      const effectivePlanType = (simulatedPlan && isTester) ? simulatedPlan : rawPlanType;

      const { data: planLimits } = await supabase
        .from('plan_limits')
        .select('max_workspaces')
        .eq('plan_type', effectivePlanType)
        .single();

      const baseLimit = planLimits?.max_workspaces || 1;
      const totalLimit = baseLimit + (extraPacks * 5);

      // Check limit
      if (currentCount >= totalLimit) {
        return { success: false, limitReached: true };
      }

      // Create workspace
      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          owner_id: userData.user.id,
          name: name.trim() || 'Novo Workspace',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating workspace:', createError);
        toast.error('Erro ao criar workspace');
        return { success: false };
      }

      toast.success('Workspace criado com sucesso!');
      await fetchWorkspace();
      return { success: true, workspaceId: newWorkspace.id };
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Erro ao criar workspace');
      return { success: false };
    }
  };

  return {
    workspace,
    myRole,
    members,
    invites,
    isLoading,
    isOwner: myRole === 'owner',
    isAdmin: myRole === 'admin',
    inviteMember,
    removeMember,
    updateMemberPermissions,
    cancelInvite,
    resendInvite,
    checkEmailStatus,
    createWorkspace,
    refetch: fetchWorkspace,
  };
};
