import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useRef } from 'react';

export function usePWAUpdate() {
  const autoUpdateTriggeredRef = useRef(false);

  // Cleanup rogue competing service workers (e.g. firebase-messaging-sw.js registered separately)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const reg of registrations) {
        if (reg.active?.scriptURL?.includes('firebase-messaging-sw.js')) {
          console.log('[PWA] Removing competing firebase SW');
          reg.unregister();
        }
      }
    });
  }, []);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] SW registered:', swUrl);
      
      if (registration) {
        // Check for updates every 30 seconds (more aggressive)
        setInterval(() => {
          registration.update();
        }, 30 * 1000);
        
        // Check for updates when tab gains focus
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            console.log('[PWA] Tab focused, checking for updates...');
            registration.update();
          }
        });
      }
    },
    onRegisterError(error) {
      console.error('[PWA] SW registration error:', error);
    },
  });

  // Auto-update immediately when new version is detected
  useEffect(() => {
    if (needRefresh && !autoUpdateTriggeredRef.current) {
      autoUpdateTriggeredRef.current = true;
      console.log('[PWA] New version detected, forcing immediate update...');
      
      // Update immediately without delay
      updateServiceWorker(true);
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
