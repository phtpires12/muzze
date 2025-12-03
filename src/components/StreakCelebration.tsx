import { useEffect, useState } from "react";
import { Flame, Snowflake, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/Confetti";
import { cn } from "@/lib/utils";

interface WeekDay {
  date: Date;
  dayName: string;
  status: 'completed' | 'freeze' | 'missed' | 'future' | 'today';
}

interface StreakCelebrationProps {
  show: boolean;
  streakCount: number;
  weekDays: WeekDay[];
  onContinue: () => void;
}

export const StreakCelebration = ({ 
  show, 
  streakCount, 
  weekDays,
  onContinue 
}: StreakCelebrationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [countUpValue, setCountUpValue] = useState(0);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Animate count up
      const duration = 1500;
      const steps = 30;
      const increment = streakCount / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= streakCount) {
          setCountUpValue(streakCount);
          clearInterval(interval);
        } else {
          setCountUpValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
      setCountUpValue(0);
    }
  }, [show, streakCount]);

  if (!isVisible) return null;

  const getStatusIcon = (status: WeekDay['status']) => {
    switch (status) {
      case 'completed':
      case 'today':
        return <Flame className="w-6 h-6 text-orange-500" />;
      case 'freeze':
        return <Snowflake className="w-6 h-6 text-blue-400" />;
      case 'missed':
        return <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
        </div>;
      case 'future':
        return <div className="w-6 h-6 rounded-full bg-muted/30" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-gradient-to-br from-orange-500/20 via-red-500/20 to-orange-600/20 backdrop-blur-xl animate-fade-in">
      <Confetti count={80} />
      
      {/* Animated glow rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-orange-500/10 blur-3xl animate-glow-pulse" />
        <div className="absolute w-[250px] h-[250px] md:w-[400px] md:h-[400px] rounded-full bg-red-500/10 blur-2xl animate-glow-pulse-delayed" />
      </div>

      <div className="relative bg-background/95 backdrop-blur-xl border-2 border-orange-500/50 rounded-3xl p-6 md:p-12 shadow-2xl max-w-md w-full mx-4 animate-slide-up-bounce">
        {/* Flame Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center animate-flame-dance">
              <Flame className="w-14 h-14 text-white" />
            </div>
          </div>
        </div>

        {/* Streak Count */}
        <div className="text-center mb-8">
          <div className="text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-2 animate-count-up tabular-nums">
            {countUpValue}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {streakCount === 1 ? 'dia de ofensiva!' : 'dias de ofensiva!'}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            🎉 Você bateu sua meta diária!
          </p>
        </div>

        {/* Week Progress */}
        <div className="mb-8 p-4 md:p-6 bg-card/50 rounded-2xl border border-border/50">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
            Sua Semana
          </h3>
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {weekDays.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-2 min-w-0">
                <div className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300",
                  day.status === 'completed' || day.status === 'today' 
                    ? "bg-orange-500/20 ring-2 ring-orange-500 animate-scale-in" 
                    : day.status === 'freeze'
                    ? "bg-blue-400/20 ring-2 ring-blue-400"
                    : day.status === 'missed'
                    ? "bg-red-500/10"
                    : "bg-muted/20"
                )}>
                  {getStatusIcon(day.status)}
                </div>
                <span className={cn(
                  "text-xs font-medium text-center w-full truncate",
                  day.status === 'completed' || day.status === 'today'
                    ? "text-orange-500"
                    : day.status === 'freeze'
                    ? "text-blue-400"
                    : "text-muted-foreground"
                )}>
                  {day.dayName.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
