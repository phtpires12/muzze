import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession, SessionStage } from "@/hooks/useSession";
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
  Home,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StreakHalo } from "@/components/StreakHalo";
import { ScriptEditor } from "@/components/ScriptEditor";
import { BrainstormWorkspace } from "@/components/brainstorm/BrainstormWorkspace";
import { EditingChecklist } from "@/components/EditingChecklist";
import { DraggableSessionTimer } from "@/components/DraggableSessionTimer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTimerPopup } from "@/hooks/useTimerPopup";
import { useAppVisibility } from "@/hooks/useAppVisibility";

const STAGES: { 
  id: SessionStage; 
  label: string; 
  icon: any;
  iconName: string;
  color: string;
}[] = [
  { id: "idea" as SessionStage, label: "Ideia", icon: Lightbulb, iconName: "Lightbulb", color: "text-yellow-500" },
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
  const { session, startSession, pauseSession, resumeSession, changeStage, endSession } = useSession();
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [showStreakHalo, setShowStreakHalo] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const isAppVisible = useAppVisibility();

  useEffect(() => {
    if (stageParam) {
      startSession(stageParam as SessionStage);
    }
  }, [stageParam]);

  useEffect(() => {
    if (scriptIdParam) {
      setScriptId(scriptIdParam);
    }
  }, [scriptIdParam]);

  // Handle record stage - redirect to shot list record
  useEffect(() => {
    const handleRecordStage = async () => {
      if (session.stage === "record") {
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
  }, [session.stage, scriptId, navigate, toast]);

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
    const result = await endSession();
    if (result) {
      setSummary(result);
      setShowSummary(true);
      
      // Show streak halo if achieved
      if (result.streakAchieved) {
        const newStreak = (result as any).newStreak;
        if (newStreak !== undefined) {
          setStreakCount(newStreak);
          setShowStreakHalo(true);
        }
      }
    }
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    setShowStreakHalo(false);
    navigate("/");
  };

  const handleEditingCompleted = async () => {
    toast({
      title: "🎉 Edição Concluída!",
      description: "Todas as etapas foram completadas com sucesso!",
    });
    await handleEnd();
  };

  // Timer popup - habilitado para TODAS as etapas
  const currentStage = STAGES.find(s => s.id === session.stage);
  const progress = (session.elapsedSeconds / (session.isStreakMode ? session.dailyGoalMinutes * 60 : 25 * 60)) * 100;

  const timerPopup = useTimerPopup({
    enabled: true,
    stage: currentStage?.label || "Sessão",
    icon: session.isStreakMode ? "Flame" : (currentStage?.iconName || "Lightbulb"),
    elapsedSeconds: session.elapsedSeconds,
    targetSeconds: session.targetSeconds,
    isPaused: session.isPaused,
    isStreakMode: session.isStreakMode,
    dailyGoalMinutes: session.dailyGoalMinutes,
    isActive: session.isActive,
    progress,
    onPause: pauseSession,
    onResume: resumeSession,
    onStop: handleEnd,
  });


  if (!session.isActive) {
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

  const CurrentIcon = currentStage!.icon;

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

  // If stage is "idea", show the brainstorm workspace
  if (session.stage === "idea") {
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

          <BrainstormWorkspace />
        </div>
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

        {/* Floating Draggable Timer Pop-up */}
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
          hidden={!isAppVisible}
        />

        {/* Script Editor */}
        <ScriptEditor scriptId={scriptId} isReviewMode={session.stage === "review"} />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/10 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className={cn(
          "p-8 backdrop-blur-md border-border/20 shadow-lg rounded-[28px] transition-all duration-1000",
          session.isStreakMode 
            ? "bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-600/10 border-orange-500/30" 
            : "bg-card/85"
        )}>
          {/* Timer Display */}
          <div className="text-center mb-8">
            <div className={cn(
              "w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg transition-all duration-1000",
              session.isStreakMode
                ? "bg-gradient-to-br from-orange-500 to-red-600 animate-wiggle"
                : "bg-gradient-to-br from-accent to-primary"
            )}>
              {session.isStreakMode ? (
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
              session.isStreakMode ? "text-orange-600" : "text-foreground"
            )}>
              {formatTime(session.elapsedSeconds)}
            </div>

            <div className={cn(
              "text-sm mb-2 transition-colors duration-1000",
              session.isStreakMode ? "text-orange-600/70" : "text-muted-foreground"
            )}>
              {session.isStreakMode 
                ? `🎯 Meta diária: ${formatTime(session.dailyGoalMinutes * 60)}`
                : `Meta: ${formatTime(25 * 60)}`}
            </div>

            <Progress 
              value={progress} 
              className={cn(
                "max-w-xs mx-auto mb-4 transition-all duration-500",
                session.isStreakMode && "bg-orange-200 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-red-600"
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
                  
                  {/* Botões de Navegação */}
                  <div className="pt-4 border-t border-border/20">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Navegação
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => changeStage("record")}
                        variant="outline"
                        className="h-14 flex flex-col items-center justify-center gap-1 hover:border-red-500/50 hover:bg-red-500/10"
                      >
                        <Video className="w-5 h-5 text-red-500" />
                        <span className="text-xs font-medium">Etapa Anterior</span>
                      </Button>
                      
                      <Button
                        onClick={() => navigate("/")}
                        variant="outline"
                        className="h-14 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-accent/10"
                      >
                        <Home className="w-5 h-5" />
                        <span className="text-xs font-medium">Home</span>
                      </Button>
                    </div>
                  </div>
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

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sessão Concluída! 🎉</DialogTitle>
            <DialogDescription>
              Você completou uma sessão criativa
            </DialogDescription>
          </DialogHeader>
          
          {summary && (
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">Tempo total</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatTime(summary.duration)}
                </p>
              </div>

              <div className="p-4 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">XP Ganho</p>
                <p className="text-2xl font-bold text-primary">
                  +{summary.xpGained} XP
                </p>
              </div>

              {summary.creativeMinutesToday && (
                <div className="p-4 bg-primary/10 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Minutos criativos hoje</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.floor(summary.creativeMinutesToday)} min
                  </p>
                </div>
              )}

              <Button
                onClick={handleCloseSummary}
                className="w-full bg-gradient-to-r from-primary to-accent"
              >
                Continuar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Streak Halo Effect */}
      <StreakHalo 
        show={showStreakHalo} 
        streakCount={streakCount}
        onComplete={() => setShowStreakHalo(false)}
      />
    </div>
  );
};

export default Session;
