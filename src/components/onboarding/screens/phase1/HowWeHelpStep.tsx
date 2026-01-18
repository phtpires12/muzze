import { PhoneMockup } from "@/components/onboarding/PhoneMockup";
import { StepDots } from "@/components/onboarding/shared/StepDots";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface HowWeHelpStepProps {
  description: string;
  screenImage: string;
  currentStep: number;
  totalSteps: number;
  onContinue: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
}

export const HowWeHelpStep = ({
  description,
  screenImage,
  currentStep,
  totalSteps,
  onContinue,
  onBack,
  canGoBack = false,
}: HowWeHelpStepProps) => {
  return (
    <div className="relative flex flex-col items-center justify-between h-[100dvh] bg-violet-50 dark:bg-gray-950 px-6 py-6 overflow-hidden">
      {/* Botão de voltar */}
      {canGoBack && (
        <button
          onClick={onBack}
          className="absolute top-12 left-4 z-10 p-2 rounded-full bg-gray-200/80 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      )}

      {/* Área do texto (topo) */}
      <div className="shrink-0 pt-12 sm:pt-16 text-center space-y-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Como vamos te ajudar?
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
        <StepDots currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      {/* iPhone Mockup com screenshot */}
      <div className="flex-1 flex items-center justify-center py-2 min-h-0">
        <PhoneMockup 
          screenImage={screenImage} 
          className="w-[180px] sm:w-[260px] h-auto max-h-full"
        />
      </div>

      {/* Botão Continuar */}
      <div className="w-full max-w-xs shrink-0 pb-safe">
        <Button
          onClick={onContinue}
          className="w-full h-12 sm:h-14 rounded-full text-base sm:text-lg font-semibold shadow-lg shadow-primary/25"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
