import { useSessionContext } from "@/contexts/SessionContext";

interface LiveDailyProgress {
  actualMinutes: number;
  goalMinutes: number;
  percentageProgress: number;
  isAbove: boolean;
  isLive: boolean;
}

export const useLiveDailyProgress = (
  dbActualMinutes: number,
  dbGoalMinutes: number
): LiveDailyProgress => {
  const { timer } = useSessionContext();

  // Se sessão ativa, usar valores live do timer
  if (timer.isActive) {
    const liveSeconds = timer.dailyBaselineSeconds + timer.elapsedSeconds;
    const liveMinutes = Math.floor(liveSeconds / 60);
    const goalMinutes = timer.dailyGoalMinutes || dbGoalMinutes;
    const percentageProgress = goalMinutes > 0
      ? Math.round((liveMinutes / goalMinutes) * 100)
      : 0;

    return {
      actualMinutes: liveMinutes,
      goalMinutes,
      percentageProgress: Math.min(percentageProgress, 200),
      isAbove: liveMinutes >= goalMinutes,
      isLive: true,
    };
  }

  // Se não há sessão ativa, usar dados do DB
  const percentageProgress = dbGoalMinutes > 0
    ? Math.round((dbActualMinutes / dbGoalMinutes) * 100)
    : 0;

  return {
    actualMinutes: dbActualMinutes,
    goalMinutes: dbGoalMinutes,
    percentageProgress: Math.min(percentageProgress, 200),
    isAbove: dbActualMinutes >= dbGoalMinutes,
    isLive: false,
  };
};
