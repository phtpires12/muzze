import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  PUBLICATION_COLUMNS, 
  getPublicationColumnForStatus, 
  getPublishStatusForColumn,
  isPublicationDragAllowed,
  PublicationColumnId 
} from "@/lib/kanban-columns";
import { PublicationKanbanColumn } from "./PublicationKanbanColumn";
import { PublicationKanbanCard } from "./PublicationKanbanCard";
import { useLongPressSensors, triggerHapticFeedback } from "@/hooks/useLongPressSensors";

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

interface PublicationBoardViewProps {
  scripts: Script[];
  onViewScript: (scriptId: string) => void;
  onDeleteScript: (e: React.MouseEvent, scriptId: string) => void;
  onUpdatePublishStatus: (scriptId: string, newStatus: string) => void;
  onReschedule: (scriptId: string) => void;
}

export function PublicationBoardView({
  scripts,
  onViewScript,
  onDeleteScript,
  onUpdatePublishStatus,
  onReschedule,
}: PublicationBoardViewProps) {
  const { toast } = useToast();
  // Filtrar apenas scripts com publish_date
  const publicationScripts = scripts.filter(s => s.publish_date !== null);
  const [localScripts, setLocalScripts] = useState<Script[]>(publicationScripts);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setLocalScripts(scripts.filter(s => s.publish_date !== null));
  }, [scripts]);

  // Sensor otimizado: long press no mobile, drag imediato no desktop
  const sensors = useLongPressSensors();

  const activeScript = activeId
    ? localScripts.find(s => s.id === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Feedback háptico no mobile
    triggerHapticFeedback();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const sourceColumnId = active.data.current?.columnId as PublicationColumnId | undefined;

    let targetColumnId: PublicationColumnId | undefined;

    if (over.data.current?.type === "column") {
      targetColumnId = over.data.current.columnId as PublicationColumnId;
    } else if (over.data.current?.type === "card") {
      targetColumnId = over.data.current.columnId as PublicationColumnId;
    }

    if (!targetColumnId || !sourceColumnId) return;
    if (sourceColumnId === targetColumnId) return;

    // Validar se o movimento é permitido
    const validation = isPublicationDragAllowed(sourceColumnId, targetColumnId);
    
    if (!validation.allowed) {
      toast({
        title: "❌ Movimento não permitido",
        description: validation.reason,
        variant: "destructive",
      });
      return;
    }

    const scriptId = active.id as string;
    const newPublishStatus = getPublishStatusForColumn(targetColumnId);

    const previousLocalScripts = [...localScripts];

    // Update otimista
    setLocalScripts(prev =>
      prev.map(s => (s.id === scriptId ? { ...s, publish_status: newPublishStatus } : s))
    );

    try {
      const updateData: { publish_status: string; published_at?: string | null } = { 
        publish_status: newPublishStatus 
      };
      
      // Se movendo para "postado", definir published_at
      if (targetColumnId === 'posted') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("scripts")
        .update(updateData)
        .eq("id", scriptId);

      if (error) throw error;

      onUpdatePublishStatus(scriptId, newPublishStatus);

      toast({
        title: "✅ Status atualizado",
        description: `Movido para ${PUBLICATION_COLUMNS.find(c => c.id === targetColumnId)?.label}`,
      });
    } catch (error) {
      setLocalScripts(previousLocalScripts);
      toast({
        title: "Erro ao mover",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
        {PUBLICATION_COLUMNS.map(column => {
          const columnScripts = localScripts.filter(
            s => getPublicationColumnForStatus(s.publish_status) === column.id
          );

          return (
            <PublicationKanbanColumn
              key={column.id}
              column={column}
              scripts={columnScripts}
              onViewScript={onViewScript}
              onDeleteScript={onDeleteScript}
              onReschedule={onReschedule}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeId && activeScript && (
          <div className="opacity-90">
            <PublicationKanbanCard
              script={activeScript}
              columnId=""
              onClick={() => {}}
              onDelete={() => {}}
              onReschedule={() => {}}
              isLostColumn={false}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
