import React, { createContext, useContext, ReactNode } from "react";
import { useDesktopTutorial, TutorialStep, TutorialContext } from "@/hooks/useDesktopTutorial";

interface TutorialContextValue {
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

const TutorialContextProvider = createContext<TutorialContextValue | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const tutorial = useDesktopTutorial();

  return (
    <TutorialContextProvider.Provider value={tutorial}>
      {children}
    </TutorialContextProvider.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContextProvider);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
