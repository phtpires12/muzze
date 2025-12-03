import { Home, Calendar, BarChart3, Settings } from "lucide-react";
import muzzeLeafWhite from "@/assets/muzze-leaf-white.png";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Calendário", href: "/calendario", icon: Calendar },
  { name: "Stats", href: "/stats", icon: BarChart3 },
  { name: "Ajustes", href: "/profile", icon: Settings },
];

export const AutoHideNav = () => {
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const showNav = () => {
    // Cancelar timer de esconder se existir
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsVisible(true);
  };

  const scheduleHide = () => {
    // Agendar para esconder após 300ms
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  const cancelHide = () => {
    // Cancelar agendamento de esconder
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Zona de detecção invisível (sempre presente) */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-[50px] z-40 pointer-events-auto"
        onMouseEnter={showNav}
        onTouchStart={showNav}
      />
      
      {/* Barra de navegação animada */}
      <nav 
        className={cn(
          "fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-50 transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none"
        )}
        onMouseLeave={scheduleHide}
        onMouseEnter={cancelHide}
        onTouchEnd={scheduleHide}
      >
        <div className="bg-background/40 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl px-4 py-3">
          <div className="flex items-center justify-around gap-2">
            {/* Left navigation items */}
            {navigation.slice(0, 2).map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-accent/10"
                activeClassName="text-primary bg-primary/10"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium hidden sm:block">{item.name}</span>
              </NavLink>
            ))}

            {/* Center session button */}
            <Button
              size="icon"
              onClick={() => navigate('/session')}
              className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300"
            >
              <img src={muzzeLeafWhite} alt="Criar" className="w-8 h-8 object-contain" />
            </Button>

            {/* Right navigation items */}
            {navigation.slice(2).map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-accent/10"
                activeClassName="text-primary bg-primary/10"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium hidden sm:block">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};
