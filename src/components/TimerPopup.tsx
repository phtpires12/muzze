import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, LucideIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerState {
  stage: string;
  icon: string;
  elapsedSeconds: number;
  targetSeconds: number | null;
  isPaused: boolean;
  isOvertime: boolean;
  isActive: boolean;
  progress: number;
}

export function TimerPopup() {
  const [timerState, setTimerState] = useState<TimerState>({
    stage: 'Edição',
    icon: 'Scissors',
    elapsedSeconds: 0,
    targetSeconds: null,
    isPaused: false,
    isOvertime: false,
    isActive: false,
    progress: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [mainWindowClosed, setMainWindowClosed] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel('session-timer');
    
    channel.onmessage = (event) => {
      const { type, ...data } = event.data;
      
      if (type === 'TIMER_UPDATE') {
        setTimerState(data);
        setIsConnected(true);
        setMainWindowClosed(false);
      } else if (type === 'MAIN_WINDOW_CLOSING') {
        setMainWindowClosed(true);
        // Close popup after 3 seconds
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };
    
    // Let main window know popup is ready
    channel.postMessage({ type: 'POPUP_READY' });
    
    // Check connection every 2 seconds
    const connectionCheck = setInterval(() => {
      if (isConnected) {
        channel.postMessage({ type: 'POPUP_PING' });
      }
    }, 2000);
    
    return () => {
      channel.close();
      clearInterval(connectionCheck);
    };
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    const channel = new BroadcastChannel('session-timer');
    channel.postMessage({ type: 'PAUSE_REQUEST' });
    channel.close();
  };

  const handleResume = () => {
    const channel = new BroadcastChannel('session-timer');
    channel.postMessage({ type: 'RESUME_REQUEST' });
    channel.close();
  };

  const handleStop = () => {
    const channel = new BroadcastChannel('session-timer');
    channel.postMessage({ type: 'STOP_REQUEST' });
    channel.close();
  };

  // Get icon component (simplified for popup)
  const getIconClass = () => {
    return timerState.icon;
  };

  if (mainWindowClosed) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-6">
        <Card className="p-8 text-center max-w-sm bg-card/95 backdrop-blur-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2 text-foreground">App Principal Fechado</h2>
          <p className="text-muted-foreground">
            Esta janela será fechada em instantes...
          </p>
        </Card>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-6">
        <Card className="p-8 text-center max-w-sm bg-card/95 backdrop-blur-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">Conectando Timer...</h2>
          <p className="text-sm text-muted-foreground">
            Sincronizando com o app principal
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-accent/10 via-background to-primary/10 p-6">
      <Card className={cn(
        "backdrop-blur-md border-border/20 shadow-2xl rounded-[28px] transition-all duration-300 max-w-md w-full",
        timerState.isOvertime 
          ? "bg-destructive/95 border-destructive animate-pulse" 
          : "bg-card/95"
      )}>
        {/* Header */}
        <div className={cn(
          "px-6 py-3 rounded-t-[28px] border-b border-border/20",
          timerState.isOvertime ? "bg-destructive/20" : "bg-primary/10"
        )}>
          <h1 className={cn(
            "text-sm font-semibold text-center",
            timerState.isOvertime ? "text-destructive-foreground" : "text-muted-foreground"
          )}>
            Timer - {timerState.stage}
          </h1>
        </div>

        {/* Timer Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            {/* Icon */}
            <div className={cn(
              "w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
              timerState.isOvertime
                ? "bg-destructive"
                : "bg-gradient-to-br from-accent to-primary"
            )}>
              {/* Using a placeholder icon - in real implementation would use the actual icon */}
              <div className={cn(
                "w-10 h-10",
                timerState.isOvertime ? "text-destructive-foreground" : "text-white"
              )}>✂️</div>
            </div>
            
            {/* Time Display */}
            <div className={cn(
              "text-5xl font-bold mb-3 tabular-nums transition-colors",
              timerState.isOvertime ? "text-destructive-foreground" : "text-foreground"
            )}>
              {formatTime(timerState.elapsedSeconds)}
            </div>

            {timerState.targetSeconds && (
              <div className={cn(
                "text-sm mb-2",
                timerState.isOvertime 
                  ? "text-destructive-foreground/70" 
                  : "text-muted-foreground"
              )}>
                {timerState.isOvertime 
                  ? "⏰ Tempo esgotado!"
                  : `Tempo sugerido: ${formatTime(timerState.targetSeconds)}`}
              </div>
            )}

            {timerState.targetSeconds && (
              <Progress 
                value={timerState.progress} 
                className={cn(
                  "max-w-xs mx-auto mb-4",
                  timerState.isOvertime && "bg-destructive-foreground/20"
                )}
              />
            )}
            
            {timerState.isPaused && (
              <p className={cn(
                "text-sm font-medium",
                timerState.isOvertime ? "text-destructive-foreground/70" : "text-muted-foreground"
              )}>
                ⏸️ Sessão pausada
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!timerState.isPaused ? (
              <Button
                onClick={handlePause}
                variant="outline"
                className="flex-1 h-12"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
            ) : (
              <Button
                onClick={handleResume}
                className="flex-1 h-12 bg-gradient-to-r from-primary to-accent"
              >
                <Play className="w-4 h-4 mr-2" />
                Retomar
              </Button>
            )}
            
            <Button
              onClick={handleStop}
              variant="destructive"
              className="flex-1 h-12"
            >
              <Square className="w-4 h-4 mr-2" />
              Finalizar
            </Button>
          </div>

          {/* Sync Status */}
          <div className="mt-6 pt-4 border-t border-border/20 text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Sincronizado com o app principal
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
