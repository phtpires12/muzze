import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { SessionContextProvider } from "@/contexts/SessionContext";
import App from "./App.tsx";
import "./index.css";

// Capturar evento de instalação PWA ANTES dos componentes montarem
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  console.log('beforeinstallprompt captured globally');
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionContextProvider>
        <App />
      </SessionContextProvider>
    </ThemeProvider>
  </StrictMode>,
);
