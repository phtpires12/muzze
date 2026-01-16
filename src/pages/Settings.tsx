import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useNotifications } from "@/hooks/useNotifications";
import { useProfile } from "@/hooks/useProfile";
import { useTimerPopupSettings } from "@/hooks/useTimerPopupSettings";
import { useNavPosition } from "@/hooks/useNavPosition";
import { useIsMobile } from "@/hooks/use-mobile";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile } = useProfile();
  const [isInstalled, setIsInstalled] = useState(false);
  const { 
    isSupported, 
    isLoading, 
    requestPermission, 
    removeToken 
  } = useNotifications();
  const { autoPopupEnabled, setAutoPopup } = useTimerPopupSettings();
  const { navPosition, setNavPosition } = useNavPosition();
  const isMobile = useIsMobile();
  
  const notificationsEnabled = profile?.notifications_enabled ?? false;

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
  }, []);
  
  const handleNotificationChange = async (checked: boolean) => {
    if (checked) {
      const granted = await requestPermission();
      await updateProfile({ notifications_enabled: granted });
    } else {
      await removeToken();
      await updateProfile({ notifications_enabled: false });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div 
          className="max-w-2xl mx-auto px-4 py-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} className="rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <section className="bg-background py-6">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="border border-border rounded-xl bg-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold tracking-tight">Preferências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between py-1">
                <Label htmlFor="notifications" className="cursor-pointer text-sm font-medium">
                  Notificações
                </Label>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  disabled={!isSupported || isLoading}
                  onCheckedChange={handleNotificationChange}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <Label htmlFor="dark-mode" className="cursor-pointer text-sm font-medium">
                  Modo Escuro
                </Label>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="auto-popup" className="cursor-pointer text-sm font-medium">
                    Timer Popup Automático
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Abre o timer em janela separada ao sair do app
                  </span>
                </div>
                <Switch
                  id="auto-popup"
                  checked={autoPopupEnabled}
                  onCheckedChange={setAutoPopup}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Navigation Position - Desktop only */}
      {!isMobile && (
        <section className="bg-muted/30 py-6">
          <div className="max-w-2xl mx-auto px-4">
            <Card className="border border-border rounded-xl bg-background">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-muted">
                    <Monitor className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    Posição da Navegação
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Escolha onde a barra de navegação aparece no desktop
                </p>
                <RadioGroup
                  value={navPosition}
                  onValueChange={(value) => setNavPosition(value as 'bottom' | 'side')}
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="bottom" id="nav-bottom" />
                    <Label htmlFor="nav-bottom" className="cursor-pointer text-sm font-medium flex-1">
                      Inferior (padrão)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="side" id="nav-side" />
                    <Label htmlFor="nav-side" className="cursor-pointer text-sm font-medium flex-1">
                      Lateral (estilo Notion)
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* PWA Install Section */}
      {!isInstalled && (
        <section className={`${isMobile ? 'bg-muted/30' : 'bg-background'} py-6`}>
          <div className="max-w-2xl mx-auto px-4">
            <PWAInstallPrompt variant="inline" />
          </div>
        </section>
      )}
    </div>
  );
};

export default Settings;