import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TROPHIES } from "@/lib/gamification";
import { Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useGamification } from "@/hooks/useGamification";

export const TrophyCard = () => {
  const navigate = useNavigate();
  const { stats, loading } = useGamification();
  
  if (loading) {
    return null;
  }
  
  const unlockedTrophies = TROPHIES.filter(t => stats.trophies.includes(t.id));
  const lockedTrophies = TROPHIES.filter(t => !stats.trophies.includes(t.id));
  const totalTrophyXP = unlockedTrophies.reduce((sum, trophy) => sum + trophy.points, 0);
  
  const calculateTrophyProgress = (trophyId: string) => {
    const scriptsCreated = stats.scriptsCreated;
    const ideasCreated = stats.ideasCreated;
    const totalHours = stats.totalHours;
    const streak = stats.streak;

    switch (trophyId) {
      case 'first_script':
        return { 
          progress: Math.min((scriptsCreated / 1) * 100, 100),
          text: `${scriptsCreated}/1 roteiro`
        };
      case 'scriptwriter':
        return {
          progress: Math.min((scriptsCreated / 10) * 100, 100),
          text: `${scriptsCreated}/10 roteiros`
        };
      case 'first_idea':
        return {
          progress: Math.min((ideasCreated / 1) * 100, 100),
          text: `${ideasCreated}/1 ideia`
        };
      case 'idea_machine':
        return {
          progress: Math.min((ideasCreated / 50) * 100, 100),
          text: `${ideasCreated}/50 ideias`
        };
      case 'week_streak':
        return {
          progress: Math.min((streak / 7) * 100, 100),
          text: `${streak}/7 dias`
        };
      case 'month_streak':
        return {
          progress: Math.min((streak / 30) * 100, 100),
          text: `${streak}/30 dias`
        };
      case 'hour_creator':
        return {
          progress: Math.min((totalHours / 1) * 100, 100),
          text: `${totalHours.toFixed(1)}/1 hora`
        };
      case 'ten_hours':
        return {
          progress: Math.min((totalHours / 10) * 100, 100),
          text: `${totalHours.toFixed(1)}/10 horas`
        };
      case 'hundred_hours':
        return {
          progress: Math.min((totalHours / 100) * 100, 100),
          text: `${totalHours.toFixed(1)}/100 horas`
        };
      default:
        return null;
    }
  };
  
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
                +{trophy.points} XP
              </Badge>
            </div>
          </div>
        ))}
        
        {lockedTrophies.map((trophy) => {
          const progressData = calculateTrophyProgress(trophy.id);
          
          return (
            <div
              key={trophy.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border-muted/40 transition-all hover:bg-muted/40 hover:border-muted/60"
            >
              <div className="text-3xl grayscale opacity-50">{trophy.icon}</div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-foreground/70">{trophy.name}</h4>
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">{trophy.description}</p>
                
                {progressData && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">{progressData.text}</span>
                      <span className="font-semibold text-primary">{Math.floor(progressData.progress)}%</span>
                    </div>
                    <Progress value={progressData.progress} className="h-2" />
                  </div>
                )}
                
                <Badge variant="outline" className="text-xs font-semibold">
                  +{trophy.points} XP
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
