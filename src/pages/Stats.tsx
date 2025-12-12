import { Award, Target, Zap } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { useStatsPage } from "@/hooks/useStatsPage";
import { TROPHIES } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { StatsPageSkeleton } from "@/components/stats/StatsPageSkeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STAGE_LABELS: Record<string, { label: string; emoji: string }> = {
  ideation: { label: 'Ideação', emoji: '💡' },
  script: { label: 'Roteiro', emoji: '📝' },
  review: { label: 'Revisão', emoji: '🔍' },
  record: { label: 'Gravação', emoji: '🎬' },
  edit: { label: 'Edição', emoji: '✂️' },
};

const formatTimeDisplay = (hours: number): string => {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}min`;
  }
  return `${hours.toFixed(1)}h`;
};

const Stats = () => {
  const {
    weeklyData,
    totalSessions,
    weeklyAverage,
    weeklyGoalStats,
    dailyGoal,
    profile,
    gamificationStats,
    loading,
  } = useStatsPage();
  
  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 0.1);
  
  // Filtrar troféus desbloqueados
  const unlockedTrophies = TROPHIES.filter(trophy => 
    gamificationStats.trophies.includes(trophy.id)
  ).slice(0, 3); // Mostrar apenas os 3 primeiros

  // Calcular progresso das próximas conquistas
  const getLockedTrophiesWithProgress = () => {
    const lockedTrophies = TROPHIES.filter(
      trophy => !gamificationStats.trophies.includes(trophy.id)
    ).map(trophy => {
      let progress = 0;
      let current = 0;
      let target = 0;
      let progressText = "";

      if (trophy.id === 'first_script') {
        current = gamificationStats.scriptsCreated;
        target = 1;
        progress = Math.min(100, (current / target) * 100);
        progressText = `${current}/${target} roteiro`;
      } else if (trophy.id === 'scripts_10') {
        current = gamificationStats.scriptsCreated;
        target = 10;
        progress = Math.min(100, (current / target) * 100);
        progressText = `${current}/${target} roteiros`;
      } else if (trophy.id === 'scripts_50') {
        current = gamificationStats.scriptsCreated;
        target = 50;
        progress = Math.min(100, (current / target) * 100);
        progressText = `${current}/${target} roteiros`;
      } else if (trophy.id === 'ideas_20') {
        current = gamificationStats.ideasCreated;
        target = 20;
        progress = Math.min(100, (current / target) * 100);
        progressText = `${current}/${target} ideias`;
      } else if (trophy.id === 'streak_7') {
        current = gamificationStats.streak;
        target = 7;
        progress = Math.min(100, (current / target) * 100);
        progressText = `${current}/${target} dias`;
      } else if (trophy.id === 'streak_30') {
        current = gamificationStats.streak;
        target = 30;
        progress = Math.min(100, (current / target) * 100);
        progressText = `${current}/${target} dias`;
      } else if (trophy.id === 'hours_10') {
        current = Math.floor(gamificationStats.totalHours);
        target = 10;
        progress = Math.min(100, (current / target) * 100);
        progressText = `${current}/${target} horas`;
      } else if (trophy.id === 'hours_50') {
        current = Math.floor(gamificationStats.totalHours);
        target = 50;
        progress = Math.min(100, (current / target) * 100);
        progressText = `${current}/${target} horas`;
      } else if (trophy.id === 'hours_100') {
        current = Math.floor(gamificationStats.totalHours);
        target = 100;
        progress = Math.min(100, (current / target) * 100);
        progressText = `${current}/${target} horas`;
      }

      return {
        ...trophy,
        progress,
        progressText,
        current,
        target
      };
    });

    return lockedTrophies
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5);
  };

  const nextTrophies = getLockedTrophiesWithProgress();

  if (loading) {
    return <StatsPageSkeleton />;
  }

  const getDailyGoalDescription = () => {
    if (dailyGoal.isAbove) {
      return `+${dailyGoal.percentageProgress}% acima da meta`;
    } else if (dailyGoal.actualMinutes === 0) {
      return "Comece sua sessão hoje";
    } else {
      return `${dailyGoal.percentageProgress}% da meta`;
    }
  };

  return (
    <div 
      className="p-8 space-y-8 pb-24"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2rem)' }}
    >
      <div>
        <h1 className="text-4xl font-bold mb-2">Estatísticas</h1>
        <p className="text-muted-foreground">Acompanhe seu progresso e conquistas</p>
      </div>

      {/* Linha 1: 4 cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Meta Diária</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <Target className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">📅 Hoje</span>
              <span className="font-bold">{dailyGoal.actualMinutes}m</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">🎯 Sua Meta</span>
              <span className="font-bold">{dailyGoal.goalMinutes}m</span>
            </div>
            <Progress value={dailyGoal.percentageProgress} className="h-2" />
            <p className={cn(
              "text-sm text-center font-medium",
              dailyGoal.isAbove ? "text-green-600" : "text-orange-600"
            )}>
              {dailyGoal.isAbove 
                ? `✅ Meta atingida! +${dailyGoal.percentageProgress - 100}%`
                : `🔻 Faltam ${dailyGoal.goalMinutes - dailyGoal.actualMinutes} minutos`
              }
            </p>
          </div>
        </Card>

        <StatCard
          title="Média Semanal"
          value={formatTimeDisplay(weeklyAverage)}
          icon={Target}
          description="por dia"
        />
        <StatCard
          title="Total de XP"
          value={profile?.xp_points ?? 0}
          icon={Zap}
          gradient
          description="pontos de experiência"
        />
        <StatCard
          title="Sessões"
          value={totalSessions}
          icon={Award}
          description="sessões completadas"
        />
      </div>

      {/* Linha 2: Gráfico + Resumo Semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Horas por Dia (Esta Semana)</h3>
          <TooltipProvider>
            <div className="flex items-end justify-between gap-4 h-64">
              {weeklyData.map((data) => {
                const height = (data.hours / maxHours) * 100;
                const hasStageData = data.stageBreakdown && Object.values(data.stageBreakdown).some(v => v > 0);
                
                return (
                  <Tooltip key={data.day}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-2 cursor-pointer">
                        <div className="w-full flex items-end justify-center h-48">
                          <div
                            className="w-full bg-gradient-to-t from-accent to-primary rounded-t-lg transition-all duration-500 hover:opacity-80 flex items-end justify-center pb-2"
                            style={{ height: `${height}%`, minHeight: '30px' }}
                          >
                            <span className="text-xs font-bold text-white">{formatTimeDisplay(data.hours)}</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{data.day}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-3 max-w-xs">
                      <div className="space-y-2">
                        <p className="font-bold text-sm capitalize">
                          {data.date.toLocaleDateString('pt-BR', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total: {formatTimeDisplay(data.hours)}
                        </p>
                        {hasStageData && (
                          <div className="border-t pt-2 space-y-1">
                            {Object.entries(data.stageBreakdown).map(([stage, minutes]) => {
                              if (minutes === 0) return null;
                              const info = STAGE_LABELS[stage];
                              if (!info) return null;
                              return (
                                <div key={stage} className="flex justify-between text-xs">
                                  <span>{info.emoji} {info.label}</span>
                                  <span className="font-medium">{minutes}min</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
          <h3 className="text-lg font-semibold mb-4">📊 Resumo da Semana</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">⏱️ Total trabalhado</span>
              <span className="font-bold">
                {formatTimeDisplay(weeklyGoalStats.weeklyTotalMinutes / 60)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">🎯 Meta da semana</span>
              <span className="font-bold">{weeklyGoalStats.weeklyGoalMinutes} min</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">📈 Produtividade</span>
              <span className={cn(
                "font-bold",
                weeklyGoalStats.weeklyProductivityPercentage >= 0 ? "text-green-600" : "text-orange-600"
              )}>
                {weeklyGoalStats.weeklyProductivityPercentage >= 0 ? '+' : ''}{weeklyGoalStats.weeklyProductivityPercentage}%
              </span>
            </div>
            <p className="text-sm text-center text-muted-foreground mt-4">
              {weeklyGoalStats.weeklyProductivityPercentage >= 0 
                ? "Você está arrasando! Continue assim! 💪"
                : "Pequenos passos todos os dias fazem diferença! 🌱"
              }
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Conquistas Recentes</h3>
          <div className="space-y-4">
            {unlockedTrophies.length > 0 ? (
              unlockedTrophies.map((trophy) => (
                <div
                  key={trophy.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-primary/20"
                >
                  <div className="text-3xl">{trophy.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{trophy.name}</p>
                    <p className="text-sm text-muted-foreground">{trophy.description}</p>
                    <span className="text-xs text-primary font-semibold">+{trophy.points} XP</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Continue trabalhando para desbloquear conquistas!
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Próximas Conquistas</h3>
          <div className="space-y-4">
            {nextTrophies.length > 0 ? (
              nextTrophies.map((trophy) => (
                <div key={trophy.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl">{trophy.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{trophy.name}</p>
                        <p className="text-xs text-muted-foreground">{trophy.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {trophy.progressText}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Progress value={trophy.progress} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0">
                      +{trophy.points} XP
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Parabéns! Você desbloqueou todas as conquistas! 🎉
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
