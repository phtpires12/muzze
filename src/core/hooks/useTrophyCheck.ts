import { checkAndAwardTrophies } from '@/core/services/gamification';

export const useTrophyCheck = () => {
  const triggerTrophyCheck = () => {
    const newTrophies = checkAndAwardTrophies();
    return newTrophies;
  };

  return { triggerTrophyCheck };
};
