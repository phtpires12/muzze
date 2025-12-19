import { useState, useEffect } from 'react';
import { Clock, Star, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Confetti } from '@/components/Confetti';

interface SessionSummaryProps {
  show: boolean;
  duration: number;
  xpGained: number;
  baseXP?: number;
  bonusXP?: number;
  streakBonusPercent?: number;
  stage: string;
  onContinue: () => void;
  autoRedirectDestination?: string | null;
}

const STAGE_LABELS: Record<string, string> = {
  idea: 'Ideação',
  ideation: 'Ideação',
  script: 'Roteirização',
  review: 'Revisão',
  record: 'Gravação',
  recording: 'Gravação',
  edit: 'Edição',
  editing: 'Edição',
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
};

const DESTINATION_LABELS: Record<string, string> = {
  '/': 'Início',
  '/calendario': 'Calendário',
  '/stats': 'Estatísticas',
};

const SessionSummary = ({ 
  show, 
  duration, 
  xpGained, 
  baseXP, 
  bonusXP, 
  streakBonusPercent, 
  stage, 
  onContinue, 
  autoRedirectDestination 
}: SessionSummaryProps) => {
  const [animatedXP, setAnimatedXP] = useState(0);
  const [animatedBonus, setAnimatedBonus] = useState(0);
  const [countdown, setCountdown] = useState(5);

  const hasBonus = bonusXP && bonusXP > 0 && streakBonusPercent && streakBonusPercent > 0;

  // Animate XP count
  useEffect(() => {
    if (show) {
      setAnimatedXP(0);
      setAnimatedBonus(0);
      
      const targetXP = xpGained;
      const targetBonus = bonusXP || 0;
      const steps = 20;
      const stepValue = targetXP / steps;
      const bonusStepValue = targetBonus / steps;
      let current = 0;
      let currentBonus = 0;
      
      const interval = setInterval(() => {
        current += stepValue;
        currentBonus += bonusStepValue;
        if (current >= targetXP) {
          setAnimatedXP(targetXP);
          setAnimatedBonus(targetBonus);
          clearInterval(interval);
        } else {
          setAnimatedXP(Math.floor(current));
          setAnimatedBonus(Math.floor(currentBonus));
        }
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [show, xpGained, bonusXP]);

  // Auto-redirect countdown when destination is set
  useEffect(() => {
    if (!show || !autoRedirectDestination) {
      setCountdown(5);
      return;
    }

    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show, autoRedirectDestination, onContinue]);

  if (!show) return null;

  const stageLabel = STAGE_LABELS[stage] || stage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <Confetti />
      
      {/* Animated glow rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-64 h-64 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute w-48 h-48 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 p-8 max-w-sm w-full mx-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Sessão Concluída! 🎉
          </h1>
          <p className="text-muted-foreground">
            Ótimo trabalho! Você está construindo consistência.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="w-full space-y-3">
          {/* Duration Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Tempo trabalhado</p>
              <p className="text-xl font-bold text-foreground">{formatDuration(duration)}</p>
            </div>
          </div>

          {/* XP Card - Com breakdown de bônus */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">XP Ganho</p>
              <p className="text-xl font-bold text-foreground">+{animatedXP} XP</p>
              {hasBonus && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Base: {baseXP}</span>
                  <span className="text-xs font-medium text-orange-500">
                    +{animatedBonus} bônus ({streakBonusPercent}% ofensiva)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stage Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Última etapa</p>
              <p className="text-xl font-bold text-foreground">{stageLabel}</p>
            </div>
          </div>
        </div>

        {/* Continue Button or Auto-redirect */}
        {autoRedirectDestination ? (
          <div className="w-full mt-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm">
                Redirecionando para {DESTINATION_LABELS[autoRedirectDestination] || 'próxima página'} em
              </span>
            </div>
            <div className="text-4xl font-bold text-primary tabular-nums">
              {countdown}s
            </div>
            <Button
              onClick={onContinue}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Ir agora
            </Button>
          </div>
        ) : (
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
};

export default SessionSummary;
