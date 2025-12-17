import { useState, useEffect, createContext, useContext } from 'react';
import { useIsMobile } from './use-mobile';

type NavPosition = 'bottom' | 'side';

interface NavPositionContextType {
  navPosition: NavPosition;
  setNavPosition: (position: NavPosition) => void;
  effectivePosition: NavPosition; // Considers mobile override
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const NAV_POSITION_KEY = 'muzze_nav_position';
const SIDEBAR_COLLAPSED_KEY = 'muzze_sidebar_collapsed';

export const NavPositionContext = createContext<NavPositionContextType | null>(null);

export const useNavPosition = (): NavPositionContextType => {
  const context = useContext(NavPositionContext);
  
  // Fallback for use outside provider (e.g., in Settings before context is available)
  const isMobile = useIsMobile();
  const [localPosition, setLocalPosition] = useState<NavPosition>(() => {
    if (typeof window === 'undefined') return 'bottom';
    return (localStorage.getItem(NAV_POSITION_KEY) as NavPosition) || 'bottom';
  });
  const [localCollapsed, setLocalCollapsed] = useState(false);

  if (context) {
    return context;
  }

  // Fallback behavior
  const setNavPosition = (position: NavPosition) => {
    setLocalPosition(position);
    localStorage.setItem(NAV_POSITION_KEY, position);
  };

  return {
    navPosition: localPosition,
    setNavPosition,
    effectivePosition: isMobile ? 'bottom' : localPosition,
    isSidebarCollapsed: localCollapsed,
    setSidebarCollapsed: setLocalCollapsed,
  };
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

  const setNavPosition = (position: NavPosition) => {
    setNavPositionState(position);
    localStorage.setItem(NAV_POSITION_KEY, position);
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  };

  // Mobile always uses bottom navigation
  const effectivePosition: NavPosition = isMobile ? 'bottom' : navPosition;

  return {
    navPosition,
    setNavPosition,
    effectivePosition,
    isSidebarCollapsed,
    setSidebarCollapsed,
  };
};
