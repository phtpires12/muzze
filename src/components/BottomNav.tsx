import { Home, Calendar, BarChart3, Settings, Timer, Video, Mic, Scissors, CheckCircle, Lightbulb } from "lucide-react";
import muzzeLeafWhite from "@/assets/muzze-leaf-white.png";
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
import { useInProgressProjects } from "@/hooks/useInProgressProjects";
import { useSessionContext } from "@/contexts/SessionContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Chaves de localStorage para limpar ao iniciar nova sessão
const SESSION_STORAGE_KEYS = ['muzze_session_state', 'muzze_global_timer'];

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
  const { projects, mostRecentProject, hasInProgressProjects, loading } = useInProgressProjects();
  const { setMuzzeSession, resetTimer } = useSessionContext();

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
    if (hasInProgressProjects && mostRecentProject) {
      trackEvent('nav_click', { action: 'continue_project', project_type: mostRecentProject.type });
      continueProject(mostRecentProject);
    } else {
      trackEvent('nav_click', { action: 'quick_start_session' });
      startSession('idea');
      navigate('/session');
    }
  };

  const continueProject = (project: typeof mostRecentProject) => {
    if (!project) return;

    // Normalizar stage para o novo padrão
    const normalizedStage = project.stage === "ideation" ? "idea" : project.stage;
    setMuzzeSession({ contentId: project.id, stage: normalizedStage as any });

    switch (project.stage) {
      case "ideation":
      case "idea":
        startSession("idea");
        navigate(`/session?stage=idea`);
        break;
      case "script":
      case "review":
        navigate(`/session?stage=${project.stage}&scriptId=${project.id}`);
        break;
      case "record":
        navigate(`/shot-list/record?scriptId=${project.id}`);
        break;
      case "edit":
        startSession("edit");
        navigate(`/session?stage=edit`);
        break;
    }
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
      // Verificar se havia sessão órfã ANTES de limpar
      const hadOrphanSession = localStorage.getItem('muzze_global_timer') !== null;
      
      // LIMPAR COMPLETAMENTE qualquer sessão anterior antes de navegar
      SESSION_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
      resetTimer();
      
      // Se havia sessão órfã, mostrar alerta educativo
      if (hadOrphanSession) {
        toast.info("Sessão anterior não finalizada", {
          description: "Não se preocupe! Seu progresso em relação à meta diária foi salvo automaticamente.",
          duration: 5000,
        });
      }
      
      navigate('/session');
    }
  };

  const handleNavClick = (name: string, href: string) => {
    trackEvent('nav_click', { destination: name });
  };

  return (
    <>
      <nav 
        className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-50"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
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
                  "h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300",
                  hasInProgressProjects && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
                  hasProgress && !hasInProgressProjects && "animate-pulse ring-2 ring-yellow-500/50 ring-offset-2 ring-offset-background"
                )}
              >
                <img src={muzzeLeafWhite} alt="Criar" className="w-8 h-8 object-contain" />
              </Button>
              {hasInProgressProjects && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
              )}
              {hasProgress && !hasInProgressProjects && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full border-2 border-background animate-pulse" />
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar Sessão Criativa</DialogTitle>
            <DialogDescription>
              {hasInProgressProjects 
                ? "Continue de onde parou ou inicie uma nova sessão"
                : "Selecione o estágio da sessão criativa"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Projetos em Andamento */}
            {hasInProgressProjects && projects.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Continuar Projeto</h3>
                {projects.slice(0, 3).map((project) => (
                  <Button
                    key={project.id}
                    variant="outline"
                    className="w-full h-auto p-4 flex items-start gap-3 hover:bg-primary/5 hover:border-primary/50"
                    onClick={() => {
                      continueProject(project);
                      setIsStageSelectOpen(false);
                    }}
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        {project.type === "idea" && <Lightbulb className="w-4 h-4 text-primary" />}
                        {project.type === "script" && <Video className="w-4 h-4 text-primary" />}
                        {project.type === "shotlist" && <Mic className="w-4 h-4 text-primary" />}
                        <span className="font-medium text-sm">{project.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Editado {formatDistanceToNow(project.updatedAt, { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {/* Iniciar Novo */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                {hasInProgressProjects ? "Ou iniciar novo:" : "Escolher Estágio"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(stageIcons).map(([stage, Icon]) => (
                  <Button
                    key={stage}
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    onClick={() => handleStageSelect(stage)}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="capitalize text-xs">{stage}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
