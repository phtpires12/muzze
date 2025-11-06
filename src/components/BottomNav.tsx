import { Home, FileText, BarChart3, Menu, Plus } from "lucide-react";
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
];

const rightNavigation = [
  { name: "Roteiros", href: "/scripts", icon: FileText },
  { name: "Estatísticas", href: "/stats", icon: BarChart3 },
];

export const BottomNav = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const navigate = useNavigate();

  const handleCreateScript = () => {
    if (!scriptTitle.trim()) return;

    const scripts = JSON.parse(localStorage.getItem("scripts") || "[]");
    const newScript = {
      id: Date.now().toString(),
      title: scriptTitle,
      content: scriptContent,
      createdAt: new Date().toISOString(),
    };
    scripts.push(newScript);
    localStorage.setItem("scripts", JSON.stringify(scripts));

    setScriptTitle("");
    setScriptContent("");
    setIsCreateOpen(false);
    navigate("/scripts");
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-between px-4 py-3">
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
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <Plus className="w-6 h-6" />
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
            <DialogTitle>Criar Novo Roteiro</DialogTitle>
            <DialogDescription>
              Adicione um título e comece a escrever seu roteiro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Título do roteiro"
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
            />
            <Textarea
              placeholder="Conteúdo do roteiro"
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
              rows={6}
            />
            <Button onClick={handleCreateScript} className="w-full">
              Criar Roteiro
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
          <div className="mt-6 space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Configurações
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Sobre
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
