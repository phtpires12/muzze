// Sistema de workflows personalizados

export type WorkflowType = 'A' | 'B' | 'C';

export interface Workflow {
  id: WorkflowType;
  name: string;
  description: string;
  problem: string;
  solution: string;
  features: string[];
  icon: string;
  color: string;
}

export const WORKFLOWS: Record<WorkflowType, Workflow> = {
  A: {
    id: 'A',
    name: 'Executor',
    description: 'Para quem tem muitas ideias, mas não executa',
    problem: 'Você tem um caderno cheio de ideias, mas não consegue transformá-las em conteúdo',
    solution: 'Foco em execução e cronômetros para transformar ideias em ação',
    features: [
      'Cronômetros por etapa para cada ideia',
      'Lembretes para executar ideias antigas',
      'Priorização automática de ideias',
      'Meta diária de tempo de execução',
    ],
    icon: '⚡',
    color: 'hsl(33 100% 50%)',
  },
  B: {
    id: 'B',
    name: 'Idealizador',
    description: 'Para quem tem dificuldade de gerar novas ideias',
    problem: 'Você quer criar, mas não sabe sobre o que fazer conteúdo',
    solution: 'Ferramentas de inspiração e brainstorming guiado',
    features: [
      'Prompts diários de ideias',
      'Biblioteca de referências',
      'Templates de conteúdo',
      'Comunidade para inspiração',
    ],
    icon: '💡',
    color: 'hsl(262 83% 58%)',
  },
  C: {
    id: 'C',
    name: 'Desenvolvedor',
    description: 'Para quem tem boas ideias, mas não sabe desenvolvê-las',
    problem: 'Você tem ideias interessantes, mas não consegue transformá-las em roteiros completos',
    solution: 'Estruturas e templates para desenvolver ideias em roteiros',
    features: [
      'Templates de roteiros por formato',
      'Guia passo a passo de desenvolvimento',
      'Checklist de elementos narrativos',
      'Expansão assistida de ideias',
    ],
    icon: '🎬',
    color: 'hsl(142 76% 36%)',
  },
};

export function getWorkflow(type: WorkflowType): Workflow {
  return WORKFLOWS[type];
}

export function getUserWorkflow(): WorkflowType | null {
  return localStorage.getItem('userWorkflow') as WorkflowType | null;
}

export function setUserWorkflow(type: WorkflowType): void {
  localStorage.setItem('userWorkflow', type);
}

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem('onboardingCompleted') === 'true';
}

export function completeOnboarding(): void {
  localStorage.setItem('onboardingCompleted', 'true');
}
