import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Share2, Download, X } from "lucide-react";
import { Confetti } from "@/components/shared";
import { RecapShareCard } from "./RecapShareCard";
import { useRecapShare } from '@/core/hooks';
import { RecapComputedStats } from "@/types/recap";

interface RecapClosingSlideProps {
  totalMinutes: number;
  daysActive: number;
  sessionsCount: number;
  periodType: string;
  computedStats: RecapComputedStats;
  onClose: () => void;
}

export const RecapClosingSlide = ({ 
  totalMinutes,
  daysActive,
  sessionsCount,
  periodType,
  computedStats,
  onClose 
}: RecapClosingSlideProps) => {
  const hours = Math.floor(totalMinutes / 60);
  const { cardRef, isGenerating, shareImage, downloadImage } = useRecapShare();
  
  const getMessage = () => {
    if (hours >= 50) return "Você é uma máquina de criar conteúdo!";
    if (hours >= 20) return "Sua dedicação é inspiradora!";
    if (hours >= 10) return "Você está construindo algo grande!";
    if (daysActive >= 20) return "Sua consistência é impressionante!";
    return "Cada passo conta na jornada!";
  };

  const handleShare = async () => {
    const textFallback = `🎉 Meu recap de criação de conteúdo!\n\n⏱️ ${hours}h criando nos últimos 30 dias\n📅 ${daysActive} dias ativos\n🎯 ${sessionsCount} sessões\n\n#Muzze #CriadorDeConteudo`;
    await shareImage(textFallback);
  };

  const handleDownload = () => {
    downloadImage();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-primary/5 via-background to-background relative overflow-hidden">
      <Confetti count={60} />

      {/* Hidden share card for image generation */}
      <div className="fixed -left-[9999px] -top-[9999px]" aria-hidden="true">
        <RecapShareCard
          ref={cardRef}
          totalMinutes={totalMinutes}
          daysActive={daysActive}
          sessionsCount={sessionsCount}
          periodType={periodType}
          favoriteStage={computedStats.favoriteStage}
          weeklyGoalHitCount={computedStats.weeklyGoalHitCount}
          totalWeeks={computedStats.totalWeeks}
        />
      </div>

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
          onClick={handleShare}
          size="lg"
          className="w-full gap-2"
          disabled={isGenerating}
        >
          <Share2 className="w-4 h-4" />
          {isGenerating ? "Gerando imagem..." : "Compartilhar meu recap"}
        </Button>

        <Button 
          onClick={handleDownload}
          variant="secondary"
          size="lg"
          className="w-full gap-2"
          disabled={isGenerating}
        >
          <Download className="w-4 h-4" />
          Salvar imagem
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
