import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, GripVertical, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableSessionTimerProps {
  stage: string;
  icon: LucideIcon;
  elapsedSeconds: number;
  targetSeconds?: number;
  isOvertime: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  progress: number;
}

export const DraggableSessionTimer = ({ 
  stage,
  icon: Icon,
  elapsedSeconds,
  targetSeconds,
  isOvertime,
  isPaused,
  onPause,
  onResume,
  onStop,
  progress
}: DraggableSessionTimerProps) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 370, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('session-timer-position');
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading timer position:', e);
      }
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('session-timer-position', JSON.stringify(position));
  }, [position]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    startPos.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const newX = clientX - startPos.current.x;
      const newY = clientY - startPos.current.y;

      // Constrain to viewport bounds
      const maxX = window.innerWidth - 340;
      const maxY = window.innerHeight - 150;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  return (
    <div
      ref={dragRef}
      className={cn(
        "fixed z-50 transition-shadow duration-200",
        isDragging && "shadow-2xl ring-2 ring-primary/50"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <Card className={cn(
        "backdrop-blur-md border-border/20 shadow-xl rounded-2xl transition-all duration-300",
        isOvertime 
          ? "bg-destructive/95 border-destructive animate-pulse" 
          : "bg-card/95"
      )}>
        {/* Drag Handle */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-2 rounded-t-2xl cursor-grab active:cursor-grabbing",
            isOvertime ? "bg-destructive/20" : "bg-primary/10"
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <span className={cn(
            "text-xs font-semibold",
            isOvertime ? "text-destructive-foreground/80" : "text-muted-foreground"
          )}>
            {stage}
          </span>
          <GripVertical className={cn(
            "w-4 h-4",
            isOvertime ? "text-destructive-foreground/60" : "text-muted-foreground"
          )} />
        </div>

        {/* Timer Content */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
              isOvertime
                ? "bg-destructive-foreground/20"
                : "bg-gradient-to-br from-accent to-primary"
            )}>
              <Icon className={cn(
                "w-6 h-6",
                isOvertime ? "text-destructive-foreground" : "text-white"
              )} />
            </div>
            
            <div className="min-w-[140px]">
              <div className={cn(
                "text-2xl font-bold tabular-nums",
                isOvertime ? "text-destructive-foreground" : "text-foreground"
              )}>
                {formatTime(elapsedSeconds)}
              </div>
              {targetSeconds && (
                <div className={cn(
                  "text-xs",
                  isOvertime ? "text-destructive-foreground/70" : "text-muted-foreground"
                )}>
                  {isOvertime ? "Tempo esgotado!" : `Meta: ${formatTime(targetSeconds)}`}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {!isPaused ? (
                <Button
                  onClick={onPause}
                  variant={isOvertime ? "secondary" : "outline"}
                  size="sm"
                >
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={onResume}
                  variant={isOvertime ? "secondary" : "default"}
                  size="sm"
                >
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={onStop}
                variant={isOvertime ? "secondary" : "outline"}
                size="sm"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          {targetSeconds && (
            <Progress 
              value={progress} 
              className={cn(
                "mt-3 h-1.5",
                isOvertime && "bg-destructive-foreground/20"
              )}
            />
          )}
        </div>
      </Card>
    </div>
  );
};
