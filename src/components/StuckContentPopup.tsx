import { useNavigate } from "react-router-dom";
import { Play, Pause, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StuckScript } from "@/hooks/useStuckContent";
import { cn } from "@/lib/utils";

interface StuckContentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  script: StuckScript | null;
  onPauseTemporarily: (script: StuckScript) => void;
}

export function StuckContentPopup({
  open,
  onOpenChange,
  script,
  onPauseTemporarily,
}: StuckContentPopupProps) {
  const navigate = useNavigate();

  // Só abre o modal se houver um script válido
  const isOpen = open && !!script;

  // Early return se não há script - retorna Dialog fechado para evitar overlay órfão
  if (!script) {
    return <Dialog open={false} onOpenChange={onOpenChange} />;
  }

  // Agora sabemos que script existe, podemos acessar suas propriedades
  const getUrgencyStyles = () => {
    switch (script.urgencyLevel) {
      case "critical":
        return {
          badge: "bg-destructive/10 text-destructive border-destructive/20",
          icon: "text-destructive",
          label: "Urgente",
        };
      case "urgent":
        return {
          badge: "bg-orange-500/10 text-orange-600 border-orange-500/20",
          icon: "text-orange-500",
          label: "Atenção",
        };
      default:
        return {
          badge: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
          icon: "text-yellow-500",
          label: "Aviso",
        };
    }
  };

  const urgencyStyles = getUrgencyStyles();

  const handleContinueWorking = () => {
    // Navigate based on script status
    if (script.status === "editing") {
      navigate(`/session?stage=edit&scriptId=${script.id}`);
    } else if (script.status === "review") {
      navigate(`/session?stage=review&scriptId=${script.id}`);
    } else if (script.status === "recording") {
      navigate(`/shot-list/record?scriptId=${script.id}`);
    } else if (script.status === "draft") {
      navigate(`/session?stage=script&scriptId=${script.id}`);
    } else {
      navigate(`/session?stage=idea&scriptId=${script.id}`);
    }
    onOpenChange(false);
  };

  const handlePause = () => {
    onPauseTemporarily(script);
    onOpenChange(false);
  };

  const getStageLabel = () => {
    switch (script.status) {
      case "editing":
        return "edição";
      case "review":
        return "revisão";
      case "recording":
        return "gravação";
      case "draft":
        return "roteiro";
      default:
        return "ideação";
    }
  };

  const content = (
    <div className="space-y-5 py-2">
      {/* Urgency badge */}
      <div className="flex justify-center">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium",
            urgencyStyles.badge
          )}
        >
          <AlertTriangle className={cn("w-3.5 h-3.5", urgencyStyles.icon)} />
          {urgencyStyles.label}
        </div>
      </div>

      {/* Info */}
      <div className="text-center space-y-1">
        <p className="text-muted-foreground">
          Está na etapa de{" "}
          <span className="font-medium text-foreground">{getStageLabel()}</span> há{" "}
          <span className="font-medium text-foreground">{script.daysSinceUpdate} dias</span>
        </p>
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Faltam {script.daysUntilPublish} dias para a publicação
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button onClick={handleContinueWorking} className="w-full" size="lg">
          <Play className="w-4 h-4 mr-2" />
          Continuar trabalhando
        </Button>

        <Button
          onClick={handlePause}
          variant="ghost"
          className="w-full text-muted-foreground"
        >
          <Pause className="w-4 h-4 mr-2" />
          Pausado por enquanto
        </Button>
      </div>
    </div>
  );

  const title = `"${script.title}" está parado`;
  const description = "Precisa de ajuda para avançar nesse conteúdo?";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] max-w-md max-h-[80vh] overflow-auto p-4 sm:p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-center px-4">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

