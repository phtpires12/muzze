import { useState, useEffect } from 'react';

const STORAGE_KEY = 'timer-auto-popup-enabled';

/**
 * Hook para gerenciar preferência do popup automático do timer
 */
export function useTimerPopupSettings() {
  const [autoPopupEnabled, setAutoPopupEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setAutoPopupEnabled(saved === 'true');
    }
  }, []);

  const setAutoPopup = (enabled: boolean) => {
    setAutoPopupEnabled(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
  };

  return { autoPopupEnabled, setAutoPopup };
}

/**
 * Utility function to check if auto popup is enabled (for use outside React)
 */
export function isAutoPopupEnabled(): boolean {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved !== 'false'; // Default to true
}
