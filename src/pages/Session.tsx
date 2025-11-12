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
  ArrowLeft 
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

const STAGES: { id: SessionStage; label: string; icon: any; color: string }[] = [
  { id: "ideation", label: "Ideação", icon: Lightbulb, color: "text-yellow-500" },
  { id: "script", label: "Roteiro", icon: FileText, color: "text-blue-500" },
  { id: "review", label: "Revisão", icon: CheckCircle, color: "text-green-500" },
  { id: "record", label: "Gravação", icon: Video, color: "text-red-500" },
  { id: "edit", label: "Edição", icon: Scissors, color: "text-purple-500" },
];

const Session = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stageParam = searchParams.get("stage");
  const scriptIdParam = searchParams.get("scriptId");
  
  const [scriptId, setScriptId] = useState<string | undefined>(scriptIdParam || undefined);
  const { session, startSession, pauseSession, resumeSession, changeStage, endSession } = useSession();
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [showStreakHalo, setShowStreakHalo] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

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
      if (result.streakAchieved && result.newStreak) {
        setStreakCount(result.newStreak);
        setShowStreakHalo(true);
      }
    }
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    navigate("/");
  };

  if (!session.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/10 p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
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

  const currentStage = STAGES.find(s => s.id === session.stage)!;
  const CurrentIcon = currentStage.icon;

  // If stage is "record", redirect to shot list
  if (session.stage === "record" && scriptId) {
    navigate(`/shot-list?scriptId=${scriptId}`);
    return null;
  }

  // If stage is "script" or "review", show the script editor with floating timer
  if (session.stage === "script" || session.stage === "review") {
    const progress = session.targetSeconds 
      ? Math.min(100, (session.elapsedSeconds / session.targetSeconds) * 100)
      : 0;

    return (
      <div className="relative">
        {/* Floating Timer Pop-up */}
        <div className="fixed top-6 right-6 z-50">
          <Card className={cn(
            "p-4 backdrop-blur-md border-border/20 shadow-xl rounded-2xl transition-all duration-300",
            session.isOvertime 
              ? "bg-destructive/95 border-destructive animate-pulse" 
              : "bg-card/95"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                session.isOvertime
                  ? "bg-destructive-foreground/20"
                  : "bg-gradient-to-br from-accent to-primary"
              )}>
                <CurrentIcon className={cn(
                  "w-6 h-6",
                  session.isOvertime ? "text-destructive-foreground" : "text-white"
                )} />
              </div>
              
              <div className="min-w-[140px]">
                <div className={cn(
                  "text-sm",
                  session.isOvertime ? "text-destructive-foreground/80" : "text-muted-foreground"
                )}>
                  {currentStage.label}
                </div>
                <div className={cn(
                  "text-2xl font-bold tabular-nums",
                  session.isOvertime ? "text-destructive-foreground" : "text-foreground"
                )}>
                  {formatTime(session.elapsedSeconds)}
                </div>
                {session.targetSeconds && (
                  <div className={cn(
                    "text-xs",
                    session.isOvertime ? "text-destructive-foreground/70" : "text-muted-foreground"
                  )}>
                    {session.isOvertime ? "Tempo esgotado!" : `Meta: ${formatTime(session.targetSeconds)}`}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {!session.isPaused ? (
                  <Button
                    onClick={pauseSession}
                    variant={session.isOvertime ? "secondary" : "outline"}
                    size="sm"
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={resumeSession}
                    size="sm"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  onClick={handleEnd}
                  variant="destructive"
                  size="sm"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            {session.targetSeconds && (
              <Progress 
                value={progress} 
                className={cn(
                  "mt-3 h-1.5",
                  session.isOvertime && "bg-destructive-foreground/20"
                )}
              />
            )}
          </Card>
        </div>

        {/* Script Editor */}
        <ScriptEditor scriptId={scriptId} isReviewMode={session.stage === "review"} />
      </div>
    );
  }

  const progress = session.targetSeconds 
    ? Math.min(100, (session.elapsedSeconds / session.targetSeconds) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/10 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className={cn(
          "p-8 backdrop-blur-md border-border/20 shadow-lg rounded-[28px] transition-all duration-300",
          session.isOvertime 
            ? "bg-destructive/10 border-destructive/30" 
            : "bg-card/85"
        )}>
          {/* Timer Display */}
          <div className="text-center mb-8">
            <div className={cn(
              "w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
              session.isOvertime
                ? "bg-destructive animate-pulse"
                : "bg-gradient-to-br from-accent to-primary"
            )}>
              <CurrentIcon className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {currentStage.label}
            </h2>
            
            <div className={cn(
              "text-6xl font-bold mb-2 tabular-nums transition-colors",
              session.isOvertime ? "text-destructive" : "text-foreground"
            )}>
              {formatTime(session.elapsedSeconds)}
            </div>

            {session.targetSeconds && (
              <div className="text-sm text-muted-foreground mb-2">
                {session.isOvertime 
                  ? "⏰ Tempo esgotado!"
                  : `Tempo sugerido: ${formatTime(session.targetSeconds)}`}
              </div>
            )}

            {session.targetSeconds && (
              <Progress 
                value={progress} 
                className={cn(
                  "max-w-xs mx-auto mb-4",
                  session.isOvertime && "bg-destructive/20"
                )}
              />
            )}
            
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

          {/* Stage Selection */}
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
