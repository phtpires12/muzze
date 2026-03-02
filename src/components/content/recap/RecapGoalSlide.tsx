import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface RecapGoalSlideProps {
  weeksHit: number;
  totalWeeks: number;
  onNext: () => void;
}

export const RecapGoalSlide = ({ weeksHit, totalWeeks, onNext }: RecapGoalSlideProps) => {
  const percentage = totalWeeks > 0 ? Math.round((weeksHit / totalWeeks) * 100) : 0;

  const getEmoji = () => {
    if (percentage >= 100) return "🏆";
    if (percentage >= 75) return "🔥";
    if (percentage >= 50) return "💪";
    if (percentage >= 25) return "🌱";
    return "🎯";
  };

  const getMessage = () => {
    if (percentage >= 100) return "Perfeito! Você bateu todas as metas!";
    if (percentage >= 75) return "Excelente! Quase perfeito!";
    if (percentage >= 50) return "Bom progresso! Continue assim!";
    if (percentage >= 25) return "Você está no caminho certo!";
    return "Cada semana é uma nova oportunidade!";
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="text-8xl mb-6"
      >
        {getEmoji()}
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xl text-muted-foreground mb-6"
      >
        Metas semanais cumpridas
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
        className="w-full max-w-xs mb-8"
      >
        <div className="flex justify-center items-baseline gap-2 mb-4">
          <span className="text-6xl font-bold text-primary">{weeksHit}</span>
          <span className="text-2xl text-muted-foreground">de {totalWeeks}</span>
        </div>

        <Progress value={percentage} className="h-3 mb-3" />

        <div className="flex justify-between items-center">
          {Array.from({ length: totalWeeks }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                i < weeksHit
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < weeksHit ? '✓' : i + 1}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-lg text-muted-foreground mb-8"
      >
        {getMessage()}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
      >
        <Button onClick={onNext} size="lg" className="px-8">
          Continuar
        </Button>
      </motion.div>
    </div>
  );
};
