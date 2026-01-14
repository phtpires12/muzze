import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { AppNavigationProvider, AppLayout } from "@/components/AppNavigation";
import { SessionContextProvider } from "@/contexts/SessionContext";
import { WorkspaceContextProvider } from "@/contexts/WorkspaceContext";
import { CelebrationContextProvider } from "@/contexts/CelebrationContext";
import { ProfileContextProvider } from "@/contexts/ProfileContext";
import { GlobalCelebrations } from "@/components/GlobalCelebrations";
import ErrorBoundary from "@/components/ErrorBoundary";
import Onboarding from "./pages/NewOnboarding";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Stats from "./pages/Stats";
import Novidades from "./pages/Novidades";
import CalendarioEditorial from "./pages/CalendarioEditorial";
import Session from "./pages/Session";
import ShotList from "./pages/ShotList";
import ShotListReview from "./pages/ShotListReview";
import ShotListRecord from "./pages/ShotListRecord";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import MyProgress from "./pages/MyProgress";
import Settings from "./pages/Settings";
import SendSuggestions from "./pages/SendSuggestions";
import Help from "./pages/Help";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import Levels from "./pages/Levels";
import Ofensiva from "./pages/Ofensiva";
import DevTools from "./pages/DevTools";
import Install from "./pages/Install";
import Guests from "./pages/Guests";
import AcceptInvite from "./pages/AcceptInvite";
import ContentView from "./pages/ContentView";
import { LevelUpModal } from "./components/LevelUpModal";
import { TrophyUnlockedModal } from "./components/TrophyUnlockedModal";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setProfile(profileData);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        setTimeout(() => {
          supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle()
            .then(({ data: profileData }) => setProfile(profileData));
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-xl text-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }

  const currentPath = window.location.pathname;
  if (profile?.first_login === true && currentPath !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

// Root layout component that wraps all routes with providers that need router context
const RootLayout = () => (
  <AppNavigationProvider>
    <WorkspaceContextProvider>
      <GlobalCelebrations />
      <LevelUpModal />
      <TrophyUnlockedModal />
      <Outlet />
    </WorkspaceContextProvider>
  </AppNavigationProvider>
);

// Create data router with all routes
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/auth", element: <Auth /> },
      { path: "/reset-password", element: <ResetPassword /> },
      { path: "/onboarding", element: <Onboarding /> },
      { path: "/install", element: <Install /> },
      { path: "/", element: <ProtectedRoute><Layout><Index /></Layout></ProtectedRoute> },
      { path: "/novidades", element: <ProtectedRoute><Layout><Novidades /></Layout></ProtectedRoute> },
      { path: "/calendario", element: <ProtectedRoute><Layout><CalendarioEditorial /></Layout></ProtectedRoute> },
      { path: "/session", element: <ProtectedRoute><Session /></ProtectedRoute> },
      { path: "/shot-list/review", element: <ProtectedRoute><ShotListReview /></ProtectedRoute> },
      { path: "/shot-list/record", element: <ProtectedRoute><ShotListRecord /></ProtectedRoute> },
      { path: "/stats", element: <ProtectedRoute><Layout><Stats /></Layout></ProtectedRoute> },
      { path: "/profile", element: <ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute> },
      { path: "/edit-profile", element: <ProtectedRoute><Layout><EditProfile /></Layout></ProtectedRoute> },
      { path: "/my-progress", element: <ProtectedRoute><Layout><MyProgress /></Layout></ProtectedRoute> },
      { path: "/settings", element: <ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute> },
      { path: "/send-suggestions", element: <ProtectedRoute><Layout><SendSuggestions /></Layout></ProtectedRoute> },
      { path: "/help", element: <ProtectedRoute><Layout><Help /></Layout></ProtectedRoute> },
      { path: "/terms", element: <TermsOfUse /> },
      { path: "/privacy", element: <PrivacyPolicy /> },
      { path: "/levels", element: <ProtectedRoute><Levels /></ProtectedRoute> },
      { path: "/ofensiva", element: <ProtectedRoute><Ofensiva /></ProtectedRoute> },
      { path: "/dev-tools", element: <ProtectedRoute><Layout><DevTools /></Layout></ProtectedRoute> },
      { path: "/guests", element: <ProtectedRoute><Layout><Guests /></Layout></ProtectedRoute> },
      { path: "/invite", element: <AcceptInvite /> },
      { path: "/content/view/:scriptId", element: <ProtectedRoute><ContentView /></ProtectedRoute> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

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
