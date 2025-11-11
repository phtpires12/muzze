import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakHaloProps {
  show: boolean;
  streakCount: number;
  onComplete?: () => void;
}

export const StreakHalo = ({ show, streakCount, onComplete }: StreakHaloProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Halo effect */}
      <div className="absolute inset-0 bg-primary/5 animate-fade-in" />
      
      {/* Animated rings */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse" 
             style={{ width: "300px", height: "300px", margin: "-150px" }} />
        <div className="absolute inset-0 rounded-full bg-accent/20 blur-2xl animate-pulse delay-100" 
             style={{ width: "250px", height: "250px", margin: "-125px" }} />
        
        {/* Center content */}
        <div className="relative bg-background/90 backdrop-blur-xl border-2 border-primary/50 rounded-3xl p-8 shadow-2xl animate-scale-in">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Trophy className="w-16 h-16 text-primary animate-bounce" />
              <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm animate-pulse">
                {streakCount}
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Meta cumprida! 🎉
              </h2>
              <p className="text-muted-foreground">
                {streakCount} {streakCount === 1 ? "dia" : "dias"} de sequência
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
