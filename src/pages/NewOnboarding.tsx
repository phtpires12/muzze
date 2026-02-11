import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { OnboardingLayout } from "@/components/onboarding/shared/OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Screen0Welcome } from "@/components/onboarding/screens/phase1/Screen0Welcome";
import { HowWeHelpSection } from "@/components/onboarding/screens/phase1/HowWeHelpSection";
import { Screen2Username } from "@/components/onboarding/screens/phase1/Screen2Username";
import { Screen5ContentGoal } from "@/components/onboarding/screens/phase1/Screen5ContentGoal";
import { Screen6StickingPoints } from "@/components/onboarding/screens/phase1/Screen6StickingPoints";
import { Screen7Diferencial } from "@/components/onboarding/screens/phase1/Screen7Diferencial";
import { Screen8MonthsTrying } from "@/components/onboarding/screens/phase1/Screen8MonthsTrying";
import { Screen9Constancia } from "@/components/onboarding/screens/phase1/Screen9Constancia";
import { Screen10ClusterFeedback } from "@/components/onboarding/screens/phase1/Screen10ClusterFeedback";
import { Screen11BehavioralScience } from "@/components/onboarding/screens/phase1/Screen11BehavioralScience";
import { Screen12DailyTime } from "@/components/onboarding/screens/phase1/Screen12DailyTime";
import { Screen13CreationTime } from "@/components/onboarding/screens/phase1/Screen13CreationTime";
import { Screen14PreviousTools } from "@/components/onboarding/screens/phase1/Screen14PreviousTools";
import { Screen15Notifications } from "@/components/onboarding/screens/phase1/Screen15Notifications";
import { ConsistencyCluster, Screen12Variant } from "@/types/onboarding";
import { Screen3Platform } from "@/components/onboarding/screens/phase1/Screen3Platform";
import { Screen4StartQuestionnaire } from "@/components/onboarding/screens/phase1/Screen4StartQuestionnaire";
import { Screen21Signup } from "@/components/onboarding/screens/phase6/Screen21Signup";
import { Screen25Paywall } from "@/components/onboarding/screens/phase6/Screen25Paywall";
import { Screen26Install } from "@/components/onboarding/screens/phase6/Screen26Install";
import { DesktopOnboarding } from "@/components/onboarding/DesktopOnboarding";
import { DevNavigationBar } from "@/components/onboarding/DevNavigationBar";

