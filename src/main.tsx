import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import { getShortBuildId } from "./lib/build-info";

// Log build version for easy debugging
console.log(`[Muzze] Build: ${getShortBuildId()}`);

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
