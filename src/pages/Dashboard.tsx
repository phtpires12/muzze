import { useState, useEffect } from "react";
import { Calendar, Clock, Flame, TrendingUp, Lightbulb, FileText, Target } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GamificationBadge } from "@/components/GamificationBadge";
import { TrophyCard } from "@/components/TrophyCard";
import { getUserWorkflow, getWorkflow } from "@/lib/workflows";
import { getUserStats, awardPoints, POINTS } from "@/lib/gamification";

const Dashboard = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [stats, setStats] = useState(getUserStats());
  const workflowType = getUserWorkflow();
  const workflow = workflowType ? getWorkflow(workflowType) : null;

  useEffect(() => {
    // Check daily login
    const lastAccess = localStorage.getItem("lastAccess");
    const today = new Date().toDateString();
    
    if (lastAccess !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      let newStats = { ...stats };
      
      if (lastAccess === yesterday) {
        newStats.streak += 1;
      } else if (lastAccess && lastAccess !== today) {
        newStats.streak = 1;
      }
      
      // Award daily login points
      const updatedStats = awardPoints(POINTS.DAILY_LOGIN, "Login diário");
      setStats(updatedStats);
      localStorage.setItem("lastAccess", today);
    }
    
    // Listen for stats updates
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
      const newStats = { ...stats };
      newStats.totalHours += hours;
      
      // Award session completion points
      const updatedStats = awardPoints(POINTS.COMPLETE_SESSION, "Sessão completa");
      updatedStats.totalHours = newStats.totalHours;
      setStats(updatedStats);
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
        <h1 className="text-4xl font-bold mb-2">
          {workflow ? (
            <>
              <span className="mr-3">{workflow.icon}</span>
              Modo {workflow.name}
            </>
          ) : (
            "Última criação"
          )}
        </h1>
        <p className="text-muted-foreground">
          {workflow ? workflow.solution : "Acompanhe seu progresso diário"}
        </p>
      </div>
      
      <GamificationBadge />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Sequência"
          value={stats.streak}
          icon={Flame}
          gradient
          description="dias consecutivos"
        />
        <StatCard
          title="Total de Horas"
          value={stats.totalHours.toFixed(1)}
          icon={Clock}
          description="horas criando"
        />
        <StatCard
          title="Roteiros"
          value={stats.scriptsCreated}
          icon={FileText}
          description="criados"
        />
        <StatCard
          title="Ideias"
          value={stats.ideasCreated}
          icon={Lightbulb}
          description="salvas"
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
        <TrophyCard />

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {workflow?.id === 'A' && '⚡ Ideias para Executar'}
            {workflow?.id === 'B' && '💡 Prompts de Inspiração'}
            {workflow?.id === 'C' && '🎬 Templates de Roteiro'}
            {!workflow && 'Metas da Semana'}
          </h3>
          <div className="space-y-4">
            {workflow?.id === 'A' && (
              <>
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Ideia mais antiga</span>
                    <span className="text-xs text-muted-foreground">15 dias</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Dica: Comece pela ideia mais antiga!</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <Target className="w-5 h-5 mb-2 text-primary" />
                  <p className="text-sm font-medium">Meta de hoje: 2h de execução</p>
                </div>
              </>
            )}
            {workflow?.id === 'B' && (
              <>
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <Lightbulb className="w-5 h-5 mb-2 text-accent" />
                  <p className="text-sm font-medium mb-1">Prompt do Dia</p>
                  <p className="text-sm text-muted-foreground">
                    "Qual problema você resolveu esta semana que poderia virar conteúdo?"
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium">💡 Tendências para se inspirar</p>
                </div>
              </>
            )}
            {workflow?.id === 'C' && (
              <>
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <FileText className="w-5 h-5 mb-2 text-accent" />
                  <p className="text-sm font-medium mb-1">Template Tutorial</p>
                  <p className="text-sm text-muted-foreground">
                    Gancho → Problema → Solução → Prova → CTA
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium">📋 Checklist de Roteiro</p>
                </div>
              </>
            )}
            {!workflow && (
              <>
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
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
