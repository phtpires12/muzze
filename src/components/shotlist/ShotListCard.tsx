import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, X, Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { sanitizeHtmlContent } from "@/lib/html-sanitizer";

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

interface ShotListCardProps {
  shot: ShotItem;
  index: number;
  onUpdate: (id: string, field: keyof ShotItem, value: string) => void;
  onRemove: (id: string) => void;
  onImageUpload: (shotId: string, file: File) => void;
  onSplitAtCursor: (shotId: string, cursorPosition: number) => void;
  showCheckbox?: boolean;
  mode?: 'review' | 'record';
  availableLocations?: string[];
  onImageClick?: (shotId: string) => void;
}

export const ShotListCard = ({
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
}: ShotListCardProps) => {
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
  };


  const handleScriptSegmentChange = (html: string) => {
    const sanitized = sanitizeHtmlContent(html);
    onUpdate(shot.id, 'scriptSegment', sanitized);
  };

  const handleSceneChange = (html: string) => {
    const sanitized = sanitizeHtmlContent(html);
    onUpdate(shot.id, 'scene', sanitized);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(shot.id, file);
    }
  };

  const handleImageClick = () => {
    const currentUrls = shot.shotImageUrls || [];
    if (currentUrls.length >= 3) {
      return;
    }
    fileInputRef.current?.click();
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none transition-shadow",
        isDragging && "shadow-lg opacity-50",
        shot.isCompleted && "bg-green-50 dark:bg-green-950/20 border-green-500/50"
      )}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header com drag handle, checkbox e remover */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground">
              #{index + 1}
            </span>
            {showCheckbox && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`shot-${shot.id}`}
                  checked={shot.isCompleted || false}
                  onCheckedChange={(checked) => 
                    onUpdate(shot.id, 'isCompleted', checked.toString())
                  }
                  className="h-5 w-5"
                />
                <label 
                  htmlFor={`shot-${shot.id}`} 
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  {shot.isCompleted ? 'Gravado ✓' : 'Gravar'}
                </label>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(shot.id)}
            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Trecho do Roteiro */}
        <div className="space-y-2 w-full max-w-full min-w-0">
          <label className="text-sm font-medium text-foreground">
            📝 Trecho do Roteiro
          </label>
          <RichTextEditor
            content={shot.scriptSegment}
            onChange={handleScriptSegmentChange}
            placeholder="Trecho do roteiro..."
            className="w-full max-w-full min-w-0 [&_.ProseMirror]:break-words [&_.ProseMirror]:overflow-wrap-anywhere"
            minHeight="120px"
          />
          <span className="text-xs text-muted-foreground">
            Use Ctrl+Enter para quebrar linha
          </span>
        </div>

        {/* Cena (Técnica) */}
        <div className="space-y-2 w-full max-w-full min-w-0">
          <label className="text-sm font-medium text-foreground">
            🎬 Cena (Técnica de Câmera)
          </label>
          <RichTextEditor
            content={shot.scene}
            onChange={handleSceneChange}
            placeholder="Descreva movimento/técnica de câmera (ex: Tracking, Dolly zoom)"
            className="w-full max-w-full min-w-0 [&_.ProseMirror]:break-words"
            minHeight="100px"
          />
        </div>

        {/* Imagem de Referência */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            🖼️ Imagens de Referência (máx. 3)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          {(shot.shotImageUrls && shot.shotImageUrls.length > 0) ? (
            <div className="grid grid-cols-2 gap-2">
              {shot.shotImageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Referência ${index + 1}`}
                    className={cn(
                      "w-full aspect-square object-cover rounded-lg border border-input",
                      onImageClick && "cursor-pointer hover:opacity-90 transition-opacity"
                    )}
                    onClick={() => onImageClick?.(shot.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-1 -right-1 h-6 w-6 bg-destructive text-destructive-foreground hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  {index === shot.shotImageUrls.length - 1 && shot.shotImageUrls.length < 3 && (
                    <Button
                      variant="default"
                      size="icon"
                      onClick={handleImageClick}
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0 shadow-lg"
                    >
                      <Upload className="w-4 h-4" />
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
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              )}
            >
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Arraste ou clique para adicionar</p>
            </div>
          )}
        </div>

        {/* Locação */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            📍 Locação
          </label>
          {mode === 'record' && availableLocations.length > 0 ? (
            <Select
              value={shot.location || undefined}
              onValueChange={(value) => onUpdate(shot.id, 'location', value)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Selecione a locação" />
              </SelectTrigger>
              <SelectContent>
                {availableLocations.map(loc => (
                  <SelectItem key={loc} value={loc}>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {loc}
                      </span>
                    </div>
                  </SelectItem>
                ))}
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
        </div>
      </CardContent>
    </Card>
  );
};
