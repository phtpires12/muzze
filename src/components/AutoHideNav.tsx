import { Home, Calendar, BarChart3, Settings } from "lucide-react";
import muzzeLeafWhite from "@/assets/muzze-leaf-white.png";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "@/hooks/useSession";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useCelebration } from "@/contexts/CelebrationContext";
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

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Calendário", href: "/calendario", icon: Calendar },
  { name: "Stats", href: "/stats", icon: BarChart3 },
  { name: "Ajustes", href: "/profile", icon: Settings },
];

export const AutoHideNav = () => {
  const isMobile = useIsMobile();
  const [isDesktopVisible, setIsDesktopVisible] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, endSession, saveCurrentStageTime } = useSession();
  const { playSound } = useSoundEffects(0.6);
  const { triggerFullCelebration } = useCelebration();

  // Verificar se estamos numa página de sessão ativa
  const isOnSessionPage = ['/session', '/shot-list/record', '/shot-list/review'].some(
    path => location.pathname.startsWith(path)
  );

  // Construir URL de retorno baseada no estágio atual da sessão
  const getSessionReturnUrl = (): string => {
    const stage = session.stage;
    const contentId = session.contentId;
    
    if (stage === 'edit') {
      return contentId ? `/shot-list/review?scriptId=${contentId}` : '/session?stage=edit';
    }
    if (stage === 'record') {
      return contentId ? `/shot-list/record?scriptId=${contentId}` : '/session?stage=record';
    }
    
    const stageParam = stage === 'idea' ? 'idea' : stage;
    return contentId ? `/session?stage=${stageParam}&scriptId=${contentId}` : `/session?stage=${stageParam}`;
  };

  // Handler para interceptar navegação durante sessão ativa
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    // Ajustes (/profile) sempre navega normalmente
    if (href === "/profile") {
      return;
    }
    
    // Se não há sessão ativa, navegar normalmente
    if (!session.isActive) {
      return;
    }
    
    // Interceptar navegação e mostrar popup de confirmação
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[AutoHideNav] Interceptando navegação - mostrando popup de confirmação');
    setPendingNavigation(href);
    setShowEndConfirmation(true);
  };

  // Handler para confirmar encerramento
  const handleConfirmEnd = async () => {
    playSound('complete');
    setShowEndConfirmation(false);
    
    console.log('[AutoHideNav] Confirmado - encerrando sessão');
    
    // CRÍTICO: Capturar dados ANTES de encerrar (timer será resetado)
    const capturedDuration = session.elapsedSeconds || 0;
    const capturedStage = session.stage || 'idea';
    const destination = pendingNavigation || '/';
    
    // Salvar tempo da etapa atual
    await saveCurrentStageTime();
    
    // Encerrar sessão e capturar resultado
    const result = await endSession();
    
    // Preparar dados de celebração
    const sessionSummary = {
      duration: result?.duration || capturedDuration,
      xpGained: result?.xpGained || 0,
      stage: capturedStage,
      autoRedirectDestination: destination,
    };
    
    const streakCount = result?.shouldShowCelebration && !result?.alreadyCounted 
      ? (result?.newStreak || 0) 
      : 0;
    
    console.log('[AutoHideNav] Disparando celebração global, destino após:', destination);
    
    // Disparar celebração global - navegação acontece no callback após todas celebrações
    await triggerFullCelebration(
      sessionSummary,
      streakCount,
      result?.xpGained || 0,
      () => {
        console.log('[AutoHideNav] Callback de celebração - navegando para:', destination);
        navigate(destination);
      }
    );
    
    setPendingNavigation(null);
  };

  // Handler para cancelar e continuar trabalhando
  const handleCancelEnd = () => {
    setShowEndConfirmation(false);
    setPendingNavigation(null);
    
    // Se não está numa página de sessão, redirecionar de volta para a sessão
    if (!isOnSessionPage && session.isActive) {
      const returnUrl = getSessionReturnUrl();
      console.log('[AutoHideNav] Redirecionando de volta para sessão:', returnUrl);
      navigate(returnUrl);
    }
  };

  // Lógica de visibilidade:
  // - Mobile: sempre visível (fixa)
  // - Desktop fora de sessão: sempre visível (fixa)
  // - Desktop em sessão ativa: auto-hide (controlado por hover)
  const shouldAutoHide = !isMobile && isOnSessionPage && session.isActive;
  const isVisible = !shouldAutoHide || isDesktopVisible;

  const showNav = () => {
    if (isMobile) return;
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsDesktopVisible(true);
  };

  const scheduleHide = () => {
    if (isMobile) return;
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
      {/* Zona de detecção invisível - APENAS quando auto-hide está ativo */}
      {shouldAutoHide && (
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
          isVisible ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none"
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
                onClick={(e) => handleNavClick(e, item.href)}
                id={item.name === 'Calendário' ? 'tutorial-calendar' : undefined}
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
                onClick={(e) => handleNavClick(e, item.href)}
                id={item.name === 'Stats' ? 'tutorial-stats' : undefined}
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

      {/* Dialog de confirmação de encerramento */}
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
