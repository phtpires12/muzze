import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableTimerProps {
  elapsedTime: number;
  isRunning: boolean;
  onToggle: () => void;
  scriptGoal?: string;
}

export const DraggableTimer = ({ 
  elapsedTime, 
  isRunning, 
  onToggle,
  scriptGoal 
}: DraggableTimerProps) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('draggable-timer-position');
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
    localStorage.setItem('draggable-timer-position', JSON.stringify(position));
  }, [position]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      const maxX = window.innerWidth - 200; // timer width
      const maxY = window.innerHeight - 120; // timer height

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
        "fixed bg-card border-2 border-primary/20 rounded-lg shadow-2xl z-50",
        "min-w-[180px] max-w-[200px]",
        isDragging && "cursor-grabbing shadow-2xl ring-2 ring-primary/50"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Drag Handle */}
      <div
        className="flex items-center justify-between p-2 bg-primary/10 rounded-t-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <span className="text-xs font-semibold text-muted-foreground">Roteiro</span>
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Timer Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-primary font-mono">
            {formatTime(elapsedTime)}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            {isRunning ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>
        {scriptGoal && (
          <div className="text-xs text-muted-foreground">
            Meta: {scriptGoal}
          </div>
        )}
      </div>
    </div>
  );
};
