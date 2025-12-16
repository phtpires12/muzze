import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Script {
  id: string;
  title: string;
  content_type: string | null;
  publish_date: string | null;
  thumbnail_url?: string | null;
  reference_url?: string | null;
}

interface KanbanCardProps {
  script: Script;
  columnId: string;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function KanbanCard({ script, columnId, onClick, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: script.id,
    data: {
      type: "card" as const,
      columnId: columnId,
      script: script,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "relative bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing",
        "hover:shadow-md transition-shadow group/card",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary z-50"
      )}
      onClick={onClick}
    >
      {/* Botão delete no hover */}
      <button
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover/card:opacity-100 
                   bg-destructive/10 hover:bg-destructive/20 transition-opacity z-10"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(e);
        }}
      >
        <Trash2 className="w-3.5 h-3.5 text-destructive" />
      </button>

      {/* Mini thumbnail 16:9 com object-contain */}
      {script.thumbnail_url && (
        <div className="w-full aspect-video bg-muted rounded overflow-hidden mb-2">
          <img
            src={script.thumbnail_url}
            alt=""
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Título */}
      <h4 className="font-medium text-sm line-clamp-2 mb-1 pr-6">
        {script.title || "Sem título"}
      </h4>

      {/* Data + Tipo */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        {script.publish_date && (
          <span>{format(parseISO(script.publish_date), "d MMM", { locale: ptBR })}</span>
        )}
        {script.content_type && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {script.content_type}
          </Badge>
        )}
      </div>

      {/* Reference URL chip */}
      {script.reference_url && (
        <div className="mt-2">
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate block max-w-full">
            {script.reference_url.replace(/^https?:\/\//, '').substring(0, 25)}...
          </span>
        </div>
      )}
    </div>
  );
}
