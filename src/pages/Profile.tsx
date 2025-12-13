import { useState, useEffect } from "react";
import { User, Mail, CheckCircle, Wrench, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { GuestsModal } from "@/components/GuestsModal";

type MenuItemWithPath = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
};

type MenuItemWithAction = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: "openGuestsModal";
};

type MenuItem = MenuItemWithPath | MenuItemWithAction;

const Profile = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { isDeveloper, isAdmin } = useUserRole();
  const { activeWorkspace, activeRole, isLoading: workspaceLoading } = useWorkspaceContext();
  const [userEmail, setUserEmail] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isGuestsModalOpen, setIsGuestsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
      if (user?.id) {
        setCurrentUserId(user.id);
      }
    };
    fetchUserEmail();
  }, []);

  // Robust permission check - works with activeRole OR owner_id fallback
  const canManageGuests =
    activeRole === "owner" ||
    activeRole === "admin" ||
    (activeWorkspace?.owner_id != null && activeWorkspace.owner_id === currentUserId);

  const displayName = profile?.username || userEmail.split('@')[0] || "Usuário";

  // Base menu items (always shown)
  const baseMenuItems: MenuItemWithPath[] = [
    { icon: User, label: "Editar perfil", path: "/edit-profile" },
    { icon: CheckCircle, label: "Meu Progresso", path: "/my-progress" },
    { icon: User, label: "Configurações", path: "/settings" },
  ];

  // Guests menu item (only for owners/admins)
  const guestsMenuItem: MenuItemWithAction = {
    icon: Users,
    label: "Gerenciar Convidados",
    action: "openGuestsModal",
  };

  // Other menu items
  const otherMenuItems: MenuItemWithPath[] = [
    { icon: Mail, label: "Mandar sugestões", path: "/send-suggestions" },
    { icon: User, label: "Ajuda", path: "/help" },
    { icon: User, label: "Termos de Uso", path: "/terms" },
    { icon: User, label: "Política de Privacidade", path: "/privacy" },
  ];

  // Dev Tools menu item (only for developers/admins)
  const devMenuItem: MenuItemWithPath[] = (isDeveloper || isAdmin) 
    ? [{ icon: Wrench, label: "Dev Tools", path: "/dev-tools" }]
    : [];

  // Build final menu with explicit insertion
  const allMenuItems: MenuItem[] = [
    ...baseMenuItems,
    ...(canManageGuests ? [guestsMenuItem] : []),
    ...otherMenuItems,
    ...devMenuItem,
  ];

  // Handle menu item click
  const handleMenuClick = (item: MenuItem) => {
    if ("action" in item && item.action === "openGuestsModal") {
      setIsGuestsModalOpen(true);
      return;
    }
    if ("path" in item) {
      navigate(item.path);
    }
  };

  // Show loading skeleton while workspace context is loading
  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div 
          className="container mx-auto p-4 max-w-2xl"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          <Skeleton className="h-40 w-full mb-6 rounded-lg" />
          <div className="space-y-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div 
        className="container mx-auto p-4 max-w-2xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <Card className="mb-6">
          <CardContent className="pt-8 pb-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
              <p className="text-muted-foreground mb-4">{userEmail}</p>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                <CheckCircle className="w-4 h-4 mr-1" />
                Assinatura ativa
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Debug info - temporary */}
        {process.env.NODE_ENV !== "production" && (
          <div className="text-xs opacity-60 p-2 bg-muted rounded mb-4 font-mono">
            role: {String(activeRole)} | ws: {String(activeWorkspace?.id?.slice(0, 8))} | owner: {String(activeWorkspace?.owner_id?.slice(0, 8))} | me: {String(currentUserId?.slice(0, 8))} | canManageGuests: {String(canManageGuests)}
          </div>
        )}

        <div className="space-y-2">
          {allMenuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-6"
              onClick={() => handleMenuClick(item)}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="text-base">{item.label}</span>
              </div>
              <span className="text-muted-foreground">›</span>
            </Button>
          ))}

          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-4 px-6 text-destructive hover:text-destructive"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/auth");
            }}
          >
            Sair
          </Button>
        </div>
      </div>

      <GuestsModal 
        open={isGuestsModalOpen} 
        onOpenChange={setIsGuestsModalOpen} 
      />
    </div>
  );
};

export default Profile;
