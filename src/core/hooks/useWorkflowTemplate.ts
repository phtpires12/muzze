import { useCallback, useMemo } from "react";
import { useProfile } from '@/core/hooks/useProfile';
import { CreativeStage } from "@/types/workspace";
import {
  WorkflowTemplate,
  WorkflowTemplateId,
  getWorkflowTemplate,
  WORKFLOW_TEMPLATES_LIST,
  isValidWorkflowTemplateId,
} from '@/core/constants';
import { PRODUCTION_COLUMNS } from '@/core/constants/kanban-columns';

// Mapeamento bidirecional SessionStage <-> CreativeStage
export const SESSION_TO_CREATIVE: Record<string, CreativeStage> = {
  'idea': 'ideation',
  'ideation': 'ideation',
  'script': 'script',
  'review': 'review',
  'record': 'recording',
  'recording': 'recording',
  'edit': 'editing',
  'editing': 'editing',
  'design': 'design',
};

export const CREATIVE_TO_SESSION: Record<CreativeStage, string> = {
  'ideation': 'idea',
  'script': 'script',
  'review': 'review',
  'recording': 'record',
  'editing': 'edit',
  'design': 'design',
};

/**
 * Helper para obter a URL de navegação para o próximo estágio
 */
export function getNextStageUrl(
  currentStage: CreativeStage,
  template: WorkflowTemplate,
  scriptId: string
): string | null {
  const currentIndex = template.stages.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex >= template.stages.length - 1) {
    return null;
  }

  const nextCreativeStage = template.stages[currentIndex + 1];
  const sessionStage = CREATIVE_TO_SESSION[nextCreativeStage];

  // Gravação tem URL especial
  if (nextCreativeStage === 'recording') {
    return `/shot-list/record?scriptId=${scriptId}`;
  }

  // Edição agora vai para o novo Editing Workspace
  if (nextCreativeStage === 'editing') {
    return `/editing-workspace?scriptId=${scriptId}`;
  }

  return `/session?stage=${sessionStage}&scriptId=${scriptId}`;
}

/**
 * Helper para obter a URL de navegação para o estágio anterior
 */
export function getPrevStageUrl(
  currentStage: CreativeStage,
  template: WorkflowTemplate,
  scriptId: string
): string | null {
  const currentIndex = template.stages.indexOf(currentStage);
  if (currentIndex <= 0) {
    return null;
  }

  const prevCreativeStage = template.stages[currentIndex - 1];
  const sessionStage = CREATIVE_TO_SESSION[prevCreativeStage];

  // Gravação tem URL especial
  if (prevCreativeStage === 'recording') {
    return `/shot-list/record?scriptId=${scriptId}`;
  }

  // Revisão tem URL especial
  if (prevCreativeStage === 'review') {
    return `/shot-list/review?scriptId=${scriptId}`;
  }

  return `/session?stage=${sessionStage}&scriptId=${scriptId}`;
}

interface UseWorkflowTemplateOptions {
  /** 
   * Workflow específico do conteúdo (sobrescreve o global).
   * Se null/undefined, usa o workflow global do usuário.
   */
  scriptWorkflow?: WorkflowTemplateId | null;
}

/**
 * Hook para gerenciar workflows de criação de conteúdo.
 * 
 * Suporta duas camadas:
 * 1. Workflow Global: definido em profile.current_workflow
 * 2. Workflow por Conteúdo: passado via options.scriptWorkflow
 * 
 * O workflow por conteúdo, quando definido, sobrescreve o global.
 */
export function useWorkflowTemplate(options?: UseWorkflowTemplateOptions) {
  const { profile, updateProfile } = useProfile();

  // Workflow global do usuário
  const globalTemplateId = profile?.current_workflow as WorkflowTemplateId | null;

  // Workflow efetivo: conteúdo > global
  const effectiveTemplateId = options?.scriptWorkflow || globalTemplateId;

  const globalTemplate = useMemo(() => {
    return getWorkflowTemplate(globalTemplateId);
  }, [globalTemplateId]);

  const currentTemplate = useMemo(() => {
    return getWorkflowTemplate(effectiveTemplateId);
  }, [effectiveTemplateId]);

  const stages = currentTemplate.stages;

  // Indica se está usando workflow específico do conteúdo (diferente do global)
  const isUsingContentWorkflow = options?.scriptWorkflow !== undefined &&
    options?.scriptWorkflow !== null &&
    options?.scriptWorkflow !== globalTemplateId;

  const setTemplate = useCallback(async (templateId: WorkflowTemplateId) => {
    await updateProfile({ current_workflow: templateId });
  }, [updateProfile]);

  const nextStage = useCallback((currentStage: CreativeStage): CreativeStage | null => {
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex >= stages.length - 1) {
      return null;
    }
    return stages[currentIndex + 1];
  }, [stages]);

  const prevStage = useCallback((currentStage: CreativeStage): CreativeStage | null => {
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex <= 0) {
      return null;
    }
    return stages[currentIndex - 1];
  }, [stages]);

  const isFirstStage = useCallback((stage: CreativeStage): boolean => {
    return stages.indexOf(stage) === 0;
  }, [stages]);

  const isLastStage = useCallback((stage: CreativeStage): boolean => {
    return stages.indexOf(stage) === stages.length - 1;
  }, [stages]);

  const isStageIncluded = useCallback((stage: CreativeStage): boolean => {
    return stages.includes(stage);
  }, [stages]);

  const getOrderedKanbanColumns = useCallback(() => {
    return stages
      .map(stage => PRODUCTION_COLUMNS.find(col => col.id === stage))
      .filter(Boolean);
  }, [stages]);

  /**
   * Obtém a URL para navegar para o próximo estágio
   */
  const getNextUrl = useCallback((currentStage: CreativeStage, scriptId: string): string | null => {
    return getNextStageUrl(currentStage, currentTemplate, scriptId);
  }, [currentTemplate]);

  /**
   * Obtém a URL para navegar para o estágio anterior
   */
  const getPrevUrl = useCallback((currentStage: CreativeStage, scriptId: string): string | null => {
    return getPrevStageUrl(currentStage, currentTemplate, scriptId);
  }, [currentTemplate]);

  return {
    // Template global do usuário
    globalTemplate,
    globalTemplateId: globalTemplate.id,
    // Template efetivo (considerando workflow do conteúdo)
    currentTemplate,
    currentTemplateId: currentTemplate.id,
    // Stages do template efetivo
    stages,
    // Indica se está usando workflow específico do conteúdo
    isUsingContentWorkflow,
    // Lista de templates disponíveis
    availableTemplates: WORKFLOW_TEMPLATES_LIST,
    // Métodos
    setTemplate,
    nextStage,
    prevStage,
    isFirstStage,
    isLastStage,
    isStageIncluded,
    getOrderedKanbanColumns,
    // Helpers de navegação
    getNextUrl,
    getPrevUrl,
  };
}
