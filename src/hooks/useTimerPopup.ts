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

  // Initialize BroadcastChannel and popup
  useEffect(() => {
    if (!options.enabled || !options.isActive) return;

    // Reuse existing channel or create new one
    if (!globalChannelRef) {
      globalChannelRef = new BroadcastChannel('session-timer');
      
      // Listen for messages from popup
      globalChannelRef.onmessage = (event) => {
        const { type } = event.data;
        
        if (type === 'PAUSE_REQUEST') {
          options.onPause();
        } else if (type === 'RESUME_REQUEST') {
          options.onResume();
        } else if (type === 'STOP_REQUEST') {
          options.onStop();
        } else if (type === 'POPUP_READY') {
          // Send current state when popup is ready
          broadcastTimerUpdate();
        }
      };
    }
    
    channelRef.current = globalChannelRef;

    // Check if popup already exists and is open
    if (globalPopupRef && !globalPopupRef.closed) {
      // Popup already exists, just reuse it and update state
      popupRef.current = globalPopupRef;
      setIsPopupBlocked(false);
      broadcastTimerUpdate();
      return;
    }

    // Create new popup only if it doesn't exist
    const popupUrl = `${window.location.origin}/timer-popup.html`;
    const popup = window.open(
      popupUrl,
      'timer-popup',  // This name ensures only 1 window exists
      'width=450,height=400,left=100,top=100,resizable=yes'
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Popup was blocked
      setIsPopupBlocked(true);
      console.warn('Popup was blocked by browser');
    } else {
      globalPopupRef = popup;
      popupRef.current = popup;
      setIsPopupBlocked(false);
      
      // Show toast on first popup open
      if (!hasShownToastRef.current) {
        setTimeout(() => {
          toast({
            title: "✨ Timer em Nova Janela",
            description: "Acompanhe seu tempo enquanto edita no seu editor preferido!",
          });
          hasShownToastRef.current = true;
        }, 1000);
      }
    }

    // Don't clean up global references on unmount
    return () => {
      // Keep global channel and popup alive
    };
  }, [options.enabled, options.isActive]);

  // Broadcast timer updates
  const broadcastTimerUpdate = () => {
    if (!channelRef.current) return;

    const state: TimerPopupState = {
      stage: options.stage,
      icon: options.icon,
      elapsedSeconds: options.elapsedSeconds,
      targetSeconds: options.targetSeconds,
      isPaused: options.isPaused,
      isStreakMode: options.isStreakMode,
      dailyGoalMinutes: options.dailyGoalMinutes,
      isActive: options.isActive,
      progress: options.progress,
    };

    channelRef.current.postMessage({
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

  // Handle visibility change - manage popup display based on app visibility
  useEffect(() => {
    if (!options.enabled || !options.isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User SAIU do app → focar popup
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.focus();
        }
        // Avisar popup que janela principal está escondida
        channelRef.current?.postMessage({ type: 'MAIN_WINDOW_HIDDEN' });
      } else {
        // User VOLTOU pro app → minimizar popup
        channelRef.current?.postMessage({ type: 'MAIN_WINDOW_VISIBLE' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [options.enabled, options.isActive]);

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
