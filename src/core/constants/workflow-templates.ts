import { CreativeStage, CREATIVE_STAGES } from "@/types/workspace";

export type WorkflowTemplateId = 'classic' | 'freestyle' | 'minimalist' | 'carousel';

export interface IdeationConfig {
  centralIdeaLabel: string;
  centralIdeaPlaceholder: string;
  musicRequired: boolean;
}

export interface ContentSection {
  key: string;
  label: string;
}

export const DEFAULT_SECTIONS: ContentSection[] = [
  { key: 'gancho', label: '🪝 GANCHO' },
  { key: 'setup', label: '🤨 SETUP' },
  { key: 'desenvolvimento', label: '🦅 DESENVOLVIMENTO' },
  { key: 'conclusao', label: '📩 CONCLUSÃO' },
];

export const CAROUSEL_SECTIONS: ContentSection[] = [
  { key: 'capa', label: '🖼️ CAPA' },
  { key: 'aquecimento', label: '🔥 AQUECIMENTO' },
  { key: 'vida_comum', label: '🌍 VIDA COMUM' },
  { key: 'dor_conflito', label: '⚔️ DOR/CONFLITO' },
  { key: 'virada', label: '🔄 VIRADA' },
  { key: 'solucao', label: '💡 SOLUÇÃO' },
  { key: 'cta', label: '📢 CTA' },
];

export interface WorkflowTemplate {
  id: WorkflowTemplateId;
  name: string;
  description: string;
  stages: CreativeStage[];
  icon: string;
  gradient: string;
  ideationConfig: IdeationConfig;
  sections: ContentSection[];
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
    sections: DEFAULT_SECTIONS,
  },
  freestyle: {
    id: 'freestyle',
    name: 'Freestyle',
    description: 'Pra quem improvisa na hora',
    stages: ['ideation', 'recording', 'editing'],
    icon: '🎤',
    gradient: 'from-orange-500 to-yellow-500',
    ideationConfig: { centralIdeaLabel: 'Ideia Central', centralIdeaPlaceholder: 'Descreva a ideia central do seu conteúdo...', musicRequired: false },
    sections: DEFAULT_SECTIONS,
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalista',
    description: 'Ideal para edits e montagens',
    stages: ['ideation', 'editing'],
    icon: '✂️',
    gradient: 'from-purple-500 to-pink-500',
    ideationConfig: { centralIdeaLabel: 'Mensagem a ser passada', centralIdeaPlaceholder: 'Qual a mensagem que você quer passar nesse edit?', musicRequired: true },
    sections: DEFAULT_SECTIONS,
  },
  carousel: {
    id: 'carousel',
    name: 'Carrossel',
    description: 'Focado em textos e slides',
    stages: ['ideation', 'script', 'review', 'design'],
    icon: '📱',
    gradient: 'from-emerald-500 to-teal-500',
    ideationConfig: { centralIdeaLabel: 'Ideia Central', centralIdeaPlaceholder: 'Qual o tema ou assunto principal do carrossel?', musicRequired: false },
    sections: CAROUSEL_SECTIONS,
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
