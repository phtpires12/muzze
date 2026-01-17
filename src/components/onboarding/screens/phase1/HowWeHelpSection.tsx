import { useState } from "react";
import { HowWeHelpStep } from "./HowWeHelpStep";

// Screenshots das telas do app
import screenshotCalendario from "@/assets/onboarding/screenshot-calendario.png";
import screenshotStats from "@/assets/onboarding/screenshot-stats.png";
import screenshotOfensiva from "@/assets/onboarding/screenshot-ofensiva.png";

interface HowWeHelpSectionProps {
  onComplete: () => void;
}

const STEPS = [
  {
    description: "Queremos te ver criar mais e temos o processo criativo perfeito pra isso",
    screenImage: screenshotCalendario,
  },
  {
    description: "Nós medimos seu progresso pelo tempo criando, não pela quantidade de publicações que você faz.",
    screenImage: screenshotStats,
  },
  {
    description: "Você cria um pouquinho todos os dias, sem pressão e sem perfeccionismo e alcança suas metas muito mais rápido.",
    screenImage: screenshotOfensiva,
  },
];

export const HowWeHelpSection = ({ onComplete }: HowWeHelpSectionProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleContinue = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Último step: avançar para próxima tela do onboarding
      onComplete();
    }
  };

  const step = STEPS[currentStep];

  return (
    <HowWeHelpStep
      description={step.description}
      screenImage={step.screenImage}
      currentStep={currentStep}
      totalSteps={STEPS.length}
      onContinue={handleContinue}
    />
  );
};
