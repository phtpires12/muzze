import { format } from "date-fns";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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

interface CalendarDayProps {
  day: Date;
  scripts: Script[];
  isCurrentMonth: boolean;
  isToday: boolean;
  compact?: boolean;
  compactCard?: boolean; // Smaller cards for desktop/tablet
  weekMobile?: boolean; // Ultra-compact for mobile week view
  onDayClick?: (day: Date, scripts: Script[]) => void;
  onAddScript?: (day: Date) => void;
  onDragStart?: (e: React.DragEvent, script: Script) => void;
  onDragOver?: (e: React.DragEvent, day: Date) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, day: Date) => void;
  onViewScript?: (scriptId: string) => void;
  onDeleteScript?: (e: React.MouseEvent, scriptId: string) => void;
  draggedScript?: Script | null;
  dragOverDate?: string | null;
}

const getContentTypeColor = (contentType: string | null) => {
  switch (contentType) {
    case "Reels":
      return "bg-purple-500";
    case "YouTube":
      return "bg-red-500";
    case "TikTok":
      return "bg-cyan-500";
    case "X (Twitter)":
      return "bg-blue-500";
    default:
      return "bg-primary";
  }
};

// Background translúcido do card baseado no status/etapa (prioridade: status final > etapa)
const getCardBackground = (script: Script): string => {
  // Prioridade 1: Status finais de publicação
  if (script.publish_status === "perdido") {
    return "bg-red-500/25";
  }
  if (script.publish_status === "postado") {
    return "bg-green-500/25";
  }
  
// Prioridade 2: Etapas do workflow - status explícito primeiro
  if (script.status === "editing") {
    return "bg-blue-500/25";
  }
  if (script.status === "review") {
    return "bg-purple-300/25";
  }
  if (script.status === "recording") {
    return "bg-orange-500/25";
  }
  if (script.status === "draft") {
    return "bg-purple-500/25";
  }
  // Prioridade 3: Inferências (fallback quando não há status)
  if (script.shot_list && script.shot_list.length > 0) {
    return "bg-orange-500/25";
  }
  if (script.content && script.content.length > 100) {
    return "bg-purple-500/25";
  }
  
  // Ideação: sem cor (neutro)
  return "";
};

// Label da etapa para exibir no card - status explícito primeiro
const getStageLabel = (script: Script): string | null => {
  if (script.publish_status === "perdido") return "Perdido";
  if (script.publish_status === "postado") return "Publicado";
  if (script.status === "editing") return "Edição";
  if (script.status === "review") return "Revisão";
  if (script.status === "recording") return "Gravação";
  if (script.status === "draft") return "Roteiro";
  // Inferências como fallback
  if (script.shot_list && script.shot_list.length > 0) return "Gravação";
  if (script.content && script.content.length > 100) return "Roteiro";
  return null; // Ideação não mostra label
};

// Classes do badge de etapa (cor forte + texto branco) - status explícito primeiro
const getStageBadgeClasses = (script: Script): string | null => {
  // Prioridade 1: Status finais de publicação
  if (script.publish_status === "perdido") {
    return "bg-red-500/70 text-white border-transparent";
  }
  if (script.publish_status === "postado") {
    return "bg-green-500/70 text-white border-transparent";
  }
  
  // Prioridade 2: Etapas do workflow - status explícito primeiro
  if (script.status === "editing") {
    return "bg-blue-500/70 text-white border-transparent";
  }
  if (script.status === "review") {
    return "bg-purple-400/70 text-white border-transparent";
  }
  if (script.status === "recording") {
    return "bg-orange-500/70 text-white border-transparent";
  }
  if (script.status === "draft") {
    return "bg-purple-500/70 text-white border-transparent";
  }
  
  // Prioridade 3: Inferências como fallback
  if (script.shot_list && script.shot_list.length > 0) {
    return "bg-orange-500/70 text-white border-transparent";
  }
  if (script.content && script.content.length > 100) {
    return "bg-purple-500/70 text-white border-transparent";
  }
  
  return null; // Ideação sem badge colorido
};

