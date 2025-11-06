import { useState, useEffect } from "react";
import { Calendar, Clock, Flame, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Dashboard = () => {
  const [streak, setStreak] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    // Load saved data
    const savedStreak = localStorage.getItem("streak");
    const savedHours = localStorage.getItem("totalHours");
    const lastAccess = localStorage.getItem("lastAccess");
    
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedHours) setTotalHours(parseFloat(savedHours));

    // Check streak
    const today = new Date().toDateString();
    if (lastAccess !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastAccess === yesterday) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem("streak", newStreak.toString());
      } else if (lastAccess && lastAccess !== today) {
        setStreak(1);
        localStorage.setItem("streak", "1");
      }
      localStorage.setItem("lastAccess", today);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const handleTrackingToggle = () => {
    if (isTracking) {
      const hours = sessionTime / 3600;
      const newTotal = totalHours + hours;
      setTotalHours(newTotal);
      localStorage.setItem("totalHours", newTotal.toString());
      setSessionTime(0);
    }
    setIsTracking(!isTracking);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Última criação</h1>
        <p className="text-muted-foreground">Acompanhe seu progresso diário</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Sequência"
          value={streak}
          icon={Flame}
          gradient
          description="dias consecutivos"
        />
        <StatCard
          title="Total de Horas"
          value={totalHours.toFixed(1)}
          icon={Clock}
          description="horas criando"
        />
        <StatCard
          title="Esta Semana"
          value="12"
          icon={TrendingUp}
          description="sessões de trabalho"
        />
        <StatCard
          title="Projetos"
          value="5"
          icon={Calendar}
          description="em andamento"
        />
      </div>

      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Sessão Atual</h2>
            <p className="text-6xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {formatTime(sessionTime)}
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleTrackingToggle}
            className={isTracking ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {isTracking ? "Pausar Sessão" : "Iniciar Sessão"}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
          <div className="space-y-3">
            {[
              { title: "Roteiro: Como editar vídeos", time: "2 horas atrás" },
              { title: "Shot List: Vlog de viagem", time: "5 horas atrás" },
              { title: "Sessão de criação", time: "1 dia atrás" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-medium">{activity.title}</span>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Metas da Semana</h3>
          <div className="space-y-4">
            {[
              { goal: "20 horas de criação", progress: 60 },
              { goal: "5 roteiros completos", progress: 40 },
              { goal: "10 shot lists", progress: 70 },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.goal}</span>
                  <span className="text-muted-foreground">{item.progress}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
