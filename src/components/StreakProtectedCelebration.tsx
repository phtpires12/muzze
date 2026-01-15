import { useState, useEffect } from 'react';
import { Shield, Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-cyan-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-sm">
      <Confetti />
      
      {/* Floating snowflakes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <Snowflake
            key={i}
            className="absolute text-white/20 animate-pulse"
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

      {/* Glow rings */}
      <div className="absolute w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute w-48 h-48 bg-blue-500/30 rounded-full blur-2xl animate-pulse delay-75" />

      {/* Main card */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-8 mx-4 text-center">
        {/* Shield icon with glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-400/40 rounded-full blur-xl animate-pulse" />
          <div className="relative p-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-2xl">
            <Shield className="w-16 h-16 text-white drop-shadow-lg" fill="currentColor" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            Ofensiva Protegida!
          </h1>
          <p className="text-cyan-200 text-lg">
            🛡️ Seus bloqueios salvaram sua sequência
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-white">
              <Snowflake className="w-6 h-6 text-cyan-300" />
              {freezesUsed}
            </div>
            <p className="text-sm text-cyan-200/80">
              {freezesUsed === 1 ? 'bloqueio usado' : 'bloqueios usados'}
            </p>
          </div>
          
          <div className="w-px bg-white/20" />
          
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              🔥 {currentStreak}
            </div>
            <p className="text-sm text-cyan-200/80">
              dias preservados
            </p>
          </div>
        </div>

        {/* Message */}
        <p className="text-white/70 text-sm max-w-xs mt-2">
          Sua ofensiva continua intacta! Continue criando para manter o ritmo.
        </p>

        {/* Continue button */}
        <Button
          onClick={onContinue}
          size="lg"
          className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg shadow-cyan-500/30 transition-all hover:scale-105"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default StreakProtectedCelebration;
