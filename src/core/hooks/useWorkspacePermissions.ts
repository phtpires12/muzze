import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceRole, CreativeStage } from '@/types/workspace';

interface UseWorkspacePermissionsReturn {
  myRole: WorkspaceRole | null;
  isLoading: boolean;
  canUseTimer: (stage: CreativeStage) => Promise<boolean>;
  canEditStage: (stage: CreativeStage) => Promise<boolean>;
  canInviteGuests: boolean;
  canRemoveGuests: boolean;
  canMoveCalendar: boolean;
  canManagePermissions: boolean;
  canViewAllContent: boolean;
}

export const useWorkspacePermissions = (workspaceId?: string): UseWorkspacePermissionsReturn => {
  const [myRole, setMyRole] = useState<WorkspaceRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!workspaceId) {
        // Se não tem workspaceId, verificar se sou owner de algum workspace
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setIsLoading(false);
          return;
        }

        const { data: ownWorkspace } = await supabase
          .from('workspaces')
          .select('id')
          .eq('owner_id', userData.user.id)
          .maybeSingle();

        if (ownWorkspace) {
          setMyRole('owner');
        }
        setIsLoading(false);
        return;
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setIsLoading(false);
          return;
        }

        const { data: role } = await supabase.rpc('get_workspace_role', {
          _user_id: userData.user.id,
          _workspace_id: workspaceId,
        });

        setMyRole(role as WorkspaceRole | null);
      } catch (error) {
        console.error('Error fetching workspace role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [workspaceId]);

  const canUseTimer = useCallback(async (stage: CreativeStage): Promise<boolean> => {
    // Owners podem sempre usar o timer
    if (myRole === 'owner') return true;

    if (!workspaceId) return true; // Se não está em workspace, pode usar

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      const { data } = await supabase.rpc('can_use_timer', {
        _user_id: userData.user.id,
        _workspace_id: workspaceId,
        _stage: stage,
      });

      return data || false;
    } catch (error) {
      console.error('Error checking timer permission:', error);
      return false;
    }
  }, [workspaceId, myRole]);

  const canEditStage = useCallback(async (stage: CreativeStage): Promise<boolean> => {
    // Owners podem sempre editar
    if (myRole === 'owner') return true;

    if (!workspaceId) return true; // Se não está em workspace, pode editar

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      const { data } = await supabase.rpc('can_edit_stage', {
        _user_id: userData.user.id,
        _workspace_id: workspaceId,
        _stage: stage,
      });

      return data || false;
    } catch (error) {
      console.error('Error checking edit permission:', error);
      return false;
    }
  }, [workspaceId, myRole]);

  // Permissões baseadas no papel
  const canInviteGuests = myRole === 'owner';
  const canRemoveGuests = myRole === 'owner';
  const canMoveCalendar = myRole === 'owner' || myRole === 'admin';
  const canManagePermissions = myRole === 'owner';
  const canViewAllContent = myRole === 'owner' || myRole === 'admin';

  return {
    myRole,
    isLoading,
    canUseTimer,
    canEditStage,
    canInviteGuests,
    canRemoveGuests,
    canMoveCalendar,
    canManagePermissions,
    canViewAllContent,
  };
};
