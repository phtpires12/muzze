import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen12Variant } from "@/types/onboarding";

interface Screen10ClusterFeedbackProps {
  variant: Screen12Variant;
  onContinue: () => void;
  onBack: () => void;
}

const VARIANT_CONTENT = {
  hurt: {
    title: "Uii! Doeu um pouco ver isso?",
    lines: [
      "Fica tranquilo, nós sabemos que você está dando o seu melhor!",
      "E estamos aqui pra ajudar criadores como você, a nunca mais parar de criar.",
    ],
    emojis: ["😵‍💫", "👊", "😵"],
  },
  path: {
    title: "Que ótimo!! Você já tá no caminho",
    lines: [
      "Vamos te ajudar a aumentar isso pra acelerar ainda mais seus resultados!",
    ],
    emojis: ["😵‍💫", "👊", "😵"],
  },
  machine: {
    title: "Você é uma máquina!",
    lines: [
      "Já dá até pra ensinar a galera a criar mais em…",
      "Conta com a gente pra produzir conteúdo pra esse público. 🤝",
    ],
    emojis: ["😵‍💫", "👊", "😵"],
  },
};

export const Screen10ClusterFeedback = ({
  variant,
  onContinue,
  onBack,
}: Screen10ClusterFeedbackProps) => {
  const [revealed, setRevealed] = useState(false);
  const content = VARIANT_CONTENT[variant];

  const handleTap = () => {
    if (!revealed) {
      setRevealed(true);
    }
  };

  return (
    <div
      className="min-h-[100dvh] bg-secondary/50 dark:bg-background flex flex-col overflow-hidden"
      onClick={handleTap}
    >
      {/* Header with back button */}
      <div className="px-4 pt-12 sm:pt-16">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-secondary/80 shadow-sm"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Emoji Cluster - 3 emojis in purple circles - inverted triangle */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          className="relative w-44 h-36 mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Top left emoji */}
          <motion.div
            className="absolute top-0 left-0 w-20 h-20 bg-primary/70 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: "backOut" }}
          >
            <span className="text-3xl">{content.emojis[0]}</span>
          </motion.div>

          {/* Top right emoji */}
          <motion.div
            className="absolute top-0 right-0 w-20 h-20 bg-primary/70 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: "backOut" }}
          >
            <span className="text-3xl">{content.emojis[1]}</span>
          </motion.div>

          {/* Bottom center emoji */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-primary/70 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease: "backOut" }}
          >
            <span className="text-3xl">{content.emojis[2]}</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Text content at bottom */}
      <div className="px-6 pb-8 space-y-4">
        <motion.h1
          className="text-2xl font-bold text-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          {content.title}
        </motion.h1>

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {content.lines.map((line, i) => (
                <motion.p
                  key={i}
                  className="text-muted-foreground text-base leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                >
                  {line}
                </motion.p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap to reveal hint */}
        <AnimatePresence>
          {!revealed && (
            <motion.p
              className="text-sm text-muted-foreground/60 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              Toque para continuar
            </motion.p>
          )}
        </AnimatePresence>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
          className="w-full rounded-full"
          size="lg"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
