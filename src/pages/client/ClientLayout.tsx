import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Camera, Calendar, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/core/contexts";
import { ROUTES } from "@/routes/routes";
import { cn } from "@/core/utils/utils";

interface ClientLayoutProps {
  children: ReactNode;
}

export const ClientLayout = ({ children }: ClientLayoutProps) => {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspaceContext();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(ROUTES.AUTH, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold">
            {activeWorkspace?.name?.[0]?.toUpperCase() || "M"}
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">
              {activeWorkspace?.name || "Workspace"}
            </h1>
            <p className="text-xs text-muted-foreground">Modo cliente</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="grid grid-cols-2 max-w-md mx-auto">
          <NavLink
            to={ROUTES.CLIENT_HOME}
            end
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <Camera className="h-5 w-5" />
            Para gravar
          </NavLink>
          <NavLink
            to={ROUTES.CLIENT_CALENDAR}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <Calendar className="h-5 w-5" />
            Calendário
          </NavLink>
        </div>
      </nav>
    </div>
  );
};