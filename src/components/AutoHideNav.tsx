import { Home, Calendar, BarChart3, Settings } from "lucide-react";
import muzzeLeafWhite from "@/assets/muzze-leaf-white.png";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Calendário", href: "/calendario", icon: Calendar },
  { name: "Stats", href: "/stats", icon: BarChart3 },
  { name: "Ajustes", href: "/profile", icon: Settings },
];

export const AutoHideNav = () => {
  const isMobile = useIsMobile();
  const [isDesktopVisible, setIsDesktopVisible] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // No mobile, sempre visível. No desktop, controlado por hover
  const isVisible = isMobile || isDesktopVisible;

  const showNav = () => {
    if (isMobile) return; // No mobile não precisa controlar
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsDesktopVisible(true);
  };

  const scheduleHide = () => {
    if (isMobile) return; // No mobile não esconde
    hideTimerRef.current = setTimeout(() => {
      setIsDesktopVisible(false);
    }, 300);
  };

  const cancelHide = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Zona de detecção invisível - APENAS no desktop */}
      {!isMobile && (
        <div 
          className="fixed left-0 right-0 z-40 pointer-events-auto"
          style={{ 
            bottom: 0, 
            height: 'calc(env(safe-area-inset-bottom, 0px) + 50px)' 
          }}
          onMouseEnter={showNav}
        />
      )}
      
      {/* Barra de navegação */}
      <nav 
        className={cn(
          "fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-50 transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none"
        )}
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
        onMouseLeave={!isMobile ? scheduleHide : undefined}
        onMouseEnter={!isMobile ? cancelHide : undefined}
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
              onClick={() => {
                localStorage.removeItem('muzze_session_state');
                navigate('/session');
              }}
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
