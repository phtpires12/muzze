import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Gift, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserStats, XP_LEVELS, getLevelByXP, getProgressToNextLevelByXP, getNextLevelInfo } from "@/lib/gamification";

export default function Levels() {
  const [stats, setStats] = useState(getUserStats());
  const navigate = useNavigate();

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

  const currentLevelInfo = getLevelByXP(stats.totalXP);
  const nextLevel = getNextLevelInfo(currentLevelInfo.level);
  const progress = getProgressToNextLevelByXP(stats.totalXP);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Seus Níveis e Recompensas</h1>
              <p className="text-sm text-muted-foreground">A cada criação, você evolui.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* XP Progress Card */}
        <Card className="p-6 bg-gradient-to-br from-card to-muted/20 border-2 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: currentLevelInfo.color }}
                >
                  {currentLevelInfo.level}
                </div>
                <div>
                  <h2 className="font-bold text-xl">Nível {currentLevelInfo.level} — {currentLevelInfo.name}</h2>
                  <p className="text-sm text-muted-foreground">{stats.totalXP} XP total</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {Math.round(progress)}%
                </div>
                <p className="text-xs text-muted-foreground">progresso</p>
              </div>
            </div>

            {nextLevel && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Próximo: {nextLevel.name}</span>
                  <span className="font-semibold">{nextLevel.xpRequired} XP</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Levels List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Todos os Níveis
          </h2>

          <div className="space-y-3">
            {XP_LEVELS.map((level) => {
              const isUnlocked = stats.totalXP >= level.xpRequired;
              const isCurrent = level.level === currentLevelInfo.level;

              return (
                <Card
                  key={level.level}
                  className={`p-5 transition-all ${
                    isCurrent
                      ? 'border-2 border-primary shadow-lg bg-gradient-to-r from-primary/5 to-accent/5'
                      : isUnlocked
                      ? 'bg-card'
                      : 'bg-muted/30 opacity-40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
                      style={{ 
                        background: isUnlocked ? level.color : 'hsl(var(--muted))',
                        filter: isUnlocked ? 'none' : 'grayscale(1)'
                      }}
                    >
                      {level.level}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-lg">
                            Nível {level.level} — {level.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{level.description}</p>
                        </div>

                        {isUnlocked && (
                          isCurrent ? (
                            <Badge variant="default" className="shrink-0">Atual</Badge>
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                          )
                        )}
                        {!isUnlocked && (
                          <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-primary">{level.xpRequired.toLocaleString()} XP</span>
                        {level.xpRequired > 0 && !isUnlocked && (
                          <span className="text-muted-foreground">
                            (faltam {(level.xpRequired - stats.totalXP).toLocaleString()} XP)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Rewards Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Recompensas
          </h2>

          <div className="space-y-3">
            {XP_LEVELS.filter(level => level.rewards.length > 0).map((level) => {
              const isUnlocked = stats.totalXP >= level.xpRequired;

              return (
                <Card
                  key={`reward-${level.level}`}
                  className={`p-5 ${
                    isUnlocked
                      ? 'bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20'
                      : 'bg-muted/30 opacity-40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">Nível {level.level} — {level.name}</h3>
                      {isUnlocked ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="space-y-2">
                      {level.rewards.map((reward, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          <span className={isUnlocked ? 'text-foreground' : 'text-muted-foreground'}>
                            {reward}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
