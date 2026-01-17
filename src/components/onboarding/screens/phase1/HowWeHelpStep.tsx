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
      {/* Área do texto (topo) - placeholder */}
      <div className="shrink-0 pt-4">
        <p className="text-gray-500 text-sm">Texto aqui (Fase 5)</p>
      </div>

      {/* Área do mockup (centro) - placeholder */}
      <div className="flex-1 flex items-center justify-center py-2 min-h-0">
        <div className="w-[180px] sm:w-[260px] h-[360px] sm:h-[520px] bg-gray-200 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
          <p className="text-gray-500 text-xs">Mockup (Fase 3)</p>
        </div>
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
