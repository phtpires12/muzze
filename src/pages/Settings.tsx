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
      <div className="border-b border-border bg-card">
        <div 
          className="container mx-auto px-4 py-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Configurações</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Preferências</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="cursor-pointer">
                Notificações
              </Label>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                disabled={!isSupported || isLoading}
                onCheckedChange={handleNotificationChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="cursor-pointer">
                Modo Escuro
              </Label>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="auto-popup" className="cursor-pointer">
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

            {/* Navigation Position - Desktop only */}
            {!isMobile && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">
                    Posição da Navegação
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Escolha onde a barra de navegação aparece no desktop
                </p>
                <RadioGroup
                  value={navPosition}
                  onValueChange={(value) => setNavPosition(value as 'bottom' | 'side')}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bottom" id="nav-bottom" />
                    <Label htmlFor="nav-bottom" className="cursor-pointer text-sm">
                      Inferior (padrão)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="side" id="nav-side" />
                    <Label htmlFor="nav-side" className="cursor-pointer text-sm">
                      Lateral (estilo Notion)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PWA Install - only shows if not installed */}
        {!isInstalled && <PWAInstallPrompt variant="inline" />}
      </div>
    </div>
  );
};

export default Settings;