import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Share2, X } from "lucide-react";
import Confetti from "@/components/Confetti";

interface RecapClosingSlideProps {
  totalMinutes: number;
  daysActive: number;
  periodType: string;
  onShare: () => void;
  onClose: () => void;
}

export const RecapClosingSlide = ({ 
  totalMinutes,
  daysActive,
  periodType,
  onShare, 
  onClose 
}: RecapClosingSlideProps) => {
  const hours = Math.floor(totalMinutes / 60);
  
  const getMessage = () => {
    if (hours >= 50) return "Você é uma máquina de criar conteúdo!";
    if (hours >= 20) return "Sua dedicação é inspiradora!";
    if (hours >= 10) return "Você está construindo algo grande!";
    if (daysActive >= 20) return "Sua consistência é impressionante!";
    return "Cada passo conta na jornada!";
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-primary/5 via-background to-background relative overflow-hidden">
      <Confetti show={true} />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
        className="text-8xl mb-6"
      >
        🎉
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-3xl font-bold text-foreground mb-3"
      >
        Parabéns!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-lg text-muted-foreground mb-2 max-w-sm"
      >
        {getMessage()}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-sm text-muted-foreground/80 mb-8 max-w-xs"
      >
        Continue assim e os resultados virão. Criação de conteúdo é uma maratona, não uma corrida de 100 metros. 🏃‍♂️
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <Button 
          onClick={onShare}
          size="lg"
          className="w-full gap-2"
        >
          <Share2 className="w-4 h-4" />
          Compartilhar meu recap
        </Button>

        <Button 
          onClick={onClose}
          variant="outline"
          size="lg"
          className="w-full gap-2"
        >
          <X className="w-4 h-4" />
          Fechar
        </Button>
      </motion.div>
    </div>
  );
};
