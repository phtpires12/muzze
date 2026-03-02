import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRecaps } from '@/core/hooks';
import { RecapOpeningSlide } from "@/components/content/recap/RecapOpeningSlide";
import { RecapQuestionsSlide } from "@/components/content/recap/RecapQuestionsSlide";
import { RecapTotalTimeSlide } from "@/components/content/recap/RecapTotalTimeSlide";
import { RecapGoalSlide } from "@/components/content/recap/RecapGoalSlide";
import { RecapComparisonSlide } from "@/components/content/recap/RecapComparisonSlide";
import { RecapHighlightsSlide } from "@/components/content/recap/RecapHighlightsSlide";
import { RecapClosingSlide } from "@/components/content/recap/RecapClosingSlide";
import { cn } from '@/core/utils';
import { toast } from "sonner";
import { ROUTES } from "@/routes/routes";


const Recap = () => {
  const { recapId } = useParams<{ recapId: string }>();
  const navigate = useNavigate();
  const { getRecapById, saveUserInputs, markAsViewed, loading } = useRecaps();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasAnsweredQuestions, setHasAnsweredQuestions] = useState(false);

  const recap = recapId ? getRecapById(recapId) : undefined;

  // Mark as viewed when opening
  useEffect(() => {
    if (recapId && recap && !recap.viewed_at) {
      markAsViewed(recapId);
    }
  }, [recapId, recap, markAsViewed]);

  // Check if user already answered questions
  useEffect(() => {
    if (recap && recap.followers_count !== null) {
      setHasAnsweredQuestions(true);
    }
  }, [recap]);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => prev + 1);
  }, []);

  const handleQuestionsSubmit = async (followers: number, hadViral: boolean) => {
    if (recapId) {
      const success = await saveUserInputs(recapId, followers, hadViral);
      if (success) {
        setHasAnsweredQuestions(true);
        nextSlide();
      } else {
        toast.error("Erro ao salvar respostas");
      }
    }
  };

  const handleShare = async () => {
    if (!recap) return;

    const hours = Math.floor(recap.total_minutes / 60);
    const shareText = `🎉 Meu recap de criação de conteúdo!\n\n⏱️ ${hours}h criando nos últimos 30 dias\n📅 ${recap.days_active} dias ativos\n🎯 ${recap.sessions_count} sessões\n\n#Muzze #CriadorDeConteudo`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Meu Recap Muzze',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Texto copiado para a área de transferência!");
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleClose = () => {
    navigate(ROUTES.STATS);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl text-foreground">Carregando...</div>
      </div>
    );
  }

  if (!recap) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-8 text-center">
        <span className="text-6xl mb-4">😕</span>
        <h2 className="text-xl font-semibold mb-2">Recap não encontrado</h2>
        <p className="text-muted-foreground mb-6">Este recap pode não existir ou já foi removido.</p>
        <button 
          onClick={handleClose}
          className="text-primary underline"
        >
          Voltar para Stats
        </button>
      </div>
    );
  }

  // Build slides array based on whether user has answered questions
  const slides = [
    <RecapOpeningSlide 
      key="opening"
      periodType={recap.period_type} 
      onNext={nextSlide} 
    />,
    ...(hasAnsweredQuestions ? [] : [
      <RecapQuestionsSlide
        key="questions"
        onSubmit={handleQuestionsSubmit}
        initialFollowers={recap.followers_count}
        initialHadViral={recap.had_viral}
      />
    ]),
    <RecapTotalTimeSlide
      key="time"
      totalMinutes={recap.total_minutes}
      periodType={recap.period_type}
      onNext={nextSlide}
    />,
    <RecapGoalSlide
      key="goal"
      weeksHit={recap.computed_stats.weeklyGoalHitCount || 0}
      totalWeeks={recap.computed_stats.totalWeeks || 4}
      onNext={nextSlide}
    />,
    <RecapComparisonSlide
      key="comparison"
      currentMinutes={recap.total_minutes}
      previousMinutes={recap.computed_stats.previousPeriodMinutes}
      onNext={nextSlide}
    />,
    <RecapHighlightsSlide
      key="highlights"
      bestDay={recap.computed_stats.bestDay}
      bestDayMinutes={recap.computed_stats.bestDayMinutes || 0}
      favoriteStage={recap.computed_stats.favoriteStage}
      daysActive={recap.days_active}
      sessionsCount={recap.sessions_count}
      onNext={nextSlide}
    />,
    <RecapClosingSlide
      key="closing"
      totalMinutes={recap.total_minutes}
      daysActive={recap.days_active}
      sessionsCount={recap.sessions_count}
      periodType={recap.period_type}
      computedStats={recap.computed_stats}
      onClose={handleClose}
    />
  ];

  const totalSlides = slides.length;

  return (
    <div 
      className="fixed inset-0 z-50 bg-background overflow-hidden"
      style={{ 
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {slides[currentSlide]}
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 flex gap-1.5"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
      >
        {slides.map((_, i) => (
          <span
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              i === currentSlide 
                ? "bg-primary w-4" 
                : i < currentSlide 
                  ? "bg-primary/50" 
                  : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default Recap;
