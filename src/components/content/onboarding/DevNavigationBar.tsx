import { useState } from "react";
import { ChevronLeft, ChevronRight, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREENS_PER_PHASE } from "@/types/onboarding";

interface DevNavigationBarProps {
  phase: number;
  screen: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (phase: number, screen: number) => void;
}

export const DevNavigationBar = ({
  phase,
  screen,
  onPrev,
  onNext,
  onGoTo,
}: DevNavigationBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isFirst = phase === 0 && screen === 0;
  const isLast =
    phase === SCREENS_PER_PHASE.length - 1 &&
    screen === SCREENS_PER_PHASE[SCREENS_PER_PHASE.length - 1] - 1;

  // Calculate global screen index
  const globalIndex =
    SCREENS_PER_PHASE.slice(0, phase).reduce((s, c) => s + c, 0) + screen;
  const totalScreens = SCREENS_PER_PHASE.reduce((s, c) => s + c, 0);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-xs font-mono shadow-lg flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
      >
        <Navigation className="w-3 h-3" />
        P{phase} S{screen}
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-background/95 backdrop-blur-sm border border-primary/30 rounded-xl shadow-xl px-3 py-2 flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrev}
        disabled={isFirst}
        className="h-7 w-7 p-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <button
        onClick={() => setIsExpanded(false)}
        className="font-mono text-xs text-primary font-semibold min-w-[80px] text-center"
      >
        P{phase} S{screen} ({globalIndex + 1}/{totalScreens})
      </button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={isLast}
        className="h-7 w-7 p-0"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};
