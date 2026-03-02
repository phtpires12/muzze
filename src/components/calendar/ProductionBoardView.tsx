import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/core/hooks';
import { 
  getProductionColumnForStatus, 
  getStatusForProductionColumn, 
  ProductionColumnId,
  getOrderedProductionColumns,
  getOrphanScripts,
  ORPHAN_COLUMN,
  PRODUCTION_COLUMNS,
} from '@/core/constants';
import { ProductionKanbanColumn } from "./ProductionKanbanColumn";
import { ProductionKanbanCard } from "./ProductionKanbanCard";
import { OrphanColumn } from "./OrphanColumn";
import { useLongPressSensors, triggerHapticFeedback } from '@/core/hooks';
import { useWorkflowTemplate } from '@/core/hooks';

interface Script {
  id: string;
  title: string;
  content_type: string | null;
  publish_date: string | null;
  status: string | null;
  thumbnail_url?: string | null;
  reference_url?: string | null;
  publish_status?: string | null;
  workflow_template?: string | null;
}

interface ProductionBoardViewProps {
  scripts: Script[];
  onViewScript: (scriptId: string) => void;
  onDeleteScript: (e: React.MouseEvent, scriptId: string) => void;
  onUpdateStatus: (scriptId: string, newStatus: string) => void;
}

export function ProductionBoardView({
  scripts,
  onViewScript,
  onDeleteScript,
  onUpdateStatus,
}: ProductionBoardViewProps) {
  const { toast } = useToast();
  const { stages, currentTemplate } = useWorkflowTemplate();
  const orderedColumns = getOrderedProductionColumns(stages);
  
  // Filtrar scripts que não estão completos E não foram postados
  const productionScripts = scripts.filter(s => 
    s.status !== 'completed' && 
    s.publish_status !== 'postado'
  );
  const [localScripts, setLocalScripts] = useState<Script[]>(productionScripts);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Detectar scripts órfãos (em etapas que não existem no workflow atual)
  const orphanScripts = getOrphanScripts(localScripts, stages);
  const hasOrphans = orphanScripts.length > 0;

  // Sincronizar localScripts quando scripts mudar externamente
  useEffect(() => {
    setLocalScripts(scripts.filter(s => 
      s.status !== 'completed' && 
      s.publish_status !== 'postado'
    ));
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

    const sourceColumnId = active.data.current?.columnId as ProductionColumnId | 'orphan' | undefined;

    let targetColumnId: ProductionColumnId | 'orphan' | undefined;

    if (over.data.current?.type === "column") {
      targetColumnId = over.data.current.columnId as ProductionColumnId | 'orphan';
    } else if (over.data.current?.type === "card") {
      targetColumnId = over.data.current.columnId as ProductionColumnId | 'orphan';
    }

    if (!targetColumnId) return;
    if (sourceColumnId === targetColumnId) return;
    
    // Não permitir arrastar PARA a coluna de órfãos
    if (targetColumnId === 'orphan') {
      toast({
        title: "Movimento não permitido",
        description: "Não é possível mover conteúdos para 'Outras Etapas'.",
        variant: "destructive",
      });
      return;
    }

    const scriptId = active.id as string;
    const newStatus = getStatusForProductionColumn(targetColumnId);
    
    // Encontrar o label da coluna de destino
    const targetColumn = orderedColumns.find(c => c.id === targetColumnId) || 
      PRODUCTION_COLUMNS.find(c => c.id === targetColumnId);

    const previousLocalScripts = [...localScripts];

    // Update otimista
    setLocalScripts(prev =>
      prev.map(s => (s.id === scriptId ? { ...s, status: newStatus } : s))
    );

    try {
      const { error } = await supabase
        .from("scripts")
        .update({ status: newStatus })
        .eq("id", scriptId);

      if (error) throw error;

      onUpdateStatus(scriptId, newStatus);

      toast({
        title: "Status atualizado",
        description: `Movido para ${targetColumn?.label || targetColumnId}`,
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
        {/* Colunas do workflow atual */}
        {orderedColumns.map(column => {
          const columnScripts = localScripts.filter(
            s => getProductionColumnForStatus(s.status) === column.id
          );

          return (
            <ProductionKanbanColumn
              key={column.id}
              column={column}
              scripts={columnScripts}
              onViewScript={onViewScript}
              onDeleteScript={onDeleteScript}
            />
          );
        })}
        
        {/* Coluna de órfãos (aparece apenas se houver conteúdos em etapas fora do workflow) */}
        {hasOrphans && (
          <OrphanColumn
            scripts={orphanScripts}
            onViewScript={onViewScript}
            onDeleteScript={onDeleteScript}
            currentWorkflowName={currentTemplate.name}
          />
        )}
      </div>

      <DragOverlay>
        {activeId && activeScript && (
          <div className="opacity-90">
            <ProductionKanbanCard
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
