import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RecapHighlightsSlideProps {
  bestDay: string | null;
  bestDayMinutes: number;
  favoriteStage: string | null;
  daysActive: number;
  sessionsCount: number;
  onNext: () => void;
}

const STAGE_INFO: Record<string, { label: string; emoji: string }> = {
  ideation: { label: 'Ideação', emoji: '💡' },
  script: { label: 'Roteiro', emoji: '📝' },
  review: { label: 'Revisão', emoji: '🔍' },
  record: { label: 'Gravação', emoji: '🎬' },
  edit: { label: 'Edição', emoji: '✂️' },
};

export const RecapHighlightsSlide = ({ 
  bestDay, 
  bestDayMinutes,
  favoriteStage, 
  daysActive,
  sessionsCount,
  onNext 
}: RecapHighlightsSlideProps) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'short',
      weekday: 'long'
    });
  };

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const stageInfo = favoriteStage ? STAGE_INFO[favoriteStage] : null;

  const highlights = [
    {
      emoji: '🏆',
      title: 'Melhor dia',
      value: bestDay ? formatDate(bestDay) : 'N/A',
      subtitle: bestDayMinutes > 0 ? `${formatMinutes(bestDayMinutes)} criando` : undefined,
    },
    {
      emoji: stageInfo?.emoji || '⭐',
      title: 'Etapa favorita',
      value: stageInfo?.label || 'Variado',
      subtitle: 'Onde você mais trabalhou',
    },
    {
      emoji: '📅',
      title: 'Dias ativos',
      value: `${daysActive} dias`,
      subtitle: 'de dedicação',
    },
    {
      emoji: '🎯',
      title: 'Sessões',
      value: `${sessionsCount}`,
      subtitle: 'sessões completadas',
    },
  ].filter(h => h.value !== 'N/A' && h.value !== '0' && h.value !== '0 dias');

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <span className="text-5xl mb-3 block">✨</span>
        <h2 className="text-2xl font-bold text-foreground">Destaques</h2>
        <p className="text-sm text-muted-foreground">Seus momentos especiais</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
        {highlights.map((highlight, index) => (
          <motion.div
            key={highlight.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card className="p-4 bg-card/50 text-center h-full">
              <span className="text-3xl block mb-2">{highlight.emoji}</span>
              <p className="text-xs text-muted-foreground mb-1">{highlight.title}</p>
              <p className="font-semibold text-foreground text-sm">{highlight.value}</p>
              {highlight.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{highlight.subtitle}</p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

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
};
