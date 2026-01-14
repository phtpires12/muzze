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

      // Buscar workspace próprio (onde sou owner)
      const { data: ownWorkspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      if (ownWorkspace) {
        setWorkspace(ownWorkspace as Workspace);
        setMyRole('owner');

        // Buscar membros do workspace
        const { data: membersData } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('workspace_id', ownWorkspace.id);

        if (membersData) {
          // Buscar usernames dos membros
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

        // Buscar convites pendentes
        const { data: invitesData } = await supabase
          .from('workspace_invites')
          .select('*')
          .eq('workspace_id', ownWorkspace.id)
          .gt('expires_at', new Date().toISOString());

        if (invitesData) {
          setInvites(invitesData.map(i => ({
            ...i,
            role: i.role as WorkspaceRole,
            allowed_timer_stages: (i.allowed_timer_stages || []) as CreativeStage[],
            can_edit_stages: (i.can_edit_stages || []) as CreativeStage[],
          })));
        }
      } else {
        // Verificar se sou membro de algum workspace
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('*, workspaces(*)')
          .eq('user_id', userId)
          .not('accepted_at', 'is', null)
          .maybeSingle();

        if (membership && membership.workspaces) {
          const ws = membership.workspaces as unknown as Workspace;
          setWorkspace(ws);
          setMyRole(membership.role as WorkspaceRole);
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
      // Verificar limite de convidados
      const { data: canInvite } = await supabase.rpc('can_invite_to_workspace', {
        _workspace_id: workspace.id
      });

      if (!canInvite) {
        toast.error('Limite de 3 convidados atingido');
        return false;
      }

      // Verificar se já existe convite pendente no banco (fonte da verdade)
      const { data: existingInvite } = await supabase
        .from('workspace_invites')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('email', email.toLowerCase())
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (existingInvite) {
        toast.error('Já existe um convite pendente para este email. Use a opção "Reenviar".');
        return false;
      }

      // Verificar se já é membro
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      // Inserir convite no banco
      const { data: inviteData, error } = await supabase.from('workspace_invites').insert({
        workspace_id: workspace.id,
        email: email.toLowerCase(),
        role,
        allowed_timer_stages: permissions.allowed_timer_stages,
        can_edit_stages: permissions.can_edit_stages,
        invited_by: userData.user.id,
      }).select().single();

      if (error) {
        // Tratar erro de duplicata como fallback (race condition)
        if (error.code === '23505') {
          toast.error('Já existe um convite pendente para este email. Use a opção "Reenviar".');
          return false;
        }
        throw error;
      }

      // Buscar dados do profile para pegar o nome do usuário que está convidando
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', userData.user.id)
        .single();

      const inviterName = profile?.username || userData.user.email?.split('@')[0] || 'Um usuário';

      // Enviar email de convite via Edge Function
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
          body: {
            inviteId: inviteData.id,
            toEmail: email.toLowerCase(),
            inviterName,
            workspaceName: workspace.name,
            role,
          },
        });

        if (emailError) {
          console.error('Error sending invite email:', emailError);
          // Não falhar a operação se o email não for enviado
          toast.success('Convite criado! (Email pode demorar alguns minutos)');
        } else {
          toast.success('Convite enviado por email!');
        }
      } catch (emailErr) {
        console.error('Error invoking email function:', emailErr);
        toast.success('Convite criado! (Email pode demorar alguns minutos)');
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
    refetch: fetchWorkspace,
  };
};
