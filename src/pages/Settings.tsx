import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useNotifications } from "@/hooks/useNotifications";
import { useProfile } from "@/hooks/useProfile";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile } = useProfile();
  const [isInstalled, setIsInstalled] = useState(false);
  const { 
    permission, 
    isSupported, 
    isLoading, 
    requestPermission, 
    removeToken 
  } = useNotifications();
  
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
        <div className="container mx-auto px-4 py-4">
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
          </CardContent>
        </Card>

        {/* PWA Install Card - only shows if not installed */}
        {!isInstalled && (
          <Card>
            <CardHeader>
              <CardTitle>Instalar Aplicativo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Instale a Muzze na sua tela inicial para acesso rápido e uma experiência melhor.
              </p>
              <Button 
                onClick={() => navigate('/install')} 
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                Instalar Muzze
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Settings;
