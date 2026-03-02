import { CreativeStage, CREATIVE_STAGES } from "@/types/workspace";

export type WorkflowTemplateId = 'classic' | 'freestyle' | 'minimalist';

export interface IdeationConfig {
  centralIdeaLabel: string;
  centralIdeaPlaceholder: string;
  musicRequired: boolean;
}

export interface WorkflowTemplate {
  id: WorkflowTemplateId;
  name: string;
  description: string;
  stages: CreativeStage[];
  icon: string;
  gradient: string;
  ideationConfig: IdeationConfig;
}

export const WORKFLOW_TEMPLATES: Record<WorkflowTemplateId, WorkflowTemplate> = {
  classic: {
    id: 'classic',
    name: 'Clássico',
    description: 'O fluxo completo de produção',
    stages: ['ideation', 'script', 'review', 'recording', 'editing'],
    icon: '🎬',
    gradient: 'from-blue-500 to-cyan-500',
    ideationConfig: { centralIdeaLabel: 'Ideia Central', centralIdeaPlaceholder: 'Descreva a ideia central do seu conteúdo...', musicRequired: false },
  },
  freestyle: {
    id: 'freestyle',
    name: 'Freestyle',
    description: 'Pra quem improvisa na hora',
    stages: ['ideation', 'recording', 'editing'],
    icon: '🎤',
    gradient: 'from-orange-500 to-yellow-500',
    ideationConfig: { centralIdeaLabel: 'Ideia Central', centralIdeaPlaceholder: 'Descreva a ideia central do seu conteúdo...', musicRequired: false },
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalista',
    description: 'Ideal para edits e montagens',
    stages: ['ideation', 'editing'],
    icon: '✂️',
    gradient: 'from-purple-500 to-pink-500',
    ideationConfig: { centralIdeaLabel: 'Mensagem a ser passada', centralIdeaPlaceholder: 'Qual a mensagem que você quer passar nesse edit?', musicRequired: true },
  },
};

export const DEFAULT_TEMPLATE_ID: WorkflowTemplateId = 'classic';

export const WORKFLOW_TEMPLATES_LIST = Object.values(WORKFLOW_TEMPLATES);

export function getWorkflowTemplate(id: WorkflowTemplateId | string | null | undefined): WorkflowTemplate {
  if (id && id in WORKFLOW_TEMPLATES) {
    return WORKFLOW_TEMPLATES[id as WorkflowTemplateId];
  }
  return WORKFLOW_TEMPLATES[DEFAULT_TEMPLATE_ID];
}

export function isValidWorkflowTemplateId(id: string | null | undefined): id is WorkflowTemplateId {
  return id !== null && id !== undefined && id in WORKFLOW_TEMPLATES;
}

export function getStageLabel(stage: CreativeStage): string {
  return CREATIVE_STAGES[stage]?.label || stage;
}
