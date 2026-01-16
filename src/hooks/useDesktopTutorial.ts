import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

export interface TutorialStep {
  id: string;
  target: string; // CSS selector
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
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
];

interface UseDesktopTutorialReturn {
  isActive: boolean;
  currentStep: number;
  currentStepData: TutorialStep | null;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  restartTutorial: () => void;
  isLoading: boolean;
}

export function useDesktopTutorial(): UseDesktopTutorialReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const location = useLocation();

  // Check if tutorial should be shown on mount (desktop only, home route only)
  useEffect(() => {
    const checkTutorialStatus = async () => {
      // Don't activate tutorial on mobile devices or outside home route
      if (isMobile || location.pathname !== '/') {
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
          .select('desktop_tutorial_completed')
          .eq('user_id', user.id)
          .single();

        if (profile && !profile.desktop_tutorial_completed) {
          setIsActive(true);
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkTutorialStatus();
  }, [isMobile, location.pathname]);

  const saveTutorialCompleted = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ desktop_tutorial_completed: true })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving tutorial status:', error);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Last step - complete tutorial
      setIsActive(false);
      saveTutorialCompleted();
    }
  }, [currentStep, saveTutorialCompleted]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    saveTutorialCompleted();
  }, [saveTutorialCompleted]);

  const completeTutorial = useCallback(() => {
    setIsActive(false);
    saveTutorialCompleted();
  }, [saveTutorialCompleted]);

  const restartTutorial = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ desktop_tutorial_completed: false })
        .eq('user_id', user.id);

      setCurrentStep(0);
      setIsActive(true);
    } catch (error) {
      console.error('Error restarting tutorial:', error);
    }
  }, []);

  const currentStepData = isActive ? TUTORIAL_STEPS[currentStep] : null;

  return {
    isActive,
    currentStep,
    currentStepData,
    totalSteps: TUTORIAL_STEPS.length,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    restartTutorial,
    isLoading,
  };
}
