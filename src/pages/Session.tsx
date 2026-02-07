import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNavigationBlocker } from "@/hooks/useNavigationBlocker";
import { useSession, SessionStage } from "@/hooks/useSession";
import { useSessionContext } from "@/contexts/SessionContext";
import { useDailyGoalProgress } from "@/hooks/useDailyGoalProgress";
import { useTimerPermission } from "@/hooks/useTimerPermission";
import { useCelebration } from "@/contexts/CelebrationContext";
import { useProfileWithLevel } from "@/hooks/useProfileWithLevel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Play, 
  Pause, 
  Square, 
  Lightbulb, 
  FileText, 
  Video, 
  Scissors, 
  CheckCircle,
  ArrowLeft,
  ChevronLeft,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StreakHalo } from "@/components/StreakHalo";
import { ScriptEditor } from "@/components/ScriptEditor";
import { BrainstormWorkspace } from "@/components/brainstorm/BrainstormWorkspace";
import { IdeaDetail } from "@/components/brainstorm/IdeaDetail";
import { DraggableSessionTimer } from "@/components/DraggableSessionTimer";
import { AutoHideNav } from "@/components/AutoHideNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DevToolsPanel } from "@/components/DevToolsPanel";
import { TROPHIES } from "@/lib/gamification";
import { CreativeStage } from "@/types/workspace";
import { useWorkflowTemplate, getPrevStageUrl, CREATIVE_TO_SESSION } from "@/hooks/useWorkflowTemplate";
import { WorkflowTemplateId, getStageLabel } from "@/lib/workflow-templates";

const STAGES: { 
  id: SessionStage; 
  label: string; 
  icon: any;
  iconName: string;
  color: string;
}[] = [
  { id: "idea", label: "Ideia", icon: Lightbulb, iconName: "Lightbulb", color: "text-yellow-500" },
  { id: "script", label: "Roteiro", icon: FileText, iconName: "FileText", color: "text-blue-500" },
  { id: "review", label: "Revisão", icon: CheckCircle, iconName: "CheckCircle", color: "text-green-500" },
  { id: "record", label: "Gravação", icon: Video, iconName: "Video", color: "text-red-500" },
  { id: "edit", label: "Edição", icon: Scissors, iconName: "Scissors", color: "text-purple-500" },
];

