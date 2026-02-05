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

export function useWorkflowTemplate() {
  const { profile, updateProfile } = useProfile();

  const currentTemplateId = profile?.current_workflow as WorkflowTemplateId | null;
  
  const currentTemplate = useMemo(() => {
    return getWorkflowTemplate(currentTemplateId);
  }, [currentTemplateId]);

  const stages = currentTemplate.stages;

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
    currentTemplate,
    currentTemplateId: currentTemplate.id,
    stages,
    availableTemplates: WORKFLOW_TEMPLATES_LIST,
    setTemplate,
    nextStage,
    prevStage,
    isFirstStage,
    isLastStage,
    isStageIncluded,
    getOrderedKanbanColumns,
  };
}
