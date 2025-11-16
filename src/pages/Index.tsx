import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSessionContext } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { getUserStats, awardPoints, TROPHIES } from "@/lib/gamification";
import { getWorkflow, getUserWorkflow } from "@/lib/workflows";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, Trophy, Lightbulb, Zap, Film, Mic, Scissors, AlertCircle, Lock, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContentItem {
  id: string;
  title: string;
  status: string;
  dueDate?: string;
  sessionsCount?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const { trackEvent } = useAnalytics();
  const { muzzeSession, setMuzzeSession, resetMuzzeSession } = useSessionContext();
  const [stats, setStats] = useState(getUserStats());
  const [streakData, setStreakData] = useState<any>(null);
  const [weeklySessionsCount, setWeeklySessionsCount] = useState(0);
  const [lastActivity, setLastActivity] = useState<any>(null);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionStage, setSessionStage] = useState<string>("");
  const [sessionDuration, setSessionDuration] = useState(profile?.preferred_session_minutes || 25);
  
  // Novos estados para seleção de item
  const [isPickItemModalOpen, setIsPickItemModalOpen] = useState(false);
  const [pickListType, setPickListType] = useState<"" | "script" | "record" | "edit">("");
  const [eligibleItems, setEligibleItems] = useState<ContentItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: "", description: "", action: "" });
  
  // Modal de troféus
  const [isTrophiesModalOpen, setIsTrophiesModalOpen] = useState(false);
  
  // Modal de tempo total
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [averageTimeByStage, setAverageTimeByStage] = useState<any>({});



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

  const fetchRecentSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar últimas 5 sessões agrupadas por content_item_id
    const { data } = await supabase
      .from('stage_times')
      .select('content_item_id, started_at, ended_at, duration_seconds')
      .eq('user_id', user.id)
      .not('content_item_id', 'is', null)
      .order('started_at', { ascending: false })
      .limit(20);

    if (data) {
      // Agrupar por content_item_id e somar durações
      const sessionMap = new Map();
      data.forEach(item => {
        const key = item.content_item_id;
        if (!sessionMap.has(key)) {
          sessionMap.set(key, {
            content_item_id: key,
            started_at: item.started_at,
            total_duration: 0
          });
        }
        sessionMap.get(key).total_duration += item.duration_seconds || 0;
      });

      const sessions = Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
        .slice(0, 5);
      
      setRecentSessions(sessions);
    }
  };

  const fetchAverageTimeByStage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('stage_times')
      .select('stage, duration_seconds')
      .eq('user_id', user.id)
      .not('duration_seconds', 'is', null);

    if (data) {
      const stageMap = new Map();
      data.forEach(item => {
        if (!item.stage) return;
        if (!stageMap.has(item.stage)) {
          stageMap.set(item.stage, { total: 0, count: 0 });
        }
        const stats = stageMap.get(item.stage);
        stats.total += item.duration_seconds;
        stats.count += 1;
      });

      const averages: any = {};
      stageMap.forEach((value, key) => {
        averages[key] = Math.round(value.total / value.count);
      });

      setAverageTimeByStage(averages);
    }
  };


  const handleOpenTimeModal = () => {
    setIsTimeModalOpen(true);
    fetchRecentSessions();
    fetchAverageTimeByStage();
  };


  const handleStartSession = () => {
    setIsSessionModalOpen(true);
  };

  const handleContinueActivity = () => {
    trackEvent('continued_activity');
    navigate('/session');
  };

  const handleStageSelect = (stage: string) => {
    setSessionStage(stage);
  };

  const handleDurationSelect = (duration: number) => {
    setSessionDuration(duration);
  };

  const getEligibleItems = (stage: string): ContentItem[] => {
    const allItems: ContentItem[] = JSON.parse(localStorage.getItem("scripts") || "[]").map((s: any) => ({
      id: s.id,
      title: s.title,
      status: s.status || "ideia",
      sessionsCount: 0,
    }));

    if (stage === "script") {
      return allItems.filter(item => ["ideia", "roteiro-em-progresso"].includes(item.status));
    } else if (stage === "record") {
      return allItems.filter(item => ["roteiro-pronto"].includes(item.status));
    } else if (stage === "edit") {
      return allItems.filter(item => ["gravado", "edição-pendente"].includes(item.status));
    }
    return [];
  };

  const handleContinue = () => {
    if (sessionStage === "ideation") {
      setMuzzeSession({
        stage: "ideation",
        duration: sessionDuration,
        contentId: null,
      });
      setIsSessionModalOpen(false);
      navigate("/calendario?mode=ideation");
      trackEvent("session_ideation_started");
      return;
    }

    const eligible = getEligibleItems(sessionStage);
    setEligibleItems(eligible);
    setPickListType(sessionStage as "script" | "record" | "edit");

    if (eligible.length > 0) {
      setIsSessionModalOpen(false);
      setIsPickItemModalOpen(true);
    } else {
      setIsSessionModalOpen(false);
      
      if (sessionStage === "script") {
        setMuzzeSession({
          stage: "script",
          duration: sessionDuration,
          contentId: null,
        });
        navigate("/scripts?new=1");
        trackEvent("session_script_new");
      } else if (sessionStage === "record") {
        setAlertConfig({
          title: "Finalize um roteiro antes de gravar",
          description: "Você precisa ter pelo menos um roteiro pronto para iniciar uma sessão de gravação.",
          action: "record",
        });
        setIsAlertOpen(true);
      } else if (sessionStage === "edit") {
        setAlertConfig({
          title: "Grave primeiro para editar",
          description: "Você precisa ter pelo menos uma gravação feita para iniciar uma sessão de edição.",
          action: "edit",
        });
        setIsAlertOpen(true);
      }
    }
  };

  const handleOpenItem = () => {
    if (!selectedItemId) return;

    setMuzzeSession({
      stage: pickListType,
      duration: sessionDuration,
      contentId: selectedItemId,
    });

    setIsPickItemModalOpen(false);
    
    if (pickListType === "script") {
      navigate(`/scripts?open=${selectedItemId}`);
    } else if (pickListType === "record") {
      navigate(`/scripts?detail=${selectedItemId}&tab=record`);
    } else if (pickListType === "edit") {
      navigate(`/scripts?detail=${selectedItemId}&tab=edit`);
    }
    
    trackEvent(`session_${pickListType}_item_selected`);
  };

  const handleAlertAction = () => {
    setIsAlertOpen(false);
    navigate("/scripts");
  };

  const handleCancel = () => {
    setIsSessionModalOpen(false);
    setSessionStage("");
    setSessionDuration(profile?.preferred_session_minutes || 25);
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
            <div className="space-y-4 text-center">
              <Button
                data-testid="cta-start-session"
                onClick={handleStartSession}
                className="w-full relative overflow-hidden group h-14 rounded-2xl font-semibold text-base shadow-[0_0_20px_hsl(var(--primary)/0.4),0_0_40px_hsl(var(--accent)/0.2)]"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                  boxShadow: '0 0 0 1px hsl(var(--accent)), inset 0 1px 0 hsl(var(--primary)/0.5)',
                }}
              >
                <Zap className="w-5 h-5 mr-2" />
                Iniciar sessão criativa
              </Button>
              <p className="text-xs text-muted-foreground">
                Defina a etapa e comece a criar — o tempo trabalhado vale pontos e streak.
              </p>
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
            <button 
              onClick={() => setIsTrophiesModalOpen(true)}
              className="p-4 bg-card rounded-2xl border border-border/20 shadow-sm text-center hover:bg-accent/10 transition-colors"
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-semibold text-foreground">
                {stats?.trophies?.length ?? 0}/9
              </div>
              <div className="text-xs text-muted-foreground">
                Conquistas
              </div>
            </button>

            <button 
              onClick={handleOpenTimeModal}
              className="p-4 bg-card rounded-2xl border border-border/20 shadow-sm text-center hover:bg-accent/10 transition-colors"
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-semibold text-foreground">
                {totalHours}h {totalMinutes}m
              </div>
              <div className="text-xs text-muted-foreground">
                Tempo Total
              </div>
            </button>

            <button 
              onClick={() => navigate('/novidades')}
              className="p-4 bg-card rounded-2xl border border-border/20 shadow-sm text-center hover:bg-accent/10 transition-colors"
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-semibold text-foreground">
                Em breve
              </div>
              <div className="text-xs text-muted-foreground">
                Novidades
              </div>
            </button>
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

      {/* Session Stage Selection Modal */}
      <Dialog open={isSessionModalOpen} onOpenChange={setIsSessionModalOpen}>
        <DialogContent data-testid="modal-session-stage" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Em que parte você quer criar agora?</DialogTitle>
            <DialogDescription className="text-sm">
              Você pode mudar de etapa a qualquer momento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Grid de etapas */}
            <div className="grid grid-cols-2 gap-3">
              <button
                data-testid="pick-ideation"
                onClick={() => handleStageSelect("ideation")}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left",
                  "hover:border-primary hover:bg-primary/5",
                  sessionStage === "ideation" 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card"
                )}
              >
                <Lightbulb className="w-8 h-8 mb-2 text-accent" />
                <h3 className="font-semibold text-foreground mb-1">Ideação</h3>
                <p className="text-xs text-muted-foreground">
                  Separar ideias e distribuir no calendário.
                </p>
              </button>

              <button
                data-testid="pick-script"
                onClick={() => handleStageSelect("script")}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left",
                  "hover:border-primary hover:bg-primary/5",
                  sessionStage === "script" 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card"
                )}
              >
                <Film className="w-8 h-8 mb-2 text-primary" />
                <h3 className="font-semibold text-foreground mb-1">Roteiro</h3>
                <p className="text-xs text-muted-foreground">
                  Escrever ou desenvolver seu roteiro.
                </p>
              </button>

              <button
                data-testid="pick-record"
                onClick={() => handleStageSelect("record")}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left",
                  "hover:border-primary hover:bg-primary/5",
                  sessionStage === "record" 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card"
                )}
              >
                <Mic className="w-8 h-8 mb-2 text-accent" />
                <h3 className="font-semibold text-foreground mb-1">Gravação</h3>
                <p className="text-xs text-muted-foreground">
                  Checklist e shotlists para gravar.
                </p>
              </button>

              <button
                data-testid="pick-edit"
                onClick={() => handleStageSelect("edit")}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left",
                  "hover:border-primary hover:bg-primary/5",
                  sessionStage === "edit" 
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card"
                )}
              >
                <Scissors className="w-8 h-8 mb-2 text-primary" />
                <h3 className="font-semibold text-foreground mb-1">Edição</h3>
                <p className="text-xs text-muted-foreground">
                  Ajustes finais e notas de corte.
                </p>
              </button>
            </div>

            {/* Seleção de duração */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Duração da sessão (opcional)
              </label>
              <div className="flex gap-2">
                {[15, 25, 45, 60].map((duration) => (
                  <button
                    key={duration}
                    data-testid={`chip-${duration}`}
                    onClick={() => handleDurationSelect(duration)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-xl border-2 transition-all font-medium",
                      "hover:border-primary hover:bg-primary/5",
                      sessionDuration === duration
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground"
                    )}
                  >
                    {duration}
                  </button>
                ))}
              </div>
              <button className="text-xs text-primary hover:underline">
                Tempo livre
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3">
            <Button
              data-testid="btn-cancel-session"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              data-testid="btn-continue-session"
              onClick={handleContinue}
              disabled={!sessionStage}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white disabled:opacity-50"
            >
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pick Item Modal */}
      <Dialog open={isPickItemModalOpen} onOpenChange={setIsPickItemModalOpen}>
        <DialogContent data-testid="modal-pick-item" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {pickListType === "script" && "Qual ideia você quer roteirizar?"}
              {pickListType === "record" && "Qual item você vai gravar?"}
              {pickListType === "edit" && "Qual item você vai editar?"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Selecione um item para continuar com a sessão criativa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto py-2">
            {eligibleItems.map((item) => (
              <button
                key={item.id}
                data-testid={`pick-item-${item.id}`}
                onClick={() => setSelectedItemId(item.id)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left",
                  "hover:border-primary hover:bg-primary/5",
                  selectedItemId === item.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  {item.sessionsCount !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {item.sessionsCount} sessões
                    </Badge>
                  )}
                </div>
                {item.dueDate && (
                  <p className="text-xs text-muted-foreground mb-1">
                    Vencimento: {new Date(item.dueDate).toLocaleDateString("pt-BR")}
                  </p>
                )}
                <Badge variant="outline" className="text-xs">
                  {item.status === "ideia" && "Ideia"}
                  {item.status === "roteiro-em-progresso" && "Roteiro em progresso"}
                  {item.status === "roteiro-pronto" && "Roteiro pronto"}
                  {item.status === "gravação-pendente" && "Gravação pendente"}
                  {item.status === "gravado" && "Gravado"}
                  {item.status === "edição-pendente" && "Edição pendente"}
                </Badge>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              data-testid="btn-cancel-pick"
              variant="outline"
              onClick={() => {
                setIsPickItemModalOpen(false);
                setSelectedItemId("");
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              data-testid="btn-open-picked-item"
              onClick={handleOpenItem}
              disabled={!selectedItemId}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white disabled:opacity-50"
            >
              Abrir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for no eligible items */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-accent mb-2">
              <AlertCircle className="w-5 h-5" />
              <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {alertConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAlertAction}>
              Abrir roteiros
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Trophies Modal */}
      <Dialog open={isTrophiesModalOpen} onOpenChange={setIsTrophiesModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-accent" />
              Troféus
            </DialogTitle>
            <DialogDescription>
              {stats?.trophies?.length ?? 0} de {TROPHIES.length} conquistas desbloqueadas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Unlocked Trophies */}
            {TROPHIES.filter(t => stats?.trophies?.includes(t.id)).map((trophy) => (
              <div
                key={trophy.id}
                className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20"
              >
                <div className="text-3xl">{trophy.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{trophy.name}</h4>
                  <p className="text-sm text-muted-foreground">{trophy.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    +{trophy.points} pontos
                  </Badge>
                </div>
              </div>
            ))}
            
            {/* Locked Trophies */}
            {TROPHIES.filter(t => !stats?.trophies?.includes(t.id)).map((trophy) => (
              <div
                key={trophy.id}
                className="flex items-start gap-3 p-4 rounded-lg bg-muted/20 border border-border opacity-60"
              >
                <div className="text-3xl grayscale">{trophy.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-muted-foreground">{trophy.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{trophy.description}</p>
                  <Badge variant="outline" className="mt-2">
                    +{trophy.points} pontos
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Stats Modal */}
      <Dialog open={isTimeModalOpen} onOpenChange={setIsTimeModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Estatísticas de Tempo
            </DialogTitle>
            <DialogDescription>
              Veja seu tempo de sessão preferido, histórico e médias por etapa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Tempo de Sessão Preferido */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
              <h3 className="font-semibold text-foreground mb-2">Tempo de Sessão Preferido</h3>
              <p className="text-3xl font-bold text-primary">
                {profile?.preferred_session_minutes || 25} minutos
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Configurado nas suas preferências
              </p>
            </div>

            {/* Últimas 5 Sessões */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Últimas 5 Sessões</h3>
              {recentSessions.length > 0 ? (
                <div className="space-y-2">
                  {recentSessions.map((session, index) => {
                    const hours = Math.floor(session.total_duration / 3600);
                    const minutes = Math.floor((session.total_duration % 3600) / 60);
                    return (
                      <div
                        key={session.content_item_id || index}
                        className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/20"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {new Date(session.started_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {hours > 0 ? `${hours}h ` : ''}{minutes}min
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma sessão registrada ainda
                </p>
              )}
            </div>

            {/* Tempo Médio por Etapa */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Tempo Médio por Etapa</h3>
              <div className="space-y-3">
                {[
                  { key: 'ideation', label: 'Ideação', icon: Lightbulb },
                  { key: 'script', label: 'Roteirização', icon: Film },
                  { key: 'record', label: 'Gravação', icon: Mic },
                  { key: 'edit', label: 'Edição', icon: Scissors },
                  { key: 'review', label: 'Revisão', icon: AlertCircle }
                ].map(({ key, label, icon: Icon }) => {
                  const avgSeconds = averageTimeByStage[key] || 0;
                  const hours = Math.floor(avgSeconds / 3600);
                  const minutes = Math.floor((avgSeconds % 3600) / 60);
                  
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/20"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{label}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {avgSeconds > 0 
                          ? `${hours > 0 ? `${hours}h ` : ''}${minutes}min`
                          : 'Sem dados'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      <BottomNav />
    </div>
  );
};

export default Index;