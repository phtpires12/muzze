import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserRole } from "@/hooks/useUserRole";
import { OnboardingLayout } from "@/components/onboarding/shared/OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Screen0Welcome } from "@/components/onboarding/screens/phase1/Screen0Welcome";
import { Screen1Methodology } from "@/components/onboarding/screens/phase1/Screen1Methodology";
import { Screen2Username } from "@/components/onboarding/screens/phase1/Screen2Username";
import { Screen3Platform } from "@/components/onboarding/screens/phase1/Screen3Platform";
import { Screen4StickingPoints } from "@/components/onboarding/screens/phase2/Screen4StickingPoints";
import { Screen5MonthsTrying } from "@/components/onboarding/screens/phase2/Screen5MonthsTrying";
import { Screen6CurrentPosts } from "@/components/onboarding/screens/phase2/Screen6CurrentPosts";
import { Screen7PreviousAttempts } from "@/components/onboarding/screens/phase2/Screen7PreviousAttempts";
import { Screen8ImpactScale } from "@/components/onboarding/screens/phase2/Screen8ImpactScale";
import { Screen9LostPosts } from "@/components/onboarding/screens/phase3/Screen9LostPosts";
import { Screen10TimeWasted } from "@/components/onboarding/screens/phase3/Screen10TimeWasted";
import { Screen11AccumulatedImpact } from "@/components/onboarding/screens/phase3/Screen11AccumulatedImpact";
import { Screen12Opportunity } from "@/components/onboarding/screens/phase3/Screen12Opportunity";
import { Screen13DreamOutcome } from "@/components/onboarding/screens/phase3/Screen13DreamOutcome";
import { Screen14TwentyFiveMinutes } from "@/components/onboarding/screens/phase4/Screen14TwentyFiveMinutes";
import { Screen15MinimalEffort } from "@/components/onboarding/screens/phase4/Screen15MinimalEffort";
import { Screen16PersonalizedFeatures } from "@/components/onboarding/screens/phase4/Screen16PersonalizedFeatures";
import { Screen17UniquePositioning } from "@/components/onboarding/screens/phase4/Screen17UniquePositioning";
import { Screen18CommitmentTest } from "@/components/onboarding/screens/phase4/Screen18CommitmentTest";
import { Screen19DailyGoal } from "@/components/onboarding/screens/phase5/Screen19DailyGoal";
import { Screen20CreationTime } from "@/components/onboarding/screens/phase5/Screen20CreationTime";
import { Screen21Signup } from "@/components/onboarding/screens/phase6/Screen21Signup";
import { Screen22Snapshot } from "@/components/onboarding/screens/phase6/Screen22Snapshot";
import { Screen23Notifications } from "@/components/onboarding/screens/phase6/Screen23Notifications";
import { Screen24Review } from "@/components/onboarding/screens/phase6/Screen24Review";
import { Screen25Paywall } from "@/components/onboarding/screens/phase6/Screen25Paywall";

