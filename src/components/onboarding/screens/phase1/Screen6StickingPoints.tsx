import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientProgressBar } from "@/components/onboarding/shared/GradientProgressBar";
import { QuestionnaireMultiSelect } from "@/components/onboarding/shared/QuestionnaireMultiSelect";
import { motion, AnimatePresence } from "framer-motion";

interface Screen6StickingPointsProps {
  value: string[];
  onChange: (value: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
  username: string;
}

const STICKING_POINTS_OPTIONS = [
  { id: "no_ideas", label: "Não sei o que postar" },
  { id: "cant_finish", label: "Não consigo terminar o que começo" },
  { id: "no_execution", label: "Tenho ideias mas não executo" },
  { id: "dont_know_start", label: "Não sei por onde começar" },
  { id: "distracted", label: "Me distraio facilmente" },
  { id: "perfectionism", label: "Perfeccionismo me paralisa" },
];

export const Screen6StickingPoints = ({
  value,
  onChange,
  onContinue,
  onBack,
  progress,
  username,
}: Screen6StickingPointsProps) => {
  const firstName = username?.split(" ")[0] || "";
  const hasSelection = value.length > 0;

  return (
    <div className="min-h-[100dvh] bg-secondary/30 flex flex-col">
      {/* Header with back button and progress bar */}
      <div className="px-4 pt-4 sm:pt-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <GradientProgressBar progress={progress} />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-4 overflow-y-auto">
        <p className="text-muted-foreground text-sm mb-1">
          {firstName ? `Além disso ${firstName},` : "Além disso,"}
        </p>
        <h1 className="text-xl font-bold text-foreground mb-2 leading-tight">
          O que mais te trava pra criar?
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Escolha tudo que se aplica ao seu caso.
        </p>

        {/* Multi-select Options */}
        <QuestionnaireMultiSelect
          options={STICKING_POINTS_OPTIONS}
          selected={value}
          onChange={onChange}
        />
      </div>

      {/* Continue Button - only shows when at least one option is selected */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="px-6 pb-8 pt-4"
          >
            <Button
              onClick={onContinue}
              className="w-full h-14 rounded-full text-base font-medium"
            >
              Continuar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
