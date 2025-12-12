export type WorkspaceRole = 'owner' | 'admin' | 'collaborator';

export type CreativeStage = 'ideation' | 'script' | 'review' | 'recording' | 'editing';

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  max_guests: number;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  allowed_timer_stages: CreativeStage[];
  can_edit_stages: CreativeStage[];
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  // Dados do usuário (join)
  username?: string;
  email?: string;
}

export interface WorkspaceInvite {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  allowed_timer_stages: CreativeStage[];
  can_edit_stages: CreativeStage[];
  expires_at: string;
  invited_by: string;
  created_at: string;
}

export interface StagePermissions {
  allowed_timer_stages: CreativeStage[];
  can_edit_stages: CreativeStage[];
}

export const CREATIVE_STAGES: Record<CreativeStage, { key: CreativeStage; label: string; color: string }> = {
  ideation: { key: 'ideation', label: 'Ideação', color: 'gray' },
  script: { key: 'script', label: 'Roteiro', color: 'green' },
  review: { key: 'review', label: 'Revisão', color: 'blue' },
  recording: { key: 'recording', label: 'Gravação', color: 'orange' },
  editing: { key: 'editing', label: 'Edição', color: 'pink' },
} as const;
