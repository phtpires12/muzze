import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import brainScienceLight from "@/assets/onboarding/brain-science-light.png";
import brainScienceDark from "@/assets/onboarding/brain-science-dark.png";

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
    <div className="h-[100dvh] bg-secondary/50 dark:bg-background flex flex-col overflow-hidden">
      
      {/* ===== SEÇÃO FIXA: Header + Título + Imagem ===== */}
      <div className="shrink-0 px-6 pt-12 sm:pt-16">
        {/* Back button */}
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-secondary/80 transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        {/* Title with gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-lg font-bold italic text-center bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent mt-2 mb-4"
        >
          Aqui você Cria Conteúdo com base na Ciência Comportamental.
        </motion.h1>

        {/* Brain illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-4"
        >
          {/* Light mode image */}
          <img
            src={brainScienceLight}
            alt="Cérebro com sistemas comportamentais"
            className="w-full max-w-[280px] dark:hidden"
            draggable={false}
          />
          {/* Dark mode image */}
          <img
            src={brainScienceDark}
            alt="Cérebro com sistemas comportamentais"
            className="w-full max-w-[280px] hidden dark:block"
            draggable={false}
          />
        </motion.div>
      </div>

      {/* ===== SEÇÃO SCROLLÁVEL: Cards ===== */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-6 space-y-3 pb-4">
          {SCIENCE_METHODS.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
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
        </div>
      </ScrollArea>

      {/* ===== SEÇÃO FIXA: Botão Continuar ===== */}
      <div className="shrink-0 px-6 pt-4 pb-6 pb-safe">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
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
