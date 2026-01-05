import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { useSessionContext } from "@/contexts/SessionContext";

interface UseNavigationBlockerOptions {
  /**
   * Callback executado quando navegação é bloqueada (swipe, browser back, etc)
   */
  onNavigationBlocked: () => void;
  /**
   * Condição adicional para bloquear (opcional, default: true)
   */
  shouldBlock?: boolean;
}

/**
 * Hook para interceptar navegação via swipe gestures no iOS e browser back button.
 * Usa o useBlocker do React Router v6 para capturar navegações antes que ocorram.
 * 
 * Quando a navegação é bloqueada, executa o callback fornecido (geralmente mostra um modal).
 * O componente pai deve chamar blocker.proceed() para prosseguir ou blocker.reset() para cancelar.
 */
export const useNavigationBlocker = ({ 
  onNavigationBlocked, 
  shouldBlock = true 
}: UseNavigationBlockerOptions) => {
  const { timer } = useSessionContext();
  
  // Usar ref para manter o callback estável e evitar re-renders
  const callbackRef = useRef(onNavigationBlocked);
  
  // Atualizar ref quando callback mudar (sem causar re-render do blocker)
  useEffect(() => {
    callbackRef.current = onNavigationBlocked;
  }, [onNavigationBlocked]);
  
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      // Só bloquear se:
      // 1. Há sessão ativa
      // 2. shouldBlock é true
      // 3. A navegação é para uma rota diferente
      const isNavigatingAway = currentLocation.pathname !== nextLocation.pathname;
      
      return (
        timer.isActive && 
        shouldBlock && 
        isNavigatingAway
      );
    }
  );
  
  // Quando bloqueado, executar o callback via ref (dependência estável)
  useEffect(() => {
    if (blocker.state === "blocked") {
      callbackRef.current();
    }
  }, [blocker.state]);
  
  return blocker;
};

export type NavigationBlocker = ReturnType<typeof useNavigationBlocker>;
