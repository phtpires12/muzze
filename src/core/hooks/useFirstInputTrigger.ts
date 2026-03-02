import { useEffect, useRef, useCallback } from "react";
import { useSessionContext } from '@/core/contexts/SessionContext';
import { useSoundEffects } from '@/core/hooks/useSoundEffects';
import { useToast } from '@/core/hooks/use-toast';

interface UseFirstInputTriggerOptions {
  enabled: boolean; // Based on timer_start_mode === 'on_input' && timer.isFrozen
}

/**
 * Hook to detect the user's first meaningful input and unfreeze the timer.
 * 
 * Listens for:
 * - keydown (typing)
 * - paste (pasting content)
 * - input (field changes)
 * - change (selections, toggles)
 * 
 * Automatically removes listeners after triggering once.
 */
export const useFirstInputTrigger = ({ enabled }: UseFirstInputTriggerOptions) => {
  const { timer, unfreezeTimer } = useSessionContext();
  const { playSound } = useSoundEffects(0.6);
  const { toast } = useToast();
  const hasTriggeredRef = useRef(false);

  const handleFirstInput = useCallback((event: Event) => {
    // Prevent duplicate triggers
    if (hasTriggeredRef.current) return;
    
    // Ignore modifier-only keypresses (Shift, Ctrl, Alt, Meta)
    if (event instanceof KeyboardEvent) {
      const modifierKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'];
      if (modifierKeys.includes(event.key)) return;
      
      // Ignore navigation keys that don't indicate work starting
      const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
      if (navKeys.includes(event.key)) return;
    }

    // Mark as triggered
    hasTriggeredRef.current = true;
    
    console.log('[useFirstInputTrigger] First input detected, unfreezing timer', event.type);
    
    // Unfreeze the timer
    unfreezeTimer();
    
    // Play sound
    playSound('resume');
    
    // Show toast
    toast({
      title: "⏱️ Timer iniciado!",
      description: "Bom trabalho! O tempo está correndo.",
    });
  }, [unfreezeTimer, playSound, toast]);

  useEffect(() => {
    // Reset trigger state when enabled changes
    if (enabled && timer.isFrozen) {
      hasTriggeredRef.current = false;
    }
  }, [enabled, timer.isFrozen]);

  useEffect(() => {
    // Don't attach listeners if not enabled or not frozen
    if (!enabled || !timer.isFrozen) {
      return;
    }

    console.log('[useFirstInputTrigger] Attaching input listeners');

    // Use capture phase to catch events before they're handled by other elements
    const options: AddEventListenerOptions = { capture: true, passive: true };
    
    document.addEventListener('keydown', handleFirstInput, options);
    document.addEventListener('paste', handleFirstInput, options);
    document.addEventListener('input', handleFirstInput, options);
    document.addEventListener('change', handleFirstInput, options);

    return () => {
      console.log('[useFirstInputTrigger] Removing input listeners');
      document.removeEventListener('keydown', handleFirstInput, options as EventListenerOptions);
      document.removeEventListener('paste', handleFirstInput, options as EventListenerOptions);
      document.removeEventListener('input', handleFirstInput, options as EventListenerOptions);
      document.removeEventListener('change', handleFirstInput, options as EventListenerOptions);
    };
  }, [enabled, timer.isFrozen, handleFirstInput]);

  return {
    isFrozen: timer.isFrozen,
    isWaitingForInput: enabled && timer.isFrozen,
  };
};
