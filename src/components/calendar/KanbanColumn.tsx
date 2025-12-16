import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { cn } from "@/lib/utils";

interface Script {
  id: string;
  title: string;
  content_type: string | null;
  publish_date: string | null;
  thumbnail_url?: string | null;
  reference_url?: string | null;
}

interface KanbanColumnType {
  id: string;
  label: string;
  status: string;
  color: string;
}

interface KanbanColumnProps {
  column: KanbanColumnType;
  scripts: Script[];
  onViewScript: (scriptId: string) => void;
  onDeleteScript: (e: React.MouseEvent, scriptId: string) => void;
}

export function KanbanColumn({ column, scripts, onViewScript, onDeleteScript }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column" as const,
      columnId: column.id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[280px] max-w-[280px] bg-muted/30 rounded-lg flex-shrink-0",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <span className={cn("w-2.5 h-2.5 rounded-full", column.color)} />
        <span className="font-medium text-sm">{column.label}</span>
        <span className="text-xs text-muted-foreground ml-auto">({scripts.length})</span>
      </div>

      {/* Cards area com SortableContext */}
      <SortableContext items={scripts.map(s => s.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[200px]">
          {scripts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhum conteúdo
            </p>
          ) : (
            scripts.map(script => (
              <KanbanCard
                key={script.id}
                script={script}
                columnId={column.id}
                onClick={() => onViewScript(script.id)}
                onDelete={(e) => onDeleteScript(e, script.id)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
