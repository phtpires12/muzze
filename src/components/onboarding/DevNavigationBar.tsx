import { useState } from "react";
import { ChevronLeft, ChevronRight, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface DevNavigationBarProps {
  phase: number;
  screen: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (phase: number, screen: number) => void;
}

export function DevNavigationBar({ phase, screen, onPrev, onNext, onGoTo }: DevNavigationBarProps) {
  const [showJump, setShowJump] = useState(false);
  const [jumpPhase, setJumpPhase] = useState(phase);
  const [jumpScreen, setJumpScreen] = useState(screen);

  const handleJump = () => {
    onGoTo(jumpPhase, jumpScreen);
    setShowJump(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2">
      {showJump && (
        <div className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-md border border-primary/20 rounded-xl shadow-lg">
          <label className="text-xs text-muted-foreground">P</label>
          <input
            type="number"
            min={0}
            value={jumpPhase}
            onChange={(e) => setJumpPhase(Number(e.target.value))}
            className="w-12 h-7 text-center text-xs rounded-md border border-input bg-background"
          />
          <label className="text-xs text-muted-foreground">S</label>
          <input
            type="number"
            min={0}
            value={jumpScreen}
            onChange={(e) => setJumpScreen(Number(e.target.value))}
            className="w-12 h-7 text-center text-xs rounded-md border border-input bg-background"
          />
          <button
            onClick={handleJump}
            className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md"
          >
            Ir
          </button>
        </div>
      )}

      <div className="flex items-center gap-1 px-2 py-1.5 bg-background/90 backdrop-blur-md border border-primary/20 rounded-full shadow-lg">
        <button
          onClick={onPrev}
          className="p-1.5 rounded-full hover:bg-primary/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-primary" />
        </button>

        <button
          onClick={() => {
            setJumpPhase(phase);
            setJumpScreen(screen);
            setShowJump(!showJump);
          }}
          className="px-2 py-0.5 text-xs font-mono font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
        >
          P{phase} S{screen}
        </button>

        <button
          onClick={onNext}
          className="p-1.5 rounded-full hover:bg-primary/10 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-primary" />
        </button>
      </div>
    </div>
  );
}
