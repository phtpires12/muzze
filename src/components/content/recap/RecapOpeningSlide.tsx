import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PERIOD_LABELS, PERIOD_DAYS } from "@/types/recap";

interface RecapOpeningSlideProps {
  periodType: string;
  onNext: () => void;
}

export const RecapOpeningSlide = ({ periodType, onNext }: RecapOpeningSlideProps) => {
  const periodLabel = PERIOD_LABELS[periodType] || periodType;
  const periodDays = PERIOD_DAYS[periodType] || 30;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-primary/10 via-background to-background">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
        className="text-8xl mb-6"
      >
        🎁
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-3xl font-bold text-foreground mb-3"
      >
        Seu recap {periodLabel} chegou!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-lg text-muted-foreground mb-2 max-w-sm"
      >
        Veja o quanto você evoluiu nos últimos {periodDays} dias como criador de conteúdo.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-sm text-muted-foreground/80 mb-8"
      >
        ✨ Uma jornada de progresso e dedicação
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
      >
        <Button 
          onClick={onNext}
          size="lg"
          className="px-8"
        >
          Descobrir meu recap
        </Button>
      </motion.div>
    </div>
  );
};
