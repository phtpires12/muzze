import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

interface Script {
  id: string;
  title: string;
  content: string | null;
  content_type: string | null;
  publish_date: string | null;
  created_at: string;
  shot_list: string[];
  status: string | null;
  publish_status?: string | null;
  published_at?: string | null;
}

interface MobileWeekAgendaViewProps {
  weekDays: Date[];
  getScriptsForDate: (date: Date) => Script[];
  onViewScript?: (scriptId: string) => void;
  onAddScript?: (day: Date) => void;
  onDeleteScript?: (e: React.MouseEvent, scriptId: string) => void;
  onDragStart?: (e: React.DragEvent, script: Script) => void;
  onDragOver?: (e: React.DragEvent, day: Date) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, day: Date) => void;
  draggedScript?: Script | null;
  dragOverDate?: string | null;
}

// Background translúcido do card baseado no status/etapa
const getCardBackground = (script: Script): string => {
  if (script.publish_status === "perdido") return "bg-red-500/25";
  if (script.publish_status === "postado") return "bg-green-500/25";
  if (script.status === "editing") return "bg-blue-500/25";
  if (script.status === "recording" || (script.shot_list && script.shot_list.length > 0)) return "bg-orange-500/25";
  if (script.status === "review") return "bg-purple-300/25";
  if (script.status === "draft" || (script.content && script.content.length > 100)) return "bg-purple-500/25";
  return "bg-muted/30";
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

// Classes do badge de etapa
const getStageBadgeClasses = (script: Script): string | null => {
  if (script.publish_status === "perdido") return "bg-red-500/70 text-white border-transparent";
  if (script.publish_status === "postado") return "bg-green-500/70 text-white border-transparent";
  if (script.status === "editing") return "bg-blue-500/70 text-white border-transparent";
  if (script.status === "recording" || (script.shot_list && script.shot_list.length > 0)) return "bg-orange-500/70 text-white border-transparent";
  if (script.status === "review") return "bg-purple-400/70 text-white border-transparent";
  if (script.status === "draft" || (script.content && script.content.length > 100)) return "bg-purple-500/70 text-white border-transparent";
  return null;
};

export function MobileWeekAgendaView({
  weekDays,
  getScriptsForDate,
  onViewScript,
  onAddScript,
  onDeleteScript,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverDate,
}: MobileWeekAgendaViewProps) {
  const [scriptToDelete, setScriptToDelete] = useState<Script | null>(null);
  const dayAbbreviations = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

  return (
    <div className="space-y-1 px-2">
      {weekDays.map((day) => {
        const scripts = getScriptsForDate(day);
        const isToday = isSameDay(day, new Date());
        const isDragOver = dragOverDate === format(day, "yyyy-MM-dd");
        const dayOfWeek = dayAbbreviations[day.getDay()];
        const dayNumber = format(day, "d");

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "rounded-md border border-border/50 bg-card/50 overflow-hidden transition-all",
              isToday && "ring-1 ring-primary/50 bg-primary/5",
              isDragOver && "bg-primary/10 ring-1 ring-primary"
            )}
            onDragOver={(e) => onDragOver?.(e, day)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop?.(e, day)}
          >
            {/* Day Header - Ultra Compacto */}
            <div className={cn(
              "flex items-center justify-between px-2 py-1",
              isToday ? "bg-primary/10" : ""
            )}>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-xs font-semibold",
                  isToday ? "text-primary" : "text-foreground"
                )}>
                  {dayOfWeek} {dayNumber}
                </span>
                {isToday && (
                  <span className="text-[9px] font-medium text-primary">
                    •
                  </span>
                )}
                {scripts.length > 0 && (
                  <span className="text-[9px] text-muted-foreground">
                    ({scripts.length})
                  </span>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                onClick={() => onAddScript?.(day)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {/* Day Content */}
            {scripts.length === 0 ? (
              <div className="px-2 pb-1">
                <span className="text-[10px] text-muted-foreground/50">—</span>
              </div>
            ) : (
              <div 
                className="flex gap-2 overflow-x-auto px-2 pb-2 pt-0.5 snap-x snap-mandatory touch-pan-x"
                style={{ 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
                onTouchStart={(e) => e.stopPropagation()}
              >
                {scripts.map((script) => {
                  const cardBackground = getCardBackground(script);
                  const stageLabel = getStageLabel(script);
                  const isPosted = script.publish_status === "postado";

                  return (
                    <div
                      key={script.id}
                      className={cn(
                        "group relative snap-start flex-shrink-0 rounded-md border border-border/50 cursor-pointer hover:border-border transition-all",
                        cardBackground,
                        isPosted && "opacity-70",
                        // Largura: se só 1 item, ocupa tudo; se mais, largura fixa para mostrar preview
                        scripts.length === 1 ? "w-full" : "w-[220px]"
                      )}
                      onClick={() => onViewScript?.(script.id)}
                    >
                      <div className="p-2">
                        {/* Delete button */}
                        <button
                          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/20 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setScriptToDelete(script);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>

                        <div className="flex items-start gap-1.5">
                          <div className="text-muted-foreground flex-shrink-0 text-xs">
                            {isPosted ? "✅" : "📄"}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className={cn(
                              "text-xs font-medium truncate mb-1",
                              script.title?.trim() ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {script.title?.trim() || "Sem título"}
                            </div>
                            <div className="flex flex-wrap gap-0.5">
                              {stageLabel && (
                                <Badge
                                  variant="outline"
                                  className={cn("text-[9px] px-1 py-0 h-4", getStageBadgeClasses(script) || "")}
                                >
                                  {stageLabel}
                                </Badge>
                              )}
                              {script.content_type && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                  {script.content_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!scriptToDelete} onOpenChange={(open) => !open && setScriptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conteúdo?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir "{scriptToDelete?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                if (scriptToDelete) {
                  onDeleteScript?.(e, scriptToDelete.id);
                  setScriptToDelete(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSS para esconder scrollbar */}
      <style>{`
        .snap-x::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
