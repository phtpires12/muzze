import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CHECK_INTERVAL_MS = 60 * 1000; // Verificar a cada 60 segundos
const LOCAL_VERSION_KEY = 'muzze_app_version';
const LAST_CHECK_KEY = 'muzze_last_version_check';

interface VersionCheckResult {
  isUpdating: boolean;
  checkNow: () => Promise<void>;
}

export function useVersionCheck(): VersionCheckResult {
  const [isUpdating, setIsUpdating] = useState(false);
  const checkInProgressRef = useRef(false);
  const initialCheckDoneRef = useRef(false);

  const clearAllCaches = async (): Promise<void> => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[VersionCheck] All caches cleared');
      } catch (error) {
        console.error('[VersionCheck] Error clearing caches:', error);
      }
    }
  };

  const unregisterServiceWorkers = async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('[VersionCheck] All service workers unregistered');
      } catch (error) {
        console.error('[VersionCheck] Error unregistering service workers:', error);
      }
    }
  };

  const forceUpdate = async (): Promise<void> => {
    setIsUpdating(true);
    console.log('[VersionCheck] Starting forced update...');

    try {
      // 1. Limpar todos os caches
      await clearAllCaches();

      // 2. Desregistrar service workers
      await unregisterServiceWorkers();

      // 3. Limpar storage de versão para evitar loops
      localStorage.removeItem(LOCAL_VERSION_KEY);
      localStorage.removeItem(LAST_CHECK_KEY);
      localStorage.removeItem('muzze_build_version');

      // 4. Pequeno delay para garantir que tudo foi limpo
      await new Promise(resolve => setTimeout(resolve, 500));

      // 5. Recarregar a página forçando busca no servidor
      console.log('[VersionCheck] Reloading page...');
      window.location.reload();
    } catch (error) {
      console.error('[VersionCheck] Error during forced update:', error);
      // Mesmo com erro, tentar recarregar
      window.location.reload();
    }
  };

  const checkVersion = useCallback(async (): Promise<void> => {
    // Evitar verificações simultâneas
    if (checkInProgressRef.current) {
      return;
    }

    checkInProgressRef.current = true;

    try {
      // Buscar versão do servidor (edge function)
      const { data, error } = await supabase.functions.invoke('app-version');

      if (error) {
        console.error('[VersionCheck] Error fetching version:', error);
        return;
      }

      const remoteVersion = data?.version;
      if (!remoteVersion) {
        console.warn('[VersionCheck] No version returned from server');
        return;
      }

      const localVersion = localStorage.getItem(LOCAL_VERSION_KEY);
      
      console.log('[VersionCheck] Local version:', localVersion);
      console.log('[VersionCheck] Remote version:', remoteVersion);

      // Se não há versão local, salvar a atual (primeira vez)
      if (!localVersion) {
        localStorage.setItem(LOCAL_VERSION_KEY, remoteVersion);
        localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
        console.log('[VersionCheck] First check, saving version');
        return;
      }

      // Se a versão mudou, forçar atualização
      if (localVersion !== remoteVersion) {
        console.log('[VersionCheck] Version mismatch detected! Forcing update...');
        
        // Salvar nova versão ANTES de atualizar para evitar loops
        localStorage.setItem(LOCAL_VERSION_KEY, remoteVersion);
        
        await forceUpdate();
        return;
      }

      // Atualizar timestamp da última verificação
      localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

    } catch (error) {
      console.error('[VersionCheck] Error during version check:', error);
    } finally {
      checkInProgressRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Verificar na inicialização (com pequeno delay para não bloquear renderização)
    const initialTimeout = setTimeout(() => {
      if (!initialCheckDoneRef.current) {
        initialCheckDoneRef.current = true;
        checkVersion();
      }
    }, 2000);

    // Configurar verificação periódica
    const intervalId = setInterval(checkVersion, CHECK_INTERVAL_MS);

    // Verificar quando a aba volta a ficar visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
        const now = Date.now();
        
        // Se passou mais de 30 segundos desde última verificação
        if (!lastCheck || now - parseInt(lastCheck) > 30000) {
          checkVersion();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkVersion]);

  return {
    isUpdating,
    checkNow: checkVersion,
  };
}
