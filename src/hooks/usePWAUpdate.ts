import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useRef } from 'react';

export function usePWAUpdate() {
  const autoUpdateTriggeredRef = useRef(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] SW registered:', swUrl);
      // Check for updates every 60 seconds (less aggressive)
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] SW registration error:', error);
    },
  });

  // Auto-update when new version is detected
  useEffect(() => {
    if (needRefresh && !autoUpdateTriggeredRef.current) {
      autoUpdateTriggeredRef.current = true;
      console.log('[PWA] New version detected, auto-updating...');
      
      // Small delay to show the overlay
      setTimeout(() => {
        updateServiceWorker(true);
      }, 500);
    }
  }, [needRefresh, updateServiceWorker]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
    close,
  };
}
