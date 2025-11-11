import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSessionContext } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { getUserStats, awardPoints } from "@/lib/gamification";
import { getWorkflow, getUserWorkflow } from "@/lib/workflows";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, Trophy, Lightbulb, Zap, Film, Mic, Scissors, AlertCircle } from "lucide-react";
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
  const { setSessionContext } = useSessionContext();
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
    // Mock de itens - substitua pela lógica real de busca
    const allItems: ContentItem[] = JSON.parse(localStorage.getItem("scripts") || "[]").map((s: any) => ({
      id: s.id,
      title: s.title,
      status: "ideia", // Status mock
      sessionsCount: 0,
    }));

    if (stage === "script") {
      return allItems.filter(item => ["ideia", "roteiro-em-progresso"].includes(item.status));
    } else if (stage === "record") {
      return allItems.filter(item => ["roteiro-pronto", "gravação-pendente"].includes(item.status));
    } else if (stage === "edit") {
      return allItems.filter(item => ["gravado", "edição-pendente"].includes(item.status));
    }
    return [];
  };

  const handleContinue = () => {
    if (sessionStage === "ideation") {
      // Ideação: ir direto para calendário
      setSessionContext({
        stage: "ideation",
        duration: sessionDuration,
        contentId: null,
      });
      setIsSessionModalOpen(false);
      navigate("/calendario?mode=ideation");
      trackEvent("session_ideation_started");
      return;
    }

    // Para script/record/edit: verificar itens elegíveis
    const eligible = getEligibleItems(sessionStage);
    setEligibleItems(eligible);
    setPickListType(sessionStage as "script" | "record" | "edit");

    if (eligible.length > 0) {
      // Tem itens: abrir modal de seleção
      setIsSessionModalOpen(false);
      setIsPickItemModalOpen(true);
    } else {
      // Sem itens: mostrar alerta ou navegar
      setIsSessionModalOpen(false);
      
      if (sessionStage === "script") {
        // Roteiro: criar novo
        setSessionContext({
          stage: "script",
          duration: sessionDuration,
          contentId: null,
        });
        navigate("/scripts");
        trackEvent("session_script_new");
      } else if (sessionStage === "record") {
        // Gravação: pedir para finalizar roteiro
        setAlertConfig({
          title: "Finalize um roteiro antes de gravar",
          description: "Você precisa ter pelo menos um roteiro pronto para iniciar uma sessão de gravação.",
          action: "record",
        });
        setIsAlertOpen(true);
      } else if (sessionStage === "edit") {
        // Edição: pedir para gravar
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

    setSessionContext({
      stage: pickListType,
      duration: sessionDuration,
      contentId: selectedItemId,
    });

    setIsPickItemModalOpen(false);
    navigate(`/scripts?item=${selectedItemId}`);
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
            <div className="space-y-4 text-center">
              <Button
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

      {/* Session Stage Selection Modal */}
      <Dialog open={isSessionModalOpen} onOpenChange={setIsSessionModalOpen}>
        <DialogContent className="sm:max-w-md">
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
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
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
        <DialogContent className="sm:max-w-lg">
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

      <BottomNav />
    </div>
  );
};

export default Index;