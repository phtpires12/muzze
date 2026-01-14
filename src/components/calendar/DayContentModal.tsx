import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Plus, ExternalLink, FileText, Check, CalendarDays, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useDeviceType } from "@/hooks/useDeviceType";
import { PublishStatus } from "./PublishStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { usePlanCapabilitiesOptional } from "@/contexts/PlanContext";
import { Paywall } from "@/components/Paywall";
import { isDateInCurrentWeek } from "@/lib/timezone-utils";

interface Script {
  id: string;
  title: string;
  content: string | null;
  content_type: string | null;
  publish_date: string | null;
  created_at: string;
  shot_list: string[];
  status: string | null;
  central_idea: string | null;
  reference_url: string | null;
  publish_status?: PublishStatus | null;
  published_at?: string | null;
}

interface DayContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  scripts: Script[];
  onViewScript: (scriptId: string) => void;
  onAddScript: (date: Date) => void;
  onRefresh?: () => void;
}

// Background translúcido do card (25% opacidade)
const getCardBackground = (script: Script): string => {
  if (script.publish_status === "perdido") return "bg-red-500/25";
  if (script.publish_status === "postado") return "bg-green-500/25";
  if (script.status === "editing") return "bg-blue-500/25";
  if (script.status === "recording" || (script.shot_list && script.shot_list.length > 0)) return "bg-orange-500/25";
  if (script.status === "review") return "bg-purple-300/25";
  if (script.status === "draft" || (script.content && script.content.length > 100)) return "bg-purple-500/25";
  return "";
};

// Label da etapa
const getStageLabel = (script: Script): string | null => {
  if (script.publish_status === "perdido") return "Perdido";
  if (script.publish_status === "postado") return "Publicado";
  if (script.status === "editing") return "Edição";
  if (script.status === "recording" || (script.shot_list && script.shot_list.length > 0)) return "Gravação";
  if (script.status === "review") return "Revisão";
  if (script.status === "draft" || (script.content && script.content.length > 100)) return "Roteiro";
  return null;
};

// Classes do badge de etapa (cor forte 70%)
const getStageBadgeClasses = (script: Script): string | null => {
  if (script.publish_status === "perdido") return "bg-red-500/70 text-white border-transparent";
  if (script.publish_status === "postado") return "bg-green-500/70 text-white border-transparent";
  if (script.status === "editing") return "bg-blue-500/70 text-white border-transparent";
  if (script.status === "recording" || (script.shot_list && script.shot_list.length > 0)) return "bg-orange-500/70 text-white border-transparent";
  if (script.status === "review") return "bg-purple-400/70 text-white border-transparent";
  if (script.status === "draft" || (script.content && script.content.length > 100)) return "bg-purple-500/70 text-white border-transparent";
  return null;
};

// Label dinâmico do botão de ação baseado no status
const getActionButtonLabel = (script: Script): string => {
  if (script.publish_status === "pronto_para_postar") return "Finalizar para postar";
  if (script.status === "editing") return "Continuar editando";
  if (script.status === "recording" || (script.shot_list && script.shot_list.length > 0)) return "Continuar gravando";
  if (script.status === "review") return "Terminar revisão";
  if (script.status === "draft" || (script.content && script.content.length > 100)) return "Continuar roteiro";
  return "Roteirizar essa ideia";
};

