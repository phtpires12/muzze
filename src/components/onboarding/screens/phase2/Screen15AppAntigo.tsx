import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { GradientProgressBar } from "../../shared/GradientProgressBar";
import { PREVIOUS_TOOLS_OPTIONS } from "@/types/onboarding";

interface Screen15AppAntigoProps {
  value: string[];
  onChange: (value: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
  progress: number;
  username: string;
}

const MAX_SELECTIONS = 3;

const SELECTION_EMOJIS = ["💪", "🎯", "🔥", "✨", "💎", "🚀", "⚡"];

const getEmojiForId = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SELECTION_EMOJIS[Math.abs(hash) % SELECTION_EMOJIS.length];
};

export const Screen15AppAntigo = ({
  value,
  onChange,
  onContinue,
  onBack,
  progress,
  username,
}: Screen15AppAntigoProps) => {
  const firstName = username?.split(" ")[0] || "";
  const atLimit = value.length >= MAX_SELECTIONS;

  const handleToggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
    } else if (!atLimit) {
      onChange([...value, id]);
    }
  };

  return (
    <div className="min-h-screen bg-violet-50 dark:bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-violet-200/60 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <GradientProgressBar progress={progress} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {firstName ? `${firstName}, onde` : "Onde"} você costumava organizar
            seu conteúdo?
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Selecione até {MAX_SELECTIONS} opções
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3"
        >
          {PREVIOUS_TOOLS_OPTIONS.map((option) => {
            const isSelected = value.includes(option.id);
            const isDisabled = atLimit && !isSelected;
            const emoji = getEmojiForId(option.id);

            return (
              <motion.button
                key={option.id}
                onClick={() => handleToggle(option.id)}
                disabled={isDisabled}
                className={`w-full text-left rounded-2xl px-4 py-4 transition-all duration-200 ${
                  isSelected
                    ? "bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-300"
                    : isDisabled
                    ? "bg-violet-200/30 opacity-50 cursor-not-allowed"
                    : "bg-violet-200/60 hover:bg-violet-200/80"
                }`}
                whileTap={isDisabled ? {} : { scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  {isSelected && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xl"
                    >
                      {emoji}
                    </motion.span>
                  )}
                  <p
                    className={`font-medium text-base ${
                      isSelected
                        ? "text-white"
                        : isDisabled
                        ? "text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Continue button */}
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <button
              onClick={onContinue}
              className="w-full py-4 rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              Continuar
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
