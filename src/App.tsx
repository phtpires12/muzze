import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { SessionContextProvider } from '@/core/contexts';
import { ProfileContextProvider } from '@/core/contexts';
import { CelebrationContextProvider } from '@/core/contexts';
import { ErrorBoundary } from "@/components/shared";
import { setupGlobalErrorHandlers } from '@/core/services';
import { UpdateOverlay } from "@/components/shared";
import { usePWAUpdate } from '@/core/hooks';
import { router } from "@/routes";

// Initialize global error handlers
setupGlobalErrorHandlers();

const queryClient = new QueryClient();

const PWAManager = () => {
  if (!('serviceWorker' in navigator)) return null;
  return <PWAManagerInner />;
};

const PWAManagerInner = () => {
  const { needRefresh } = usePWAUpdate();
  return <UpdateOverlay isVisible={needRefresh} />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SessionContextProvider>
          <ProfileContextProvider>
            <CelebrationContextProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <PWAManager />
                <RouterProvider router={router} />
              </TooltipProvider>
            </CelebrationContextProvider>
          </ProfileContextProvider>
        </SessionContextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
