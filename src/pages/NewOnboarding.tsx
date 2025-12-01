import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAnalytics } from "@/hooks/useAnalytics";
import { OnboardingLayout } from "@/components/onboarding/shared/OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Screen0Welcome } from "@/components/onboarding/screens/phase1/Screen0Welcome";
import { Screen1Methodology } from "@/components/onboarding/screens/phase1/Screen1Methodology";
import { Screen2Username } from "@/components/onboarding/screens/phase1/Screen2Username";
import { Screen3Platform } from "@/components/onboarding/screens/phase1/Screen3Platform";
import { Screen4StickingPoints } from "@/components/onboarding/screens/phase2/Screen4StickingPoints";
import { Screen5MonthsTrying } from "@/components/onboarding/screens/phase2/Screen5MonthsTrying";
import { Screen6CurrentPosts } from "@/components/onboarding/screens/phase2/Screen6CurrentPosts";
import { Screen7PreviousAttempts } from "@/components/onboarding/screens/phase2/Screen7PreviousAttempts";
import { Screen8ImpactScale } from "@/components/onboarding/screens/phase2/Screen8ImpactScale";

const NewOnboarding = () => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const {
    state,
    updateData,
    nextScreen,
    prevScreen,
    getProgress,
  } = useOnboarding();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        trackEvent("onboarding_started");
      }
    };
    checkAuth();
  }, [navigate, trackEvent]);

  const handleContinue = () => {
    nextScreen();
  };

  const handleBack = () => {
    prevScreen();
  };

  const canContinue = () => {
    const { phase, screen, data } = state;
    
    // Phase 0 (Hook + Dream Outcome)
    if (phase === 0) {
      if (screen === 0) return true; // Welcome screen
      if (screen === 1) return true; // Methodology screen
      if (screen === 2) return !!data.username?.trim(); // Username required
      if (screen === 3) return (data.preferred_platform?.length ?? 0) > 0; // At least one platform
    }
    
    // Phase 1 (Pain Diagnosis)
    if (phase === 1) {
      if (screen === 0) return (data.sticking_points?.length ?? 0) > 0; // At least one sticking point
      if (screen === 1) return (data.months_trying ?? 0) > 0; // Months trying required
      if (screen === 2) return (data.current_post_count ?? 0) >= 0; // Current posts (can be 0)
      if (screen === 3) return (data.previous_attempts?.length ?? 0) > 0; // At least one attempt
      if (screen === 4) {
        // All impact scales must be set (1-5)
        return (
          data.inconsistency_impact?.financial > 0 &&
          data.inconsistency_impact?.emotional > 0 &&
          data.inconsistency_impact?.professional > 0
        );
      }
    }
    
    return true;
  };

  const renderScreen = () => {
    const { phase, screen } = state;

    // Phase 0: Hook + Dream Outcome
    if (phase === 0) {
      if (screen === 0) {
        return <Screen0Welcome onContinue={handleContinue} />;
      }
      if (screen === 1) {
        return <Screen1Methodology onContinue={handleContinue} />;
      }
      if (screen === 2) {
        return (
          <Screen2Username
            value={state.data.username || ""}
            onChange={(value) => updateData({ username: value })}
          />
        );
      }
      if (screen === 3) {
        const platforms = state.data.preferred_platform
          ? state.data.preferred_platform.split(",")
          : [];
        return (
          <Screen3Platform
            value={platforms}
            onChange={(value) => updateData({ preferred_platform: value.join(",") })}
          />
        );
      }
    }

    // Phase 1: Pain Diagnosis
    if (phase === 1) {
      if (screen === 0) {
        return (
          <Screen4StickingPoints
            value={state.data.sticking_points || []}
            onChange={(value) => updateData({ sticking_points: value })}
          />
        );
      }
      if (screen === 1) {
        return (
          <Screen5MonthsTrying
            value={state.data.months_trying || 0}
            onChange={(value) => updateData({ months_trying: value })}
          />
        );
      }
      if (screen === 2) {
        return (
          <Screen6CurrentPosts
            value={state.data.current_post_count || 0}
            onChange={(value) => updateData({ current_post_count: value })}
          />
        );
      }
      if (screen === 3) {
        return (
          <Screen7PreviousAttempts
            value={state.data.previous_attempts || []}
            onChange={(value) => updateData({ previous_attempts: value })}
          />
        );
      }
      if (screen === 4) {
        return (
          <Screen8ImpactScale
            value={
              state.data.inconsistency_impact || {
                financial: 0,
                emotional: 0,
                professional: 0,
              }
            }
            onChange={(value) => updateData({ inconsistency_impact: value })}
          />
        );
      }
    }

    // Placeholder for other phases
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">
          Fase {phase + 1}, Tela {screen + 1}
        </h2>
        <p className="text-muted-foreground">
          Esta tela será implementada nos próximos sprints.
        </p>
      </div>
    );
  };

  const showProgress = state.phase > 0 || state.screen > 1;
  const showBack = state.phase > 0 || state.screen > 2;
  const showContinueButton = 
    (state.phase === 0 && (state.screen === 2 || state.screen === 3)) ||
    (state.phase === 1 && state.screen >= 0 && state.screen <= 4);

  return (
    <OnboardingLayout
      showBack={showBack}
      onBack={handleBack}
      showProgress={showProgress}
      progress={getProgress()}
      phase={state.phase}
      totalPhases={state.totalPhases}
    >
      {renderScreen()}

      {/* Continue button for screens that need it */}
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
