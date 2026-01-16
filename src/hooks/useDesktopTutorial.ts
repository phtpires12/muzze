import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

export interface TutorialStep {
  id: string;
  target: string; // CSS selector
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export type TutorialContext = 
  | 'home' 
  | 'session_select' 
  | 'ideation' 
  | 'script' 
  | 'review' 
  | 'record' 
  | 'edit';

// Tutorial steps for each context
export const TUTORIAL_CONFIGS: Record<TutorialContext, TutorialStep[]> = {
  home: [
    {
      id: 'start-session',
      target: '#tutorial-start-session',
      title: 'Comece uma sessão',
      description: 'Clique aqui para iniciar sua primeira sessão de criação focada.',
      position: 'top'
    },
    {
      id: 'streak',
      target: '#tutorial-streak',
      title: 'Sua ofensiva 🔥',
      description: 'Crie todos os dias para manter sua sequência ativa e desbloquear recompensas.',
      position: 'bottom'
    },
    {
      id: 'daily-progress',
      target: '#tutorial-daily-progress',
      title: 'Meta diária',
      description: 'Acompanhe quanto você já criou hoje. Complete a barra para garantir o dia.',
      position: 'bottom'
    },
    {
      id: 'calendar',
      target: '#tutorial-calendar',
      title: 'Calendário Editorial',
      description: 'Organize suas publicações e nunca perca uma data importante.',
      position: 'top'
    },
    {
      id: 'stats',
      target: '#tutorial-stats',
      title: 'Suas Estatísticas',
      description: 'Veja seu progresso, níveis e conquistas acumulados.',
      position: 'top'
    },
    {
      id: 'profile',
      target: '#tutorial-profile',
      title: 'Seu Perfil',
      description: 'Acesse configurações, mude seu avatar e veja suas conquistas.',
      position: 'bottom'
    },
    {
      id: 'complete',
      target: '#tutorial-start-session',
      title: 'Pronto para começar! 🚀',
      description: 'Você conhece o básico. Agora é só iniciar sua primeira sessão!',
      position: 'top'
    },
  ],

  session_select: [
    {
      id: 'stage-idea',
      target: '#session-stage-idea',
      title: 'Comece com uma Ideia 💡',
      description: 'Esta é a primeira etapa: transforme uma ideia bruta em algo concreto.',
      position: 'right'
    },
    {
      id: 'stage-script',
      target: '#session-stage-script',
      title: 'Desenvolva o Roteiro 📝',
      description: 'Escreva seu roteiro estruturado com gancho, setup, desenvolvimento e conclusão.',
      position: 'right'
    },
    {
      id: 'stage-review',
      target: '#session-stage-review',
      title: 'Revise o Conteúdo ✅',
      description: 'Revise cada seção do seu roteiro antes de gravar.',
      position: 'right'
    },
    {
      id: 'stage-record',
      target: '#session-stage-record',
      title: 'Grave o Vídeo 🎬',
      description: 'Use o Shot List para organizar e marcar suas gravações.',
      position: 'right'
    },
    {
      id: 'stage-edit',
      target: '#session-stage-edit',
      title: 'Finalize na Edição ✂️',
      description: 'Complete todas as etapas de pós-produção para deixar seu vídeo pronto.',
      position: 'right'
    },
  ],

  ideation: [
    {
      id: 'ideation-new',
      target: '#ideation-card-new',
      title: 'Crie uma Nova Ideia ✨',
      description: 'Clique aqui para adicionar uma nova ideia ao seu workspace.',
      position: 'bottom'
    },
    {
      id: 'ideation-card',
      target: '#ideation-card-first',
      title: 'Preencha os Detalhes',
      description: 'Defina título, tipo de conteúdo e sua ideia central.',
      position: 'right'
    },
    {
      id: 'ideation-calendar',
      target: '#ideation-calendar',
      title: 'Arraste para Agendar 📅',
      description: 'Quando a ideia estiver pronta, arraste para o calendário para definir uma data.',
      position: 'left'
    },
  ],

  script: [
    {
      id: 'script-title',
      target: '#script-title',
      title: 'Título do Roteiro',
      description: 'Dê um nome claro para seu conteúdo.',
      position: 'bottom'
    },
    {
      id: 'script-editor',
      target: '#script-editor',
      title: 'Editor de Roteiro ✍️',
      description: 'Escreva seu roteiro nas seções: Gancho, Setup, Desenvolvimento e Conclusão.',
      position: 'right'
    },
    {
      id: 'script-advance',
      target: '#script-advance',
      title: 'Avançar para Revisão ➡️',
      description: 'Quando terminar, clique aqui para revisar seu roteiro.',
      position: 'top'
    },
  ],

  review: [
    {
      id: 'review-section',
      target: '#review-section-gancho',
      title: 'Revise o Gancho',
      description: 'Leia e aprove cada seção. O gancho é o que prende a atenção.',
      position: 'right'
    },
    {
      id: 'review-advance',
      target: '#review-advance',
      title: 'Avançar para Gravação 🎬',
      description: 'Após revisar todas as seções, avance para a etapa de gravação.',
      position: 'top'
    },
  ],

  record: [
    {
      id: 'record-shot-table',
      target: '#record-shot-table',
      title: 'Lista de Takes 📋',
      description: 'Cada linha é um trecho do seu roteiro. Marque como concluído após gravar.',
      position: 'bottom'
    },
    {
      id: 'record-shot-checkbox',
      target: '#record-shot-checkbox',
      title: 'Marcar como Gravado ✅',
      description: 'Clique no checkbox quando finalizar a gravação deste take.',
      position: 'right'
    },
    {
      id: 'record-advance',
      target: '#record-advance',
      title: 'Avançar para Edição ✂️',
      description: 'Quando todos os takes estiverem gravados, avance para a edição.',
      position: 'top'
    },
  ],

  edit: [
    {
      id: 'edit-checklist',
      target: '#edit-checklist',
      title: 'Checklist de Edição 📝',
      description: 'Complete cada etapa da pós-produção clicando para iniciar.',
      position: 'right'
    },
    {
      id: 'edit-step',
      target: '#edit-step-decupagem',
      title: 'Comece pela Decupagem',
      description: 'Clique para iniciar o timer. Pause quando terminar e marque como concluído.',
      position: 'right'
    },
    {
      id: 'edit-complete',
      target: '#edit-complete',
      title: 'Finalize a Edição 🎉',
      description: 'Quando todas as etapas estiverem verdes, seu conteúdo está pronto para publicar!',
      position: 'top'
    },
  ],
};

interface TutorialProgress {
  [key: string]: boolean | undefined;
  home?: boolean;
  session_select?: boolean;
  ideation?: boolean;
  script?: boolean;
  review?: boolean;
  record?: boolean;
  edit?: boolean;
}

interface UseDesktopTutorialReturn {
  isActive: boolean;
  currentStep: number;
  currentStepData: TutorialStep | null;
  totalSteps: number;
  currentContext: TutorialContext | null;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  restartTutorial: (context?: TutorialContext) => Promise<void>;
  restartAllTutorials: () => Promise<void>;
  isLoading: boolean;
}

// Helper to detect context from route
function detectContextFromRoute(pathname: string, searchParams: URLSearchParams): TutorialContext | null {
  // Home route
  if (pathname === '/') return 'home';
  
  // Session routes
  if (pathname === '/session') {
    const stage = searchParams.get('stage');
    if (!stage) return 'session_select';
    
    switch (stage) {
      case 'idea':
      case 'ideation':
        return 'ideation';
      case 'script':
        return 'script';
      case 'review':
        return 'review';
      case 'edit':
        return 'edit';
      default:
        return null;
    }
  }
  
  // Shot list record route
  if (pathname.includes('/shot-list/record')) return 'record';
  
  return null;
}

export function useDesktopTutorial(): UseDesktopTutorialReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tutorialProgress, setTutorialProgress] = useState<TutorialProgress>({});
  const isMobile = useIsMobile();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Detect current context based on route
  const currentContext = useMemo(() => 
    detectContextFromRoute(location.pathname, searchParams),
    [location.pathname, searchParams]
  );

  // Get steps for current context
  const currentSteps = useMemo(() => 
    currentContext ? TUTORIAL_CONFIGS[currentContext] : [],
    [currentContext]
  );

  // Check if tutorial should be shown on mount/route change
  useEffect(() => {
    const checkTutorialStatus = async () => {
      // Don't activate tutorial on mobile devices or if no valid context
      if (isMobile || !currentContext) {
        setIsActive(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('desktop_tutorial_completed, tutorial_progress')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          // Parse tutorial_progress from JSONB
          const progress: TutorialProgress = (profile.tutorial_progress as TutorialProgress) || {};
          setTutorialProgress(progress);
          
          // Check if this specific context's tutorial has been completed
          // Also check legacy desktop_tutorial_completed for 'home' context
          const contextCompleted = currentContext === 'home' 
            ? (profile.desktop_tutorial_completed || progress.home)
            : progress[currentContext];
          
          if (!contextCompleted) {
            setCurrentStep(0);
            setIsActive(true);
          } else {
            setIsActive(false);
          }
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkTutorialStatus();
  }, [isMobile, currentContext]);

  const saveTutorialCompleted = useCallback(async (context: TutorialContext) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current progress
      const { data: profile } = await supabase
        .from('profiles')
        .select('tutorial_progress')
        .eq('user_id', user.id)
        .single();

      const currentProgress: TutorialProgress = (profile?.tutorial_progress as TutorialProgress) || {};
      const updatedProgress = { ...currentProgress, [context]: true };

      // Update both tutorial_progress and legacy desktop_tutorial_completed for home
      const updateData: any = { tutorial_progress: updatedProgress };
      if (context === 'home') {
        updateData.desktop_tutorial_completed = true;
      }

      await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      setTutorialProgress(updatedProgress);
    } catch (error) {
      console.error('Error saving tutorial status:', error);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (!currentContext) return;
    
    if (currentStep < currentSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Last step - complete tutorial
      setIsActive(false);
      saveTutorialCompleted(currentContext);
    }
  }, [currentStep, currentSteps.length, currentContext, saveTutorialCompleted]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    if (!currentContext) return;
    setIsActive(false);
    saveTutorialCompleted(currentContext);
  }, [currentContext, saveTutorialCompleted]);

  const completeTutorial = useCallback(() => {
    if (!currentContext) return;
    setIsActive(false);
    saveTutorialCompleted(currentContext);
  }, [currentContext, saveTutorialCompleted]);

  const restartTutorial = useCallback(async (context?: TutorialContext) => {
    const targetContext = context || currentContext;
    if (!targetContext) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current progress
      const { data: profile } = await supabase
        .from('profiles')
        .select('tutorial_progress')
        .eq('user_id', user.id)
        .single();

      const currentProgress: TutorialProgress = (profile?.tutorial_progress as TutorialProgress) || {};
      const updatedProgress = { ...currentProgress, [targetContext]: false };

      // Update tutorial_progress
      const updateData: any = { tutorial_progress: updatedProgress };
      if (targetContext === 'home') {
        updateData.desktop_tutorial_completed = false;
      }

      await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      setTutorialProgress(updatedProgress);
      
      // Only activate if we're restarting the current context
      if (targetContext === currentContext) {
        setCurrentStep(0);
        setIsActive(true);
      }
    } catch (error) {
      console.error('Error restarting tutorial:', error);
    }
  }, [currentContext]);

  const restartAllTutorials = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const resetProgress: TutorialProgress = {
        home: false,
        session_select: false,
        ideation: false,
        script: false,
        review: false,
        record: false,
        edit: false,
      };

      await supabase
        .from('profiles')
        .update({ 
          tutorial_progress: resetProgress,
          desktop_tutorial_completed: false
        })
        .eq('user_id', user.id);

      setTutorialProgress(resetProgress);
      
      if (currentContext) {
        setCurrentStep(0);
        setIsActive(true);
      }
    } catch (error) {
      console.error('Error restarting all tutorials:', error);
    }
  }, [currentContext]);

  const currentStepData = isActive && currentSteps.length > 0 ? currentSteps[currentStep] : null;

  return {
    isActive,
    currentStep,
    currentStepData,
    totalSteps: currentSteps.length,
    currentContext,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    restartTutorial,
    restartAllTutorials,
    isLoading,
  };
}
