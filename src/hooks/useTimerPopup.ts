import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

// Global references to ensure only one popup and one channel exist
let globalPopupRef: Window | null = null;
let globalChannelRef: BroadcastChannel | null = null;

interface TimerPopupState {
  stage: string;
  icon: string;
  elapsedSeconds: number;
  targetSeconds: number;
  isPaused: boolean;
  isStreakMode: boolean;
  dailyGoalMinutes: number;
  isActive: boolean;
  progress: number;
}

interface UseTimerPopupOptions {
  enabled: boolean;
  stage: string;
  icon: string;
  elapsedSeconds: number;
  targetSeconds: number;
  isPaused: boolean;
  isStreakMode: boolean;
  dailyGoalMinutes: number;
  isActive: boolean;
  progress: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function useTimerPopup(options: UseTimerPopupOptions) {
  const { toast } = useToast();
  const popupRef = useRef<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const hasShownToastRef = useRef(false);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);

  // Refs to avoid stale closures
  const optionsRef = useRef(options);
  const onPauseRef = useRef(options.onPause);
  const onResumeRef = useRef(options.onResume);
  const onStopRef = useRef(options.onStop);

  // Keep refs updated on every render
  useEffect(() => {
    optionsRef.current = options;
    onPauseRef.current = options.onPause;
    onResumeRef.current = options.onResume;
    onStopRef.current = options.onStop;
  });

  // Initialize BroadcastChannel (NOT popup - popup is created on demand)
  useEffect(() => {
    if (!options.enabled || !options.isActive) return;

    // Reuse existing channel or create new one
    if (!globalChannelRef) {
      globalChannelRef = new BroadcastChannel('session-timer');
      
      // Listen for messages from popup - ONLY set once!
      globalChannelRef.onmessage = (event) => {
        const { type } = event.data;
        
        if (type === 'PAUSE_REQUEST') {
          onPauseRef.current(); // Always use latest callback
        } else if (type === 'RESUME_REQUEST') {
          onResumeRef.current();
        } else if (type === 'STOP_REQUEST') {
          onStopRef.current();
        } else if (type === 'POPUP_READY') {
          // Send current state when popup is ready using refs
          if (globalChannelRef && optionsRef.current.isActive) {
            const opts = optionsRef.current;
            globalChannelRef.postMessage({
              type: 'TIMER_UPDATE',
              stage: opts.stage,
              icon: opts.icon,
              elapsedSeconds: opts.elapsedSeconds,
              targetSeconds: opts.targetSeconds,
              isPaused: opts.isPaused,
              isStreakMode: opts.isStreakMode,
              dailyGoalMinutes: opts.dailyGoalMinutes,
              isActive: opts.isActive,
              progress: opts.progress,
            });
          }
        }
      };
      
      channelRef.current = globalChannelRef;
    } else {
      // Channel already exists - reuse without overwriting onmessage
      channelRef.current = globalChannelRef;
    }

    // If popup already exists and is open, reuse it
    if (globalPopupRef && !globalPopupRef.closed) {
      popupRef.current = globalPopupRef;
      setIsPopupBlocked(false);
      broadcastTimerUpdate();
    }

    // ✅ Popup is NOT created here - only on demand when user leaves app

    return () => {
      // Keep global channel and popup alive
    };
  }, [options.enabled, options.isActive]);

  // Broadcast timer updates
  const broadcastTimerUpdate = () => {
    if (!globalChannelRef) return; // Use global ref directly

    const opts = optionsRef.current; // Always get latest version
    const state: TimerPopupState = {
      stage: opts.stage,
      icon: opts.icon,
      elapsedSeconds: opts.elapsedSeconds,
      targetSeconds: opts.targetSeconds,
      isPaused: opts.isPaused,
      isStreakMode: opts.isStreakMode,
      dailyGoalMinutes: opts.dailyGoalMinutes,
      isActive: opts.isActive,
      progress: opts.progress,
    };

    globalChannelRef.postMessage({
      type: 'TIMER_UPDATE',
      ...state,
    });
  };

  // Broadcast updates whenever timer state changes
  useEffect(() => {
    if (options.enabled && options.isActive) {
      broadcastTimerUpdate();
    }
  }, [
    options.enabled,
    options.isActive,
    options.elapsedSeconds,
    options.isPaused,
    options.isStreakMode,
    options.progress,
  ]);

  // Handle visibility change - create popup when user leaves app, close when returns
  useEffect(() => {
    if (!options.enabled || !options.isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User SAIU do app → criar popup se não existir
        if (!popupRef.current || popupRef.current.closed) {
          const popupUrl = `${window.location.origin}/timer-popup.html`;
          const popup = window.open(
            popupUrl,
            'timer-popup',
            'width=450,height=400,left=100,top=100,resizable=yes'
          );

          if (popup && !popup.closed) {
            globalPopupRef = popup;
            popupRef.current = popup;
            setIsPopupBlocked(false);
            
            // Show toast on first popup open
            if (!hasShownToastRef.current) {
              setTimeout(() => {
                toast({
                  title: "✨ Timer em Nova Janela",
                  description: "Acompanhe seu tempo enquanto trabalha em outros apps!",
                });
                hasShownToastRef.current = true;
              }, 1000);
            }
          } else {
            setIsPopupBlocked(true);
            console.warn('Popup was blocked by browser');
          }
        }
        
        // Focar popup (novo ou existente)
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.focus();
        }
        
        // Avisar popup que janela principal está escondida
        globalChannelRef?.postMessage({ type: 'MAIN_WINDOW_HIDDEN' });
      } else {
        // User VOLTOU pro app → fechar popup (Opção A)
        globalChannelRef?.postMessage({ type: 'MAIN_WINDOW_VISIBLE' });
        
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
          popupRef.current = null;
          globalPopupRef = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [options.enabled, options.isActive, toast]);

  // Cleanup when session ends (close global popup)
  useEffect(() => {
    if (!options.isActive && globalPopupRef && !globalPopupRef.closed) {
      // Session ended, close popup
      if (globalChannelRef) {
        globalChannelRef.postMessage({ type: 'MAIN_WINDOW_CLOSING' });
        globalChannelRef.close();
        globalChannelRef = null;
      }
      setTimeout(() => {
        globalPopupRef?.close();
        globalPopupRef = null;
        popupRef.current = null;
      }, 500);
    }
  }, [options.isActive]);

  const openPopupManually = () => {
    const popupUrl = `${window.location.origin}/timer-popup.html`;
    const popup = window.open(
      popupUrl,
      'timer-popup',
      'width=450,height=400,left=100,top=100,resizable=yes'
    );

    if (popup && !popup.closed) {
      globalPopupRef = popup;
      popupRef.current = popup;
      setIsPopupBlocked(false);
    }
  };

  return {
    isPopupBlocked,
    openPopupManually,
  };
}
