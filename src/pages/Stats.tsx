import { Award, Target, Zap } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { useStatsPage } from "@/hooks/useStatsPage";
import { useLiveDailyProgress } from "@/hooks/useLiveDailyProgress";
import { useProfileWithLevel } from "@/hooks/useProfileWithLevel";
import { TROPHIES } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { StatsPageSkeleton } from "@/components/stats/StatsPageSkeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WeeklySummaryCarousel } from "@/components/stats/WeeklySummaryCarousel";

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
  const { effectiveLevel, goalMinutes, loading: profileLoading } = useProfileWithLevel();
  
  const {
    weeklyData,
    totalSessions,
    weeklyAverage,
    weeklyGoalStats,
    previousWeekStats,
    dailyGoal,
    profile,
    gamificationStats,
    loading: statsLoading,
  } = useStatsPage({ effectiveLevel, goalMinutes });
  
  // Hook para progresso live durante sessão ativa
  const liveGoal = useLiveDailyProgress(dailyGoal.actualMinutes, dailyGoal.goalMinutes);
  
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

  const loading = profileLoading || statsLoading;

  if (loading) {
    return <StatsPageSkeleton />;
  }

  const getDailyGoalDescription = () => {
    if (liveGoal.isAbove) {
      return `+${liveGoal.percentageProgress}% acima da meta`;
    } else if (liveGoal.actualMinutes === 0) {
      return "Comece sua sessão hoje";
    } else {
      return `${liveGoal.percentageProgress}% da meta`;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Section */}
      <section 
        className="px-4 py-8 sm:px-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2rem)' }}
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Estatísticas</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seu progresso e conquistas</p>
        </div>
      </section>

      {/* Cards Principais - Seção Alternada */}
      <section className="bg-muted/30 px-4 py-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card Meta Diária */}
            <Card className="p-5 bg-background border border-border rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Meta Diária</p>
                  {liveGoal.isLive && (
                    <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full font-medium">
                      LIVE
                    </span>
                  )}
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">📅 Hoje</span>
                  <span className="font-semibold">{liveGoal.actualMinutes}m</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">🎯 Sua Meta</span>
                  <span className="font-semibold">{liveGoal.goalMinutes}m</span>
                </div>
                <Progress value={liveGoal.percentageProgress} className="h-2" />
                <p className={cn(
                  "text-xs text-center font-medium",
                  liveGoal.isAbove ? "text-green-600" : "text-amber-600"
                )}>
                  {liveGoal.isAbove 
                    ? `✅ Meta atingida! +${liveGoal.percentageProgress - 100}%`
                    : `🔻 Faltam ${liveGoal.goalMinutes - liveGoal.actualMinutes} minutos`
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
              highlight
              description="pontos de experiência"
            />
            <StatCard
              title="Sessões"
              value={totalSessions}
              icon={Award}
              description="sessões completadas"
            />
          </div>
        </div>
      </section>

      {/* Gráfico + Resumo Semanal */}
      <section className="px-4 py-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5 bg-background border border-border rounded-xl overflow-hidden">
              <h3 className="text-base font-semibold text-foreground mb-5">Horas por Dia (Esta Semana)</h3>
              <TooltipProvider>
                <div className="flex items-end justify-between gap-1 sm:gap-2 md:gap-4 h-48 md:h-56">
                  {weeklyData.map((data) => {
                    const height = (data.hours / maxHours) * 100;
                    const hasStageData = data.stageBreakdown && Object.values(data.stageBreakdown).some(v => v > 0);
                    
                    return (
                      <Tooltip key={data.day}>
                        <TooltipTrigger asChild>
                          <div className="flex-1 flex flex-col items-center gap-1 sm:gap-2 cursor-pointer min-w-0">
                            <div className="w-full flex items-end justify-center h-36 md:h-44">
                              <div
                                className="w-full bg-primary rounded-t-lg transition-all duration-500 hover:bg-primary/80 flex items-end justify-center pb-1 sm:pb-2"
                                style={{ height: `${height}%`, minHeight: '24px' }}
                              >
                                <span className="text-[10px] sm:text-xs font-bold text-primary-foreground truncate px-0.5">{formatTimeDisplay(data.hours)}</span>
                              </div>
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">{data.day}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="p-3 max-w-xs">
                          <div className="space-y-2">
                            <p className="font-semibold text-sm capitalize">
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
                              <div className="border-t border-border pt-2 space-y-1">
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

            <Card className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
              <WeeklySummaryCarousel
                currentWeek={{
                  totalMinutes: weeklyGoalStats.weeklyTotalMinutes,
                  goalMinutes: weeklyGoalStats.weeklyGoalMinutes,
                  productivity: weeklyGoalStats.weeklyProductivityPercentage,
                }}
                previousWeek={{
                  totalMinutes: previousWeekStats.weeklyTotalMinutes,
                  productivity: previousWeekStats.weeklyProductivityPercentage,
                }}
              />
            </Card>
          </div>
        </div>
      </section>

      {/* Conquistas - Seção Alternada */}
      <section className="bg-muted/30 px-4 py-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5 bg-background border border-border rounded-xl">
              <h3 className="text-base font-semibold text-foreground mb-4">Conquistas Recentes</h3>
              <div className="space-y-3">
                {unlockedTrophies.length > 0 ? (
                  unlockedTrophies.map((trophy) => (
                    <div
                      key={trophy.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
                    >
                      <div className="text-2xl">{trophy.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{trophy.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{trophy.description}</p>
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

            <Card className="p-5 bg-background border border-border rounded-xl">
              <h3 className="text-base font-semibold text-foreground mb-4">Próximas Conquistas</h3>
              <div className="space-y-4">
                {nextTrophies.length > 0 ? (
                  nextTrophies.map((trophy) => (
                    <div key={trophy.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xl">{trophy.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">{trophy.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{trophy.description}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {trophy.progressText}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Progress value={trophy.progress} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground shrink-0">
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
      </section>
    </div>
  );
};

export default Stats;
