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
import { ConsistencyCluster, Screen12Variant } from "@/types/onboarding";
import { Screen3Platform } from "@/components/onboarding/screens/phase1/Screen3Platform";
import { Screen4StartQuestionnaire } from "@/components/onboarding/screens/phase1/Screen4StartQuestionnaire";
import { Screen13DreamOutcome } from "@/components/onboarding/screens/phase3/Screen13DreamOutcome";
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
import { Screen26Install } from "@/components/onboarding/screens/phase6/Screen26Install";
import { DesktopOnboarding } from "@/components/onboarding/DesktopOnboarding";

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
    getProgress,
    calculateLostPosts,
    completeOnboarding,
  } = useOnboarding();

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for desktop (handled by DesktopOnboarding)
      if (isMobile === false) return;
      
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Only redirect to auth if past the signup screen (phase 5, screen 0)
        // Screen 0 of phase 5 IS the signup screen, so allow access
        if (state.phase >= 5 && state.screen > 0) {
          navigate("/auth");
        }
      } else {
        trackEvent("onboarding_started");
      }
    };
    checkAuth();
  }, [navigate, trackEvent, state.phase, state.screen, isMobile]);

  // Auto-skip Screen24Review (Review/Rating) on non-mobile devices
  // App Store review only makes sense on mobile
  useEffect(() => {
    if (state.phase === 5 && state.screen === 3 && !isMobile) {
      nextScreen();
    }
  }, [state.phase, state.screen, isMobile, nextScreen]);

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

    // Phase 0 (Hook + Dream Outcome)
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

    // Phase 1 (Pain Diagnosis - 3 screens)
    if (phase === 1) {
      if (screen === 0) return true; // BehavioralScience - transition screen
      if (screen === 1) return !!data.daily_available_time; // DailyTime
      if (screen === 2) return true; // CreationTime - always can continue (has default)
    }

    // Phase 2 (Confrontation + Opportunity - 1 screen: DreamOutcome)
    if (phase === 2) {
      if (screen === 0) {
        return (
          data.dream_outcome_importance?.posts_30_days > 0 &&
          data.dream_outcome_importance?.clarity > 0 &&
          data.dream_outcome_importance?.consistent_identity > 0
        );
      }
    }

    // Phase 3 (Personalized Solution - 4 screens)
    if (phase === 3) {
      if (screen === 0) return true; // MinimalEffort
      if (screen === 1) return true; // PersonalizedFeatures
      if (screen === 2) return true; // UniquePositioning
      if (screen === 3) return !!data.commitment_level; // CommitmentTest
    }

    // Phase 4 (Commitment + Configuration)
    if (phase === 4) {
      if (screen === 0) return (data.daily_goal_minutes ?? 0) > 0;
      if (screen === 1) return !!data.creation_time;
    }

    // Phase 5 (Signup + Snapshot + Paywall + Install)
    if (phase === 5) {
      if (screen === 0) return false; // Signup handled separately
      if (screen === 1) return true; // Snapshot
      if (screen === 2) return false; // Notifications (button handles)
      if (screen === 3) return false; // Review (button handles)
      if (screen === 4) return false; // Paywall (button handles)
      if (screen === 5) return false; // Install (button handles completion)
    }

    return true;
  };

  const renderScreen = () => {
    const { phase, screen } = state;

    // Phase 0: Hook + Dream Outcome
    if (phase === 0) {
      if (screen === 0) return <Screen0Welcome onContinue={handleContinue} onLogin={handleLogin} />;
      if (screen === 1) return <HowWeHelpSection onComplete={handleContinue} onBack={handleBack} />;
      if (screen === 2) return <Screen4StartQuestionnaire onContinue={handleContinue} onBack={handleBack} />;
      // Screen 3 (Username) renderiza fora do OnboardingLayout - tem layout próprio
      if (screen === 3) return null;
      // Screen 4 (ContentGoal) renderiza fora do OnboardingLayout - tem layout próprio
      if (screen === 4) return null;
      // Screen 5 (StickingPoints) renderiza fora do OnboardingLayout - tem layout próprio
      if (screen === 5) return null;
      // Screen 6 (Diferencial) renderiza fora do OnboardingLayout - tem layout próprio
      if (screen === 6) return null;
      // Screen 7 (MonthsTrying) renderiza fora do OnboardingLayout - tem layout próprio
      if (screen === 7) return null;
      // Screen 8 (Constancia) renderiza fora do OnboardingLayout - tem layout próprio
      if (screen === 8) return null;
      // Screen 9 (ClusterFeedback) renderiza fora do OnboardingLayout - tem layout próprio
      if (screen === 9) return null;
    }

    // Phase 1: Pain Diagnosis (3 screens)
    if (phase === 1) {
      // Screen 0: BehavioralScience renderiza fora do OnboardingLayout
      if (screen === 0) return null;
      // Screen 1: DailyTime renderiza fora do OnboardingLayout
      if (screen === 1) return null;
      // Screen 2: CreationTime renderiza fora do OnboardingLayout
      if (screen === 2) return null;
    }

    // Phase 2: Confrontation + Opportunity (1 screen: DreamOutcome)
    if (phase === 2) {
      if (screen === 0) {
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

    // Phase 3: Personalized Solution (4 screens)
    if (phase === 3) {
      if (screen === 0) return <Screen15MinimalEffort />;
      if (screen === 1) {
        return (
          <Screen16PersonalizedFeatures
            stickingPoints={state.data.sticking_points || []}
          />
        );
      }
      if (screen === 2) return <Screen17UniquePositioning />;
      if (screen === 3) {
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
        return <Screen25Paywall onContinue={handlePaywallComplete} onBack={handleBack} />;
      }
      if (screen === 5) {
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
  // Username agora tem botão interno - removido do showContinueButton
  const showContinueButton =
    (state.phase === 2 && state.screen === 0) || // DreamOutcome
    (state.phase === 3 && state.screen >= 0 && state.screen <= 3) || // Phase 3 all screens
    (state.phase === 4 && state.screen === 1) || // CreationTime
    (state.phase === 5 && state.screen === 1); // Snapshot - botão Continuar

  // Tela de Welcome renderiza fora do OnboardingLayout para controle total do layout
  if (state.phase === 0 && state.screen === 0) {
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
    return (
      <>
        {/* Developer Badge */}
        {(isDeveloper || isAdmin) && (
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
