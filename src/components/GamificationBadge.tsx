import { Trophy, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getUserStats, getLevelInfo, getProgressToNextLevel, getNextLevelInfo } from "@/lib/gamification";
import { useEffect, useState } from "react";

export const GamificationBadge = () => {
  const [stats, setStats] = useState(getUserStats());
  
  useEffect(() => {
    const handleStorageChange = () => {
      setStats(getUserStats());
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  const levelInfo = getLevelInfo(stats.level);
  const nextLevel = getNextLevelInfo(stats.level);
  const progress = getProgressToNextLevel(stats.totalPoints, stats.level);
  
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20 border-2 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: levelInfo.color }}
            >
              {stats.level}
            </div>
            <div>
              <h3 className="font-bold text-lg">{levelInfo.name}</h3>
              <p className="text-sm text-muted-foreground">{stats.totalPoints} pontos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-accent" />
              <span className="font-semibold">{stats.totalPoints}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="font-semibold">{stats.trophies.length}</span>
            </div>
          </div>
        </div>
        
        {nextLevel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Próximo: {nextLevel.name}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
