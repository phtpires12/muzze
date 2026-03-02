import { useEffect, useRef, useCallback } from 'react';

interface UseLongPressDragOptions {
  /** Delay in ms to activate drag mode (default: 350) */
  delay?: number;
  /** Vibration duration in ms (default: 15) */
  vibration?: number;
  /** Whether drag is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook to enable long-press drag on mobile devices
 * 
 * Features:
 * - Long-press only activates on drag handles (not entire editor)
 * - Normal scroll works without interference
 * - Haptic feedback on activation
 * - touch-action management to prevent scroll during drag
 */
export function useLongPressDrag(
  containerRef: React.RefObject<HTMLDivElement>,
  options: UseLongPressDragOptions = {}
) {
  const { delay = 350, vibration = 15, enabled = true } = options;
  
  const pressTimer = useRef<ReturnType<typeof setTimeout>>();
  const activeHandle = useRef<HTMLElement | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const isDragActive = useRef(false);
  
  // Movement threshold to cancel long-press (in pixels)
  const MOVE_THRESHOLD = 10;
  
  const cleanup = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = undefined;
    }
    
    if (activeHandle.current) {
      activeHandle.current.classList.remove('drag-active');
      activeHandle.current.style.touchAction = '';
    }
    
    activeHandle.current = null;
    startPos.current = null;
    isDragActive.current = false;
  }, []);
  
  useEffect(() => {
    if (!enabled) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Only activate if touched the drag handle
      const handle = target.closest('.drag-handle') as HTMLElement;
      if (!handle) return;
      
      // Store initial touch position
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
      activeHandle.current = handle;
      
      pressTimer.current = setTimeout(() => {
        if (!activeHandle.current) return;
        
        isDragActive.current = true;
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(vibration);
        }
        
        // Visual feedback
        activeHandle.current.classList.add('drag-active');
        
        // Prevent scroll during drag
        activeHandle.current.style.touchAction = 'none';
        
        // Trigger mousedown to initiate ProseMirror drag
        const currentTouch = e.touches[0];
        if (currentTouch) {
          const mouseEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: currentTouch.clientX,
            clientY: currentTouch.clientY,
            button: 0,
          });
          activeHandle.current.dispatchEvent(mouseEvent);
        }
      }, delay);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      // If drag is already active, let ProseMirror handle it
      if (isDragActive.current) {
        // Simulate mousemove for drag
        const touch = e.touches[0];
        if (touch && activeHandle.current) {
          const mouseMoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
          document.dispatchEvent(mouseMoveEvent);
        }
        return;
      }
      
      // If moved before delay, cancel (it's a scroll gesture)
      if (startPos.current && e.touches[0]) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - startPos.current.x);
        const deltaY = Math.abs(touch.clientY - startPos.current.y);
        
        if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
          cleanup();
        }
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      // If drag was active, simulate mouseup
      if (isDragActive.current && activeHandle.current) {
        const mouseUpEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        document.dispatchEvent(mouseUpEvent);
      }
      
      cleanup();
    };
    
    const handleTouchCancel = () => {
      cleanup();
    };
    
    // Add listeners to container
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchCancel);
    
    return () => {
      cleanup();
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [containerRef, delay, vibration, enabled, cleanup]);
  
  return {
    isDragActive: isDragActive.current,
    cleanup,
  };
}
