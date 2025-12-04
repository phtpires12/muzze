import { Card } from "@/components/ui/card";
import { getLevelByXP, getProgressToNextLevelByXP, getNextLevelInfo } from "@/lib/gamification";
import { useNavigate } from "react-router-dom";
import { useGamification } from "@/hooks/useGamification";

export const GamificationBadge = () => {
  const { stats, loading } = useGamification();
  const navigate = useNavigate();
  
  if (loading) {
    return null;
  }
  
  const levelInfo = getLevelByXP(stats.totalXP);
  const nextLevel = getNextLevelInfo(levelInfo.level);
  const progress = getProgressToNextLevelByXP(stats.totalXP);
  
  return (
    <Card 
      className="p-6 bg-gradient-to-br from-card to-muted/20 border-2 border-primary/20 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      onClick={() => navigate('/levels')}
    >
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
              <h3 className="font-bold text-lg">Nível {levelInfo.level} — {levelInfo.name}</h3>
              <p className="text-sm text-muted-foreground">{stats.totalXP} XP</p>
            </div>
          </div>
          
          <div className="text-2xl font-bold text-primary">
            {Math.floor(progress)}%
          </div>
        </div>
        
        {nextLevel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Próximo: {nextLevel.name}</span>
              <span>{Math.floor(progress)}%</span>
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
