import { useState, useEffect } from 'react';
import { Shield, Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Confetti } from './Confetti';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface StreakProtectedCelebrationProps {
  show: boolean;
  freezesUsed: number;
  currentStreak: number;
  onContinue: () => void;
}

const StreakProtectedCelebration = ({
  show,
  freezesUsed,
  currentStreak,
  onContinue,
}: StreakProtectedCelebrationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { playSound } = useSoundEffects(0.6);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Play protection sound when celebration appears
      playSound('protect');
    }
  }, [show, playSound]);

  if (!isVisible) return null;

  return (
    <AuroraBackground 
      variant="full" 
      intensity="strong" 
      animated={true}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <Confetti />
      
      {/* Floating snowflakes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <Snowflake
            key={i}
            className="absolute text-primary/30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 20 + 10}px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 2 + 2}s`,
            }}
            size={Math.random() * 24 + 16}
          />
        ))}

      </div>

      {/* Main card */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-8 mx-4 text-center">
        {/* Shield icon with glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/40 rounded-full blur-xl animate-pulse" />
          <div className="relative p-6 bg-gradient-to-br from-primary to-accent rounded-full shadow-2xl">
            <Shield className="w-16 h-16 text-white drop-shadow-lg" fill="currentColor" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground drop-shadow-lg">
            Ofensiva Protegida!
          </h1>
          <p className="text-muted-foreground text-lg">
            🛡️ Seus bloqueios salvaram sua sequência
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-foreground">
              <Snowflake className="w-6 h-6 text-primary" />
              {freezesUsed}
            </div>
            <p className="text-sm text-muted-foreground">
              {freezesUsed === 1 ? 'bloqueio usado' : 'bloqueios usados'}
            </p>
          </div>
          
          <div className="w-px bg-border" />
          
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">
              🔥 {currentStreak}
            </div>
            <p className="text-sm text-muted-foreground">
              dias preservados
            </p>
          </div>
        </div>

        {/* Message */}
        <p className="text-muted-foreground text-sm max-w-xs mt-2">
          Sua ofensiva continua intacta! Continue criando para manter o ritmo.
        </p>

        {/* Continue button */}
        <Button
          onClick={onContinue}
          size="lg"
          variant="gradient-pill"
          className="mt-4 px-8 py-6 text-lg transition-all hover:scale-105"
        >
          Continuar
        </Button>
      </div>
    </AuroraBackground>
  );
};

export default StreakProtectedCelebration;
