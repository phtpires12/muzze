import { useCelebration } from '@/core/contexts';
import { SessionSummary } from "@/components/content";
import { StreakCelebration } from "@/components/shared";
import { TrophyCelebration } from "@/components/shared";

export const GlobalCelebrations = () => {
  const {
    celebrationData,
    dismissSessionSummary,
    dismissStreakCelebration,
    dismissTrophyCelebration,
  } = useCelebration();

  return (
    <>
      <SessionSummary
        show={celebrationData.showSessionSummary}
        duration={celebrationData.sessionSummary?.duration || 0}
        xpGained={celebrationData.sessionSummary?.xpGained || 0}
        stage={celebrationData.sessionSummary?.stage || 'idea'}
        onContinue={dismissSessionSummary}
        autoRedirectDestination={celebrationData.sessionSummary?.autoRedirectDestination}
      />

      <StreakCelebration
        show={celebrationData.showStreakCelebration}
        streakCount={celebrationData.streakCount}
        weekDays={celebrationData.weekDays}
        onContinue={dismissStreakCelebration}
      />

      <TrophyCelebration
        show={celebrationData.showTrophyCelebration}
        trophy={celebrationData.currentTrophy}
        xpGained={celebrationData.xpGained}
        onContinue={dismissTrophyCelebration}
      />
    </>
  );
};
