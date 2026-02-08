import { ReactNode } from 'react';
import { useNavPosition, NavPositionContext, useNavPositionState } from '@/hooks/useNavPosition';
import { AutoHideNav } from './AutoHideNav';
import { SideNav } from './SideNav';
import { cn } from '@/lib/utils';

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
        // Add class to parent safe-app via useEffect or direct class manipulation
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
      <main className="h-full overflow-auto">{children}</main>
      <AppNavigation />
    </div>
  );
};