function IdeaCard({ 
  script, 
  onRefresh,
}: { 
  script: Script; 
  onRefresh?: () => void;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [showPaywall, setShowPaywall] = useState(false);
  
  const planCapabilities = usePlanCapabilitiesOptional();

  const isPosted = script.publish_status === "postado";
  const isLost = script.publish_status === "perdido";
  const isReady = script.publish_status === "pronto_para_postar";

  const handleMarkAsPosted = async () => {
    try {
      await supabase
        .from("scripts")
        .update({
          publish_status: "postado",
          published_at: new Date().toISOString(),
          status: "completed", // Garante que saia do workflow de produção
        })
        .eq("id", script.id);

      toast({
        title: "✅ Marcado como postado!",
        description: "Parabéns por publicar seu conteúdo!",
      });
      onRefresh?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const handleUnmarkAsPosted = async () => {
    const newStatus = script.shot_list && script.shot_list.length > 0 
      ? "pronto_para_postar" 
      : "planejado";
    
    try {
      await supabase
        .from("scripts")
        .update({
          publish_status: newStatus,
          published_at: null,
        })
        .eq("id", script.id);

      toast({
        title: "Status atualizado",
        description: "Conteúdo desmarcado como postado.",
      });
      onRefresh?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate) return;
    
    // Check plan limits for future dates
    const targetDateKey = format(rescheduleDate, 'yyyy-MM-dd');
    if (planCapabilities && !planCapabilities.canScheduleToDate(targetDateKey)) {
      setShowPaywall(true);
      return;
    }

    try {
      await supabase
        .from("scripts")
        .update({
          publish_date: format(rescheduleDate, "yyyy-MM-dd"),
          publish_status: script.shot_list && script.shot_list.length > 0 
            ? "pronto_para_postar" 
            : "planejado",
        })
        .eq("id", script.id);

      toast({
        title: "Data reagendada!",
        description: `Novo agendamento: ${format(rescheduleDate, "d 'de' MMMM", { locale: ptBR })}`,
      });
      setShowReschedule(false);
      setRescheduleDate(undefined);
      onRefresh?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível reagendar.",
        variant: "destructive",
      });
    }
  };

  const stageLabel = getStageLabel(script);
  const cardBackground = getCardBackground(script);

  // For Free plan, calculate which dates to disable (outside current week)
  const disableDateForFreePlan = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Always disable past dates
    if (date < today) return true;
    // If Free plan, disable dates outside current week
    if (planCapabilities?.planType === 'free') {
      const dateKey = format(date, 'yyyy-MM-dd');
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      return !isDateInCurrentWeek(dateKey, tz);
    }
    return false;
  };

  return (
    <>
      <Paywall
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        action="schedule_future"
      />
    <div className={cn(
      "p-4 rounded-lg border border-border space-y-3",
      cardBackground || "bg-card"
    )}>
      {/* Header with title and badges */}
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          isPosted 
            ? "bg-green-500/20" 
            : "bg-gradient-to-br from-primary/20 to-accent/20"
        )}>
          {isPosted ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <FileText className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold line-clamp-2",
            script.title?.trim() ? "text-foreground" : "text-muted-foreground"
          )}>
            {script.title?.trim() || "Sem título"}
          </h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {stageLabel && (
              <Badge 
                variant="outline" 
                className={`text-xs ${getStageBadgeClasses(script) || ""}`}
              >
                {stageLabel}
              </Badge>
            )}
            {script.content_type && (
              <Badge variant="secondary" className="text-xs">
                {script.content_type}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Central idea */}
      {script.central_idea && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Ideia Central:</p>
          <p className="text-sm text-foreground line-clamp-3">{script.central_idea}</p>
        </div>
      )}

      {/* Reference URL */}
      {script.reference_url && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Referência:</p>
          <a 
            href={script.reference_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">{script.reference_url}</span>
          </a>
        </div>
      )}

      {/* Action Buttons - Conditional based on status */}
      <div className="space-y-2">
        {isPosted ? (
          <>
            <Button 
              onClick={() => navigate(`/content/view/${script.id}`)}
              variant="outline"
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
            <Button 
              onClick={handleUnmarkAsPosted}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Desmarcar como postado
            </Button>
          </>
        ) : isLost ? (
          <>
            {!showReschedule ? (
              <Button 
                onClick={() => setShowReschedule(true)}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Reagendar
              </Button>
            ) : (
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !rescheduleDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {rescheduleDate ? format(rescheduleDate, "PPP", { locale: ptBR }) : "Escolha uma nova data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={rescheduleDate}
                      onSelect={setRescheduleDate}
                      disabled={disableDateForFreePlan}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {rescheduleDate && (
                  <Button onClick={handleReschedule} className="w-full">
                    Confirmar reagendamento
                  </Button>
                )}
              </div>
            )}
            <Button 
              onClick={handleMarkAsPosted}
              variant="outline"
              className="w-full"
            >
              <Check className="w-4 h-4 mr-2" />
              Marcar como postado
            </Button>
          </>
        ) : (
          <>
            <Button 
              onClick={() => navigate(`/content/view/${script.id}`)}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
            >
              {getActionButtonLabel(script)}
            </Button>
            {isReady && (
              <Button 
                onClick={handleMarkAsPosted}
                variant="outline"
                className="w-full border-green-500/30 text-green-500 hover:bg-green-500/10"
              >
                <Check className="w-4 h-4 mr-2" />
                Marcar como postado
              </Button>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}

export function DayContentModal({
  open,
  onOpenChange,
  date,
  scripts,
  onViewScript,
  onAddScript,
  onRefresh,
}: DayContentModalProps) {
  const deviceType = useDeviceType();

  if (!date) return null;

  const formattedDate = format(date, "dd/MM/yyyy");
  const titleDate = format(date, "d 'de' MMMM", { locale: ptBR });

  const content = (
    <div className="space-y-4">
      {scripts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Nenhum post agendado para este dia</p>
          <Button onClick={() => onAddScript(date)} className="mx-auto">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Post
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {scripts.map((script) => (
              <IdeaCard 
                key={script.id} 
                script={script} 
                onRefresh={onRefresh}
              />
            ))}
          </div>

          <Button onClick={() => onAddScript(date)} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Mais Posts
          </Button>
        </>
      )}
    </div>
  );

  // Mobile: Use Drawer
  if (deviceType === "mobile") {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Publicações Agendadas - {formattedDate}</DrawerTitle>
            <DrawerDescription>
              Visualize e continue o progresso dos posts agendados para este dia
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 max-h-[70vh] overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Tablet/Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publicações Agendadas - {titleDate}</DialogTitle>
          <DialogDescription>
            Visualize e continue o progresso dos posts agendados para este dia
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
