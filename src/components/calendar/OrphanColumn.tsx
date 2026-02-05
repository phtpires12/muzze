import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Trash2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ORPHAN_COLUMN, getOrphanOriginalStageLabel, EDITING_STEP_IDS } from "@/lib/kanban-columns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Script {
  id: string;
  title: string;
  content_type: string | null;
  publish_date: string | null;
  status: string | null;
  thumbnail_url?: string | null;
  reference_url?: string | null;
  editing_progress?: string[] | null;
  workflow_template?: string | null;
}

interface OrphanColumnProps {
  scripts: Script[];
  onViewScript: (scriptId: string) => void;
  onDeleteScript: (e: React.MouseEvent, scriptId: string) => void;
  currentWorkflowName: string;
}

export function OrphanColumn({ 
  scripts, 
  onViewScript, 
  onDeleteScript,
  currentWorkflowName,
}: OrphanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: ORPHAN_COLUMN.id,
    data: {
      type: "column" as const,
      columnId: ORPHAN_COLUMN.id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-72 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 transition-colors",
        isOver && "bg-amber-500/10 border-amber-500/40"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-2 h-2 rounded-full", ORPHAN_COLUMN.color)} />
        <h3 className="font-medium text-sm flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          {ORPHAN_COLUMN.label}
        </h3>
        <Badge variant="outline" className="ml-auto text-xs text-amber-600 border-amber-500/30">
          {scripts.length}
        </Badge>
      </div>
      
      {/* Info tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-xs text-muted-foreground mb-3 cursor-help">
              Conteúdos em etapas fora do workflow "{currentWorkflowName}"
            </p>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[250px]">
            <p className="text-xs">
              Arraste estes conteúdos para uma coluna do seu workflow atual, 
              ou altere o workflow individual de cada conteúdo.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Cards */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {scripts.map(script => (
          <OrphanCard
            key={script.id}
            script={script}
            onClick={() => onViewScript(script.id)}
            onDelete={(e) => onDeleteScript(e, script.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface OrphanCardProps {
  script: Script;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function OrphanCard({ script, onClick, onDelete }: OrphanCardProps) {
  const originalStageLabel = getOrphanOriginalStageLabel(script.status);
  
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
      columnId: ORPHAN_COLUMN.id,
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
        "relative bg-card border border-amber-500/20 rounded-lg p-3 cursor-grab active:cursor-grabbing",
        "hover:shadow-md hover:border-amber-500/40 transition-all group/card",
        isDragging && "opacity-90 scale-[1.03] shadow-xl ring-2 ring-amber-500/50 z-50"
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

      {/* Badge da etapa original */}
      <Badge 
        variant="outline" 
        className="mb-2 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30"
      >
        📍 {originalStageLabel}
      </Badge>

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

      {/* Hint para arrastar */}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-600/80">
        <ArrowRight className="w-3 h-3" />
        <span>Arraste para mover</span>
      </div>
    </div>
  );
}
