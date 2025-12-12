import { useState, useEffect } from "react";
import { User, Mail, CheckCircle, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";

const Profile = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { isDeveloper, isAdmin } = useUserRole();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUserEmail();
  }, []);

  const displayName = profile?.username || userEmail.split('@')[0] || "Usuário";

  const menuItems = [
    { icon: User, label: "Editar perfil", path: "/edit-profile" },
    { icon: CheckCircle, label: "Meu Progresso", path: "/my-progress" },
    { icon: User, label: "Configurações", path: "/settings" },
    { icon: Mail, label: "Mandar sugestões", path: "/send-suggestions" },
    { icon: User, label: "Ajuda", path: "/help" },
    { icon: User, label: "Termos de Uso", path: "/terms" },
    { icon: User, label: "Política de Privacidade", path: "/privacy" },
  ];

  // Add Dev Tools for developers/admins
  const devMenuItem = (isDeveloper || isAdmin) 
    ? [{ icon: Wrench, label: "Dev Tools", path: "/dev-tools" }]
    : [];

  const allMenuItems = [...menuItems, ...devMenuItem];

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

        <div className="space-y-2">
          {allMenuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-6"
              onClick={() => navigate(item.path)}
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
            onClick={() => {
              // Handle logout
              console.log("Logout");
            }}
          >
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
