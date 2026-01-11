import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { GripVertical, X, Upload, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShotListCard } from "./ShotListCard";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { sanitizeHtmlContent } from "@/lib/html-sanitizer";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLongPressSensors } from "@/hooks/useLongPressSensors";

export interface ShotItem {
  id: string;
  scriptSegment: string;
  scene: string;
  shotImagePaths: string[];      // Paths no Storage (fonte da verdade)
  shotImageUrls?: string[];      // DEPRECADO: mantido para compatibilidade
  location: string;
  sectionName?: string;
  isCompleted?: boolean;
}

interface SortableRowProps {
  shot: ShotItem;
  index: number;
  resolvedUrls: Map<string, string>;
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
  resolvedUrls,
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
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shot.id });


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
    const currentPaths = shot.shotImagePaths || [];
    if (currentPaths[imageIndex]) {
      try {
        const path = currentPaths[imageIndex];
        await supabase.storage
          .from('shot-references')
          .remove([path]);
      } catch (error) {
        console.error('Error removing image:', error);
      }
      const newPaths = currentPaths.filter((_, i) => i !== imageIndex);
      onUpdate(shot.id, 'shotImagePaths', JSON.stringify(newPaths));
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

  const handleScriptSegmentChange = (html: string) => {
    const sanitized = sanitizeHtmlContent(html);
    onUpdate(shot.id, 'scriptSegment', sanitized);
  };

  const handleSceneChange = (html: string) => {
    const sanitized = sanitizeHtmlContent(html);
    onUpdate(shot.id, 'scene', sanitized);
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
      <td className="p-4 w-80 min-w-0 align-top">
        <div className="flex flex-col gap-2 w-full max-w-full min-w-0">
          {shot.sectionName && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {shot.sectionName}
            </span>
          )}
          <RichTextEditor
            content={shot.scriptSegment}
            onChange={handleScriptSegmentChange}
            placeholder="Trecho do roteiro..."
            className="w-full max-w-full min-w-0 [&_.ProseMirror]:break-words [&_.ProseMirror]:overflow-wrap-anywhere"
            minHeight="80px"
          />
          <span className="text-xs text-muted-foreground">Use Ctrl+Enter para quebrar linha</span>
        </div>
      </td>
      <td className="p-4 w-64 min-w-0 align-top">
        <RichTextEditor
          content={shot.scene}
          onChange={handleSceneChange}
          placeholder="Descreva movimento/técnica de câmera (ex: Tracking, Dolly zoom)"
          className="w-full max-w-full min-w-0 [&_.ProseMirror]:break-words"
          minHeight="80px"
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
          {(shot.shotImagePaths && shot.shotImagePaths.length > 0) ? (
            <div className="flex flex-wrap gap-2">
              {shot.shotImagePaths.map((path, index) => {
                const resolvedUrl = (window as any).__resolvedUrls?.get(path);
                return (
                  <div key={index} className="relative group">
                    <img
                      src={resolvedUrl || path}
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
                    {index === shot.shotImagePaths.length - 1 && shot.shotImagePaths.length < 3 && (
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
                );
              })}
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
  resolvedUrls?: Map<string, string>;
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
  resolvedUrls = new Map(),
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
  // Sensor otimizado: long press no mobile, drag imediato no desktop
  const sensors = useLongPressSensors();

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
                resolvedUrls={resolvedUrls}
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
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full border-collapse table-fixed">
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
                  resolvedUrls={resolvedUrls}
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
