import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PublicationKanbanCard } from "./PublicationKanbanCard";
import { cn } from "@/lib/utils";

interface Script {
  id: string;
  title: string;
  content_type: string | null;
  publish_date: string | null;
  publish_status?: string | null;
  status?: string | null;
  thumbnail_url?: string | null;
  reference_url?: string | null;
}

interface KanbanColumnType {
  id: string;
  label: string;
  status: string;
  color: string;
}

interface PublicationKanbanColumnProps {
  column: KanbanColumnType;
  scripts: Script[];
  onViewScript: (scriptId: string) => void;
  onDeleteScript: (e: React.MouseEvent, scriptId: string) => void;
  onReschedule: (scriptId: string) => void;
}

export function PublicationKanbanColumn({ 
  column, 
  scripts, 
  onViewScript, 
  onDeleteScript,
  onReschedule 
}: PublicationKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column" as const,
      columnId: column.id,
    },
  });

  const isLostColumn = column.id === 'lost';
  const isScheduledColumn = column.id === 'scheduled';

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

      {/* Cards area */}
      <SortableContext items={scripts.map(s => s.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[200px]">
          {scripts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {isLostColumn ? "Nenhum conteúdo perdido 🎉" : "Nenhum conteúdo"}
            </p>
          ) : (
            scripts.map(script => (
              <PublicationKanbanCard
                key={script.id}
                script={script}
                columnId={column.id}
                onClick={() => onViewScript(script.id)}
                onDelete={(e) => onDeleteScript(e, script.id)}
                onReschedule={() => onReschedule(script.id)}
                isLostColumn={isLostColumn}
                isScheduledColumn={isScheduledColumn}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
