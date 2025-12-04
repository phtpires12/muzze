import { Button } from "@/components/ui/button";
import { Download, Share, Plus, MoreVertical, Check, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function Install() {
  const navigate = useNavigate();
  const { isInstallAvailable, isInstalled, triggerInstall } = usePWAInstall();
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar plataforma
    const userAgent = navigator.userAgent.toLowerCase();
    const iOS = /ipad|iphone|ipod/.test(userAgent);
    setIsIOS(iOS);
  }, []);

  const handleInstall = async () => {
    const installed = await triggerInstall();
    if (installed) {
      // Sucesso - navegar para home após instalação
      navigate("/");
    }
  };

  // Já instalado
  if (isInstalled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-foreground">Muzze já está instalado!</h1>
        <p className="text-muted-foreground text-center mb-8">
          Você pode acessar o app pela sua tela inicial.
        </p>
        <Button onClick={() => navigate("/")} variant="outline">
          Voltar ao app
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* Logo */}
        <img 
          src="/muzze-logo-install.png" 
          alt="Muzze" 
          className="w-24 h-24 rounded-2xl shadow-lg object-cover"
        />
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Instalar Muzze</h1>
          <p className="text-muted-foreground max-w-xs">
            Instale o Muzze na sua tela inicial para acesso rápido e experiência completa
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 w-full max-w-sm">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <span className="text-foreground">Acesso rápido pela tela inicial</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <span className="text-foreground">Funciona offline</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <span className="text-foreground">Notificações de lembrete</span>
          </div>
        </div>

        {/* Installation Instructions */}
        {isInstallAvailable ? (
          // Botão de instalação direta quando API disponível
          <Button 
            onClick={handleInstall} 
            size="lg" 
            className="gap-2 w-full max-w-sm"
          >
            <Download className="w-5 h-5" />
            Instalar Agora
          </Button>
        ) : isIOS ? (
          // Instruções para iOS (Safari)
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 max-w-sm w-full">
            <h2 className="font-semibold text-foreground">Como instalar no iPhone/iPad:</h2>
            <ol className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </span>
                <span className="text-foreground">
                  Toque no botão <Share className="inline w-4 h-4 mx-1" /> <strong>Compartilhar</strong> na barra inferior do Safari
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </span>
                <span className="text-foreground">
                  Role para baixo e toque em <Plus className="inline w-4 h-4 mx-1" /> <strong>"Adicionar à Tela de Início"</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </span>
                <span className="text-foreground">
                  Toque em <strong>"Adicionar"</strong> no canto superior direito
                </span>
              </li>
            </ol>
          </div>
        ) : (
          // Instruções para Android/Desktop (Chrome) quando prompt não disponível
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 max-w-sm w-full">
            <h2 className="font-semibold text-foreground">Como instalar:</h2>
            <ol className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </span>
                <span className="text-foreground">
                  Toque no menu <MoreVertical className="inline w-4 h-4 mx-1" /> no canto superior direito do navegador
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </span>
                <span className="text-foreground">
                  Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </span>
                <span className="text-foreground">
                  Confirme tocando em <strong>"Instalar"</strong>
                </span>
              </li>
            </ol>
          </div>
        )}

        {/* Skip button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-muted-foreground"
        >
          Continuar no navegador
        </Button>
      </div>
    </div>
  );
}
