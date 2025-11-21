import { Award, Target, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { useStats } from "@/hooks/useStats";
import { useDailyGoalProgress } from "@/hooks/useDailyGoalProgress";
import { useProfile } from "@/hooks/useProfile";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const Stats = () => {
  const { weeklyData, totalSessions, totalHours, weeklyAverage, achievements, weeklyGoalStats, loading } = useStats();
  const { profile } = useProfile();
  const { progress: dailyGoal, loading: loadingGoal } = useDailyGoalProgress();
  
  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 0.1);

  if (loading || loadingGoal) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Estatísticas</h1>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Estatísticas</h1>
        <p className="text-muted-foreground">Acompanhe seu progresso e conquistas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      {/* Weekly Summary Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <h3 className="text-lg font-semibold mb-4">📊 Resumo da Semana</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">⏱️ Total trabalhado</span>
            <span className="font-bold">
              {weeklyGoalStats.weeklyTotalMinutes} min ({(weeklyGoalStats.weeklyTotalMinutes / 60).toFixed(1)}h)
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
        <StatCard
          title="Média Semanal"
          value={`${weeklyAverage}h`}
          icon={Target}
          description="horas de trabalho"
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

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Horas por Dia (Esta Semana)</h3>
        <div className="flex items-end justify-between gap-4 h-64">
          {weeklyData.map((data) => {
            const height = (data.hours / maxHours) * 100;
            return (
              <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-48">
                  <div
                    className="w-full bg-gradient-to-t from-accent to-primary rounded-t-lg transition-all duration-500 hover:opacity-80 flex items-end justify-center pb-2"
                    style={{ height: `${height}%`, minHeight: '30px' }}
                  >
                    <span className="text-xs font-bold text-white">{data.hours}h</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{data.day}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Conquistas Recentes</h3>
          <div className="space-y-4">
            {achievements.length > 0 ? (
              achievements.map((achievement, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-primary/20"
                >
                  <div className="text-3xl">{achievement.badge}</div>
                  <div>
                    <p className="font-semibold">{achievement.title}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
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
          <h3 className="text-lg font-semibold mb-4">Próximas Metas</h3>
          <div className="space-y-4">
            {[
              { goal: "Sequência de 30 dias", current: profile?.streak_freezes ?? 0, target: 30 },
              { goal: "200 horas totais", current: Math.floor(totalHours), target: 200 },
              { goal: "500 XP", current: profile?.xp_points ?? 0, target: 500 },
            ].map((item, i) => {
              const progress = Math.min((item.current / item.target) * 100, 100);
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.goal}</span>
                    <span className="text-muted-foreground">
                      {item.current}/{item.target}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
