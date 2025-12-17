import { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

type NavPosition = 'bottom' | 'side';

interface NavPositionContextType {
  navPosition: NavPosition;
  setNavPosition: (position: NavPosition) => void;
  effectivePosition: NavPosition;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const NAV_POSITION_KEY = 'muzze_nav_position';
const SIDEBAR_COLLAPSED_KEY = 'muzze_sidebar_collapsed';

export const NavPositionContext = createContext<NavPositionContextType | null>(null);

// Hook separado para fallback (evita chamadas de hooks condicionais)
const useNavPositionFallback = (): NavPositionContextType => {
  const isMobile = useIsMobile();
  const [localPosition, setLocalPosition] = useState<NavPosition>(() => {
    if (typeof window === 'undefined') return 'bottom';
    return (localStorage.getItem(NAV_POSITION_KEY) as NavPosition) || 'bottom';
  });
  const [localCollapsed, setLocalCollapsed] = useState(false);

  const setNavPosition = useCallback((position: NavPosition) => {
    setLocalPosition(position);
    localStorage.setItem(NAV_POSITION_KEY, position);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setLocalCollapsed(collapsed);
  }, []);

  return useMemo(() => ({
    navPosition: localPosition,
    setNavPosition,
    effectivePosition: isMobile ? 'bottom' : localPosition,
    isSidebarCollapsed: localCollapsed,
    setSidebarCollapsed,
  }), [localPosition, setNavPosition, isMobile, localCollapsed, setSidebarCollapsed]);
};

export const useNavPosition = (): NavPositionContextType => {
  const context = useContext(NavPositionContext);
  const fallback = useNavPositionFallback();
  
  // Se contexto existe, retornar ele; senão usar fallback
  return context || fallback;
};

// Hook for the provider to use internally
export const useNavPositionState = () => {
  const isMobile = useIsMobile();
  const [navPosition, setNavPositionState] = useState<NavPosition>(() => {
    if (typeof window === 'undefined') return 'bottom';
    return (localStorage.getItem(NAV_POSITION_KEY) as NavPosition) || 'bottom';
  });
  const [isSidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  });

  useEffect(() => {
    const stored = localStorage.getItem(NAV_POSITION_KEY) as NavPosition;
    if (stored && stored !== navPosition) {
      setNavPositionState(stored);
    }
  }, []);

  const setNavPosition = useCallback((position: NavPosition) => {
    setNavPositionState(position);
    localStorage.setItem(NAV_POSITION_KEY, position);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, []);

  const effectivePosition: NavPosition = isMobile ? 'bottom' : navPosition;

  return useMemo(() => ({
    navPosition,
    setNavPosition,
    effectivePosition,
    isSidebarCollapsed,
    setSidebarCollapsed,
  }), [navPosition, setNavPosition, effectivePosition, isSidebarCollapsed, setSidebarCollapsed]);
};