const Session = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stageParam = searchParams.get("stage");
  const scriptIdParam = searchParams.get("scriptId");
  const { toast } = useToast();
  
  const [scriptId, setScriptId] = useState<string | undefined>(scriptIdParam || undefined);
  const { session, startSession, pauseSession, resumeSession, changeStage, endSession, saveCurrentStageTime } = useSession({ 
    attachBeforeUnloadListener: true 
  });
  const { validateSessionFreshness } = useSessionContext();
  // Flag para prevenir reinício de sessão após encerramento intencional
  const [hasEndedSession, setHasEndedSession] = useState(false);
  const [showStreakHalo, setShowStreakHalo] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const { goalMinutes } = useProfileWithLevel();
  const { progress: dailyProgress } = useDailyGoalProgress({ goalMinutes });
  
  // Workflow template state for dynamic navigation
  const [scriptWorkflow, setScriptWorkflow] = useState<WorkflowTemplateId | null>(null);
  const { prevStage, currentTemplate } = useWorkflowTemplate({ scriptWorkflow });
  // Map session stage to CreativeStage for permission check
  const stageMapping: Record<string, CreativeStage> = {
    'idea': 'ideation',
    'script': 'script',
    'review': 'review',
    'record': 'recording',
    'edit': 'editing',
  };
  const currentCreativeStage = stageMapping[session.stage || 'idea'];
  
  // Timer permission check
  const { canUseTimer } = useTimerPermission(scriptId, currentCreativeStage);
  
  // Global celebration system
  const { 
    triggerFullCelebration,
    triggerCelebration,
    isShowingAnyCelebration,
  } = useCelebration();

  // State para modal de confirmação de encerramento
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  
  // State para controlar se devemos prosseguir com navegação bloqueada
  const [shouldProceedWithBlocker, setShouldProceedWithBlocker] = useState(false);

  // Memoizar callback para evitar recriações desnecessárias
  const handleNavigationBlocked = useCallback(() => {
    setShowEndConfirmation(true);
  }, []);

  // Interceptar navegação via swipe/browser back quando há sessão ativa
  const blocker = useNavigationBlocker({
    onNavigationBlocked: handleNavigationBlocked,
    shouldBlock: true,
  });

  // Handler para confirmar encerramento via modal (swipe/back)
  const handleConfirmEndSession = async () => {
    setShowEndConfirmation(false);
    
    // Guardar se devemos prosseguir com navegação bloqueada após celebração
    const blockerWasActive = blocker.state === "blocked";
    setShouldProceedWithBlocker(blockerWasActive);
    
    // CRÍTICO: Capturar dados da sessão ANTES de qualquer reset
    const capturedDuration = session.elapsedSeconds;
    const capturedStage = session.stage || 'idea';
    
    // Ativar flag ANTES de encerrar para evitar reinício de sessão
    setHasEndedSession(true);
    
    const result = await endSession();
    if (result) {
      const sessionSummary = {
        duration: result.duration || capturedDuration || 0,
        xpGained: result.xpGained || 0,
        stage: capturedStage,
      };
      
      const alreadyCounted = (result as any).alreadyCounted || false;
      const shouldShowStreak = (result as any).shouldShowCelebration && !alreadyCounted;
      const streakCountResult = shouldShowStreak ? ((result as any).newStreak || 0) : 0;
      
      // Disparar celebração global - navegação no callback
      await triggerFullCelebration(sessionSummary, streakCountResult, result.xpGained || 0, () => {
        if (blockerWasActive) {
          blocker.proceed?.();
        } else {
          navigate('/');
        }
      });
    } else {
      setHasEndedSession(false);
    }
  };

  // Handler para cancelar encerramento
  const handleCancelEndSession = () => {
    setShowEndConfirmation(false);
    if (blocker.state === "blocked") {
      blocker.reset?.();
    }
  };

  // Developer tools handlers
  const handleSimulateSession = async () => {
    // Simulate a completed session with streak
    await triggerCelebration(5, 150);
  };

  const handleSimulateTrophy = async () => {
    // Get the first trophy as example
    const exampleTrophy = TROPHIES[0];
    await triggerCelebration(3, 100);
  };

  // Validar frescor da sessão ao montar a página
  useEffect(() => {
    const isValid = validateSessionFreshness();
    if (!isValid) {
      toast({
        title: "Sessão anterior expirada",
        description: "Iniciando uma nova sessão do zero.",
      });
    }
  }, []);

  useEffect(() => {
    if (stageParam) {
      // Normalizar "ideation" para "idea" (são sinônimos no workflow)
      const normalizedStage = stageParam === "ideation" ? "idea" : stageParam;
      
      // NÃO iniciar nova sessão se o usuário acabou de encerrar ou está em celebração
      if (!session.isActive && !hasEndedSession && !isShowingAnyCelebration) {
        // Nenhuma sessão ativa e usuário não encerrou - iniciar nova
        startSession(normalizedStage as SessionStage);
      } else if (session.isActive && session.stage !== normalizedStage) {
        // Sessão ativa mas etapa diferente - mudar etapa (preserva timer)
        changeStage(normalizedStage as SessionStage);
      }
      // Se sessão ativa e mesma etapa, não faz nada
      // Se hasEndedSession ou isShowingAnyCelebration, não iniciar nova sessão
    }
  }, [stageParam, session.isActive, session.stage, hasEndedSession, isShowingAnyCelebration]);

  useEffect(() => {
    if (scriptIdParam) {
      setScriptId(scriptIdParam);
      
      // Load workflow_template for dynamic navigation
      const loadWorkflow = async () => {
        const { data } = await supabase
          .from('scripts')
          .select('workflow_template')
          .eq('id', scriptIdParam)
          .single();
        if (data?.workflow_template) {
          setScriptWorkflow(data.workflow_template as WorkflowTemplateId);
        }
      };
      loadWorkflow();
    }
  }, [scriptIdParam]);

  // Handle record stage - redirect to shot list record
  useEffect(() => {
    const handleRecordStage = async () => {
      // Only redirect if both session.stage and stageParam are "record"
      // This prevents unwanted redirects when navigating back from review
      if (session.stage === "record" && stageParam === "record") {
        console.log('[Session] Record stage detected, scriptId:', scriptId);
        
        if (scriptId && scriptId !== 'null' && scriptId !== 'undefined') {
          // Already has scriptId (coming from Review), redirect directly
          console.log('[Session] Valid scriptId found, navigating...');
          navigate(`/shot-list/record?scriptId=${scriptId}`);
        } else {
          console.log('[Session] No valid scriptId, fetching latest script...');
          // No scriptId, fetch the latest script from the user
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: latestScript, error } = await supabase
              .from('scripts')
              .select('id, title')
              .eq('user_id', user.id)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (error) throw error;

            if (latestScript) {
              navigate(`/shot-list/record?scriptId=${latestScript.id}`);
            } else {
              toast({
                title: "Nenhum roteiro encontrado",
                description: "Crie um roteiro primeiro antes de iniciar a gravação",
                variant: "destructive",
              });
              navigate("/");
            }
          } catch (error) {
            console.error('Error fetching latest script:', error);
            toast({
              title: "Erro",
              description: "Não foi possível carregar o roteiro",
              variant: "destructive",
            });
          }
        }
      }
    };

    handleRecordStage();
  }, [session.stage, stageParam, scriptId, navigate, toast]);

  // Handle edit stage - always redirect to Editing Workspace
  useEffect(() => {
    if (session.stage === "edit" && stageParam === "edit") {
      if (scriptId && scriptId !== 'null' && scriptId !== 'undefined') {
        navigate(`/editing-workspace?scriptId=${scriptId}`);
      } else {
        // No scriptId for edit stage, redirect to calendar
        toast({
          title: "Conteúdo não encontrado",
          description: "Selecione um conteúdo para editar no calendário.",
          variant: "destructive",
        });
        navigate('/calendario?view=board');
      }
    }
  }, [session.stage, stageParam, scriptId, navigate, toast]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = (stage: SessionStage) => {
    startSession(stage);
  };

  const handleEnd = async () => {
    // CRÍTICO: Capturar dados da sessão ANTES de qualquer reset
    const capturedDuration = session.elapsedSeconds;
    const capturedStage = session.stage || 'idea';
    
    // Ativar flag ANTES de encerrar para evitar reinício de sessão
    setHasEndedSession(true);
    
    const result = await endSession();
    if (result) {
      // Usar dados capturados como fallback se result estiver corrompido
      const sessionSummary = {
        duration: result.duration || capturedDuration || 0,
        xpGained: result.xpGained || 0,
        stage: capturedStage,
      };
      
      // ✅ Só mostrar celebração de streak se NÃO foi contado antes hoje
      const alreadyCounted = (result as any).alreadyCounted || false;
      const shouldShowStreak = (result as any).shouldShowCelebration && !alreadyCounted;
      const streakCountResult = shouldShowStreak ? ((result as any).newStreak || 0) : 0;
      
      // Disparar celebração global - navegação para home no callback
      await triggerFullCelebration(sessionSummary, streakCountResult, result.xpGained || 0, () => {
        navigate('/');
      });
    } else {
      // Se falhou, resetar flag
      setHasEndedSession(false);
    }
  };

  const currentStage = STAGES.find(s => s.id === session.stage);
  const progress = (session.elapsedSeconds / (session.isStreakMode ? session.dailyGoalMinutes * 60 : 25 * 60)) * 100;

  // Se celebração está ativa, renderizar tela mínima para evitar flash
  if (isShowingAnyCelebration) {
    return (
      <div className="min-h-screen bg-background">
        {/* Tela em branco - celebração aparece como overlay via GlobalCelebrations */}
      </div>
    );
  }

  // Detectar se estamos inicializando a partir de URL (evita flash do modal)
  const isInitializingFromUrl = stageParam && !session.isActive && !hasEndedSession;

  if (isInitializingFromUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  // Não mostrar tela de seleção se estiver exibindo celebração
  if (!session.isActive && !isShowingAnyCelebration) {
    return (
      <div 
        className="min-h-screen bg-background px-4 py-6"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          <Card className="p-6 bg-background border border-border rounded-xl">
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
              Nova Sessão Criativa
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Escolha a etapa em que você vai trabalhar
            </p>

            <div className="space-y-2">
              {STAGES.map((stage) => {
                const Icon = stage.icon;
                return (
                  <button
                    key={stage.id}
                    id={`session-stage-${stage.id}`}
                    onClick={() => handleStart(stage.id)}
                    className={cn(
                      "w-full p-4 rounded-xl border border-border",
                      "bg-background hover:bg-muted/50 transition-colors",
                      "flex items-center gap-4 text-left",
                      "hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      "bg-muted"
                    )}>
                      <Icon className={cn("w-6 h-6", stage.color)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground">
                        {stage.label}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Iniciar sessão de {stage.label.toLowerCase()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Celebrações são renderizadas globalmente via GlobalCelebrations em App.tsx
  // Quando celebração está ativa, ela aparece como overlay sobre qualquer página

  // Fallback seguro se currentStage for undefined
  if (!currentStage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  const CurrentIcon = currentStage.icon;

  // If stage is "record", show loading while redirecting to shot list
  if (session.stage === "record") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando shot list...</p>
        </div>
      </div>
    );
  }

  // If stage is "edit", show loading while redirecting to Editing Workspace
  if (session.stage === "edit") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">Abrindo mesa de edição...</p>
        </div>
      </div>
    );
  }

  // If stage is "idea", show either the specific idea detail or brainstorm workspace
  if (session.stage === "idea") {
    console.log('[Session] Rendering idea stage, scriptId:', scriptId, 'scriptIdParam:', scriptIdParam);
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          {/* Show IdeaDetail if scriptId is present, otherwise BrainstormWorkspace */}
          {scriptId ? (
            <IdeaDetail scriptId={scriptId} />
          ) : (
            <BrainstormWorkspace />
          )}
        </div>

        {/* Floating Draggable Timer - Hidden during celebrations */}
        <DraggableSessionTimer
          stage={currentStage!.label}
          icon={currentStage!.iconName}
          elapsedSeconds={session.elapsedSeconds}
          targetSeconds={session.targetSeconds}
          isStreakMode={session.isStreakMode}
          dailyGoalMinutes={session.dailyGoalMinutes}
          isPaused={session.isPaused}
          onPause={pauseSession}
          onResume={resumeSession}
          onStop={handleEnd}
          progress={progress}
          dailyBaselineSeconds={session.dailyBaselineSeconds}
          permissionEnabled={canUseTimer}
          hidden={isShowingAnyCelebration}
        />

        {/* Auto-hide Navigation */}
        <AutoHideNav />

        {/* Developer Tools Panel */}
        <DevToolsPanel
          onSimulateSession={handleSimulateSession}
          onSimulateTrophy={handleSimulateTrophy}
        />

        {/* Celebration Components rendered globally via GlobalCelebrations */}
      </div>
    );
  }

  // If stage is "script" or "review", show the script editor with floating timer
  if (session.stage === "script" || session.stage === "review") {
    const progress = session.targetSeconds 
      ? Math.min(100, (session.elapsedSeconds / session.targetSeconds) * 100)
      : 0;

  return (
    <div className="relative">
      {/* ScriptEditor has its own back button, don't render here for script/review stages */}
      {session.stage !== 'script' && session.stage !== 'review' && (
        <div className="fixed top-4 left-4 md:top-6 md:left-6 z-50">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="bg-card/95 backdrop-blur-md hover:bg-accent/10 border border-border/20 shadow-lg h-9 md:h-10 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </div>
      )}

        {/* Floating Draggable Timer - Hidden during celebrations */}
        <DraggableSessionTimer
          stage={currentStage.label}
          icon={currentStage.iconName}
          elapsedSeconds={session.elapsedSeconds}
          targetSeconds={session.targetSeconds}
          isStreakMode={session.isStreakMode}
          dailyGoalMinutes={session.dailyGoalMinutes}
          isPaused={session.isPaused}
          onPause={pauseSession}
          onResume={resumeSession}
          onStop={handleEnd}
          progress={progress}
          dailyBaselineSeconds={session.dailyBaselineSeconds}
          permissionEnabled={canUseTimer}
          hidden={isShowingAnyCelebration}
        />

        {/* Script Editor */}
        <ScriptEditor scriptId={scriptId} isReviewMode={session.stage === "review"} />

        {/* Auto-hide Navigation */}
        <AutoHideNav />

        {/* Developer Tools Panel */}
        <DevToolsPanel
          onSimulateSession={handleSimulateSession}
          onSimulateTrophy={handleSimulateTrophy}
        />

        {/* Celebration Components rendered globally via GlobalCelebrations */}
      </div>
    );
  }

  // Fallback: unknown stage - redirect to home
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>

      {/* Alert Dialog para confirmar encerramento de sessão via swipe/back */}
      <AlertDialog open={showEndConfirmation} onOpenChange={(open) => {
        if (!open) handleCancelEndSession();
        else setShowEndConfirmation(true);
      }}>
        <AlertDialogContent className="z-[150]">
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao encerrar, seu tempo será salvo e você verá o resumo da sua sessão criativa.
              Tem certeza que deseja finalizar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelEndSession}>Continuar trabalhando</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEndSession}>
              Sim, encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Session;
