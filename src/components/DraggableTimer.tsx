import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, GripVertical, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DraggableTimerProps {
  elapsedTime: number;
  targetTime?: number;
  isRunning: boolean;
  onToggle: () => void;
  onStop: () => void;
  progress: number;
}

export const DraggableTimer = ({ 
  elapsedTime, 
  targetTime,
  isRunning, 
  onToggle,
  onStop,
  progress
}: DraggableTimerProps) => {
  const isMobile = useIsMobile();
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [safeAreaTop, setSafeAreaTop] = useState(0);
  const dragRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  // Detect iOS safe area on mount
  useEffect(() => {
    const computeSafeArea = () => {
      const computed = getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-inset-top')
        .trim();
      const safeArea = parseInt(computed.replace('px', '') || '0', 10);
      // Fallback mínimo de 20px para dispositivos iOS sem safe area detectável
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setSafeAreaTop(isIOS ? Math.max(safeArea, 20) : safeArea);
    };
    computeSafeArea();
    window.addEventListener('resize', computeSafeArea);
    return () => window.removeEventListener('resize', computeSafeArea);
  }, []);

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('draggable-timer-position');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure Y position respects safe area
        setPosition({
          ...parsed,
          y: Math.max(parsed.y, safeAreaTop + 16)
        });
      } catch (e) {
        console.error('Error loading timer position:', e);
      }
    } else if (safeAreaTop > 0) {
      // Set initial position below safe area
      setPosition(prev => ({
        ...prev,
        y: Math.max(prev.y, safeAreaTop + 16)
      }));
    }
  }, [safeAreaTop]);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('draggable-timer-position', JSON.stringify(position));
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
    e.preventDefault(); // Prevenir scroll ao iniciar drag
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

      // Prevenir scroll durante o arraste
      if ('touches' in e) {
        e.preventDefault();
      }

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const newX = clientX - startPos.current.x;
      const newY = clientY - startPos.current.y;

      // Constrain to viewport bounds (ajustado para mobile)
      const timerWidth = isMobile ? 280 : 340;
      const timerHeight = isMobile ? 120 : 150;
      const maxX = window.innerWidth - timerWidth;
      const maxY = window.innerHeight - timerHeight;

      // Minimum Y respects iOS safe area (Dynamic Island)
      const minY = safeAreaTop + 8;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY))
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
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
        "backdrop-blur-md bg-card/95 border-border/20 shadow-xl rounded-2xl transition-all duration-300",
        isMobile && "rounded-xl"
      )}>
        {/* Drag Handle */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-2 bg-primary/10 cursor-grab active:cursor-grabbing",
            isMobile ? "rounded-t-xl py-1.5" : "rounded-t-2xl"
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <span className={cn(
            "font-semibold text-muted-foreground",
            isMobile ? "text-xs" : "text-xs"
          )}>
            Gravação
          </span>
          <GripVertical className={cn(
            "text-muted-foreground",
            isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
          )} />
        </div>

        {/* Timer Content */}
        <div className={cn(isMobile ? "p-3" : "p-4")}>
          {isMobile ? (
            // Layout compacto para mobile
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground tabular-nums">
                      {formatTime(elapsedTime)}
                    </div>
                    {targetTime && (
                      <div className="text-[10px] text-muted-foreground leading-none">
                        Meta: {formatTime(targetTime)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {!isRunning ? (
                    <Button
                      onClick={onToggle}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={onToggle}
                      variant="default"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    onClick={onStop}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Progress bar mobile */}
              {targetTime && (
                <Progress 
                  value={progress} 
                  className="h-1"
                />
              )}
            </div>
          ) : (
            // Layout desktop (original)
            <div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                
                <div className="min-w-[140px]">
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {formatTime(elapsedTime)}
                  </div>
                  {targetTime && (
                    <div className="text-xs text-muted-foreground">
                      Meta: {formatTime(targetTime)}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {!isRunning ? (
                    <Button
                      onClick={onToggle}
                      variant="outline"
                      size="sm"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={onToggle}
                      variant="default"
                      size="sm"
                    >
                      <Pause className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={onStop}
                    variant="outline"
                    size="sm"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Progress bar desktop */}
              {targetTime && (
                <Progress 
                  value={progress} 
                  className="mt-3 h-1.5"
                />
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
