import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientProgressBar } from "@/components/content/onboarding/shared/GradientProgressBar";
import { DAILY_TIME_OPTIONS } from "@/types/onboarding";
import { motion, AnimatePresence } from "framer-motion";

interface Screen12DailyTimeProps {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
  username: string;
}

export const Screen12DailyTime = ({
  value,
  onChange,
  onContinue,
  onBack,
  progress,
  username,
}: Screen12DailyTimeProps) => {
  const firstName = username?.split(" ")[0] || "";

  return (
    <div className="min-h-[100dvh] bg-violet-50 dark:bg-background flex flex-col">
      {/* Header: Back + Progress */}
      <div className="px-4 pt-12 sm:pt-16 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-violet-100 dark:hover:bg-muted transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <GradientProgressBar progress={progress} />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-bold text-foreground mb-6 leading-tight">
            {firstName ? `${firstName} no dia a dia,` : "No dia a dia,"}
            <br />
            por quanto tempo você pode criar?
          </h1>
        </motion.div>

        {/* Options */}
        <div className="space-y-3 flex-1">
          {DAILY_TIME_OPTIONS.map((option, index) => {
            const isSelected = value === option.id;

            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onChange(option.id)}
                className={`w-full text-left rounded-2xl px-4 py-4 transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-300"
                    : "bg-violet-200/60 hover:bg-violet-200/80 dark:bg-violet-900/30 dark:hover:bg-violet-900/50"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{option.emoji}</span>
                  <p
                    className={`font-medium text-base ${
                      isSelected ? "text-white" : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Continue Button */}
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
              variant="gradient-pill"
              size="lg"
              className="w-full"
            >
              Continuar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
