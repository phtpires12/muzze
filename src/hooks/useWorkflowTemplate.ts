import { useCallback, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { CreativeStage } from "@/types/workspace";
import { 
  WorkflowTemplate, 
  WorkflowTemplateId, 
  getWorkflowTemplate, 
  WORKFLOW_TEMPLATES_LIST,
  isValidWorkflowTemplateId,
} from "@/lib/workflow-templates";
import { PRODUCTION_COLUMNS } from "@/lib/kanban-columns";

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
  };
}
