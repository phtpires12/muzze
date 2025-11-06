import { Award, Target, Zap } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";

const Stats = () => {
  const weeklyData = [
    { day: "Seg", hours: 3 },
    { day: "Ter", hours: 5 },
    { day: "Qua", hours: 2 },
    { day: "Qui", hours: 4 },
    { day: "Sex", hours: 6 },
    { day: "Sáb", hours: 3 },
    { day: "Dom", hours: 1 },
  ];

  const maxHours = Math.max(...weeklyData.map((d) => d.hours));

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Estatísticas</h1>
        <p className="text-muted-foreground">Acompanhe seu progresso e conquistas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Média Semanal"
          value="24h"
          icon={Target}
          description="horas de trabalho"
        />
        <StatCard
          title="Produtividade"
          value="92%"
          icon={Zap}
          gradient
          description="acima da meta"
        />
        <StatCard
          title="Conquistas"
          value="12"
          icon={Award}
          description="badges desbloqueados"
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
            {[
              {
                badge: "🔥",
                title: "Sequência de 7 dias",
                description: "Trabalhou 7 dias seguidos",
              },
              {
                badge: "⭐",
                title: "100 horas",
                description: "Alcançou 100 horas totais",
              },
              {
                badge: "📝",
                title: "Escritor Dedicado",
                description: "Criou 10 roteiros",
              },
            ].map((achievement, i) => (
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
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Próximas Metas</h3>
          <div className="space-y-4">
            {[
              { goal: "Sequência de 30 dias", current: 7, target: 30 },
              { goal: "200 horas totais", current: 124, target: 200 },
              { goal: "20 roteiros criados", current: 8, target: 20 },
            ].map((item, i) => {
              const progress = (item.current / item.target) * 100;
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
