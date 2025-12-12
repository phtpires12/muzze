import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useNotifications } from "@/hooks/useNotifications";
import { useProfile } from "@/hooks/useProfile";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { GuestsModal } from "@/components/GuestsModal";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile } = useProfile();
  const { activeRole, activeWorkspace, isLoading: workspaceLoading } = useWorkspaceContext();
  const [isInstalled, setIsInstalled] = useState(false);
  const [isGuestsModalOpen, setIsGuestsModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { 
    permission, 
    isSupported, 
    isLoading, 
    requestPermission, 
    removeToken 
  } = useNotifications();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);
  
  const notificationsEnabled = profile?.notifications_enabled ?? false;
  // Check both activeRole and direct owner_id comparison
  const isOwner = activeRole === 'owner' || (activeWorkspace?.owner_id === currentUserId && currentUserId !== null);

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

  // Show loading skeleton while workspace data loads
  if (workspaceLoading) {
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
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          </CardContent>
        </Card>

        {/* Convidados - apenas para owners */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsGuestsModalOpen(true)}
              >
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Convidados
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PWA Install - only shows if not installed */}
        {!isInstalled && <PWAInstallPrompt variant="inline" />}
      </div>

      <GuestsModal 
        open={isGuestsModalOpen} 
        onOpenChange={setIsGuestsModalOpen} 
      />
    </div>
  );
};

export default Settings;
