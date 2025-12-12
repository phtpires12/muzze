import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CreativeStage } from '@/types/workspace';

interface UseTimerPermissionReturn {
  canUseTimer: boolean;
  workspaceId: string | null;
  isLoading: boolean;
}

export const useTimerPermission = (
  scriptId?: string | null,
  stage?: CreativeStage
): UseTimerPermissionReturn => {
  const [canUseTimer, setCanUseTimer] = useState(true); // Default: true (owner behavior)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setCanUseTimer(false);
          setIsLoading(false);
          return;
        }

        let wsId: string | null = null;

        // If we have a scriptId, get workspace_id from the script
        if (scriptId && scriptId !== 'null' && scriptId !== 'undefined') {
          const { data: script } = await supabase
            .from('scripts')
            .select('workspace_id')
            .eq('id', scriptId)
            .maybeSingle();

          wsId = script?.workspace_id || null;
        }

        // If no workspace from script, get user's own workspace
        if (!wsId) {
          const { data: userWorkspaceId } = await supabase.rpc('get_user_workspace', {
            _user_id: userData.user.id
          });
          wsId = userWorkspaceId;
        }

        setWorkspaceId(wsId);

        // If no workspace, user is solo - always allow timer
        if (!wsId) {
          setCanUseTimer(true);
          setIsLoading(false);
          return;
        }

        // Check if user is owner of the workspace
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('owner_id')
          .eq('id', wsId)
          .maybeSingle();

        if (workspace?.owner_id === userData.user.id) {
          // Owner can always use timer
          setCanUseTimer(true);
          setIsLoading(false);
          return;
        }

        // If stage is provided, check specific permission
        if (stage) {
          const { data: canUse } = await supabase.rpc('can_use_timer', {
            _user_id: userData.user.id,
            _workspace_id: wsId,
            _stage: stage,
          });
          setCanUseTimer(canUse || false);
        } else {
          // No stage provided, default to allowing timer
          setCanUseTimer(true);
        }
      } catch (error) {
        console.error('Error checking timer permission:', error);
        setCanUseTimer(true); // Default to allowing on error
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [scriptId, stage]);

  return { canUseTimer, workspaceId, isLoading };
};
