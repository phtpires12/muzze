import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TROPHIES, getUserStats } from "@/lib/gamification";
import { useEffect, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const TrophyCard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(getUserStats());
  
  useEffect(() => {
    const handleStorageChange = () => {
      setStats(getUserStats());
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('trophyUnlocked', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('trophyUnlocked', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  const unlockedTrophies = TROPHIES.filter(t => stats.trophies.includes(t.id));
  const lockedTrophies = TROPHIES.filter(t => !stats.trophies.includes(t.id));
  const totalTrophyXP = unlockedTrophies.reduce((sum, trophy) => sum + trophy.points, 0);
  
  return (
    <Card 
      className={cn(
        "p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
        "active:scale-[0.98]"
      )}
      onClick={() => navigate('/levels')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">🏆 Troféus</h3>
          {totalTrophyXP > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" />
              +{totalTrophyXP} XP
            </Badge>
          )}
        </div>
        <Badge variant="secondary">{unlockedTrophies.length}/{TROPHIES.length}</Badge>
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {unlockedTrophies.map((trophy) => (
          <div
            key={trophy.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20"
          >
            <div className="text-3xl">{trophy.icon}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{trophy.name}</h4>
              <p className="text-xs text-muted-foreground">{trophy.description}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                +{trophy.points} pontos
              </Badge>
            </div>
          </div>
        ))}
        
        {lockedTrophies.map((trophy) => (
          <div
            key={trophy.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 opacity-50"
          >
            <div className="text-3xl grayscale">{trophy.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{trophy.name}</h4>
                <Lock className="w-3 h-3 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">{trophy.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
