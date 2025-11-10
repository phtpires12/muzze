import { Home, FileText, BarChart3, Menu, Plus, Calendar, Lightbulb, Zap } from "lucide-react";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useNavigate } from "react-router-dom";

const leftNavigation = [
  { name: "Última criação", href: "/", icon: Home },
  { name: "Ideias", href: "/ideias", icon: Lightbulb },
];

const rightNavigation = [
  { name: "Calendário", href: "/calendario", icon: Calendar },
  { name: "Estatísticas", href: "/stats", icon: BarChart3 },
];

export const BottomNav = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <nav className="fixed bottom-4 left-4 right-4 bg-card/80 backdrop-blur-lg border border-border/20 rounded-3xl z-50 shadow-lg">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left navigation */}
          <div className="flex items-center gap-2">
            {leftNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground"
                activeClassName="text-primary"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Center create button */}
          <Button
            size="icon"
            onClick={() => setIsCreateOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 animate-pulse-glow"
          >
            <Zap className="w-6 h-6 text-white" />
          </Button>

          {/* Right navigation */}
          <div className="flex items-center gap-2">
            {rightNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground"
                activeClassName="text-primary"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </NavLink>
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 h-auto"
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs font-medium">Menu</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar</DialogTitle>
            <DialogDescription>
              O que você deseja criar?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => {
                setIsCreateOpen(false);
                navigate("/scripts");
              }}
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 mt-1" />
                <div className="text-left">
                  <div className="font-semibold">Roteiro</div>
                  <div className="text-sm text-muted-foreground">
                    Criar um novo roteiro de conteúdo
                  </div>
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => {
                setIsCreateOpen(false);
                navigate("/ideias");
              }}
            >
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 mt-1" />
                <div className="text-left">
                  <div className="font-semibold">Ideia</div>
                  <div className="text-sm text-muted-foreground">
                    Anotar uma nova ideia de conteúdo
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Configurações e opções do aplicativo
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                setIsMenuOpen(false);
                navigate("/profile");
              }}
            >
              Ver Perfil Completo
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
