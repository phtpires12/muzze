import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallAvailable, setIsInstallAvailable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado (modo standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Verificar se evento já foi capturado globalmente (em main.tsx)
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      setIsInstallAvailable(true);
    }

    // Continuar escutando por novos eventos
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallAvailable(true);
      (window as any).deferredPrompt = promptEvent;
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Detectar quando foi instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallAvailable(false);
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      // Limpar o prompt após uso (independente do resultado)
      setDeferredPrompt(null);
      setIsInstallAvailable(false);
      (window as any).deferredPrompt = null;

      if (outcome === "accepted") {
        setIsInstalled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao instalar PWA:", error);
      return false;
    }
  }, [deferredPrompt]);

  return { 
    isInstallAvailable, 
    isInstalled,
    triggerInstall 
  };
}
