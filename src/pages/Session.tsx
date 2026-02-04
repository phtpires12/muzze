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
import { EditingChecklist } from "@/components/EditingChecklist";
import { DraggableSessionTimer } from "@/components/DraggableSessionTimer";
import { AutoHideNav } from "@/components/AutoHideNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWindowPortal } from "@/hooks/useWindowPortal";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { TimerWindowActivator } from "@/components/TimerWindowActivator";
import { DevToolsPanel } from "@/components/DevToolsPanel";
import { TROPHIES } from "@/lib/gamification";
import { CreativeStage } from "@/types/workspace";

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
  const isAppVisible = useAppVisibility();
  const { goalMinutes } = useProfileWithLevel();
  const { progress: dailyProgress } = useDailyGoalProgress({ goalMinutes });
  
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

  const handleEditingCompleted = async () => {
    // Update publish_status to pronto_para_postar when editing is completed
    if (scriptId) {
      try {
        await supabase
          .from('scripts')
          .update({ publish_status: 'pronto_para_postar' })
          .eq('id', scriptId);
      } catch (error) {
        console.error('Error updating publish_status:', error);
      }
    }

    toast({
      title: "🎉 Edição Concluída!",
      description: "Seu conteúdo está pronto para publicar!",
    });
    await handleEnd();
  };

  // Window portal system - pops out timer when user leaves app
  const currentStage = STAGES.find(s => s.id === session.stage);
  const progress = (session.elapsedSeconds / (session.isStreakMode ? session.dailyGoalMinutes * 60 : 25 * 60)) * 100;

  const { isOpen, openPortal, closePortal, Portal, hasOpenWindow } = useWindowPortal({
    title: `Timer - ${currentStage?.label || "Sessão"}`,
    width: 500,
    height: 500,
  });

  // Handler for user-initiated popup activation (via button click)
  const handleActivatePopup = () => {
    openPortal({ reason: 'user' });
  };

  // Ref para estado atual do pause (evita race conditions com stale closures)
  const isPausedRef = useRef(session.isPaused);
  useEffect(() => {
    isPausedRef.current = session.isPaused;
  }, [session.isPaused]);

  // Fechar popup quando timer é pausado
  useEffect(() => {
    if (session.isPaused && isOpen) {
      closePortal();
    }
  }, [session.isPaused, isOpen, closePortal]);

  // Handle visibility changes - only focus existing window, never create new
  useEffect(() => {
    if (!session.isActive) return;
    
    const autoPopupEnabled = localStorage.getItem('timer-auto-popup-enabled') !== 'false';
    const popupActivated = localStorage.getItem('timer-popup-activated') === 'true';

    // When user leaves the tab and popup was activated
    if (!isAppVisible && !session.isPaused && autoPopupEnabled && popupActivated) {
      // Auto mode: only focus existing window, never create new tab
      openPortal({ reason: 'auto' });
    }
    // NOTE: We no longer close the popup when returning to the main tab
    // This keeps the window handle alive for subsequent auto-focus
  }, [isAppVisible, session.isActive, session.isPaused, openPortal]);


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

  // If stage is "record", show loading while fetching script
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

        {/* Floating Draggable Timer (in-app) - Hidden when user leaves app or during celebrations */}
        {!isOpen && (
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
        )}

        <Portal>
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
            isPopup={true}
            dailyBaselineSeconds={session.dailyBaselineSeconds}
            permissionEnabled={canUseTimer}
          />
        </Portal>

        {/* Timer Window Activator - prompts user to enable popup */}
        <TimerWindowActivator
          onActivate={handleActivatePopup}
          hasOpenWindow={hasOpenWindow()}
          isSessionActive={session.isActive}
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

        {/* Floating Draggable Timer (in-app) - Hidden when user leaves app or during celebrations */}
        {!isOpen && (
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
        )}

        {/* Timer in External Popup Window */}
        <Portal>
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
            isPopup={true}
            dailyBaselineSeconds={session.dailyBaselineSeconds}
            permissionEnabled={canUseTimer}
          />
        </Portal>

        {/* Script Editor */}
        <ScriptEditor scriptId={scriptId} isReviewMode={session.stage === "review"} />

        {/* Timer Window Activator - prompts user to enable popup */}
        <TimerWindowActivator
          onActivate={handleActivatePopup}
          hasOpenWindow={hasOpenWindow()}
          isSessionActive={session.isActive}
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


  // Calculate bonus mode for edit stage (same logic as DraggableSessionTimer)
  // Usar dailyBaselineSeconds (snapshot do início da sessão) + elapsedSeconds para cálculo monotônico
  const goalSeconds = session.dailyGoalMinutes * 60;
  const totalCreatedToday = session.dailyBaselineSeconds + session.elapsedSeconds;
  const remainingSeconds = Math.max(0, goalSeconds - totalCreatedToday);
  const bonusSeconds = Math.max(0, totalCreatedToday - goalSeconds);
  const isBonusMode = bonusSeconds >= 90 && session.isStreakMode;

  // Dynamic goal text
  const goalText = remainingSeconds > 0 
    ? `Falta: ${formatTime(remainingSeconds)}`
    : `🔥 Bônus: +${formatTime(bonusSeconds)} além da meta`;

  return (
    <div 
      className="min-h-screen bg-background px-4 py-6"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
    >
      <div className="max-w-2xl mx-auto">
        <Card className={cn(
          "relative p-6 border rounded-xl transition-all duration-500",
          session.isStreakMode 
            ? "bg-primary/5 border-primary/30" 
            : isBonusMode
              ? "bg-purple-500/5 border-purple-500/30"
              : "bg-background border-border"
        )}>
          {/* Back to Recording Button - top left */}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (!scriptId) {
                console.error('scriptId não encontrado para atualizar status');
                return;
              }
              await saveCurrentStageTime();
              const { error } = await supabase
                .from('scripts')
                .update({ status: 'recording' })
                .eq('id', scriptId);
              if (error) {
                console.error('Erro ao atualizar status para recording:', error);
              }
              
              // Verificar qual modo de gravação foi usado anteriormente
              const recordingMode = localStorage.getItem(`recording-mode-${scriptId}`);
              
              // Navegar para shot-list/record - o componente decide qual modo renderizar
              // baseado em isShotListEmpty (teleprompter ou shot list tradicional)
              navigate(`/shot-list/record?scriptId=${scriptId}`);
            }}
            className="absolute top-2 left-4 gap-2 text-muted-foreground hover:text-foreground hover:bg-red-500/10"
          >
            <ChevronLeft className="w-4 h-4" />
            <Video className="w-4 h-4 text-red-500" />
            <span className="text-xs">Gravação</span>
          </Button>

          {/* Timer Display */}
          <div className="text-center mb-6">
            <div className={cn(
              "w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-500",
              session.isStreakMode
                ? "bg-primary/10"
                : isBonusMode
                  ? "bg-purple-500/10"
                  : "bg-muted"
            )}>
              {session.isStreakMode ? (
                <Flame className="w-10 h-10 text-primary" />
              ) : isBonusMode ? (
                <Flame className="w-10 h-10 text-purple-500" />
              ) : (
                <CurrentIcon className={cn("w-10 h-10", currentStage.color)} />
              )}
            </div>
            
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {currentStage.label}
            </h2>
            
            <div className={cn(
              "text-5xl font-bold tracking-tight mb-1 tabular-nums transition-colors duration-500",
              session.isStreakMode 
                ? "text-primary" 
                : isBonusMode 
                  ? "text-purple-600"
                  : "text-foreground"
            )}>
              {formatTime(session.elapsedSeconds)}
            </div>

            <div className={cn(
              "text-sm mb-3 transition-colors duration-500",
              session.isStreakMode 
                ? "text-primary/70" 
                : isBonusMode
                  ? "text-purple-500/70"
                  : "text-muted-foreground"
            )}>
              {goalText}
            </div>

            <Progress 
              value={progress} 
              className={cn(
                "max-w-xs mx-auto mb-4 h-2",
                session.isStreakMode && "[&>div]:bg-primary",
                isBonusMode && !session.isStreakMode && "[&>div]:bg-purple-500"
              )}
            />
            
            {session.isPaused && (
              <p className="text-sm text-muted-foreground">Sessão pausada</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-6">
            {!session.isPaused ? (
              <Button
                onClick={pauseSession}
                variant="outline"
                className="flex-1 h-12 rounded-lg font-medium"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
            ) : (
              <Button
                onClick={resumeSession}
                className="flex-1 h-12 rounded-lg font-medium"
              >
                <Play className="w-4 h-4 mr-2" />
                Retomar
              </Button>
            )}
            
            <Button
              onClick={handleEnd}
              variant="destructive"
              className="flex-1 h-12 rounded-lg font-medium"
            >
              <Square className="w-4 h-4 mr-2" />
              Finalizar
            </Button>
          </div>

              {/* Stage Selection OR Editing Checklist */}
              {session.stage === "edit" ? (
                // Checklist para etapa de Edição
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Etapas de Edição
                  </h3>
                  <EditingChecklist scriptId={scriptId} onAllCompleted={handleEditingCompleted} />
                  
                </div>
              ) : (
                // Botões de mudança de etapa para outras etapas
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Mudar Etapa
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {STAGES.map((stage) => {
                      const Icon = stage.icon;
                      const isActive = stage.id === session.stage;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => !isActive && changeStage(stage.id)}
                          disabled={isActive}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            "flex flex-col items-center gap-1.5",
                            isActive 
                              ? "bg-primary/10 border-primary/30" 
                              : "bg-background border-border hover:border-primary/30 hover:bg-muted/50"
                          )}
                        >
                          <Icon className={cn(
                            "w-5 h-5",
                            isActive ? "text-primary" : stage.color
                          )} />
                          <span className={cn(
                            "text-xs font-medium",
                            isActive ? "text-primary" : "text-foreground"
                          )}>
                            {stage.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
        </Card>
      </div>

      {/* Floating Draggable Timer for edit stage (same as other stages) - Hidden during celebrations */}
      {!isOpen && (
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
      )}

      {/* Portal for popup window when user leaves app */}
      <Portal>
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
          isPopup={true}
        />
      </Portal>

      {/* Celebration Components rendered globally via GlobalCelebrations */}


      {/* Streak Halo Effect */}
      <StreakHalo 
        show={showStreakHalo} 
        streakCount={streakCount}
        onComplete={() => setShowStreakHalo(false)}
      />
      
      {/* Timer Window Activator - prompts user to enable popup */}
      <TimerWindowActivator
        onActivate={handleActivatePopup}
        hasOpenWindow={hasOpenWindow()}
        isSessionActive={session.isActive}
      />
      
      {/* Auto-hide Navigation */}
      <AutoHideNav />

      {/* Developer Tools Panel */}
      <DevToolsPanel
        onSimulateSession={handleSimulateSession}
        onSimulateTrophy={handleSimulateTrophy}
      />

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
