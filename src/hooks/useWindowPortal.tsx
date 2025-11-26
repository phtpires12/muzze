import { useState, useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface UseWindowPortalOptions {
  width?: number;
  height?: number;
  title?: string;
}

export function useWindowPortal(options: UseWindowPortalOptions = {}) {
  const { width = 450, height = 400, title = 'Timer' } = options;
  const [isOpen, setIsOpen] = useState(false);
  const windowRef = useRef<Window | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize broadcast channel for popup coordination
  useEffect(() => {
    channelRef.current = new BroadcastChannel('muzze-timer-channel');
    
    // Close any orphan popups on mount
    channelRef.current.postMessage({ type: 'close-orphan-popups' });
    
    return () => {
      channelRef.current?.close();
    };
  }, []);

  const openPortal = () => {
    // If window already exists and is not closed, just focus it
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.focus();
      return;
    }

    // Close any existing popups before opening new one
    channelRef.current?.postMessage({ type: 'close-all-popups' });

    // Small delay to allow existing popups to close
    setTimeout(() => {
      // Open new popup window
      const popup = window.open(
        '',
        'timer-popup',
        `width=${width},height=${height},left=100,top=100,resizable=yes,scrollbars=no`
      );

      if (!popup) {
        console.error('Failed to open popup - might be blocked');
        return;
      }

      windowRef.current = popup;

      // Copy all styles to popup
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
      styles.forEach(styleElement => {
        const clonedStyle = styleElement.cloneNode(true) as HTMLElement;
        popup.document.head.appendChild(clonedStyle);
      });

      // Set body styles
      popup.document.body.style.margin = '0';
      popup.document.body.style.padding = '0';
      popup.document.body.style.overflow = 'hidden';
      popup.document.body.style.backgroundColor = 'hsl(var(--background))';

      // Create container for portal
      const container = popup.document.createElement('div');
      container.id = 'portal-root';
      container.style.width = '100%';
      container.style.height = '100vh';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      popup.document.body.appendChild(container);
      containerRef.current = container;

      // Set title
      popup.document.title = title;

      // Setup broadcast channel in popup to listen for close messages
      const channelScript = popup.document.createElement('script');
      channelScript.textContent = `
        const channel = new BroadcastChannel('muzze-timer-channel');
        channel.onmessage = (event) => {
          if (event.data.type === 'close-all-popups' || event.data.type === 'close-orphan-popups') {
            window.close();
          }
        };
      `;
      popup.document.head.appendChild(channelScript);

      // Handle popup close
      popup.onbeforeunload = () => {
        setIsOpen(false);
        windowRef.current = null;
        containerRef.current = null;
      };

      setIsOpen(true);
    }, 50);
  };

  const closePortal = () => {
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
    }
    windowRef.current = null;
    containerRef.current = null;
    setIsOpen(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closePortal();
    };
  }, []);

  // Portal component
  const Portal = ({ children }: { children: ReactNode }) => {
    if (!isOpen || !containerRef.current) return null;
    return createPortal(children, containerRef.current);
  };

  return { isOpen, openPortal, closePortal, Portal };
}
