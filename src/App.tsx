import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppNavigationProvider, AppLayout } from "@/components/AppNavigation";
import { SessionContextProvider } from "@/contexts/SessionContext";
import { WorkspaceContextProvider } from "@/contexts/WorkspaceContext";
import { CelebrationContextProvider } from "@/contexts/CelebrationContext";
import { GlobalCelebrations } from "@/components/GlobalCelebrations";
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


const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider>
        <CelebrationContextProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppNavigationProvider>
                <WorkspaceContextProvider>
                <GlobalCelebrations />
                <LevelUpModal />
                <TrophyUnlockedModal />
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
                  <Route path="/novidades" element={<ProtectedRoute><Layout><Novidades /></Layout></ProtectedRoute>} />
                  <Route path="/calendario" element={<ProtectedRoute><Layout><CalendarioEditorial /></Layout></ProtectedRoute>} />
                  <Route path="/session" element={<ProtectedRoute><Session /></ProtectedRoute>} />
                  <Route path="/shot-list/review" element={<ProtectedRoute><ShotListReview /></ProtectedRoute>} />
                  <Route path="/shot-list/record" element={<ProtectedRoute><ShotListRecord /></ProtectedRoute>} />
                  <Route path="/stats" element={<ProtectedRoute><Layout><Stats /></Layout></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
                  <Route path="/edit-profile" element={<ProtectedRoute><Layout><EditProfile /></Layout></ProtectedRoute>} />
                  <Route path="/my-progress" element={<ProtectedRoute><Layout><MyProgress /></Layout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
                  <Route path="/send-suggestions" element={<ProtectedRoute><Layout><SendSuggestions /></Layout></ProtectedRoute>} />
                  <Route path="/help" element={<ProtectedRoute><Layout><Help /></Layout></ProtectedRoute>} />
                  <Route path="/terms" element={<TermsOfUse />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/levels" element={<ProtectedRoute><Levels /></ProtectedRoute>} />
                  <Route path="/ofensiva" element={<ProtectedRoute><Ofensiva /></ProtectedRoute>} />
                  <Route path="/dev-tools" element={<ProtectedRoute><Layout><DevTools /></Layout></ProtectedRoute>} />
                  <Route path="/guests" element={<ProtectedRoute><Layout><Guests /></Layout></ProtectedRoute>} />
                  <Route path="/invite" element={<AcceptInvite />} />
                  <Route path="/content/view/:scriptId" element={<ProtectedRoute><ContentView /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </WorkspaceContextProvider>
              </AppNavigationProvider>
            </BrowserRouter>
          </TooltipProvider>
        </CelebrationContextProvider>
      </SessionContextProvider>
    </QueryClientProvider>
  );
};

export default App;
