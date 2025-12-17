import { Home, Calendar, BarChart3, Settings, PanelLeftClose, PanelLeft } from "lucide-react";
import muzzeLeafWhite from "@/assets/muzze-leaf-white.png";
import muzzeLogo from "@/assets/muzze-logo.png";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useCelebration } from "@/contexts/CelebrationContext";
import { useNavPosition } from "@/hooks/useNavPosition";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Calendário", href: "/calendario", icon: Calendar },
  { name: "Estatísticas", href: "/stats", icon: BarChart3 },
  { name: "Ajustes", href: "/profile", icon: Settings },
];

export const SideNav = () => {
  const { isSidebarCollapsed, setSidebarCollapsed } = useNavPosition();
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, endSession, saveCurrentStageTime } = useSession();
  const { playSound } = useSoundEffects(0.6);
  const { triggerFullCelebration } = useCelebration();

  // Check if we're on an active session page
  const isOnSessionPage = ['/session', '/shot-list/record', '/shot-list/review'].some(
    path => location.pathname.startsWith(path)
  );

  // Durante sessão ativa: auto-colapsa, mas permite expandir via hover
  const isInActiveSession = session.isActive && isOnSessionPage;
  const effectiveCollapsed = isInActiveSession ? !isHovering : isSidebarCollapsed;

  // Handler to intercept navigation during active session
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    // Settings (/profile) always navigates normally
    if (href === "/profile") {
      return;
    }
    
    // If no active session OR not on session page, navigate normally
    if (!session.isActive || !isOnSessionPage) {
      return;
    }
    
    // Intercept navigation and show confirmation popup
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[SideNav] Intercepting navigation - showing confirmation popup');
    setPendingNavigation(href);
    setShowEndConfirmation(true);
  };

  // Handler to confirm session end
  const handleConfirmEnd = async () => {
    playSound('complete');
    setShowEndConfirmation(false);
    
    console.log('[SideNav] Confirmed - ending session');
    
    // CRITICAL: Capture data BEFORE ending (timer will be reset)
    const capturedDuration = session.elapsedSeconds || 0;
    const capturedStage = session.stage || 'idea';
    const destination = pendingNavigation || '/';
    
    // Save current stage time
    await saveCurrentStageTime();
    
    // End session and capture result
    const result = await endSession();
    
    // Prepare celebration data
    const sessionSummary = {
      duration: result?.duration || capturedDuration,
      xpGained: result?.xpGained || 0,
      stage: capturedStage,
      autoRedirectDestination: destination,
    };
    
    const streakCount = result?.shouldShowCelebration && !result?.alreadyCounted 
      ? (result?.newStreak || 0) 
      : 0;
    
    console.log('[SideNav] Triggering global celebration, destination after:', destination);
    
    // Trigger global celebration - navigation happens in callback after all celebrations
    await triggerFullCelebration(
      sessionSummary,
      streakCount,
      result?.xpGained || 0,
      () => {
        console.log('[SideNav] Celebration callback - navigating to:', destination);
        navigate(destination);
      }
    );
    
    setPendingNavigation(null);
  };

  // Handler to cancel and continue working
  const handleCancelEnd = () => {
    setShowEndConfirmation(false);
    setPendingNavigation(null);
  };

  const handleNewSession = () => {
    localStorage.removeItem('muzze_session_state');
    navigate('/session');
  };

  const sidebarWidth = effectiveCollapsed ? 'w-16' : 'w-56';

  return (
    <>
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen z-40 transition-all duration-300 ease-out",
          "bg-background/80 backdrop-blur-xl border-r border-border/50",
          sidebarWidth
        )}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        onMouseEnter={() => isInActiveSession && setIsHovering(true)}
        onMouseLeave={() => isInActiveSession && setIsHovering(false)}
      >
        <div className="flex flex-col h-full">
          {/* Header with logo */}
          <div className={cn(
            "flex items-center h-16 border-b border-border/50 px-3",
            effectiveCollapsed ? "justify-center" : "justify-between"
          )}>
            {!effectiveCollapsed && (
              <div className="flex items-center gap-2">
                <img 
                  src={muzzeLogo} 
                  alt="Muzze" 
                  className="w-8 h-8 object-contain"
                />
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Muzze
                </span>
              </div>
            )}
            {/* Botão de colapsar só aparece fora de sessão */}
            {!isInActiveSession && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                    className="h-8 w-8 shrink-0"
                  >
                    {isSidebarCollapsed ? (
                      <PanelLeft className="w-4 h-4" />
                    ) : (
                      <PanelLeftClose className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isSidebarCollapsed ? "Expandir" : "Recolher"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Navigation items */}
          <nav className="flex-1 p-2 space-y-1">
            {navigation.map((item) => (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                      "text-muted-foreground hover:text-foreground hover:bg-accent/10",
                      effectiveCollapsed && "justify-center px-2"
                    )}
                    activeClassName="text-primary bg-primary/10 hover:bg-primary/15"
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!effectiveCollapsed && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </NavLink>
                </TooltipTrigger>
                {effectiveCollapsed && (
                  <TooltipContent side="right">
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>

          {/* New session button */}
          <div className="p-3 border-t border-border/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleNewSession}
                  className={cn(
                    "w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300",
                    effectiveCollapsed ? "h-10 w-10 rounded-full p-0" : "h-11 rounded-xl"
                  )}
                >
                  <img 
                    src={muzzeLeafWhite} 
                    alt="Nova sessão" 
                    className={cn(
                      "object-contain",
                      effectiveCollapsed ? "w-6 h-6" : "w-5 h-5 mr-2"
                    )}
                  />
                  {!effectiveCollapsed && (
                    <span className="font-medium">Nova Sessão</span>
                  )}
                </Button>
              </TooltipTrigger>
              {effectiveCollapsed && (
                <TooltipContent side="right">
                  Nova Sessão
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Alert dialog for session end confirmation */}
      <AlertDialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao encerrar, seu tempo será salvo e você verá o resumo da sua sessão criativa.
              Tem certeza que deseja finalizar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelEnd}>Continuar trabalhando</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEnd}>
              Sim, encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
