import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceRole } from '@/types/workspace';

interface WorkspaceInfo {
  workspace: Workspace;
  role: WorkspaceRole;
  ownerName?: string;
}

interface WorkspaceContextType {
  activeWorkspace: Workspace | null;
  activeRole: WorkspaceRole | null;
  allWorkspaces: WorkspaceInfo[];
  switchWorkspace: (workspaceId: string) => Promise<void>;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const ACTIVE_WORKSPACE_KEY = 'muzze_active_workspace';

export const WorkspaceContextProvider = ({ children }: { children: ReactNode }) => {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [activeRole, setActiveRole] = useState<WorkspaceRole | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setIsLoading(false);
        return;
      }

      const userId = userData.user.id;
      const workspacesList: WorkspaceInfo[] = [];

      // 1. Buscar workspace próprio (onde sou owner)
      const { data: ownWorkspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      if (ownWorkspace) {
        workspacesList.push({
          workspace: ownWorkspace as Workspace,
          role: 'owner',
        });
      }

      // 2. Buscar workspaces onde sou membro (convidado)
      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('role, workspaces(*)')
        .eq('user_id', userId)
        .not('accepted_at', 'is', null);

      if (memberships) {
        for (const membership of memberships) {
          if (membership.workspaces) {
            const ws = membership.workspaces as unknown as Workspace;
            
            // Buscar nome do owner do workspace
            let ownerName: string | undefined;
            const { data: ownerProfile } = await supabase
              .from('profiles')
              .select('username')
              .eq('user_id', ws.owner_id)
              .maybeSingle();
            
            if (ownerProfile?.username) {
              ownerName = ownerProfile.username;
            } else {
              // Fallback: buscar email do owner via auth (não é possível diretamente)
              // Usar owner_id como fallback visual
              ownerName = undefined;
            }
            
            workspacesList.push({
              workspace: ws,
              role: membership.role as WorkspaceRole,
              ownerName,
            });
          }
        }
      }

      setAllWorkspaces(workspacesList);

      // 3. Determinar workspace ativo
      const savedActiveId = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
      let activeWs = workspacesList.find(w => w.workspace.id === savedActiveId);

      // Se não encontrou o salvo, usar o próprio (owner) ou primeiro da lista
      if (!activeWs && workspacesList.length > 0) {
        activeWs = workspacesList.find(w => w.role === 'owner') || workspacesList[0];
      }

      if (activeWs) {
        setActiveWorkspace(activeWs.workspace);
        setActiveRole(activeWs.role);
        localStorage.setItem(ACTIVE_WORKSPACE_KEY, activeWs.workspace.id);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllWorkspaces();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchAllWorkspaces();
      } else if (event === 'SIGNED_OUT') {
        setActiveWorkspace(null);
        setActiveRole(null);
        setAllWorkspaces([]);
        localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAllWorkspaces]);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    const targetWs = allWorkspaces.find(w => w.workspace.id === workspaceId);
    if (targetWs) {
      setActiveWorkspace(targetWs.workspace);
      setActiveRole(targetWs.role);
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
    }
  }, [allWorkspaces]);

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        activeRole,
        allWorkspaces,
        switchWorkspace,
        isLoading,
        refetch: fetchAllWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspaceContext = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceContextProvider');
  }
  return context;
};
