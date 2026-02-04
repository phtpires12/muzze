import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'timer-popup-activated';

interface TimerWindowActivatorProps {
  onActivate: () => void;
  hasOpenWindow: boolean;
  isSessionActive: boolean;
  className?: string;
}

/**
 * Button component that activates the timer popup window.
 * This must be triggered by a user click to ensure Chrome opens a proper popup window.
 */
export function TimerWindowActivator({
  onActivate,
  hasOpenWindow,
  isSessionActive,
  className,
}: TimerWindowActivatorProps) {
  const [isActivated, setIsActivated] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const activated = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsActivated(activated);
  }, []);

  // Update activation state when window is opened
  useEffect(() => {
    if (hasOpenWindow) {
      setIsActivated(true);
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, [hasOpenWindow]);

  const handleActivate = () => {
    onActivate();
    setIsActivated(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't show if:
  // - Session is not active
  // - Already has an open window
  // - User dismissed the prompt
  if (!isSessionActive || hasOpenWindow || isDismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-40",
        "bg-card/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-lg",
        "max-w-[320px] w-[calc(100%-2rem)]",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
        className
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="space-y-3">
        <div className="pr-6">
          <h4 className="text-sm font-medium text-foreground">
            Timer em Janela
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Clique para abrir a janela. Enquanto o timer estiver rodando, 
            ao trocar de aba ela será trazida para frente.
          </p>
        </div>
        
        <Button
          onClick={handleActivate}
          size="sm"
          className="w-full gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir Timer em Janela
        </Button>
      </div>
    </div>
  );
}

/**
 * Hook to manage timer popup activation state
 */
export function useTimerPopupActivation() {
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    const activated = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsActivated(activated);
  }, []);

  const activate = () => {
    setIsActivated(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const deactivate = () => {
    setIsActivated(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { isActivated, activate, deactivate };
}
