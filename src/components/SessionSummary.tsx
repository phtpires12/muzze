import { useState, useEffect } from 'react';
import { Clock, Star, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Confetti } from '@/components/Confetti';

interface SessionSummaryProps {
  show: boolean;
  duration: number;
  xpGained: number;
  stage: string;
  onContinue: () => void;
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

const SessionSummary = ({ show, duration, xpGained, stage, onContinue }: SessionSummaryProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedXP, setAnimatedXP] = useState(0);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setAnimatedXP(0);
      
      // Animate XP count
      const targetXP = xpGained;
      const steps = 20;
      const stepValue = targetXP / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += stepValue;
        if (current >= targetXP) {
          setAnimatedXP(targetXP);
          clearInterval(interval);
        } else {
          setAnimatedXP(Math.floor(current));
        }
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [show, xpGained]);

  if (!isVisible) return null;

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

          {/* XP Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">XP Ganho</p>
              <p className="text-xl font-bold text-foreground">+{animatedXP} XP</p>
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

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          size="lg"
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default SessionSummary;
