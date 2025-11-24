import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

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

    // Create BroadcastChannel
    const channel = new BroadcastChannel('session-timer');
    channelRef.current = channel;

    // Listen for messages from popup
    channel.onmessage = (event) => {
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

    // Try to create popup
    const popupUrl = `${window.location.origin}/timer-popup.html`;
    const popup = window.open(
      popupUrl,
      'timer-popup',
      'width=450,height=400,left=100,top=100,resizable=yes'
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Popup was blocked
      setIsPopupBlocked(true);
      console.warn('Popup was blocked by browser');
    } else {
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

    return () => {
      channel.close();
      channelRef.current = null;
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

  // Handle visibility change - focus popup when user leaves
  useEffect(() => {
    if (!options.enabled || !options.isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden && popupRef.current && !popupRef.current.closed) {
        // User left the app, bring popup to front
        popupRef.current.focus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [options.enabled, options.isActive]);

  // Cleanup when session ends
  useEffect(() => {
    if (!options.isActive && popupRef.current && !popupRef.current.closed) {
      // Session ended, close popup
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'MAIN_WINDOW_CLOSING' });
      }
      setTimeout(() => {
        popupRef.current?.close();
        popupRef.current = null;
      }, 500);
    }
  }, [options.isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'MAIN_WINDOW_CLOSING' });
        channelRef.current.close();
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  const openPopupManually = () => {
    const popupUrl = `${window.location.origin}/timer-popup.html`;
    const popup = window.open(
      popupUrl,
      'timer-popup',
      'width=450,height=400,left=100,top=100,resizable=yes'
    );

    if (popup && !popup.closed) {
      popupRef.current = popup;
      setIsPopupBlocked(false);
    }
  };

  return {
    isPopupBlocked,
    openPopupManually,
  };
}
