import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, X, Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ShotItem {
  id: string;
  scriptSegment: string;
  scene: string;
  shotImageUrl: string;
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
  availableLocations = []
}: ShotListCardProps) => {
  const [localText, setLocalText] = useState(shot.scriptSegment);
  const [history, setHistory] = useState<string[]>([shot.scriptSegment]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    setLocalText(shot.scriptSegment);
    setHistory([shot.scriptSegment]);
    setHistoryIndex(0);
  }, [shot.scriptSegment]);

  const updateHistory = (newText: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newText);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const newText = history[newIndex];
      setLocalText(newText);
      if (contentRef.current) {
        contentRef.current.textContent = newText;
      }
      onUpdate(shot.id, 'scriptSegment', newText);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const newText = history[newIndex];
      setLocalText(newText);
      if (contentRef.current) {
        contentRef.current.textContent = newText;
      }
      onUpdate(shot.id, 'scriptSegment', newText);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    setLocalText(newText);
    updateHistory(newText);
    onUpdate(shot.id, 'scriptSegment', newText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const selection = window.getSelection();
      const cursorPosition = selection?.anchorOffset || 0;
      
      let textBeforeCursor = '';
      const range = selection?.getRangeAt(0);
      if (range) {
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(contentRef.current!);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        textBeforeCursor = preCaretRange.toString();
      }
      
      onSplitAtCursor(shot.id, textBeforeCursor.length);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(shot.id, file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            📝 Trecho do Roteiro
          </label>
          <div
            ref={contentRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            suppressContentEditableWarning
            className="min-h-[120px] max-h-[200px] overflow-y-auto overflow-x-hidden text-sm p-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-pre-wrap break-words"
          >
            {localText}
          </div>
          <span className="text-xs text-muted-foreground">
            Pressione Enter para dividir
          </span>
        </div>

        {/* Cena (Técnica) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            🎬 Cena (Técnica de Câmera)
          </label>
          <Textarea
            value={shot.scene}
            onChange={(e) => onUpdate(shot.id, 'scene', e.target.value)}
            placeholder="Descreva movimento/técnica de câmera (ex: Tracking, Dolly zoom)"
            className="text-sm min-h-[100px] max-h-[120px] overflow-y-auto resize-none break-words"
          />
        </div>

        {/* Imagem de Referência */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            🖼️ Imagem de Referência
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          {shot.shotImageUrl ? (
            <div className="relative group">
              <img
                src={shot.shotImageUrl}
                alt="Referência"
                className="w-full h-48 object-cover rounded-lg border border-input"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleImageClick}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Upload className="w-4 h-4 mr-2" />
                Trocar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={handleImageClick}
              className="w-full h-24 border-dashed"
            >
              <ImageIcon className="w-6 h-6 mr-2" />
              Adicionar Imagem
            </Button>
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
