import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface Script {
  id: string;
  title: string;
  content: string | null;
  content_type: string | null;
  publish_date: string | null;
  created_at: string;
  shot_list: string[];
  status: string | null;
}

interface CalendarDayProps {
  day: Date;
  scripts: Script[];
  isCurrentMonth: boolean;
  isToday: boolean;
  compact?: boolean;
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

const getStageInfo = (script: Script): { label: string; color: string } => {
  // Prioridade: shot_list → review status → content → ideation
  if (script.shot_list && script.shot_list.length > 0) {
    return { label: "Gravação", color: "bg-orange-500" };
  }
  if (script.status === "review") {
    return { label: "Revisão", color: "bg-blue-500" };
  }
  if (script.content && script.content.length > 100) {
    return { label: "Roteiro", color: "bg-green-500" };
  }
  return { label: "Ideação", color: "bg-gray-400" };
};

export function CalendarDay({
  day,
  scripts,
  isCurrentMonth,
  isToday,
  compact = false,
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
  const isDragOver = dragOverDate === format(day, "yyyy-MM-dd");

  const handleCellClick = () => {
    if (scripts.length > 0 && onDayClick) {
      onDayClick(day, scripts);
    }
  };

  if (compact) {
    // Mobile/Tablet view - compact with dots
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

  // Desktop view - Notion-style cards
  return (
    <div
      className={`group relative min-h-[120px] border-r border-b border-border p-2 transition-all ${
        !isCurrentMonth ? "bg-muted/10" : "bg-card"
      } ${isDragOver ? "bg-primary/20 ring-2 ring-primary ring-inset shadow-lg" : ""}`}
      onDragOver={(e) => onDragOver?.(e, day)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop?.(e, day)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
          onClick={() => onAddScript?.(day)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-1.5">
        {scripts.slice(0, 4).map((script) => {
          const stageInfo = getStageInfo(script);
          return (
            <div
              key={script.id}
              draggable
              onDragStart={(e) => onDragStart?.(e, script)}
              className={`group/card relative text-xs p-2 rounded bg-card border border-border/50 cursor-pointer hover:border-border hover:shadow-sm transition-all ${
                draggedScript?.id === script.id ? "opacity-50" : ""
              }`}
              onClick={() => onViewScript?.(script.id)}
            >
              <div className="flex items-start gap-2">
                <div className="text-muted-foreground mt-0.5 flex-shrink-0">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-foreground mb-1.5">
                    {script.title}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge 
                      className={`${stageInfo.color} text-white text-[10px] px-1.5 py-0 border-0`}
                    >
                      {stageInfo.label}
                    </Badge>
                    {script.content_type && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {script.content_type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {scripts.length > 4 && (
          <div className="text-xs text-muted-foreground pl-2">+{scripts.length - 4} mais</div>
        )}
      </div>
    </div>
  );
}
