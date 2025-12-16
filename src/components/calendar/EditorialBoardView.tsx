import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { KANBAN_COLUMNS, getColumnForStatus, getStatusForColumn, KanbanColumnId } from "@/lib/kanban-columns";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

interface Script {
  id: string;
  title: string;
  content_type: string | null;
  publish_date: string | null;
  status: string | null;
  thumbnail_url?: string | null;
  reference_url?: string | null;
}

interface EditorialBoardViewProps {
  scripts: Script[];
  onViewScript: (scriptId: string) => void;
  onDeleteScript: (e: React.MouseEvent, scriptId: string) => void;
  onUpdateStatus: (scriptId: string, newStatus: string) => void;
  stageFilter: string;
}

export function EditorialBoardView({
  scripts,
  onViewScript,
  onDeleteScript,
  onUpdateStatus,
  stageFilter,
}: EditorialBoardViewProps) {
  const { toast } = useToast();
  const [localScripts, setLocalScripts] = useState<Script[]>(scripts);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sincronizar localScripts quando scripts mudar externamente
  useEffect(() => {
    setLocalScripts(scripts);
  }, [scripts]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Evitar drag acidental
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeScript = activeId
    ? localScripts.find(s => s.id === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    // Se não soltou em lugar válido, abortar
    if (!over) return;

    // Determinar coluna de origem (do card arrastado)
    const sourceColumnId = active.data.current?.columnId as KanbanColumnId | undefined;

    // Determinar coluna de destino (pode ser coluna ou outro card)
    let targetColumnId: KanbanColumnId | undefined;

    if (over.data.current?.type === "column") {
      // Soltou diretamente na coluna
      targetColumnId = over.data.current.columnId as KanbanColumnId;
    } else if (over.data.current?.type === "card") {
      // Soltou sobre outro card - usar a coluna desse card
      targetColumnId = over.data.current.columnId as KanbanColumnId;
    }

    // Se não conseguiu determinar destino, abortar
    if (!targetColumnId) return;

    // Se mesma coluna, não fazer nada (reorder não persiste em v1)
    if (sourceColumnId === targetColumnId) return;

    const scriptId = active.id as string;
    const newStatus = getStatusForColumn(targetColumnId);

    // ROLLBACK CORRETO: guardar estado anterior ANTES do update
    const previousLocalScripts = [...localScripts];

    // 1. Update otimista
    setLocalScripts(prev =>
      prev.map(s => (s.id === scriptId ? { ...s, status: newStatus } : s))
    );

    try {
      // 2. Persistir no banco - apenas campo `status`
      const { error } = await supabase
        .from("scripts")
        .update({ status: newStatus })
        .eq("id", scriptId);

      if (error) throw error;

      // 3. Atualizar estado pai
      onUpdateStatus(scriptId, newStatus);

      // 4. Verificar se item ainda aparece com filtros atuais
      if (stageFilter !== "all" && stageFilter !== targetColumnId) {
        toast({
          title: "Status atualizado",
          description: "O item pode ter sido ocultado pelos filtros atuais.",
        });
      } else {
        toast({
          title: "Status atualizado",
          description: `Movido para ${KANBAN_COLUMNS.find(c => c.id === targetColumnId)?.label}`,
        });
      }
    } catch (error) {
      // ROLLBACK com estado anterior correto
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
        {KANBAN_COLUMNS.map(column => {
          const columnScripts = localScripts.filter(
            s => getColumnForStatus(s.status) === column.id
          );

          return (
            <KanbanColumn
              key={column.id}
              column={column}
              scripts={columnScripts}
              onViewScript={onViewScript}
              onDeleteScript={onDeleteScript}
            />
          );
        })}
      </div>

      {/* DragOverlay para visual do card sendo arrastado */}
      <DragOverlay>
        {activeId && activeScript && (
          <div className="opacity-90">
            <KanbanCard
              script={activeScript}
              columnId=""
              onClick={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
