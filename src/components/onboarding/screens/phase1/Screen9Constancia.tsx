import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientProgressBar } from "@/components/onboarding/shared/GradientProgressBar";
import { POSTING_FREQUENCY_OPTIONS, ConsistencyCluster, Screen12Variant } from "@/types/onboarding";
import { motion, AnimatePresence } from "framer-motion";

interface Screen9ConstanciaProps {
  value: string;
  onChange: (value: string, cluster: ConsistencyCluster, variant: Screen12Variant) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
  username: string;
}

export const Screen9Constancia = ({
  value,
  onChange,
  onContinue,
  onBack,
  progress,
  username,
}: Screen9ConstanciaProps) => {
  const firstName = username?.split(" ")[0] || "";

  const handleOptionClick = (option: typeof POSTING_FREQUENCY_OPTIONS[number]) => {
    onChange(option.id, option.cluster, option.screen12Variant);
  };

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
          <p className="text-muted-foreground text-sm mb-1">
            {firstName ? `Entendi, ${firstName}` : "Entendi"}
            <br />
            e de lá pra cá...
          </p>
          <h1 className="text-xl font-bold text-foreground mb-6 leading-tight">
            Quantos posts por semana você tem feito?
          </h1>
        </motion.div>

        {/* Options */}
        <div className="space-y-3 flex-1">
          {POSTING_FREQUENCY_OPTIONS.map((option, index) => {
            const isSelected = value === option.id;

            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleOptionClick(option)}
                className={`w-full text-left rounded-2xl px-4 py-4 transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-300 ring-2 ring-purple-500/50"
                    : "bg-violet-200/60 hover:bg-violet-200/80"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <p
                  className={`font-medium text-base ${
                    isSelected ? "text-white" : "text-foreground"
                  }`}
                >
                  {option.label}
                </p>
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
