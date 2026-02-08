import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecapComparisonSlideProps {
  currentMinutes: number;
  previousMinutes: number | null;
  onNext: () => void;
}

export const RecapComparisonSlide = ({ 
  currentMinutes, 
  previousMinutes, 
  onNext 
}: RecapComparisonSlideProps) => {
  const hasPrevious = previousMinutes !== null && previousMinutes > 0;
  
  const diff = hasPrevious ? currentMinutes - previousMinutes! : 0;
  const percentChange = hasPrevious && previousMinutes! > 0 
    ? Math.round((diff / previousMinutes!) * 100)
    : 0;
  
  const isPositive = diff > 0;
  const isNeutral = diff === 0;

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  if (!hasPrevious) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="text-8xl mb-6"
        >
          🌟
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-muted-foreground mb-4"
        >
          Este é seu primeiro recap!
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-base text-muted-foreground max-w-sm mb-8"
        >
          A partir de agora, vamos acompanhar sua evolução e mostrar como você está progredindo a cada período.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button onClick={onNext} size="lg" className="px-8">
            Continuar
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="text-7xl mb-6"
      >
        {isPositive ? '📈' : isNeutral ? '➡️' : '📉'}
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xl text-muted-foreground mb-6"
      >
        Comparado ao período anterior
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
        className="mb-6"
      >
        <div className={cn(
          "inline-flex items-center gap-2 px-6 py-3 rounded-full text-4xl font-bold",
          isPositive && "bg-green-500/10 text-green-600",
          isNeutral && "bg-muted text-muted-foreground",
          !isPositive && !isNeutral && "bg-amber-500/10 text-amber-600"
        )}>
          {isPositive ? (
            <TrendingUp className="w-8 h-8" />
          ) : isNeutral ? (
            <Minus className="w-8 h-8" />
          ) : (
            <TrendingDown className="w-8 h-8" />
          )}
          <span>
            {isPositive ? '+' : ''}{percentChange}%
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-4 mb-8"
      >
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Antes</p>
          <p className="text-lg font-semibold">{formatTime(previousMinutes!)}</p>
        </div>
        <div className="text-2xl">→</div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Agora</p>
          <p className="text-lg font-semibold text-primary">{formatTime(currentMinutes)}</p>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-base text-muted-foreground mb-8 max-w-sm"
      >
        {isPositive 
          ? 'Você está evoluindo! Continue nesse ritmo incrível! 🚀' 
          : isNeutral 
            ? 'Você manteve seu ritmo. Constância é a chave! 💪'
            : 'Cada período é diferente. O importante é não desistir! 🌱'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Button onClick={onNext} size="lg" className="px-8">
          Continuar
        </Button>
      </motion.div>
    </div>
  );
};
