import { useProfileContext } from '@/core/contexts/ProfileContext';

export const useProfile = () => {
  return useProfileContext();
};