const NewOnboarding = () => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { requestPermission } = useNotifications();
  const { isDeveloper, isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const {
    state,
    updateData,
    nextScreen,
    prevScreen,
    goToScreen,
    getProgress,
    calculateLostPosts,
    completeOnboarding,
  } = useOnboarding();

  const isDevUser = isDeveloper || isAdmin;

  // Wrapper that appends dev navigation bar to any screen content
  const withDevBar = (content: React.ReactNode) => (
    <>
      {content}
      {isDevUser && (
        <DevNavigationBar
          phase={state.phase}
          screen={state.screen}
          onPrev={prevScreen}
          onNext={nextScreen}
          onGoTo={goToScreen}
        />
      )}
    </>
  );

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for desktop (handled by DesktopOnboarding)
      if (isMobile === false) return;
      
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Only redirect to auth if past the signup screen (phase 2, screen 0)
        // Screen 0 of phase 2 IS the signup screen, so allow access
        if (state.phase >= 2 && state.screen > 0) {
          navigate("/auth");
        }
      } else {
        trackEvent("onboarding_started");
      }
    };
    checkAuth();
  }, [navigate, trackEvent, state.phase, state.screen, isMobile]);

  // Desktop users get the minimal onboarding flow
  // Note: isMobile is undefined during initial render, so we wait for it
  if (isMobile === false) {
    return <DesktopOnboarding />;
  }

  const handleContinue = () => {
    nextScreen();
  };

  const handleBack = () => {
    prevScreen();
  };

  const handleLogin = () => {
    navigate("/auth");
  };

  const handleSignupSuccess = () => {
    nextScreen();
  };

  const handlePaywallComplete = () => {
    nextScreen(); // Go to install screen
  };

  const handleComplete = async () => {
    const success = await completeOnboarding();
    if (success) {
      // Verificar convite pendente
      const pendingInviteId = localStorage.getItem("pendingInviteId");
      if (pendingInviteId) {
        localStorage.removeItem("pendingInviteId");
        navigate(`/invite?id=${pendingInviteId}`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  };

  const canContinue = () => {
    // Desenvolvedores e admins podem navegar livremente
    if (isDeveloper || isAdmin) return true;

    const { phase, screen, data } = state;

    // Phase 0 (Hook + Dream Outcome - 10 screens)
    if (phase === 0) {
      if (screen === 0) return true; // Welcome
      if (screen === 1) return true; // HowWeHelp
      if (screen === 2) return true; // StartQuestionnaire - transition
      if (screen === 3) return !!data.username?.trim(); // Username
      if (screen === 4) return !!data.content_goal; // ContentGoal
      if (screen === 5) return (data.sticking_points?.length ?? 0) > 0; // StickingPoints
      if (screen === 6) return false; // Diferencial - internal buttons handle navigation
      if (screen === 7) return (data.months_trying ?? 0) > 0; // MonthsTrying
      if (screen === 8) return !!data.posting_frequency; // Constancia
      if (screen === 9) return false; // ClusterFeedback - internal button handles
    }

    // Phase 1 (Behavioral Science + Configuration - 3 screens)
    if (phase === 1) {
      if (screen === 0) return true; // BehavioralScience - transition screen
      if (screen === 1) return !!data.daily_available_time; // DailyTime
      if (screen === 2) return true; // CreationTime - always can continue (has default)
      if (screen === 3) return (data.previous_tools?.length ?? 0) > 0; // PreviousTools
    }

    // Phase 2 (Signup + Paywall + Install - 3 screens)
    if (phase === 2) {
      if (screen === 0) return false; // Signup handled separately
      if (screen === 1) return false; // Paywall (button handles)
      if (screen === 2) return false; // Install (button handles completion)
    }

    return true;
  };

  const renderScreen = () => {
    const { phase, screen } = state;

    // Phase 0: Hook + Dream Outcome (10 screens)
    if (phase === 0) {
      if (screen === 0) return <Screen0Welcome onContinue={handleContinue} onLogin={handleLogin} />;
      if (screen === 1) return <HowWeHelpSection onComplete={handleContinue} onBack={handleBack} />;
      if (screen === 2) return <Screen4StartQuestionnaire onContinue={handleContinue} onBack={handleBack} />;
      // Screens 3-9 renderizam fora do OnboardingLayout - têm layout próprio
      if (screen >= 3 && screen <= 9) return null;
    }

    // Phase 1: Behavioral Science + Configuration (3 screens)
    if (phase === 1) {
      // All screens render outside OnboardingLayout
      if (screen >= 0 && screen <= 3) return null;
    }

    // Phase 2: Signup + Paywall + Install (3 screens)
    if (phase === 2) {
      if (screen === 0) return null; // Rendered outside OnboardingLayout
      if (screen === 1) return null; // Rendered outside OnboardingLayout
      if (screen === 2) {
        return <Screen26Install onContinue={handleComplete} onBack={handleBack} />;
      }
    }

    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">
          Fase {phase + 1}, Tela {screen + 1}
        </h2>
        <p className="text-muted-foreground">Erro ao carregar tela.</p>
      </div>
    );
  };

  const showProgress = state.phase > 0 || state.screen > 2;
  // Mostrar botão de voltar em TODAS as telas exceto a primeira (Welcome)
  const showBack = !(state.phase === 0 && state.screen === 0);
  // No continue button needed - all screens handle their own navigation
  const showContinueButton = false;

  // Tela de Welcome renderiza fora do OnboardingLayout para controle total do layout
  if (state.phase === 0 && state.screen === 0) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen0Welcome onContinue={handleContinue} onLogin={handleLogin} />
      </>
    );
  }

  // Mini-seção "Como vamos te ajudar" renderiza fora do OnboardingLayout
  if (state.phase === 0 && state.screen === 1) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <HowWeHelpSection onComplete={handleContinue} onBack={handleBack} />
      </>
    );
  }

  // StartQuestionnaire também renderiza fora do OnboardingLayout (tela de transição)
  if (state.phase === 0 && state.screen === 2) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen4StartQuestionnaire onContinue={handleContinue} onBack={handleBack} />
      </>
    );
  }

  // Username renderiza fora do OnboardingLayout - tem layout próprio com progress bar gradiente
  if (state.phase === 0 && state.screen === 3) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen2Username
          value={state.data.username || ""}
          onChange={(value) => updateData({ username: value })}
          onContinue={handleContinue}
          onBack={handleBack}
          progress={getProgress()}
        />
      </>
    );
  }

  // ContentGoal renderiza fora do OnboardingLayout - tem layout próprio com toggle expansível
  if (state.phase === 0 && state.screen === 4) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen5ContentGoal
          value={state.data.content_goal || ""}
          onChange={(value) => updateData({ content_goal: value })}
          onContinue={handleContinue}
          onBack={handleBack}
          progress={getProgress()}
          username={state.data.username || ""}
        />
      </>
    );
  }

  // StickingPoints renderiza fora do OnboardingLayout - tem layout próprio com multi-select
  if (state.phase === 0 && state.screen === 5) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen6StickingPoints
          value={state.data.sticking_points || []}
          onChange={(value) => updateData({ sticking_points: value })}
          onContinue={handleContinue}
          onBack={handleBack}
          progress={getProgress()}
          username={state.data.username || ""}
        />
      </>
    );
  }

  // Diferencial renderiza fora do OnboardingLayout - tem layout próprio com comparação
  if (state.phase === 0 && state.screen === 6) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen7Diferencial
          onContinue={handleContinue}
          onSkip={handleContinue}
          onBack={handleBack}
          progress={getProgress()}
        />
      </>
    );
  }

  // MonthsTrying renderiza fora do OnboardingLayout - tem layout próprio com input numérico
  if (state.phase === 0 && state.screen === 7) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen8MonthsTrying
          value={state.data.months_trying || 0}
          onChange={(value) => updateData({ months_trying: value })}
          onContinue={handleContinue}
          onBack={handleBack}
          progress={getProgress()}
        />
      </>
    );
  }

  // Handler for Constancia screen - updates multiple cluster-related fields
  const handleConstanciaChange = (
    value: string,
    cluster: ConsistencyCluster,
    variant: Screen12Variant
  ) => {
    updateData({
      posting_frequency: value,
      consistency_cluster: cluster,
      screen12_variant: variant,
    });
  };

  // Constancia renderiza fora do OnboardingLayout - tem layout próprio com single-select
  if (state.phase === 0 && state.screen === 8) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen9Constancia
          value={state.data.posting_frequency || ""}
          onChange={handleConstanciaChange}
          onContinue={handleContinue}
          onBack={handleBack}
          progress={getProgress()}
          username={state.data.username || ""}
        />
      </>
    );
  }

  // ClusterFeedback renderiza fora do OnboardingLayout - tela de transição personalizada
  if (state.phase === 0 && state.screen === 9) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen10ClusterFeedback
          variant={state.data.screen12_variant || "hurt"}
          onContinue={handleContinue}
          onBack={handleBack}
        />
      </>
    );
  }

  // BehavioralScience renderiza fora do OnboardingLayout - tela educacional com imagem hero
  if (state.phase === 1 && state.screen === 0) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen11BehavioralScience
          onContinue={handleContinue}
          onBack={handleBack}
        />
      </>
    );
  }

  // DailyTime renderiza fora do OnboardingLayout - tela de questionário com layout próprio
  if (state.phase === 1 && state.screen === 1) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen12DailyTime
          value={state.data.daily_available_time || ""}
          onChange={(value) => updateData({ daily_available_time: value })}
          onContinue={handleContinue}
          onBack={handleBack}
          progress={getProgress()}
          username={state.data.username || ""}
        />
      </>
    );
  }

  // CreationTime renderiza fora do OnboardingLayout - tela com time input
  if (state.phase === 1 && state.screen === 2) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen13CreationTime
          value={state.data.preferred_creation_time || "09:00"}
          onChange={(value) => updateData({ preferred_creation_time: value })}
          onContinue={handleContinue}
          onBack={handleBack}
          progress={getProgress()}
          username={state.data.username || ""}
        />
      </>
    );
  }

  // PreviousTools renderiza fora do OnboardingLayout - multi-select com limite de 3
  if (state.phase === 1 && state.screen === 3) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen14PreviousTools
          value={state.data.previous_tools || []}
          onChange={(value) => updateData({ previous_tools: value })}
          onContinue={handleContinue}
          onBack={handleBack}
          progress={getProgress()}
        />
      </>
    );
  }

  // Signup renderiza fora do OnboardingLayout - layout próprio sem progress bar
  if (state.phase === 2 && state.screen === 0) {
    return withDevBar(
      <>
        {isDevUser && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              {isAdmin ? "Admin" : "Developer"}
            </span>
          </div>
        )}
        <Screen21Signup
          onSuccess={handleSignupSuccess}
          onBack={handleBack}
        />
      </>
    );
  }

  // Paywall renderiza fora do OnboardingLayout - layout fullscreen próprio
  if (state.phase === 2 && state.screen === 1) {
    return withDevBar(
      <Screen25Paywall
        onContinue={handlePaywallComplete}
        onBack={handleBack}
      />
    );
  }

  return withDevBar(
    <OnboardingLayout
      showBack={showBack}
      onBack={handleBack}
      showProgress={showProgress}
      progress={getProgress()}
      phase={state.phase}
      totalPhases={state.totalPhases}
    >
      {/* Developer Badge */}
      {isDevUser && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">
            {isAdmin ? "Admin" : "Developer"}
          </span>
        </div>
      )}

      {renderScreen()}

      {showContinueButton && (
        <div className="flex justify-center gap-4 pt-4">
          {showBack && (
            <Button variant="outline" onClick={handleBack}>
              Voltar
            </Button>
          )}
          <Button
            onClick={handleContinue}
            disabled={!canContinue()}
            className="min-w-[200px]"
          >
            Continuar
          </Button>
        </div>
      )}

    </OnboardingLayout>
  );
};

export default NewOnboarding;
