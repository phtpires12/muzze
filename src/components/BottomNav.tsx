import { Home, Calendar, BarChart3, Settings, Zap, Timer, Video, Mic, Scissors, CheckCircle, Lightbulb } from "lucide-react";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Calendário", href: "/calendario", icon: Calendar },
  { name: "Stats", href: "/stats", icon: BarChart3 },
  { name: "Ajustes", href: "/profile", icon: Settings },
];

const stageIcons = {
  ideation: Lightbulb,
  script: Video,
  record: Mic,
  edit: Scissors,
  review: CheckCircle,
};

export const BottomNav = () => {
  const [isStageSelectOpen, setIsStageSelectOpen] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const navigate = useNavigate();
  const { startSession } = useSession();
  const { trackEvent } = useAnalytics();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  useEffect(() => {
    const checkDailyProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('stage_times')
        .select('duration_seconds')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      const totalMinutes = (data || []).reduce((sum, item) => sum + (item.duration_seconds / 60), 0);
      setHasProgress(totalMinutes > 0);
    };

    checkDailyProgress();
  }, []);

  const handleQuickStart = () => {
    trackEvent('nav_click', { action: 'quick_start_session' });
    startSession('ideation');
    navigate('/session');
  };

  const handleStageSelect = (stage: string) => {
    trackEvent('nav_click', { action: 'start_session', stage });
    startSession(stage as any);
    setIsStageSelectOpen(false);
    navigate('/session');
  };

  const handleMouseDown = () => {
    setIsLongPress(false);
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      setIsStageSelectOpen(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (!isLongPress) {
      handleQuickStart();
    }
  };

  const handleNavClick = (name: string, href: string) => {
    trackEvent('nav_click', { destination: name });
  };

  return (
    <>
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-50">
        <div className="bg-background/40 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl px-4 py-3">
          <div className="flex items-center justify-around gap-2">
            {/* Left navigation items */}
            {navigation.slice(0, 2).map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => handleNavClick(item.name, item.href)}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-accent/10"
                activeClassName="text-primary bg-primary/10"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium hidden sm:block">{item.name}</span>
              </NavLink>
            ))}

            {/* Center session button */}
            <div className="relative">
              <Button
                size="icon"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                className={cn(
                  "h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300",
                  hasProgress && "animate-pulse ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                )}
              >
                <Zap className="w-6 h-6 text-primary-foreground" />
              </Button>
              {hasProgress && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </div>

            {/* Right navigation items */}
            {navigation.slice(2).map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => handleNavClick(item.name, item.href)}
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

      {/* Stage Selection Dialog */}
      <Dialog open={isStageSelectOpen} onOpenChange={setIsStageSelectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escolher Estágio</DialogTitle>
            <DialogDescription>
              Selecione o estágio da sessão criativa
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(stageIcons).map(([stage, Icon]) => (
              <Button
                key={stage}
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => handleStageSelect(stage)}
              >
                <Icon className="w-6 h-6" />
                <span className="capitalize">{stage}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
