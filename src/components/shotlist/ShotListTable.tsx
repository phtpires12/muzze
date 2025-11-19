import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, X, Upload, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface ShotItem {
  id: string;
  scriptSegment: string;
  scene: string;
  shotImageUrl: string;
  location: string;
  sectionName?: string;
  isCompleted?: boolean;
}

interface SortableRowProps {
  shot: ShotItem;
  index: number;
  onUpdate: (id: string, field: keyof ShotItem, value: string) => void;
  onRemove: (id: string) => void;
  onImageUpload: (id: string, file: File) => void;
  onSplitAtCursor: (id: string, cursorPosition: number) => void;
  showCheckbox?: boolean;
}

const SortableRow = ({ 
  shot, 
  index, 
  onUpdate, 
  onRemove, 
  onImageUpload, 
  onSplitAtCursor,
  showCheckbox = false 
}: SortableRowProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editableDivRef = useRef<HTMLDivElement>(null);
  const [localText, setLocalText] = useState(shot.scriptSegment);
  const cursorPositionRef = useRef<number | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shot.id });

  // Sincronizar mudanças externas
  useEffect(() => {
    if (shot.scriptSegment !== localText && document.activeElement !== editableDivRef.current) {
      setLocalText(shot.scriptSegment);
    }
  }, [shot.scriptSegment, localText]);

  // Restaurar posição do cursor
  useEffect(() => {
    if (cursorPositionRef.current !== null && editableDivRef.current) {
      const element = editableDivRef.current;
      const textNode = element.firstChild;
      
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const selection = window.getSelection();
        const range = document.createRange();
        
        const targetPosition = Math.min(
          cursorPositionRef.current,
          textNode.textContent?.length || 0
        );
        
        try {
          range.setStart(textNode, targetPosition);
          range.setEnd(textNode, targetPosition);
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch (error) {
          console.error('Erro ao restaurar cursor:', error);
        }
      }
      
      cursorPositionRef.current = null;
    }
  }, [localText]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(shot.id, file);
    }
  };

  const handleRemoveImage = async () => {
    if (shot.shotImageUrl) {
      try {
        const fileName = shot.shotImageUrl.split('/').pop();
        if (fileName) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.storage
              .from('shot-references')
              .remove([`${user.id}/${fileName}`]);
          }
        }
      } catch (error) {
        console.error('Error removing image:', error);
      }
      onUpdate(shot.id, 'shotImageUrl', '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      const selection = window.getSelection();
      if (!selection || !editableDivRef.current) return;
      
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editableDivRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const cursorPosition = preCaretRange.toString().length;
      
      onSplitAtCursor(shot.id, cursorPosition);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    
    // Salvar posição do cursor
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editableDivRef.current) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editableDivRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      cursorPositionRef.current = preCaretRange.toString().length;
    }
    
    setLocalText(newText);
    onUpdate(shot.id, 'scriptSegment', newText);
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "border-t border-border hover:bg-muted/20 transition-all relative",
        showCheckbox && shot.isCompleted && "bg-green-50 dark:bg-green-950/20 opacity-75"
      )}
    >
      {showCheckbox && (
        <td className="p-4 w-16">
          <Checkbox
            checked={shot.isCompleted || false}
            onCheckedChange={(checked) => 
              onUpdate(shot.id, 'isCompleted', checked.toString())
            }
            className="h-5 w-5"
          />
        </td>
      )}
      <td className="p-4 w-20">
        <div className="flex flex-col gap-2 items-center">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
        </div>
      </td>
      <td className="p-4 w-80">
        <div className="flex flex-col gap-2">
          {shot.sectionName && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {shot.sectionName}
            </span>
          )}
              <div
                ref={editableDivRef}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (localText !== shot.scriptSegment) {
                    onUpdate(shot.id, 'scriptSegment', localText);
                  }
                }}
                suppressContentEditableWarning
                className="min-h-[80px] max-h-[160px] overflow-y-auto text-sm p-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-pre-wrap"
              >
                {localText}
              </div>
          <span className="text-xs text-muted-foreground">Pressione Enter para dividir</span>
        </div>
      </td>
      <td className="p-4 w-48">
        <Input
          value={shot.scene}
          onChange={(e) => onUpdate(shot.id, 'scene', e.target.value)}
          placeholder="Ex: Tarde na garagem"
          className="text-sm"
        />
      </td>
      <td className="p-4 w-48 relative">
        {showCheckbox && shot.isCompleted && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-green-500 rounded-full p-1">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {shot.shotImageUrl ? (
            <div className="relative group">
              <img
                src={shot.shotImageUrl}
                alt="Referência"
                className="w-32 h-20 object-cover rounded border border-border cursor-pointer"
                onClick={handleImageClick}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleImageClick}
              className="gap-2 w-32"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          )}
        </div>
      </td>
      <td className="p-4 w-48">
        <Input
          value={shot.location}
          onChange={(e) => onUpdate(shot.id, 'location', e.target.value)}
          placeholder="Ex: Casa do João"
          className="text-sm"
        />
      </td>
      <td className="p-4 w-24">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(shot.id)}
          className="hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
};

interface ShotListTableProps {
  shots: ShotItem[];
  onUpdate: (id: string, field: keyof ShotItem, value: string) => void;
  onRemove: (id: string) => void;
  onImageUpload: (id: string, file: File) => void;
  onSplitAtCursor: (id: string, cursorPosition: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
  showCheckbox?: boolean;
}

export const ShotListTable = ({
  shots,
  onUpdate,
  onRemove,
  onImageUpload,
  onSplitAtCursor,
  onDragEnd,
  showCheckbox = false
}: ShotListTableProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              {showCheckbox && <th className="p-4 text-left text-sm font-semibold text-foreground w-16">✓</th>}
              <th className="p-4 text-left text-sm font-semibold text-foreground w-20">#</th>
              <th className="p-4 text-left text-sm font-semibold text-foreground w-80">Trecho do Roteiro</th>
              <th className="p-4 text-left text-sm font-semibold text-foreground w-48">Cena</th>
              <th className="p-4 text-left text-sm font-semibold text-foreground w-48">Imagem de Ref.</th>
              <th className="p-4 text-left text-sm font-semibold text-foreground w-48">Locação</th>
              <th className="p-4 text-left text-sm font-semibold text-foreground w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={shots.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {shots.map((shot, index) => (
                <SortableRow
                  key={shot.id}
                  shot={shot}
                  index={index}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                  onImageUpload={onImageUpload}
                  onSplitAtCursor={onSplitAtCursor}
                  showCheckbox={showCheckbox}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  );
};
