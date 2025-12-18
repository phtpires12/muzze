import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, X, Upload, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShotListCard } from "./ShotListCard";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  shotImageUrls: string[];
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
  mode?: 'review' | 'record';
  availableLocations?: string[];
  onImageClick?: (shotId: string) => void;
}

const SortableRow = ({ 
  shot, 
  index, 
  onUpdate, 
  onRemove, 
  onImageUpload, 
  onSplitAtCursor,
  showCheckbox = false,
  mode = 'review',
  availableLocations = [],
  onImageClick
}: SortableRowProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editableDivRef = useRef<HTMLDivElement>(null);
  const [localText, setLocalText] = useState(shot.scriptSegment);
  const cursorPositionRef = useRef<number | null>(null);
  const [history, setHistory] = useState<string[]>([shot.scriptSegment]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shot.id });

  // Sincronizar mudanças externas (incluindo splits)
  useEffect(() => {
    if (shot.scriptSegment !== localText) {
      // Verificar se é uma operação de split (texto novo é substring do antigo)
      const isReduction = shot.scriptSegment.length < localText.length && 
                          localText.startsWith(shot.scriptSegment);
      
      // Se for redução (split) OU elemento não está focado, atualizar
      if (isReduction || document.activeElement !== editableDivRef.current) {
        setLocalText(shot.scriptSegment);
        setHistory([shot.scriptSegment]);
        setHistoryIndex(0);
        
        // Forçar atualização do DOM
        if (editableDivRef.current) {
          editableDivRef.current.textContent = shot.scriptSegment;
        }
      }
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

  const handleRemoveImage = async (imageIndex: number) => {
    const currentUrls = shot.shotImageUrls || [];
    if (currentUrls[imageIndex]) {
      try {
        const fileName = currentUrls[imageIndex].split('/').pop();
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
      const newUrls = currentUrls.filter((_, i) => i !== imageIndex);
      onUpdate(shot.id, 'shotImageUrls', JSON.stringify(newUrls));
    }
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const currentUrls = shot.shotImageUrls || [];
    if (currentUrls.length >= 3) {
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageUpload(shot.id, imageFile);
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
    
    // Adicionar ao histórico (limitar a 50 itens)
    setHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), newText];
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
    
    setLocalText(newText);
    onUpdate(shot.id, 'scriptSegment', newText);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousText = history[newIndex];
      setHistoryIndex(newIndex);
      setLocalText(previousText);
      onUpdate(shot.id, 'scriptSegment', previousText);
      
      // Mover cursor para o final
      setTimeout(() => {
        if (editableDivRef.current) {
          const textNode = editableDivRef.current.firstChild;
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            const selection = window.getSelection();
            const range = document.createRange();
            const length = textNode.textContent?.length || 0;
            range.setStart(textNode, length);
            range.setEnd(textNode, length);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }
      }, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextText = history[newIndex];
      setHistoryIndex(newIndex);
      setLocalText(nextText);
      onUpdate(shot.id, 'scriptSegment', nextText);
      
      // Mover cursor para o final
      setTimeout(() => {
        if (editableDivRef.current) {
          const textNode = editableDivRef.current.firstChild;
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            const selection = window.getSelection();
            const range = document.createRange();
            const length = textNode.textContent?.length || 0;
            range.setStart(textNode, length);
            range.setEnd(textNode, length);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }
      }, 0);
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Ctrl+Z / Cmd+Z para desfazer
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }
    
    // Ctrl+Shift+Z / Cmd+Shift+Z ou Ctrl+Y para refazer
    if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
      e.preventDefault();
      handleRedo();
      return;
    }
    
    // Enter para dividir
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
                onKeyDown={handleEditorKeyDown}
                onBlur={() => {
                  if (localText !== shot.scriptSegment) {
                    onUpdate(shot.id, 'scriptSegment', localText);
                  }
                }}
                suppressContentEditableWarning
                className="min-h-[80px] max-h-[160px] overflow-y-auto overflow-x-hidden text-sm p-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-pre-wrap break-words"
              >
                {localText}
              </div>
          <span className="text-xs text-muted-foreground">Pressione Enter para dividir</span>
        </div>
      </td>
      <td className="p-4 w-64">
        <Textarea
          value={shot.scene}
          onChange={(e) => onUpdate(shot.id, 'scene', e.target.value)}
          placeholder="Descreva movimento/técnica de câmera (ex: Tracking, Dolly zoom)"
          className="text-sm min-h-[80px] max-h-[120px] overflow-y-auto resize-none break-words"
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
          {(shot.shotImageUrls && shot.shotImageUrls.length > 0) ? (
            <div className="flex flex-wrap gap-2">
              {shot.shotImageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Referência ${index + 1}`}
                    className="w-20 h-20 object-cover rounded border border-border cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onImageClick?.(shot.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  {index === shot.shotImageUrls.length - 1 && shot.shotImageUrls.length < 3 && (
                    <Button
                      variant="default"
                      size="icon"
                      onClick={handleImageClick}
                      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0 shadow-lg"
                    >
                      <Upload className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleImageClick}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                isDragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              )}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Arraste ou clique</p>
            </div>
          )}
        </div>
      </td>
      <td className="p-4 w-48">
        {mode === 'record' ? (
          <Select
            value={shot.location || undefined}
            onValueChange={(value) => onUpdate(shot.id, 'location', value)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Selecione a locação" />
            </SelectTrigger>
            <SelectContent>
              {availableLocations.length > 0 ? (
                availableLocations.map(loc => (
                  <SelectItem key={loc} value={loc}>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {loc}
                      </span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="sem-locacao" disabled>
                  Nenhuma locação disponível
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={shot.location}
            onChange={(e) => onUpdate(shot.id, 'location', e.target.value)}
            placeholder="Ex: Casa do João"
            className="text-sm break-words"
          />
        )}
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
  mode?: 'review' | 'record';
  availableLocations?: string[];
  onImageClick?: (shotId: string) => void;
}

export const ShotListTable = ({
  shots,
  onUpdate,
  onRemove,
  onImageUpload,
  onSplitAtCursor,
  onDragEnd,
  showCheckbox = false,
  mode = 'review',
  availableLocations = [],
  onImageClick
}: ShotListTableProps) => {
  const isMobile = useIsMobile();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mobile: Renderizar cards verticais
  if (isMobile) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={shots.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {shots.map((shot, index) => (
              <ShotListCard
                key={shot.id}
                shot={shot}
                index={index}
                onUpdate={onUpdate}
                onRemove={onRemove}
                onImageUpload={onImageUpload}
                onSplitAtCursor={onSplitAtCursor}
                showCheckbox={showCheckbox}
                mode={mode}
                availableLocations={availableLocations}
                onImageClick={onImageClick}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  // Desktop: Renderizar tabela horizontal
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
              <th className="p-4 text-left text-sm font-semibold text-foreground w-64">Cena</th>
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
                  mode={mode}
                  availableLocations={availableLocations}
                  onImageClick={onImageClick}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  );
};