// Cor sólida da bolinha de status para modo ultra-compacto (weekMobile) - status explícito primeiro
const getStageIndicatorColor = (script: Script): string => {
  if (script.publish_status === "perdido") return "bg-red-500";
  if (script.publish_status === "postado") return "bg-green-500";
  if (script.status === "editing") return "bg-blue-500";
  if (script.status === "review") return "bg-purple-400";
  if (script.status === "recording") return "bg-orange-500";
  if (script.status === "draft") return "bg-purple-500";
  // Inferências como fallback
  if (script.shot_list && script.shot_list.length > 0) return "bg-orange-500";
  if (script.content && script.content.length > 100) return "bg-purple-500";
  return "bg-muted-foreground/50"; // Ideação
};

export function CalendarDay({
  day,
  scripts,
  isCurrentMonth,
  isToday,
  compact = false,
  compactCard = false,
  weekMobile = false,
  onDayClick,
  onAddScript,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onViewScript,
  onDeleteScript,
  draggedScript,
  dragOverDate,
}: CalendarDayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [scriptToDelete, setScriptToDelete] = useState<Script | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const isDragOver = dragOverDate === format(day, "yyyy-MM-dd");
  
  // Define limits based on card mode
  const maxScripts = compactCard ? 2 : 4;
  const hasMultipleCards = scripts.length > 1;

  const AUTOPLAY_INTERVAL = 3500; // 3.5 seconds between transitions
  const [autoplayProgress, setAutoplayProgress] = useState(0);

  // Reset carousel index when scripts change
  useEffect(() => {
    setCurrentCardIndex(0);
    setAutoplayProgress(0);
  }, [scripts.length]);

  // Auto-play carousel with progress indicator
  useEffect(() => {
    if (!hasMultipleCards || isHovered || weekMobile || compact) {
      return;
    }

    // Reset progress when starting
    setAutoplayProgress(0);
    
    // Progress animation (updates every 50ms for smooth animation)
    const progressInterval = setInterval(() => {
      setAutoplayProgress(prev => {
        const increment = (50 / AUTOPLAY_INTERVAL) * 100;
        return Math.min(prev + increment, 100);
      });
    }, 50);

    // Card transition
    const transitionInterval = setInterval(() => {
      setCurrentCardIndex(prev => {
        const maxIndex = Math.min(scripts.length, maxScripts) - 1;
        return prev >= maxIndex ? 0 : prev + 1;
      });
      setAutoplayProgress(0); // Reset progress on card change
    }, AUTOPLAY_INTERVAL);

    return () => {
      clearInterval(progressInterval);
      clearInterval(transitionInterval);
    };
  }, [hasMultipleCards, isHovered, weekMobile, compact, scripts.length, maxScripts, currentCardIndex]);

  // Carousel navigation handlers
  const goToPrevCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentCardIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentCardIndex(prev => Math.min(scripts.length - 1, prev + 1));
  };

  const handleCellClick = () => {
    if (scripts.length > 0 && onDayClick) {
      onDayClick(day, scripts);
    }
  };

  // Ultra-compact mode for mobile week view
  if (weekMobile) {
    return (
      <div
        className={`group relative min-h-[80px] border-r border-b border-border p-1 transition-all cursor-pointer ${
          !isCurrentMonth ? "bg-muted/10" : "bg-card"
        } ${isDragOver ? "bg-primary/20 ring-1 ring-primary ring-inset" : ""}`}
        onDragOver={(e) => onDragOver?.(e, day)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop?.(e, day)}
        onClick={handleCellClick}
      >
        {/* Data pequena */}
        <div className={`text-[10px] font-medium mb-1 ${
          isToday ? "text-primary font-bold" : !isCurrentMonth ? "text-muted-foreground/50" : "text-muted-foreground"
        }`}>
          {format(day, "d")}
        </div>

        {/* Cards ultra-compactos */}
        <div className="space-y-0.5">
          {scripts.slice(0, 2).map((script) => {
            const stageColor = getStageIndicatorColor(script);
            return (
              <div
                key={script.id}
                className="flex items-center gap-1 px-1 py-0.5 rounded bg-muted/60 hover:bg-muted transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewScript?.(script.id);
                }}
              >
                {/* Bolinha de status */}
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stageColor}`} />
                {/* Título truncado */}
                <span className="text-[9px] truncate leading-tight text-foreground/80">
                  {script.title?.trim()?.slice(0, 6) || "..."}
                </span>
              </div>
            );
          })}
          {scripts.length > 2 && (
            <div className="text-[8px] text-muted-foreground text-center opacity-70">
              +{scripts.length - 2}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (compact) {
    // Mobile/Tablet month view - compact with dots
    return (
      <div
        className={`group relative min-h-[80px] border-r border-b border-border p-2 transition-all ${
          !isCurrentMonth ? "bg-muted/10" : "bg-card"
        } ${isDragOver ? "bg-primary/20 ring-2 ring-primary ring-inset" : ""}`}
        onDragOver={(e) => onDragOver?.(e, day)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop?.(e, day)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCellClick}
      >
        <div className="flex justify-between items-start mb-2">
          <div
            className={`text-sm font-medium ${
              !isCurrentMonth ? "text-muted-foreground" : isToday ? "text-primary" : "text-foreground"
            }`}
          >
            {format(day, "d")}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className={`h-6 w-6 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}
            onClick={(e) => {
              e.stopPropagation();
              onAddScript?.(day);
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {scripts.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {scripts.slice(0, 3).map((script, idx) => (
                <div
                  key={script.id}
                  className={`w-2 h-2 rounded-full ${getContentTypeColor(script.content_type)}`}
                  style={{ zIndex: 3 - idx }}
                />
              ))}
            </div>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
              {scripts.length}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Desktop view OR compact card view (mobile week) - Notion-style cards
  return (
    <div
      className={`group relative border-r border-b border-border transition-all ${
        !isCurrentMonth ? "bg-muted/10" : "bg-card"
      } ${isDragOver ? "bg-primary/20 ring-2 ring-primary ring-inset shadow-lg" : ""} ${
        compactCard ? "min-h-[100px] p-1.5" : "min-h-[120px] p-2"
      }`}
      onDragOver={(e) => onDragOver?.(e, day)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop?.(e, day)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center justify-between gap-2 ${compactCard ? "mb-1" : "mb-2"}`}>
        {/* Day number - fixed left */}
        <span
          className={`font-medium flex-shrink-0 ${compactCard ? "text-xs" : "text-sm"} ${
            !isCurrentMonth ? "text-muted-foreground" : isToday ? "text-primary" : "text-foreground"
          }`}
        >
          {format(day, "d")}
        </span>
        
        {/* Central container: Progress bar + Indicators - takes all available space */}
        {hasMultipleCards && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Progress bar - expands to fill available width */}
            {!isHovered && !weekMobile && !compact && (
              <div className="flex-1 h-1.5 bg-muted-foreground/15 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/60 transition-all duration-75 ease-linear rounded-full"
                  style={{ width: `${autoplayProgress}%` }}
                />
              </div>
            )}
            
            {/* Navigation dots - proportional size */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {scripts.slice(0, maxScripts).map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentCardIndex(idx);
                  }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    idx === currentCardIndex 
                      ? "bg-primary scale-110" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
              
              {/* Counter - readable size */}
              <span className="text-[9px] text-muted-foreground ml-0.5 tabular-nums">
                {currentCardIndex + 1}/{Math.min(scripts.length, maxScripts)}
              </span>
            </div>
          </div>
        )}
        
        {/* Right side: Add button */}
        <Button
          size="icon"
          variant="ghost"
          className={`transition-opacity flex-shrink-0 ${isHovered ? "opacity-100" : "opacity-0"} ${
            compactCard ? "h-5 w-5" : "h-6 w-6"
          }`}
          onClick={() => onAddScript?.(day)}
        >
          <Plus className={compactCard ? "w-3 h-3" : "w-4 h-4"} />
        </Button>
      </div>

      {/* Carousel container */}
      <div className="relative">
        {/* Overflow hidden container */}
        <div className="overflow-hidden">
          {/* Track that slides */}
          <div 
            className="flex transition-transform duration-300 ease-out"
            style={{ 
              transform: hasMultipleCards ? `translateX(-${currentCardIndex * 100}%)` : undefined 
            }}
          >
            {scripts.slice(0, maxScripts).map((script) => {
              const cardBackground = getCardBackground(script);
              const stageLabel = getStageLabel(script);
              const isPosted = script.publish_status === "postado";
              return (
                <div 
                  key={script.id} 
                  className={cn(
                    hasMultipleCards && "w-full flex-shrink-0"
                  )}
                >
                  <div
                    draggable={!isPosted}
                    onDragStart={(e) => !isPosted && onDragStart?.(e, script)}
                    className={`group/card relative rounded border border-border/50 cursor-pointer hover:border-border hover:shadow-sm transition-all ${cardBackground} ${
                      draggedScript?.id === script.id ? "opacity-50" : ""
                    } ${isPosted ? "opacity-75" : ""} ${compactCard ? "text-[10px]" : "text-xs"}`}
                    onClick={() => onViewScript?.(script.id)}
                  >
                    <div className={compactCard ? "p-1.5" : "p-2"}>
                      <button
                        className={`absolute opacity-0 group-hover/card:opacity-100 transition-opacity rounded hover:bg-destructive/20 z-10 ${
                          compactCard ? "top-0.5 right-0.5 p-0.5" : "top-1 right-1 p-1"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setScriptToDelete(script);
                        }}
                      >
                        <Trash2 className={`text-muted-foreground hover:text-destructive ${
                          compactCard ? "w-2.5 h-2.5" : "w-3 h-3"
                        }`} />
                      </button>
                      
                      <div className="flex items-start gap-1.5">
                        <div className={`text-muted-foreground flex-shrink-0 ${compactCard ? "text-[8px]" : "mt-0.5"}`}>
                          {isPosted ? "✅" : "📄"}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className={`font-medium truncate ${
                            script.title?.trim() ? "text-foreground" : "text-muted-foreground"
                          } ${compactCard ? "mb-0.5" : "mb-1"}`}>
                            {script.title?.trim() || "Sem título"}
                          </div>
                          <div className="flex flex-wrap gap-0.5">
                            {stageLabel && (
                              <Badge 
                                variant="outline" 
                                className={`${compactCard ? "text-[8px] px-1 py-0" : "text-[10px] px-1.5 py-0"} ${getStageBadgeClasses(script) || ""}`}
                              >
                                {stageLabel}
                              </Badge>
                            )}
                            {!compactCard && script.content_type && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {script.content_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation arrows (hover only) */}
        {hasMultipleCards && isHovered && (
          <>
            {currentCardIndex > 0 && (
              <button
                onClick={goToPrevCard}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 z-20 
                           w-5 h-5 rounded-full bg-background/90 shadow-md border border-border
                           flex items-center justify-center
                           hover:bg-background transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            )}
            {currentCardIndex < Math.min(scripts.length, maxScripts) - 1 && (
              <button
                onClick={goToNextCard}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 z-20 
                           w-5 h-5 rounded-full bg-background/90 shadow-md border border-border
                           flex items-center justify-center
                           hover:bg-background transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </>
        )}


        {/* Extra scripts indicator */}
        {scripts.length > maxScripts && (
          <div className={`text-muted-foreground ${compactCard ? "text-[9px] pl-1" : "text-xs pl-2"} mt-1`}>
            +{scripts.length - maxScripts} mais
          </div>
        )}
      </div>

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
