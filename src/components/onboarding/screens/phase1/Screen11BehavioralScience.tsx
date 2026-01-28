import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import brainScience from "@/assets/onboarding/brain-science.png";

interface Screen11BehavioralScienceProps {
  onContinue: () => void;
  onBack: () => void;
}

const SCIENCE_METHODS = [
  {
    title: "Método Pomodoro",
    description: "Ciclos de 5-25 minutos são ideais para vencer a resistência inicial e entrar em estado de foco profundo.",
    credibility: "Mais de 2 milhões de pessoas usam essa técnica diariamente.",
  },
  {
    title: "Hábitos Atômicos (James Clear)",
    description: "Hábitos consistentes surgem de micro-compromissos diários, não de metas grandes e intimidadoras.",
    credibility: "Livro com mais de 15 milhões de cópias vendidas mundialmente.",
  },
  {
    title: "O Ato Criativo (Rick Rubin)",
    description: "Criatividade surge quando há silêncio, atenção e presença — não pressão.",
    credibility: "Rick Rubin é um dos produtores criativos mais influentes da história.",
  },
];

export const Screen11BehavioralScience = ({
  onContinue,
  onBack,
}: Screen11BehavioralScienceProps) => {
  return (
    <div className="min-h-[100dvh] bg-secondary/50 dark:bg-background flex flex-col">
      {/* Header with back button */}
      <div className="px-4 pt-12 sm:pt-16 pb-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-secondary/80 transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        {/* Title with gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-bold italic text-center bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent mb-6"
        >
          Aqui você Cria Conteúdo com base na Ciência Comportamental.
        </motion.h1>

        {/* Brain illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <img
            src={brainScience}
            alt="Cérebro com sistemas comportamentais"
            className="w-full max-w-xs"
            draggable={false}
          />
        </motion.div>

        {/* Science method cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4 mb-6"
        >
          {SCIENCE_METHODS.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              <Card className="p-4 bg-card/80 backdrop-blur-sm">
                <h3 className="font-semibold text-foreground mb-1">{method.title}</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {method.description}
                </p>
                {method.credibility && (
                  <p className="text-xs text-muted-foreground/70 italic">
                    {method.credibility}
                  </p>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Continue button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Button
            onClick={onContinue}
            className="w-full"
            variant="gradient-pill"
            size="lg"
          >
            Continuar
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
