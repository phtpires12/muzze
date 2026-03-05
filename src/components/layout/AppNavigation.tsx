import { ReactNode } from 'react';
import { useNavPosition, NavPositionContext, useNavPositionState } from '@/core/hooks';
import { AutoHideNav } from './AutoHideNav';
import { SideNav } from './SideNav';
import { cn } from '@/core/utils';

interface AppNavigationProviderProps {
  children: ReactNode;
}

export const AppNavigationProvider = ({ children }: AppNavigationProviderProps) => {
  const navPositionState = useNavPositionState();

  return (
    <NavPositionContext.Provider value={navPositionState}>
      {children}
    </NavPositionContext.Provider>
  );
};

interface AppNavigationProps {
  children?: ReactNode;
}

export const AppNavigation = ({ children }: AppNavigationProps) => {
  const { effectivePosition } = useNavPosition();

  return (
    <>
      {effectivePosition === 'side' ? <SideNav /> : <AutoHideNav />}
      {children}
    </>
  );
};

// Layout wrapper that adjusts for sidebar
interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AppLayout = ({ children, className }: AppLayoutProps) => {
  const { effectivePosition, isSidebarCollapsed } = useNavPosition();
  const hasSidebar = effectivePosition === 'side';
  const hasBottomNav = effectivePosition === 'bottom';

  return (
    <div
      className={cn(
        "min-h-screen bg-background transition-all duration-300",
        hasSidebar && (isSidebarCollapsed ? "pl-16" : "pl-56"),
        className
      )}
      data-has-bottom-nav={hasBottomNav}
    >
      {/* Apply with-bottom-nav class to parent safe-app wrapper */}
      {hasBottomNav && (
        <style>{`
          .safe-app:has([data-has-bottom-nav="true"]) {
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height));
          }
        `}</style>
      )}
      <main className={cn(
        "h-full overflow-auto",
        // Padding universal: garante que o conteúdo nunca fique atrás da navbar fixa
        // Aplica em desktop e mobile. Não aplica quando há sidebar (nav lateral, sem conflito)
        !hasSidebar && "pb-[calc(env(safe-area-inset-bottom,0px)+5rem)]"
      )}>
        {children}
      </main>
      <AppNavigation />
    </div>
  );
};
