import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientProgressBar } from "@/components/onboarding/shared/GradientProgressBar";
import { QuestionnaireMultiSelect } from "@/components/onboarding/shared/QuestionnaireMultiSelect";
import { motion, AnimatePresence } from "framer-motion";

interface Screen14PreviousToolsProps {
  value: string[];
  onChange: (value: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
}

const PREVIOUS_TOOLS_OPTIONS = [
  { id: "notion", label: "Notion" },
  { id: "trello", label: "Trello" },
  { id: "clickup", label: "Click-Up" },
  { id: "obsidian", label: "Obsidian" },
  { id: "cadernos", label: "Cadernos" },
  { id: "monday", label: "Monday" },
  { id: "outros", label: "Outros" },
];

const MAX_SELECTIONS = 3;

export const Screen14PreviousTools = ({
  value,
  onChange,
  onContinue,
  onBack,
  progress,
}: Screen14PreviousToolsProps) => {
  const hasSelection = value.length > 0;

  const handleChange = (selected: string[]) => {
    if (selected.length <= MAX_SELECTIONS) {
      onChange(selected);
    }
  };

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
        <h1 className="text-xl font-bold text-foreground mb-2 leading-tight">
          Onde você costumava organizar seu conteúdo?
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Selecione até 3 opções.
        </p>

        {/* Multi-select Options */}
        <QuestionnaireMultiSelect
          options={PREVIOUS_TOOLS_OPTIONS}
          selected={value}
          onChange={handleChange}
        />
      </div>

      {/* Continue Button */}
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
