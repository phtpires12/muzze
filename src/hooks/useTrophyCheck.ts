import { checkAndAwardTrophies } from "@/lib/gamification";

export const useTrophyCheck = () => {
  const triggerTrophyCheck = () => {
    const newTrophies = checkAndAwardTrophies();
    return newTrophies;
  };

  return { triggerTrophyCheck };
};
