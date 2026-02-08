import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PERIOD_DAYS } from "@/types/recap";

interface RecapTotalTimeSlideProps {
  totalMinutes: number;
  periodType: string;
  onNext: () => void;
}

export const RecapTotalTimeSlide = ({ 
  totalMinutes, 
  periodType, 
  onNext 
}: RecapTotalTimeSlideProps) => {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const periodDays = PERIOD_DAYS[periodType] || 30;

  const getMotivationalMessage = () => {
    if (hours >= 50) return "Você é um verdadeiro mestre! 🏆";
    if (hours >= 20) return "Dedicação impressionante! 🔥";
    if (hours >= 10) return "Ótimo ritmo de criação! ⚡";
    if (hours >= 5) return "Consistência que faz diferença! 💪";
    return "Cada minuto conta! 🌟";
  };

  const timeDisplay = hours > 0 
    ? `${hours}h ${mins > 0 ? `${mins}min` : ''}`
    : `${mins}min`;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-background via-background to-primary/5">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
        className="text-8xl mb-6"
      >
        ⏱️
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xl text-muted-foreground mb-4"
      >
        Nos últimos {periodDays} dias, você criou por
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
        className="mb-6"
      >
        <span className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {timeDisplay}
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-lg text-muted-foreground mb-8"
      >
        {getMotivationalMessage()}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <Button onClick={onNext} size="lg" className="px-8">
          Continuar
        </Button>
      </motion.div>
    </div>
  );
};
