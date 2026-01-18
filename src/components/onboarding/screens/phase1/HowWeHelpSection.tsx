import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HowWeHelpStep } from "./HowWeHelpStep";

// Screenshots das telas do app
import screenshotCalendario from "@/assets/onboarding/screenshot-calendario.png";
import screenshotStats from "@/assets/onboarding/screenshot-stats.png";
import screenshotOfensiva from "@/assets/onboarding/screenshot-ofensiva.png";

interface HowWeHelpSectionProps {
  onComplete: () => void;
  onBack?: () => void;
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

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

export const HowWeHelpSection = ({ onComplete, onBack }: HowWeHelpSectionProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const directionRef = useRef(1); // 1 = forward, -1 = backward

  const handleContinue = () => {
    directionRef.current = 1;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    directionRef.current = -1;
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="relative h-[100dvh] overflow-hidden">
      <AnimatePresence mode="wait" custom={directionRef.current}>
        <motion.div
          key={currentStep}
          custom={directionRef.current}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "tween", duration: 0.15, ease: "easeOut" },
            opacity: { duration: 0.12 },
          }}
          className="absolute inset-0"
        >
          <HowWeHelpStep
            description={step.description}
            screenImage={step.screenImage}
            currentStep={currentStep}
            totalSteps={STEPS.length}
            onContinue={handleContinue}
            onBack={handleBack}
            canGoBack={currentStep > 0 || !!onBack}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
