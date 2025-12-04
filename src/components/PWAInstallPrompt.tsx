import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";
import muzzeLogo from "@/assets/muzze-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallPromptProps {
  variant?: "popup" | "inline";
  onDismiss?: () => void;
}

const PWAInstallPrompt = ({ variant = "popup", onDismiss }: PWAInstallPromptProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Capture the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if dismissed recently (don't show for 24h)
    const dismissedAt = localStorage.getItem("pwa_prompt_dismissed");
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      if (now - dismissedTime < 24 * 60 * 60 * 1000) {
        setIsVisible(false);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // For iOS, navigate to install page with instructions
      window.location.href = "/install";
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
    onDismiss?.();
  };

  // Don't render if installed or dismissed
  if (isInstalled || !isVisible) return null;

  // For inline variant (Settings page), always show if not installed
  if (variant === "inline") {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <img src={muzzeLogo} alt="Muzze" className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Instalar Muzze</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Adicione a Muzze à sua tela inicial para acesso rápido e uma experiência melhor.
              </p>
              <Button 
                onClick={handleInstall} 
                className="w-full mt-3 gap-2"
              >
                <Download className="w-4 h-4" />
                Instalar App
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Popup variant (Home page)
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl border border-border/50 bg-card flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Instalar Muzze</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    Adicione a Muzze à sua tela inicial para acesso rápido e uma experiência melhor.
                  </p>
                </div>
                <button 
                  onClick={handleDismiss}
                  className="p-1 -mr-1 -mt-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Button 
                onClick={handleInstall} 
                size="sm"
                className="w-full mt-2.5 gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar App
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
