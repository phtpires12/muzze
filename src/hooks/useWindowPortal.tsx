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

      // Add immediate loading styles FIRST (before any content)
      const loadingStyle = popup.document.createElement('style');
      loadingStyle.textContent = `
        :root {
          --background: 0 0% 3.9%;
          --foreground: 0 0% 98%;
          --card: 0 0% 3.9%;
          --card-foreground: 0 0% 98%;
          --primary: 24 95% 53%;
          --primary-foreground: 0 0% 98%;
          --muted: 0 0% 14.9%;
          --muted-foreground: 0 0% 63.9%;
          --border: 0 0% 14.9%;
        }
        * { box-sizing: border-box; }
        body {
          background: hsl(0 0% 3.9%);
          color: hsl(0 0% 98%);
          margin: 0;
          padding: 0;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
        }
        #portal-root {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100%;
          background: hsl(0 0% 3.9%);
        }
      `;
      popup.document.head.appendChild(loadingStyle);

      // Copy inline <style> tags synchronously
      const inlineStyles = document.querySelectorAll('style');
      inlineStyles.forEach(style => {
        popup.document.head.appendChild(style.cloneNode(true));
      });

      // Extract CSS from loaded stylesheets and inject as inline styles
      // This avoids async loading of external CSS files
      Array.from(document.styleSheets).forEach(sheet => {
        if (sheet.href) {
          try {
            const rules = Array.from(sheet.cssRules || [])
              .map(rule => rule.cssText)
              .join('\n');
            if (rules) {
              const inlineStyle = popup.document.createElement('style');
              inlineStyle.textContent = rules;
              popup.document.head.appendChild(inlineStyle);
            }
          } catch (e) {
            // CORS blocked - fallback to link clone (will load async)
            const link = popup.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            popup.document.head.appendChild(link);
          }
        }
      });

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

      // Wait for next frame to ensure styles are applied before rendering content
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
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
