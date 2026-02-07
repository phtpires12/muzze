import { CreativeStage } from "@/types/workspace";

// === KANBAN DE PRODUÇÃO (baseado em status) ===
export const PRODUCTION_COLUMNS = [
  { id: 'ideation' as CreativeStage, label: 'Ideação', status: 'draft_idea', color: 'bg-zinc-400' },
  { id: 'script' as CreativeStage, label: 'Roteiro', status: 'draft', color: 'bg-purple-500' },
  { id: 'review' as CreativeStage, label: 'Revisão', status: 'review', color: 'bg-blue-400' },
  { id: 'recording' as CreativeStage, label: 'Gravação', status: 'recording', color: 'bg-orange-500' },
  { id: 'editing' as CreativeStage, label: 'Edição', status: 'editing', color: 'bg-cyan-500' },
] as const;

export type ProductionColumn = typeof PRODUCTION_COLUMNS[number];
export type ProductionColumnId = ProductionColumn['id'];

// === COLUNA ESPECIAL PARA CONTEÚDOS ÓRFÃOS ===
export const ORPHAN_COLUMN = {
  id: 'orphan' as const,
  label: 'Outras Etapas',
  status: null,
  color: 'bg-amber-500',
  isSpecial: true,
};

export type OrphanColumn = typeof ORPHAN_COLUMN;

// === HELPER: OBTER COLUNAS ORDENADAS POR TEMPLATE ===
export function getOrderedProductionColumns(stages: CreativeStage[]): ProductionColumn[] {
  return stages
    .map(stage => PRODUCTION_COLUMNS.find(col => col.id === stage))
    .filter((col): col is ProductionColumn => col !== undefined);
}

// === HELPER: DETECTAR SCRIPTS ÓRFÃOS ===
export interface OrphanableScript {
  id: string;
  status: string | null;
  workflow_template?: string | null;
}

/**
 * Identifica scripts que estão em etapas que não existem no workflow ativo.
 * Por exemplo, se o usuário usa "Minimalista" (Ideação → Edição), 
 * scripts em "Roteiro", "Revisão" ou "Gravação" são órfãos.
 */
export function getOrphanScripts<T extends OrphanableScript>(
  scripts: T[], 
  activeStages: CreativeStage[]
): T[] {
  return scripts.filter(script => {
    const scriptStage = getProductionColumnForStatus(script.status);
    return !activeStages.includes(scriptStage);
  });
}

/**
 * Retorna o label da etapa original de um script órfão (para exibir no badge)
 */
export function getOrphanOriginalStageLabel(status: string | null): string {
  const column = PRODUCTION_COLUMNS.find(col => col.status === status);
  return column?.label || 'Desconhecido';
}

// === KANBAN DE PUBLICAÇÃO (baseado em publish_status) ===
export const PUBLICATION_COLUMNS = [
  { id: 'scheduled', label: 'Agendados', status: 'planejado', color: 'bg-blue-500' },
  { id: 'ready', label: 'Pronto p/ Postar', status: 'pronto_para_postar', color: 'bg-green-500' },
  { id: 'posted', label: 'Postados', status: 'postado', color: 'bg-emerald-600' },
  { id: 'lost', label: 'Perdidos', status: 'perdido', color: 'bg-red-500' },
] as const;

export type PublicationColumnId = typeof PUBLICATION_COLUMNS[number]['id'];

// === REGRAS DE DRAG & DROP PARA PUBLICAÇÃO ===
export const PUBLICATION_DRAG_RULES = {
  // Movimentos permitidos pelo usuário
  allowed: [
    { from: 'ready', to: 'posted' },
  ],
  // Movimentos bloqueados (sistema faz automaticamente ou não permitido)
  blocked: [
    { from: 'scheduled', to: 'ready', reason: 'Complete todas as etapas de edição' },
    { from: 'scheduled', to: 'posted', reason: 'Complete a edição primeiro' },
    { from: 'posted', to: 'scheduled', reason: 'Conteúdo já foi publicado' },
    { from: 'posted', to: 'ready', reason: 'Conteúdo já foi publicado' },
    { from: 'lost', to: 'scheduled', reason: 'Use o botão "Reagendar" no card' },
    { from: 'lost', to: 'ready', reason: 'Reagende o conteúdo primeiro' },
    { from: 'lost', to: 'posted', reason: 'Reagende o conteúdo primeiro' },
  ],
};


// === HELPERS PARA PRODUÇÃO ===
export const getProductionColumnForStatus = (status: string | null): ProductionColumnId => {
  const column = PRODUCTION_COLUMNS.find(col => col.status === status);
  return column?.id || 'ideation';
};

export const getStatusForProductionColumn = (columnId: ProductionColumnId): string => {
  const column = PRODUCTION_COLUMNS.find(col => col.id === columnId);
  return column?.status || 'draft_idea';
};

// === HELPERS PARA PUBLICAÇÃO ===
export const getPublicationColumnForStatus = (publishStatus: string | null): PublicationColumnId => {
  const column = PUBLICATION_COLUMNS.find(col => col.status === publishStatus);
  return column?.id || 'scheduled';
};

export const getPublishStatusForColumn = (columnId: PublicationColumnId): string => {
  const column = PUBLICATION_COLUMNS.find(col => col.id === columnId);
  return column?.status || 'planejado';
};

// === VALIDAÇÃO DE DRAG & DROP PARA PUBLICAÇÃO ===
export const isPublicationDragAllowed = (
  fromColumnId: string, 
  toColumnId: string
): { allowed: boolean; reason?: string } => {
  // Verificar se está bloqueado
  const blockedRule = PUBLICATION_DRAG_RULES.blocked.find(
    rule => rule.from === fromColumnId && rule.to === toColumnId
  );
  
  if (blockedRule) {
    return { allowed: false, reason: blockedRule.reason };
  }
  
  // Verificar se está explicitamente permitido
  const isAllowed = PUBLICATION_DRAG_RULES.allowed.some(
    rule => rule.from === fromColumnId && rule.to === toColumnId
  );
  
  if (!isAllowed) {
    return { allowed: false, reason: 'Este movimento não é permitido.' };
  }
  
  return { allowed: true };
};

// === LEGACY EXPORTS (para compatibilidade) ===
export const KANBAN_COLUMNS = PRODUCTION_COLUMNS;
export type KanbanColumnId = ProductionColumnId;
export const getColumnForStatus = getProductionColumnForStatus;
export const getStatusForColumn = getStatusForProductionColumn;
