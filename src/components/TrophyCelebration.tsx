import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/Confetti";
import { Trophy } from "@/lib/gamification";

interface TrophyCelebrationProps {
  show: boolean;
  trophy: Trophy | null;
  xpGained: number;
  onContinue: () => void;
}

export const TrophyCelebration = ({ 
  show, 
  trophy,
  xpGained,
  onContinue 
}: TrophyCelebrationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (show && trophy) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [show, trophy]);

  if (!isVisible || !trophy) return null;

  const handleViewLevels = () => {
    onContinue();
    navigate("/levels");
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 backdrop-blur-xl animate-fade-in">
      <Confetti count={60} />

      {/* Animated glow rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-primary/10 blur-3xl animate-glow-pulse" />
        <div className="absolute w-[250px] h-[250px] md:w-[400px] md:h-[400px] rounded-full bg-accent/10 blur-2xl animate-glow-pulse-delayed" />
      </div>

      <div className="relative bg-background/95 backdrop-blur-xl border-2 border-primary/50 rounded-3xl p-6 md:p-12 shadow-2xl max-w-md w-full mx-4 animate-slide-up-bounce">
        {/* Trophy Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center animate-bounce text-5xl">
              {trophy.icon}
            </div>
          </div>
        </div>

        {/* Trophy Info */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            🎉 Conquista Desbloqueada!
          </h2>
          <h3 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
            {trophy.name}
          </h3>
          <p className="text-muted-foreground mb-4">
            {trophy.description}
          </p>
          
          {xpGained > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <span className="text-2xl font-bold text-primary">⭐ +{xpGained} XP</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3">
          <Button
            onClick={handleViewLevels}
            variant="outline"
            className="flex-1 h-12 text-base border-primary/50 hover:bg-primary/10"
          >
            Ver Conquistas
          </Button>
          <Button
            onClick={onContinue}
            className="flex-1 h-12 text-base bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg font-bold"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};
