import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession, SessionStage } from "@/hooks/useSession";
import { useSessionContext } from "@/contexts/SessionContext";
import { useDailyGoalProgress } from "@/hooks/useDailyGoalProgress";
import { useTimerPermission } from "@/hooks/useTimerPermission";
import { useCelebration } from "@/contexts/CelebrationContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  const { progress: dailyProgress } = useDailyGoalProgress();
  
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

  const { isOpen, openPortal, closePortal, Portal } = useWindowPortal({
    title: `Timer - ${currentStage?.label || "Sessão"}`,
    width: 500,
    height: 500,
  });

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

  // Open/close portal based on app visibility
  useEffect(() => {
    if (!session.isActive) return;
    
    const autoPopupEnabled = localStorage.getItem('timer-auto-popup-enabled') !== 'false';

    // Fechar imediatamente quando usuário volta para o app
    if (isAppVisible) {
      closePortal();
      return;
    }

    // Se timer está pausado, NÃO abrir popup
    if (session.isPaused) {
      return;
    }

    // Delay para garantir que o estado está sincronizado antes de abrir
    const timeoutId = setTimeout(() => {
      // Double-check: verificar se ainda NÃO está pausado antes de abrir
      if (!isPausedRef.current && autoPopupEnabled) {
        openPortal();
      }
    }, 150); // 150ms de delay para evitar race condition

    return () => clearTimeout(timeoutId);
  }, [isAppVisible, session.isActive, session.isPaused, openPortal, closePortal]);


  // Se celebração está ativa, renderizar tela mínima para evitar flash
  if (isShowingAnyCelebration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/10">
        {/* Tela em branco - celebração aparece como overlay via GlobalCelebrations */}
      </div>
    );
  }

  // Detectar se estamos inicializando a partir de URL (evita flash do modal)
  const isInitializingFromUrl = stageParam && !session.isActive && !hasEndedSession;

  if (isInitializingFromUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent/10 via-background to-primary/10">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  // Não mostrar tela de seleção se estiver exibindo celebração
  if (!session.isActive && !isShowingAnyCelebration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/10 p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 hover:bg-accent/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          <Card className="p-8 backdrop-blur-md bg-card/85 border-border/20 shadow-lg rounded-[28px]">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Nova Sessão Criativa
            </h1>
            <p className="text-muted-foreground mb-8">
              Escolha a etapa em que você vai trabalhar
            </p>

            <div className="space-y-3">
              {STAGES.map((stage) => {
                const Icon = stage.icon;
                return (
                  <button
                    key={stage.id}
                    onClick={() => handleStart(stage.id)}
                    className={cn(
                      "w-full p-6 rounded-2xl border-2 border-border/20",
                      "bg-card hover:bg-accent/10 transition-all duration-200",
                      "flex items-center gap-4 text-left",
                      "hover:border-primary/50 hover:shadow-lg"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center",
                      "bg-gradient-to-br from-accent/20 to-primary/20"
                    )}>
                      <Icon className={cn("w-7 h-7", stage.color)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground">
                        {stage.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  const CurrentIcon = currentStage.icon;

  // If stage is "record", show loading while fetching script
  if (session.stage === "record") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Carregando shot list...</p>
        </div>
      </div>
    );
  }

  // If stage is "idea", show either the specific idea detail or brainstorm workspace
  if (session.stage === "idea") {
    console.log('[Session] Rendering idea stage, scriptId:', scriptId, 'scriptIdParam:', scriptIdParam);
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 hover:bg-accent/10"
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
            todayMinutesFromDB={dailyProgress.actualMinutes}
            permissionEnabled={canUseTimer}
            savedSecondsThisSession={session.savedSecondsThisSession}
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
            todayMinutesFromDB={dailyProgress.actualMinutes}
            permissionEnabled={canUseTimer}
            savedSecondsThisSession={session.savedSecondsThisSession}
          />
        </Portal>

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
            todayMinutesFromDB={dailyProgress.actualMinutes}
            permissionEnabled={canUseTimer}
            savedSecondsThisSession={session.savedSecondsThisSession}
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
            todayMinutesFromDB={dailyProgress.actualMinutes}
            permissionEnabled={canUseTimer}
            savedSecondsThisSession={session.savedSecondsThisSession}
          />
        </Portal>

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


  // Calculate bonus mode for edit stage (same logic as DraggableSessionTimer)
  const goalSeconds = session.dailyGoalMinutes * 60;
  const alreadyDoneSeconds = (dailyProgress.actualMinutes || 0) * 60;
  const totalWithCurrentSession = alreadyDoneSeconds + session.elapsedSeconds;
  const remainingSeconds = goalSeconds - totalWithCurrentSession;
  const isBonusMode = remainingSeconds <= 0 && !session.isStreakMode;

  // Dynamic goal text
  const goalText = session.isStreakMode 
    ? `🎯 Meta diária: ${formatTime(session.dailyGoalMinutes * 60)}`
    : remainingSeconds > 0 
      ? `Falta: ${formatTime(remainingSeconds)}`
      : `🔥 Bônus: +${formatTime(Math.abs(remainingSeconds))} além da meta`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/10 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className={cn(
          "relative p-8 backdrop-blur-md border-border/20 shadow-lg rounded-[28px] transition-all duration-1000",
          session.isStreakMode 
            ? "bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-600/10 border-orange-500/30" 
            : isBonusMode
              ? "bg-gradient-to-br from-orange-400/10 via-purple-500/10 to-violet-600/10 border-purple-400/30"
              : "bg-card/85"
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
            className="absolute top-4 left-4 gap-2 text-muted-foreground hover:text-foreground hover:bg-red-500/10"
          >
            <ChevronLeft className="w-4 h-4" />
            <Video className="w-4 h-4 text-red-500" />
            <span className="text-xs">Gravação</span>
          </Button>

          {/* Timer Display */}
          <div className="text-center mb-8">
            <div className={cn(
              "w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg transition-all duration-1000",
              session.isStreakMode
                ? "bg-gradient-to-br from-orange-500 to-red-600 animate-wiggle"
                : isBonusMode
                  ? "bg-gradient-to-br from-orange-400 via-purple-500 to-violet-600"
                  : "bg-gradient-to-br from-accent to-primary"
            )}>
              {session.isStreakMode ? (
                <Flame className="w-12 h-12 text-white" />
              ) : isBonusMode ? (
                <Flame className="w-12 h-12 text-white" />
              ) : (
                <CurrentIcon className="w-12 h-12 text-white" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {currentStage.label}
            </h2>
            
            <div className={cn(
              "text-6xl font-bold mb-2 tabular-nums transition-colors duration-1000",
              session.isStreakMode 
                ? "text-orange-600" 
                : isBonusMode 
                  ? "text-purple-600"
                  : "text-foreground"
            )}>
              {formatTime(session.elapsedSeconds)}
            </div>

            <div className={cn(
              "text-sm mb-2 transition-colors duration-1000",
              session.isStreakMode 
                ? "text-orange-600/70" 
                : isBonusMode
                  ? "text-purple-600/70"
                  : "text-muted-foreground"
            )}>
              {goalText}
            </div>

            <Progress 
              value={progress} 
              className={cn(
                "max-w-xs mx-auto mb-4 transition-all duration-500",
                session.isStreakMode && "bg-orange-200 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-red-600",
                isBonusMode && !session.isStreakMode && "bg-purple-200 [&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:via-purple-500 [&>div]:to-violet-600"
              )}
            />
            
            {session.isPaused && (
              <p className="text-muted-foreground">Sessão pausada</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-8">
            {!session.isPaused ? (
              <Button
                onClick={pauseSession}
                variant="outline"
                className="flex-1 h-14 text-lg"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pausar
              </Button>
            ) : (
              <Button
                onClick={resumeSession}
                className="flex-1 h-14 text-lg bg-gradient-to-r from-primary to-accent"
              >
                <Play className="w-5 h-5 mr-2" />
                Retomar
              </Button>
            )}
            
            <Button
              onClick={handleEnd}
              variant="destructive"
              className="flex-1 h-14 text-lg"
            >
              <Square className="w-5 h-5 mr-2" />
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
                  <EditingChecklist onAllCompleted={handleEditingCompleted} />
                  
                </div>
              ) : (
                // Botões de mudança de etapa para outras etapas
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Mudar Etapa
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {STAGES.map((stage) => {
                      const Icon = stage.icon;
                      const isActive = stage.id === session.stage;
                      return (
                        <button
                          key={stage.id}
                          onClick={() => !isActive && changeStage(stage.id)}
                          disabled={isActive}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all duration-200",
                            "flex flex-col items-center gap-2",
                            isActive 
                              ? "bg-gradient-to-br from-accent to-primary border-transparent text-white shadow-lg" 
                              : "bg-card border-border/20 hover:border-primary/50 hover:bg-accent/10"
                          )}
                        >
                          <Icon className={cn(
                            "w-6 h-6",
                            isActive ? "text-white" : stage.color
                          )} />
                          <span className={cn(
                            "text-sm font-medium",
                            isActive ? "text-white" : "text-foreground"
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
          todayMinutesFromDB={dailyProgress.actualMinutes}
          permissionEnabled={canUseTimer}
          savedSecondsThisSession={session.savedSecondsThisSession}
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
          todayMinutesFromDB={dailyProgress.actualMinutes}
          permissionEnabled={canUseTimer}
          isPopup={true}
          savedSecondsThisSession={session.savedSecondsThisSession}
        />
      </Portal>

      {/* Celebration Components rendered globally via GlobalCelebrations */}


      {/* Streak Halo Effect */}
      <StreakHalo 
        show={showStreakHalo} 
        streakCount={streakCount}
        onComplete={() => setShowStreakHalo(false)}
      />
      
      {/* Auto-hide Navigation */}
      <AutoHideNav />

      {/* Developer Tools Panel */}
      <DevToolsPanel
        onSimulateSession={handleSimulateSession}
        onSimulateTrophy={handleSimulateTrophy}
      />
    </div>
  );
};

export default Session;
