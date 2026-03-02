import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import { getShortBuildId } from "@/core/constants";
import { BUILD_INFO } from "@/core/constants";

// Emergency SW cleanup - remove rogue firebase-messaging-sw.js before React mounts
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const reg of registrations) {
      if (reg.active?.scriptURL?.includes('firebase-messaging-sw.js')) {
        console.warn('[Muzze] Removing rogue firebase SW:', reg.active.scriptURL);
        reg.unregister().then(() => window.location.reload());
        return; // stop after first match to avoid multiple reloads
      }
    }
  });
}

// Log build version for easy debugging
console.info(`[Muzze][BUILD] v=20260209-1820 id=${getShortBuildId()} mode=${BUILD_INFO.mode} ts=${BUILD_INFO.timestamp}`);

// Cleanup legacy timer popup localStorage keys (feature removed)
localStorage.removeItem('timer-popup-activated');
localStorage.removeItem('timer-auto-popup-enabled');

// Capturar evento de instalação PWA ANTES dos componentes montarem
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  console.log('beforeinstallprompt captured globally');
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
