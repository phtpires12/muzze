import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Wifi, Bell, Zap } from "lucide-react";
import muzzeLogo from "@/assets/muzze-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Screen26InstallProps {
  onContinue: () => void;
}

export const Screen26Install = ({ onContinue }: Screen26InstallProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
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
    }
  };

  const benefits = [
    { icon: Smartphone, text: "Acesso rápido na tela inicial" },
    { icon: Wifi, text: "Funciona offline" },
    { icon: Bell, text: "Notificações push" },
    { icon: Zap, text: "Carregamento instantâneo" },
  ];

  if (isInstalled) {
    return (
      <div className="text-center space-y-8 py-8">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-lg">
          <img src={muzzeLogo} alt="Muzze" className="w-12 h-12" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">App Instalado! ✓</h1>
          <p className="text-muted-foreground">
            Você já pode acessar a Muzze pela sua tela inicial.
          </p>
        </div>

        <Button onClick={onContinue} size="lg" className="min-w-[200px]">
          Começar a criar
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6 py-4">
      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-lg">
        <img src={muzzeLogo} alt="Muzze" className="w-12 h-12" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Instale a Muzze</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Tenha acesso rápido ao app direto da sua tela inicial
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {benefits.map(({ icon: Icon, text }) => (
          <div 
            key={text}
            className="flex items-center gap-2 p-3 bg-card rounded-xl border border-border/50"
          >
            <Icon className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs text-left">{text}</span>
          </div>
        ))}
      </div>

      {/* Install instructions based on platform */}
      {isIOS ? (
        <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3 max-w-sm mx-auto">
          <p className="text-sm font-medium">Como instalar no iPhone:</p>
          <ol className="text-xs text-muted-foreground text-left space-y-2">
            <li className="flex items-start gap-2">
              <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-xs">1</span>
              <span>Toque no ícone de compartilhar (quadrado com seta)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-xs">2</span>
              <span>Role para baixo e toque em "Adicionar à Tela de Início"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-xs">3</span>
              <span>Confirme tocando em "Adicionar"</span>
            </li>
          </ol>
        </div>
      ) : deferredPrompt ? (
        <Button 
          onClick={handleInstall} 
          size="lg" 
          className="min-w-[200px] gap-2"
        >
          <Download className="w-4 h-4" />
          Instalar agora
        </Button>
      ) : (
        <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3 max-w-sm mx-auto">
          <p className="text-sm font-medium">Como instalar:</p>
          <ol className="text-xs text-muted-foreground text-left space-y-2">
            <li className="flex items-start gap-2">
              <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-xs">1</span>
              <span>Abra o menu do navegador (três pontos)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-xs">2</span>
              <span>Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"</span>
            </li>
          </ol>
        </div>
      )}

      <Button 
        variant="ghost" 
        onClick={onContinue}
        className="text-muted-foreground"
      >
        Continuar no navegador
      </Button>
    </div>
  );
};