const NewOnboarding = () => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { requestPermission } = useNotifications();
  const { isDeveloper, isAdmin } = useUserRole();
  const {
    state,
    updateData,
    nextScreen,
    prevScreen,
    getProgress,
    calculateLostPosts,
    completeOnboarding,
  } = useOnboarding();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Only check auth for phase 5 onwards (signup phase)
        if (state.phase >= 5) {
          navigate("/auth");
        }
      } else {
        trackEvent("onboarding_started");
      }
    };
    checkAuth();
  }, [navigate, trackEvent, state.phase]);

  const handleContinue = () => {
    nextScreen();
  };

  const handleBack = () => {
    prevScreen();
  };

  const handleAcceptDefaultGoal = () => {
    updateData({ daily_goal_minutes: 25 });
    nextScreen();
  };

  const handleNotificationsAccept = async () => {
    await requestPermission();
    nextScreen();
  };

  const handleSignupSuccess = () => {
    nextScreen();
  };

  const handleComplete = async () => {
    const success = await completeOnboarding();
    if (success) {
      navigate("/", { replace: true });
    }
  };

  const canContinue = () => {
    // Desenvolvedores e admins podem navegar livremente
    if (isDeveloper || isAdmin) return true;

    const { phase, screen, data } = state;

    // Phase 0 (Hook + Dream Outcome)
    if (phase === 0) {
      if (screen === 0) return true;
      if (screen === 1) return true;
      if (screen === 2) return !!data.username?.trim();
      if (screen === 3) return (data.preferred_platform?.length ?? 0) > 0;
    }

    // Phase 1 (Pain Diagnosis)
    if (phase === 1) {
      if (screen === 0) return (data.sticking_points?.length ?? 0) > 0;
      if (screen === 1) return (data.months_trying ?? 0) > 0;
      if (screen === 2) return (data.current_post_count ?? 0) >= 0;
      if (screen === 3) return (data.previous_attempts?.length ?? 0) > 0;
      if (screen === 4) {
        return (
          data.inconsistency_impact?.financial > 0 &&
          data.inconsistency_impact?.emotional > 0 &&
          data.inconsistency_impact?.professional > 0
        );
      }
    }

    // Phase 2 (Confrontation + Opportunity)
    if (phase === 2) {
      if (screen === 0) return true;
      if (screen === 1) return true;
      if (screen === 2) return true;
      if (screen === 3) return true;
      if (screen === 4) {
        return (
          data.dream_outcome_importance?.posts_30_days > 0 &&
          data.dream_outcome_importance?.clarity > 0 &&
          data.dream_outcome_importance?.consistent_identity > 0
        );
      }
    }

    // Phase 3 (Personalized Solution)
    if (phase === 3) {
      if (screen === 0) return true;
      if (screen === 1) return true;
      if (screen === 2) return true;
      if (screen === 3) return true;
      if (screen === 4) return !!data.commitment_level;
    }

    // Phase 4 (Commitment + Configuration)
    if (phase === 4) {
      if (screen === 0) return (data.daily_goal_minutes ?? 0) > 0;
      if (screen === 1) return !!data.creation_time;
    }

    // Phase 5 (Signup + Snapshot + Paywall)
    if (phase === 5) {
      if (screen === 0) return false; // Signup handled separately
      if (screen === 1) return true; // Snapshot
      if (screen === 2) return false; // Notifications (button handles)
      if (screen === 3) return false; // Review (button handles)
      if (screen === 4) return false; // Paywall (button handles completion)
    }

    return true;
  };

  const renderScreen = () => {
    const { phase, screen } = state;

    // Phase 0: Hook + Dream Outcome
    if (phase === 0) {
      if (screen === 0) return <Screen0Welcome onContinue={handleContinue} />;
      if (screen === 1) return <Screen1Methodology onContinue={handleContinue} />;
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

    // Phase 2: Confrontation + Opportunity
    if (phase === 2) {
      const lostPosts = calculateLostPosts(
        state.data.months_trying || 0,
        state.data.current_post_count || 0
      );

      if (screen === 0) {
        return (
          <Screen9LostPosts
            monthsTrying={state.data.months_trying || 0}
            currentPosts={state.data.current_post_count || 0}
            lostPosts={lostPosts}
          />
        );
      }
      if (screen === 1) {
        return <Screen10TimeWasted monthsTrying={state.data.months_trying || 0} />;
      }
      if (screen === 2) {
        return (
          <Screen11AccumulatedImpact
            impact={
              state.data.inconsistency_impact || {
                financial: 1,
                emotional: 1,
                professional: 1,
              }
            }
            monthsTrying={state.data.months_trying || 0}
          />
        );
      }
      if (screen === 3) {
        return <Screen12Opportunity />;
      }
      if (screen === 4) {
        return (
          <Screen13DreamOutcome
            value={
              state.data.dream_outcome_importance || {
                posts_30_days: 0,
                clarity: 0,
                consistent_identity: 0,
              }
            }
            onChange={(value) => updateData({ dream_outcome_importance: value })}
          />
        );
      }
    }

    // Phase 3: Personalized Solution
    if (phase === 3) {
      if (screen === 0) return <Screen14TwentyFiveMinutes />;
      if (screen === 1) return <Screen15MinimalEffort />;
      if (screen === 2) {
        return (
          <Screen16PersonalizedFeatures
            stickingPoints={state.data.sticking_points || []}
          />
        );
      }
      if (screen === 3) return <Screen17UniquePositioning />;
      if (screen === 4) {
        return (
          <Screen18CommitmentTest
            value={state.data.commitment_level || ""}
            onChange={(value) => updateData({ commitment_level: value })}
          />
        );
      }
    }

    // Phase 4: Commitment + Configuration
    if (phase === 4) {
      if (screen === 0) {
        return (
          <Screen19DailyGoal
            value={state.data.daily_goal_minutes || 25}
            onChange={(value) => updateData({ daily_goal_minutes: value })}
            onAcceptDefault={handleAcceptDefaultGoal}
          />
        );
      }
      if (screen === 1) {
        return (
          <Screen20CreationTime
            value={state.data.creation_time || "09:00"}
            onChange={(value) => updateData({ creation_time: value })}
          />
        );
      }
    }

    // Phase 5: Signup + Snapshot + Paywall
    if (phase === 5) {
      const lostPosts = calculateLostPosts(
        state.data.months_trying || 0,
        state.data.current_post_count || 0
      );

      if (screen === 0) {
        return <Screen21Signup onSuccess={handleSignupSuccess} />;
      }
      if (screen === 1) {
        return <Screen22Snapshot data={state.data} lostPosts={lostPosts} />;
      }
      if (screen === 2) {
        return (
          <Screen23Notifications
            onAccept={handleNotificationsAccept}
            onSkip={nextScreen}
          />
        );
      }
      if (screen === 3) {
        return <Screen24Review onSkip={nextScreen} />;
      }
      if (screen === 4) {
        return <Screen25Paywall onContinue={handleComplete} />;
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

  const showProgress = state.phase > 0 || state.screen > 1;
  // Mostrar botão de voltar em todas as telas exceto a primeira
  const showBack = !(state.phase === 0 && state.screen === 0);
  const showContinueButton =
    (state.phase === 0 && (state.screen === 2 || state.screen === 3)) ||
    (state.phase === 1 && state.screen >= 0 && state.screen <= 4) ||
    (state.phase === 2 && state.screen >= 0 && state.screen <= 4) ||
    (state.phase === 3 && state.screen >= 0 && state.screen <= 4) ||
    (state.phase === 4 && state.screen === 1);

  return (
    <OnboardingLayout
      showBack={showBack}
      onBack={handleBack}
      showProgress={showProgress}
      progress={getProgress()}
      phase={state.phase}
      totalPhases={state.totalPhases}
    >
      {/* Developer Badge */}
      {(isDeveloper || isAdmin) && (
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

      {/* Developer bypass button - appears when normal continue button is hidden */}
      {(isDeveloper || isAdmin) && !showContinueButton && (
        <div className="flex justify-center pt-6">
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleContinue}
            className="min-w-[200px] border-primary/50 text-primary hover:bg-primary/10"
          >
            <Shield className="w-4 h-4 mr-2" />
            Pular (Dev)
          </Button>
        </div>
      )}
    </OnboardingLayout>
  );
};

export default NewOnboarding;
