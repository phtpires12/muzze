import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Gift, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { XP_LEVELS, getLevelByXP, getProgressToNextLevelByXP, getNextLevelInfo, TROPHIES } from "@/lib/gamification";
import { useGamification } from "@/hooks/useGamification";

export default function Levels() {
  const { stats, loading } = useGamification();
  const navigate = useNavigate();
  
  // 🔍 DEBUG LOG TEMPORÁRIO
  console.log('🏅 Levels useGamification:', stats);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const currentLevelInfo = getLevelByXP(stats.totalXP);
  const nextLevel = getNextLevelInfo(currentLevelInfo.level);
  const progress = getProgressToNextLevelByXP(stats.totalXP);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div 
        className="sticky z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <div 
          className="container max-w-4xl mx-auto px-4 py-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
        >
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
                  {Math.floor(progress)}%
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

        {/* Trophies Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Conquistas Desbloqueadas
          </h2>

          <div className="grid gap-3">
            {/* Unlocked Trophies */}
            {TROPHIES.filter(trophy => stats.trophies.includes(trophy.id)).map((trophy) => (
              <Card
                key={trophy.id}
                className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{trophy.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{trophy.name}</h3>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{trophy.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      +{trophy.points} XP
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}

            {/* Locked Trophies with Progress */}
            {TROPHIES.filter(trophy => !stats.trophies.includes(trophy.id)).map((trophy) => {
              // Calculate progress towards trophy
              let progress = 0;
              let progressText = "";
              
              // Conquistas existentes
              if (trophy.id === 'first_script') {
                progress = Math.min(100, (stats.scriptsCreated / 1) * 100);
                progressText = `${stats.scriptsCreated}/1 roteiro`;
              } else if (trophy.id === 'scripts_10') {
                progress = Math.min(100, (stats.scriptsCreated / 10) * 100);
                progressText = `${stats.scriptsCreated}/10 roteiros`;
              } else if (trophy.id === 'scripts_50') {
                progress = Math.min(100, (stats.scriptsCreated / 50) * 100);
                progressText = `${stats.scriptsCreated}/50 roteiros`;
              } else if (trophy.id === 'ideas_20') {
                progress = Math.min(100, (stats.ideasCreated / 20) * 100);
                progressText = `${stats.ideasCreated}/20 ideias`;
              } else if (trophy.id === 'streak_7') {
                progress = Math.min(100, (stats.streak / 7) * 100);
                progressText = `${stats.streak}/7 dias`;
              } else if (trophy.id === 'streak_30') {
                progress = Math.min(100, (stats.streak / 30) * 100);
                progressText = `${stats.streak}/30 dias`;
              } else if (trophy.id === 'hours_10') {
                progress = Math.min(100, (stats.totalHours / 10) * 100);
                progressText = `${Math.floor(stats.totalHours)}/10 horas`;
              } else if (trophy.id === 'hours_50') {
                progress = Math.min(100, (stats.totalHours / 50) * 100);
                progressText = `${Math.floor(stats.totalHours)}/50 horas`;
              } else if (trophy.id === 'hours_100') {
                progress = Math.min(100, (stats.totalHours / 100) * 100);
                progressText = `${Math.floor(stats.totalHours)}/100 horas`;
              }
              // 🧠 Conquistas de Processo
              else if (trophy.id === 'first_real_session') {
                progress = Math.min(100, (stats.sessionsOver25Min / 1) * 100);
                progressText = `${stats.sessionsOver25Min}/1 sessão de 25min`;
              } else if (trophy.id === 'focused_creator') {
                progress = Math.min(100, (stats.sessionsWithoutPause / 1) * 100);
                progressText = `${stats.sessionsWithoutPause}/1 sessão sem pausa`;
              } else if (trophy.id === 'no_distractions') {
                progress = Math.min(100, (stats.sessionsWithoutAbandon / 3) * 100);
                progressText = `${stats.sessionsWithoutAbandon}/3 sessões completas`;
              }
              // 🔥 Conquistas de Constância
              else if (trophy.id === 'honorable_return') {
                progress = stats.hadStreakReset ? 100 : 0;
                progressText = stats.hadStreakReset ? 'Você voltou!' : 'Continue após perder streak';
              } else if (trophy.id === 'three_days') {
                progress = Math.min(100, (stats.streak / 3) * 100);
                progressText = `${stats.streak}/3 dias`;
              } else if (trophy.id === 'five_days') {
                progress = Math.min(100, (stats.streak / 5) * 100);
                progressText = `${stats.streak}/5 dias`;
              }
              // ⏱️ Conquistas de Tempo
              else if (trophy.id === 'hours_1') {
                progress = Math.min(100, (stats.totalHours / 1) * 100);
                progressText = `${Math.floor(stats.totalHours * 60)}/60 min`;
              } else if (trophy.id === 'hours_5') {
                progress = Math.min(100, (stats.totalHours / 5) * 100);
                progressText = `${Math.floor(stats.totalHours)}/5 horas`;
              }
              // ✍️ Conquistas de Produção
              else if (trophy.id === 'first_completed') {
                progress = Math.min(100, (stats.scriptsCompleted / 1) * 100);
                progressText = `${stats.scriptsCompleted}/1 projeto finalizado`;
              } else if (trophy.id === 'creative_sequence') {
                progress = Math.min(100, (stats.scriptsCompleted / 3) * 100);
                progressText = `${stats.scriptsCompleted}/3 projetos finalizados`;
              }
              // 💡 Conquistas de Organização
              else if (trophy.id === 'ideas_organized') {
                progress = Math.min(100, (stats.ideasOrganized / 10) * 100);
                progressText = `${stats.ideasOrganized}/10 ideias organizadas`;
              } else if (trophy.id === 'full_flow') {
                const requiredStages = ['idea', 'script', 'review', 'record', 'edit'];
                const usedCount = requiredStages.filter(s => stats.usedStages.includes(s)).length;
                progress = Math.min(100, (usedCount / 5) * 100);
                progressText = `${usedCount}/5 etapas usadas`;
              }

              return (
                <Card
                  key={trophy.id}
                  className="p-4 bg-muted/30 border-muted/40 transition-all hover:bg-muted/40 hover:border-muted/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl grayscale opacity-50">{trophy.icon}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground/70">{trophy.name}</h3>
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">{trophy.description}</p>
                      
                      {progressText && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">{progressText}</span>
                            <span className="font-semibold text-primary">{Math.floor(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                      
                      <Badge variant="outline" className="text-xs font-semibold">
                        +{trophy.points} XP
                      </Badge>
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
