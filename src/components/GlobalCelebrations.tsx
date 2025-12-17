import { useCelebration } from "@/contexts/CelebrationContext";
import SessionSummary from "@/components/SessionSummary";
import { StreakCelebration } from "@/components/StreakCelebration";
import { TrophyCelebration } from "@/components/TrophyCelebration";

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
