import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  GripVertical, 
  Lightbulb, 
  FileText, 
  Video, 
  Scissors, 
  CheckCircle,
  Flame,
  LucideIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

const ICON_MAP: Record<string, LucideIcon> = {
  Lightbulb,
  FileText,
  Video,
  Scissors,
  CheckCircle,
  Flame,
};

interface DraggableSessionTimerProps {
  stage: string;
  icon: string;
  elapsedSeconds: number;
  targetSeconds: number;
  isStreakMode: boolean;
  dailyGoalMinutes: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  progress: number;
  hidden?: boolean;
  isPopup?: boolean; // When true, render as centered popup (no drag, no fixed position)
  todayMinutesFromDB?: number; // Minutos já acumulados hoje (do banco de dados)
  permissionEnabled?: boolean; // When false, timer is not rendered (permission denied)
  savedSecondsThisSession?: number; // Segundos já salvos no banco NESTA sessão (evita contagem dupla)
}

export const DraggableSessionTimer = ({ 
  stage,
  icon,
  elapsedSeconds,
  targetSeconds,
  isStreakMode,
  dailyGoalMinutes,
  isPaused,
  onPause,
  onResume,
  onStop,
  progress,
  hidden = false,
  isPopup = false,
  todayMinutesFromDB = 0,
  permissionEnabled = true,
  savedSecondsThisSession = 0,
}: DraggableSessionTimerProps) => {
  const isMobile = useIsMobile();
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const { playSound, preloadSounds } = useSoundEffects(0.6);

  // Preload sounds on mount
  useEffect(() => {
    preloadSounds();
  }, [preloadSounds]);

  const handlePause = useCallback(() => {
    playSound('pause');
    onPause();
  }, [playSound, onPause]);

  const handleResume = useCallback(() => {
    playSound('resume');
    onResume();
  }, [playSound, onResume]);

  const handleConfirmEnd = useCallback(() => {
    playSound('complete');
    setShowEndConfirmation(false);
    onStop();
  }, [playSound, onStop]);

  const [position, setPosition] = useState({
    x: isMobile ? 16 : window.innerWidth - 370, 
    y: isMobile ? 16 : 24 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [safeAreaTop, setSafeAreaTop] = useState(0);
  const dragRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  // Pinch-to-resize state (mobile only)
  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const initialPinchDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 1.2;

  // Helper to calculate distance between two touch points
  const getDistance = (touches: TouchList | React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Load saved scale from localStorage (mobile only)
  useEffect(() => {
    if (!isMobile) return;
    const savedScale = localStorage.getItem('session-timer-scale');
    if (savedScale) {
      const parsed = parseFloat(savedScale);
      if (!isNaN(parsed) && parsed >= MIN_SCALE && parsed <= MAX_SCALE) {
        setScale(parsed);
      }
    }
  }, [isMobile]);

  // Save scale to localStorage when it changes
  useEffect(() => {
    if (isMobile && scale !== 1) {
      localStorage.setItem('session-timer-scale', scale.toString());
    }
  }, [scale, isMobile]);

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
    const saved = localStorage.getItem('session-timer-position');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure Y position respects safe area on mobile
        if (isMobile && safeAreaTop > 0) {
          setPosition({
            ...parsed,
            y: Math.max(parsed.y, safeAreaTop + 16)
          });
        } else {
          setPosition(parsed);
        }
      } catch (e) {
        console.error('Error loading timer position:', e);
      }
    } else if (isMobile && safeAreaTop > 0) {
      // Set initial position below safe area
      setPosition(prev => ({
        ...prev,
        y: Math.max(prev.y, safeAreaTop + 16)
      }));
    }
  }, [safeAreaTop, isMobile]);

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

  const Icon = isStreakMode ? ICON_MAP['Flame'] : (ICON_MAP[icon] || ICON_MAP['Lightbulb']);
  const displayedTarget = isStreakMode ? dailyGoalMinutes * 60 : 25 * 60;
  
  // Calcular tempo restante para a meta diária
  // CORREÇÃO: Subtrair tempo já salvo desta sessão para evitar contagem dupla
  // todayMinutesFromDB já inclui o tempo que foi salvo (auto-save), então precisamos
  // considerar apenas o tempo ainda não salvo: elapsedSeconds - savedSecondsThisSession
  const goalSeconds = dailyGoalMinutes * 60;
  const alreadyDoneSeconds = todayMinutesFromDB * 60;
  const unsavedElapsedSeconds = Math.max(0, elapsedSeconds - savedSecondsThisSession);
  const totalWithCurrentSession = alreadyDoneSeconds + unsavedElapsedSeconds;
  const remainingSeconds = goalSeconds - totalWithCurrentSession;
  
  // Modo bônus: meta diária atingida (só ativa se NÃO estiver em streak mode)
  const isBonusMode = remainingSeconds <= 0 && !isStreakMode;
  
  // Gerar texto dinâmico baseado no progresso
  let goalText: string;
  if (remainingSeconds > 0) {
    goalText = `Falta: ${formatTime(remainingSeconds)}`;
  } else {
    const bonusSeconds = Math.abs(remainingSeconds);
    goalText = `🔥 Bônus: +${formatTime(bonusSeconds)} além da meta`;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture detected - NOT drag
      e.preventDefault();
      setIsPinching(true);
      setIsDragging(false);
      initialPinchDistance.current = getDistance(e.touches);
      initialScale.current = scale;
    } else if (e.touches.length === 1) {
      // Normal drag (1 finger)
      setIsDragging(true);
      setIsPinching(false);
      const touch = e.touches[0];
      startPos.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      };
    }
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      // Handle pinch resize (2 fingers on touch)
      if ('touches' in e && e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        if (initialPinchDistance.current && currentDistance > 0) {
          const scaleChange = currentDistance / initialPinchDistance.current;
          const newScale = initialScale.current * scaleChange;
          setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)));
        }
        return;
      }

      if (!isDragging) return;

      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;

      if (clientX === undefined || clientY === undefined) return;

      const newX = clientX - startPos.current.x;
      const newY = clientY - startPos.current.y;

      // Constrain to viewport bounds - consider scale for mobile
      const baseWidth = isMobile ? 280 : 340;
      const baseHeight = isMobile ? 120 : 150;
      const scaledWidth = isMobile ? baseWidth * scale : baseWidth;
      const scaledHeight = isMobile ? baseHeight * scale : baseHeight;
      const maxX = window.innerWidth - scaledWidth - 16;
      const maxY = window.innerHeight - scaledHeight - 16;

      // Minimum Y respects iOS safe area (Dynamic Island) on mobile
      const minY = isMobile ? safeAreaTop + 8 : 0;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY))
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
      setIsPinching(false);
      initialPinchDistance.current = null;
    };

    if (isDragging || isPinching) {
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
  }, [isDragging, isPinching, scale, isMobile, safeAreaTop]);

  // Don't render when hidden (user is outside app) or permission denied
  // Moved here to respect Rules of Hooks
  if (hidden || !permissionEnabled) return null;

  // Popup mode: centered, no dragging, no fixed positioning
  if (isPopup) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <Card className={cn(
          "backdrop-blur-md border-border/20 shadow-xl rounded-2xl transition-all duration-1000 w-full max-w-md",
          isStreakMode 
            ? "bg-gradient-to-br from-orange-500/95 via-red-500/95 to-orange-600/95 border-orange-500 animate-pulse"
            : isBonusMode
              ? "bg-gradient-to-br from-orange-400/90 via-purple-500/90 to-violet-600/90 border-purple-400"
              : "bg-card/95"
        )}>
          {/* Timer Content */}
          <div className="p-6">
            <div className="text-center mb-4">
              <span className={cn(
                "font-semibold text-sm transition-colors duration-1000",
                isStreakMode ? "text-orange-100/80" : isBonusMode ? "text-purple-100/80" : "text-muted-foreground"
              )}>
                {stage}
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-6">
              {/* Icon */}
              <div className={cn(
                "rounded-full flex items-center justify-center shadow-lg transition-all duration-1000 w-20 h-20",
                isStreakMode
                  ? "bg-orange-100/20 animate-wiggle"
                  : isBonusMode
                    ? "bg-white/20"
                    : "bg-gradient-to-br from-accent to-primary"
              )}>
                <Icon className={cn(
                  "transition-colors duration-1000 w-10 h-10",
                  isStreakMode ? "text-orange-100" : isBonusMode ? "text-white" : "text-white"
                )} />
              </div>
              
              {/* Time Display */}
              <div className="text-center">
                <div className={cn(
                  "font-bold tabular-nums text-5xl transition-colors duration-1000",
                  isStreakMode ? "text-orange-100" : isBonusMode ? "text-white" : "text-foreground"
                )}>
                  {formatTime(elapsedSeconds)}
                </div>
                <div className={cn(
                  "mt-2 text-sm transition-colors duration-1000",
                  isStreakMode ? "text-orange-100/70" : isBonusMode ? "text-purple-100/70" : "text-muted-foreground"
                )}>
                  {goalText}
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-3">
                {!isPaused ? (
                  <Button
                    onClick={handlePause}
                    variant={isStreakMode ? "secondary" : "outline"}
                    size="lg"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Pausar
                  </Button>
                ) : (
                  <Button
                    onClick={handleResume}
                    variant={isStreakMode ? "secondary" : "default"}
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Retomar
                  </Button>
                )}
                <Button
                  onClick={() => setShowEndConfirmation(true)}
                  variant={isStreakMode ? "secondary" : "outline"}
                  size="lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Finalizar
                </Button>
              </div>

              {/* Confirmation Dialog */}
              <AlertDialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ao encerrar, seu tempo será salvo e você será redirecionado para a tela inicial.
                      Tem certeza que deseja finalizar sua sessão criativa?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Continuar trabalhando</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmEnd}>
                      Sim, encerrar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Progress bar */}
              <Progress 
                value={(elapsedSeconds / displayedTarget) * 100} 
                className={cn(
                  "w-full h-2 transition-all duration-500",
                  isStreakMode && "bg-orange-200 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-red-600",
                  isBonusMode && "bg-purple-200 [&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-purple-500"
                )}
              />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Normal mode: draggable, fixed position
  return (
    <div
      ref={dragRef}
      className={cn(
        "fixed z-50 transition-shadow duration-200",
        isDragging && "shadow-2xl ring-2 ring-primary/50",
        isPinching && "ring-2 ring-accent/50"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isMobile ? `scale(${scale})` : 'none',
        transformOrigin: 'top left',
      }}
    >
      {/* Scale indicator while pinching */}
      {isPinching && isMobile && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
          {Math.round(scale * 100)}%
        </div>
      )}
      <Card className={cn(
        "backdrop-blur-md border-border/20 shadow-xl rounded-2xl transition-all duration-1000",
        isStreakMode 
          ? "bg-gradient-to-br from-orange-500/95 via-red-500/95 to-orange-600/95 border-orange-500 animate-pulse"
          : isBonusMode
            ? "bg-gradient-to-br from-orange-400/90 via-purple-500/90 to-violet-600/90 border-purple-400"
            : "bg-card/95",
        isMobile ? "w-[280px]" : "w-auto"
      )}>
        {/* Drag Handle - Compacto em mobile */}
        <div
          className={cn(
            "flex items-center justify-between rounded-t-2xl cursor-grab active:cursor-grabbing transition-all duration-1000",
            isStreakMode ? "bg-orange-500/20" : isBonusMode ? "bg-purple-500/20" : "bg-primary/10",
            isMobile ? "px-3 py-1.5" : "px-4 py-2"
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <span className={cn(
            "font-semibold transition-colors duration-1000",
            isStreakMode ? "text-orange-100/80" : isBonusMode ? "text-purple-100/80" : "text-muted-foreground",
            isMobile ? "text-[10px]" : "text-xs"
          )}>
            {stage}
          </span>
          <GripVertical className={cn(
            "transition-colors duration-1000",
            isStreakMode ? "text-orange-100/60" : isBonusMode ? "text-purple-100/60" : "text-muted-foreground",
            isMobile ? "w-3 h-3" : "w-4 h-4"
          )} />
        </div>

        {/* Timer Content - Layout compacto em mobile */}
        <div className={cn(isMobile ? "p-3" : "p-4")}>
          <div className={cn(
            "flex items-center",
            isMobile ? "gap-2" : "gap-4"
          )}>
            {/* Icon - Menor em mobile */}
            <div className={cn(
              "rounded-full flex items-center justify-center shadow-lg flex-shrink-0 transition-all duration-1000",
              isStreakMode
                ? "bg-orange-100/20 animate-wiggle"
                : isBonusMode
                  ? "bg-white/20"
                  : "bg-gradient-to-br from-accent to-primary",
              isMobile ? "w-10 h-10" : "w-12 h-12"
            )}>
              <Icon className={cn(
                "transition-colors duration-1000",
                isStreakMode ? "text-orange-100" : isBonusMode ? "text-white" : "text-white",
                isMobile ? "w-5 h-5" : "w-6 h-6"
              )} />
            </div>
            
            <div className={cn(isMobile ? "min-w-[100px]" : "min-w-[140px]")}>
              <div className={cn(
                "font-bold tabular-nums transition-colors duration-1000",
                isStreakMode ? "text-orange-100" : isBonusMode ? "text-white" : "text-foreground",
                isMobile ? "text-xl" : "text-2xl"
              )}>
                {formatTime(elapsedSeconds)}
              </div>
              <div className={cn(
                "transition-colors duration-1000",
                isStreakMode ? "text-orange-100/70" : isBonusMode ? "text-purple-100/70" : "text-muted-foreground",
                isMobile ? "text-[10px]" : "text-xs"
              )}>
                {goalText}
              </div>
            </div>

            {/* Controls - Mais compactos em mobile */}
            <TooltipProvider delayDuration={300}>
              <div className={cn(
                "flex gap-2",
                isMobile ? "flex-row" : "flex-col"
              )}>
                {!isPaused ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handlePause}
                        variant={isStreakMode ? "secondary" : "outline"}
                        size={isMobile ? "icon" : "sm"}
                        className={cn(isMobile && "h-8 w-8")}
                      >
                        <Pause className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Pausar sessão</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleResume}
                        variant={isStreakMode ? "secondary" : "default"}
                        size={isMobile ? "icon" : "sm"}
                        className={cn(isMobile && "h-8 w-8")}
                      >
                        <Play className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Retomar sessão</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowEndConfirmation(true)}
                      variant={isStreakMode ? "secondary" : "outline"}
                      size={isMobile ? "icon" : "sm"}
                      className={cn(isMobile && "h-8 w-8")}
                    >
                      <Square className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Encerrar sessão</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            {/* Confirmation Dialog */}
            <AlertDialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ao encerrar, seu tempo será salvo e você será redirecionado para a tela inicial.
                    Tem certeza que deseja finalizar sua sessão criativa?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continuar trabalhando</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmEnd}>
                    Sim, encerrar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Progress bar - Mais fino em mobile */}
          <Progress 
            value={(elapsedSeconds / displayedTarget) * 100} 
            className={cn(
              "transition-all duration-500",
              isStreakMode && "bg-orange-200 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-red-600",
              isBonusMode && "bg-purple-200 [&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-purple-500",
              isMobile ? "mt-2 h-1" : "mt-3 h-1.5"
            )}
          />
        </div>
      </Card>
    </div>
  );
};
