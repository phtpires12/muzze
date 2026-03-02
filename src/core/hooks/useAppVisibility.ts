import { useState, useEffect } from 'react';

/**
 * Hook to track if the app/document is currently visible to the user
 * Uses the Page Visibility API to detect when user switches tabs/minimizes
 */
export function useAppVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
