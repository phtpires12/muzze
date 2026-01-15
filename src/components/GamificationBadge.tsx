import { Card } from "@/components/ui/card";
import { getLevelByXP, getProgressToNextLevelByXP, getNextLevelInfo } from "@/lib/gamification";
import { useNavigate } from "react-router-dom";
import { useGamification } from "@/hooks/useGamification";
import { ChevronRight } from "lucide-react";

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
      className="p-5 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] group"
      onClick={() => navigate('/levels')}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{ background: levelInfo.color }}
            >
              {stats.level}
            </div>
            <div>
              <h3 className="font-semibold text-base">Nível {levelInfo.level} — {levelInfo.name}</h3>
              <p className="text-sm text-muted-foreground">{stats.totalXP} XP</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              {Math.floor(progress)}%
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
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
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
