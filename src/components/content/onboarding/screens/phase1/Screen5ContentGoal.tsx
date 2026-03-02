import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientProgressBar } from "@/components/content/onboarding/shared/GradientProgressBar";
import { CONTENT_GOALS } from "@/types/onboarding";
import { motion, AnimatePresence } from "framer-motion";

interface Screen5ContentGoalProps {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
  username: string;
}

export const Screen5ContentGoal = ({
  value,
  onChange,
  onContinue,
  onBack,
  progress,
  username,
}: Screen5ContentGoalProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(value || null);

  const handleOptionClick = (id: string) => {
    setExpandedId(id);
    onChange(id);
  };

  const firstName = username?.split(" ")[0] || "";

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
          {firstName ? `${firstName},` : ""}
        </p>
        <h1 className="text-xl font-bold text-foreground mb-6 leading-tight">
          Onde você quer chegar com a sua criação de conteúdo?
        </h1>

        {/* Options */}
        <div className="space-y-3 flex-1">
          {CONTENT_GOALS.map((goal) => {
            const isExpanded = expandedId === goal.id;

            return (
              <motion.button
                key={goal.id}
                onClick={() => handleOptionClick(goal.id)}
                className={`w-full text-left rounded-2xl px-4 py-4 transition-all duration-300 ${
                  isExpanded
                    ? "bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-300 ring-2 ring-purple-500/50"
                    : "bg-violet-200/60 hover:bg-violet-200/80"
                }`}
                layout
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{goal.emoji}</span>
                  <div className="flex-1">
                    <p
                      className={`font-medium text-base ${
                        isExpanded ? "text-white" : "text-foreground"
                      }`}
                    >
                      {goal.label}
                    </p>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm text-white/90 mt-1"
                        >
                          {goal.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Continue Button - only shows when an option is selected */}
      <AnimatePresence>
        {value && (
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
