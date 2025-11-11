import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { getUserStats, awardPoints } from "@/lib/gamification";
import { getWorkflow, getUserWorkflow } from "@/lib/workflows";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Clock, Trophy, Lightbulb, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Index = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const { trackEvent } = useAnalytics();
  const [stats, setStats] = useState(getUserStats());
  const [streakData, setStreakData] = useState<any>(null);
  const [weeklySessionsCount, setWeeklySessionsCount] = useState(0);
  const [lastActivity, setLastActivity] = useState<any>(null);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  useEffect(() => {
    if (profile && !profileLoading) {
      fetchStreakData();
      fetchWeeklySessions();
      fetchLastActivity();
      
      const statsInterval = setInterval(() => {
        setStats(getUserStats());
      }, 1000);
      
      const dataInterval = setInterval(() => {
        fetchStreakData();
        fetchWeeklySessions();
      }, 30000);

      return () => {
        clearInterval(statsInterval);
        clearInterval(dataInterval);
      };
    }
  }, [profile, profileLoading]);

  const fetchStreakData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setStreakData(data);
  };

  const fetchWeeklySessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, count } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event', 'session_started')
      .gte('created_at', sevenDaysAgo.toISOString());

    setWeeklySessionsCount(count || 0);
  };

  const fetchLastActivity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('stage_times')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setLastActivity(data);
  };

  const handleStartSession = () => {
    trackEvent('session_started');
    navigate('/session');
  };

  const handleContinueActivity = () => {
    trackEvent('continued_activity');
    navigate('/session');
  };

  if (profileLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent/10 via-background to-primary/10">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Safety check - if first_login is still true, don't render
  if (profile?.first_login === true) {
    return null;
  }

  const workflow = profile?.current_workflow ? getWorkflow(profile.current_workflow) : null;
  const currentLevel = stats?.level ?? 1;
  const xpProgress = (((stats?.totalPoints ?? 0) % 1000) / 1000) * 100;
  const totalHours = Math.floor(stats?.totalHours ?? 0);
  const totalMinutes = Math.round(((stats?.totalHours ?? 0) - totalHours) * 60);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/10 pb-24">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-foreground">
            <Flame className="w-5 h-5 text-accent" />
            <span className="font-semibold">{streakData?.current_streak ?? 0} dias</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-semibold">{weeklySessionsCount ?? 0} sessões</span>
          </div>
        </div>
        
        {workflow && (
          <button
            onClick={() => setIsWorkflowModalOpen(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center w-full mt-2"
          >
            Workflow: {workflow.name}
          </button>
        )}
      </header>

      {/* Main Panel */}
      <div className="px-6 mt-8">
        <Card 
          className={cn(
            "p-8 backdrop-blur-md bg-card/85 border-border/20",
            "shadow-[0_8px_30px_-8px_hsl(var(--shadow-panel))]",
            "rounded-[28px] animate-fade-in"
          )}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {lastActivity ? "Sua última atividade criativa" : "Bem-vindo de volta"}
          </h2>

          {lastActivity ? (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-2xl">
                <h3 className="font-semibold text-foreground mb-1">
                  Sessão em {lastActivity.stage || "andamento"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Você parou na etapa de {lastActivity.stage?.toLowerCase() || "criação"}.
                </p>
              </div>
              <Button
                onClick={handleContinueActivity}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg h-12 rounded-xl font-semibold"
              >
                Continuar criando
              </Button>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center shadow-lg">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Iniciar nova sessão criativa
                </h3>
                <p className="text-sm text-muted-foreground">
                  Defina seu tempo e mergulhe na criação.
                </p>
              </div>
              <Button
                onClick={handleStartSession}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg h-12 rounded-xl font-semibold"
              >
                Começar agora
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Progress Section */}
      <div className="px-6 mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Seu progresso na Muzze
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-card rounded-2xl border border-border/20 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Nível {currentLevel} — Criador Focado
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(xpProgress)}%
              </span>
            </div>
            <Progress 
              value={xpProgress} 
              className="h-2 bg-secondary"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-card rounded-2xl border border-border/20 shadow-sm text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-semibold text-foreground">
                {stats?.trophies?.length ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Conquistas
              </div>
            </div>

            <div className="p-4 bg-card rounded-2xl border border-border/20 shadow-sm text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-semibold text-foreground">
                {totalHours}h {totalMinutes}m
              </div>
              <div className="text-xs text-muted-foreground">
                Tempo Total
              </div>
            </div>

            <div className="p-4 bg-card rounded-2xl border border-border/20 shadow-sm text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-semibold text-foreground">
                {stats?.ideasCreated ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Ideias
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Card */}
      <div className="px-6 mt-8">
        <Card className="p-6 bg-gradient-to-br from-accent to-primary text-white border-0 rounded-2xl shadow-lg">
          <p className="text-center font-medium">
            {(streakData?.current_streak ?? 0) > 0 
              ? `Você está há ${streakData.current_streak} dias com a mente em movimento.`
              : "Um dia de cada vez, uma obra por vez."}
          </p>
        </Card>
      </div>

      {/* Workflow Modal */}
      <Dialog open={isWorkflowModalOpen} onOpenChange={setIsWorkflowModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar Workflow</DialogTitle>
            <DialogDescription>
              Esta funcionalidade estará disponível em breve.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Index;