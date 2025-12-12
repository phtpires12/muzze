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
    <div className="space-y-3 px-1">
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
              "rounded-lg border border-border bg-card overflow-hidden transition-all",
              isToday && "ring-2 ring-primary/50",
              isDragOver && "bg-primary/10 ring-2 ring-primary"
            )}
            onDragOver={(e) => onDragOver?.(e, day)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop?.(e, day)}
          >
            {/* Day Header */}
            <div className={cn(
              "flex items-center justify-between px-3 py-2 border-b border-border",
              isToday ? "bg-primary/10" : "bg-muted/30"
            )}>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-semibold",
                  isToday ? "text-primary" : "text-foreground"
                )}>
                  {dayOfWeek} {dayNumber}
                </span>
                {scripts.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                    {scripts.length}
                  </Badge>
                )}
                {isToday && (
                  <Badge className="text-[10px] px-1.5 py-0 h-5 bg-primary text-primary-foreground">
                    Hoje
                  </Badge>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onAddScript?.(day)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Day Content */}
            <div className="p-2">
              {scripts.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Nenhum conteúdo agendado
                </div>
              ) : (
                <div className={cn(
                  "gap-2",
                  scripts.length === 1 ? "grid grid-cols-1" : "grid grid-cols-2"
                )}>
                  {scripts.map((script) => {
                    const cardBackground = getCardBackground(script);
                    const stageLabel = getStageLabel(script);
                    const isPosted = script.publish_status === "postado";

                    return (
                      <div
                        key={script.id}
                        className={cn(
                          "group relative rounded-lg border border-border/50 cursor-pointer hover:border-border hover:shadow-sm transition-all",
                          cardBackground,
                          isPosted && "opacity-75"
                        )}
                        onClick={() => onViewScript?.(script.id)}
                      >
                        <div className="p-3">
                          {/* Delete button */}
                          <button
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setScriptToDelete(script);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                          </button>

                          <div className="flex items-start gap-2">
                            <div className="text-muted-foreground flex-shrink-0 mt-0.5">
                              {isPosted ? "✅" : "📄"}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className={cn(
                                "text-sm font-medium truncate mb-1.5",
                                script.title?.trim() ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {script.title?.trim() || "Sem título"}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {stageLabel && (
                                  <Badge
                                    variant="outline"
                                    className={cn("text-[10px] px-1.5 py-0", getStageBadgeClasses(script) || "")}
                                  >
                                    {stageLabel}
                                  </Badge>
                                )}
                                {script.content_type && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
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
    </div>
  );
}
