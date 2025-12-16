export const KANBAN_COLUMNS = [
  { id: 'ideation', label: 'Ideação', status: 'draft_idea', color: 'bg-zinc-400' },
  { id: 'script', label: 'Roteiro', status: 'draft', color: 'bg-purple-500' },
  { id: 'review', label: 'Revisão', status: 'review', color: 'bg-blue-400' },
  { id: 'recording', label: 'Gravação', status: 'recording', color: 'bg-orange-500' },
  { id: 'editing', label: 'Edição', status: 'editing', color: 'bg-cyan-500' },
] as const;

export type KanbanColumnId = typeof KANBAN_COLUMNS[number]['id'];

// Mapear status -> coluna
export const getColumnForStatus = (status: string | null): KanbanColumnId => {
  const column = KANBAN_COLUMNS.find(col => col.status === status);
  return column?.id || 'ideation';
};

// Mapear coluna -> status (para persistir no banco)
export const getStatusForColumn = (columnId: KanbanColumnId): string => {
  const column = KANBAN_COLUMNS.find(col => col.id === columnId);
  return column?.status || 'draft_idea';
};
