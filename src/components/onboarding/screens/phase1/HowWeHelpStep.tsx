import { PhoneMockup } from "@/components/onboarding/PhoneMockup";
import { StepDots } from "@/components/onboarding/shared/StepDots";

interface HowWeHelpStepProps {
  description: string;
  screenImage: string;
  currentStep: number;
  totalSteps: number;
  onContinue: () => void;
}

export const HowWeHelpStep = ({
  description,
  screenImage,
  currentStep,
  totalSteps,
  onContinue,
}: HowWeHelpStepProps) => {
  return (
    <div className="flex flex-col items-center justify-between h-[100dvh] bg-violet-50 dark:bg-gray-950 px-6 py-6 overflow-hidden">
      {/* Área do texto (topo) */}
      <div className="shrink-0 pt-4 text-center space-y-3">
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

      {/* Área do botão (rodapé) - placeholder */}
      <div className="w-full max-w-xs shrink-0 pb-safe">
        <div className="w-full h-12 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <p className="text-gray-500 text-xs">Botão (Fase 6)</p>
        </div>
      </div>
    </div>
  );
};
