import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, GripVertical, Video, Clapperboard, Music, FileText, RefreshCw } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { DatePickerModal } from "./DatePickerModal";
import { useDeviceType } from "@/hooks/useDeviceType";
import { ThumbnailUploader } from "@/components/ThumbnailUploader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CONTENT_TYPES = [
  { value: "Reels", label: "Reels", icon: Clapperboard },
  { value: "YouTube", label: "YouTube", icon: Video },
  { value: "TikTok", label: "TikTok", icon: Music },
  { value: "X (Twitter)", label: "X (Twitter)", icon: FileText },
];

interface IdeaCardProps {
  id: string;
  title?: string;
  contentType?: string;
  centralIdea?: string;
  referenceUrl?: string;
  thumbnailUrl?: string;
  onUpdate: (id: string, data: { title?: string; content_type?: string; central_idea?: string; reference_url?: string; thumbnail_url?: string }) => void;
  onDelete: (id: string) => void;
  onSchedule?: () => void;
  isDragging?: boolean;
  compact?: boolean;
}

export const IdeaCard = ({
  id,
  title = "",
  contentType = "",
  centralIdea = "",
  referenceUrl = "",
  thumbnailUrl = "",
  onUpdate,
  onDelete,
  onSchedule,
  isDragging = false,
  compact = false,
}: IdeaCardProps) => {
  const { toast } = useToast();
  const deviceType = useDeviceType();
  const [localTitle, setLocalTitle] = useState(title || "");
  const [localContentType, setLocalContentType] = useState(contentType || "");
  const [localCentralIdea, setLocalCentralIdea] = useState(centralIdea || "");
  const [localReferenceUrl, setLocalReferenceUrl] = useState(referenceUrl || "");
  const [localThumbnailUrl, setLocalThumbnailUrl] = useState<string | null>(thumbnailUrl || null);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id,
    disabled: !localContentType || !localCentralIdea || localCentralIdea.length < 20,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleBlur = (field: string, value: string) => {
    onUpdate(id, { [field]: value });
  };

  const isComplete = !!localContentType && !!localCentralIdea && localCentralIdea.length >= 20;
  const ContentIcon = CONTENT_TYPES.find(t => t.value === localContentType)?.icon || FileText;
  const isMobile = deviceType === "mobile";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHoveringThumb, setIsHoveringThumb] = useState(false);
  const hasYouTubeThumbnail = localContentType === "YouTube" && localThumbnailUrl;

  const handleThumbnailChange = (url: string | null) => {
    setLocalThumbnailUrl(url);
    onUpdate(id, { thumbnail_url: url });
  };

  const handleThumbnailUpload = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use JPG, PNG ou WebP.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB.", variant: "destructive" });
      return;
    }

    setIsUploadingThumb(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${id}_${Date.now()}.${fileExt}`;

      if (localThumbnailUrl) {
        const oldPath = localThumbnailUrl.split('/thumbnails/')[1];
        if (oldPath) await supabase.storage.from('thumbnails').remove([oldPath]);
      }

      const { error } = await supabase.storage.from('thumbnails').upload(fileName, file, { upsert: true });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
      handleThumbnailChange(publicUrl);
      toast({ title: "Thumbnail atualizada" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Erro no upload", variant: "destructive" });
    } finally {
      setIsUploadingThumb(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(
      "h-full transition-all",
      // Feedback visual de drag: escala + sombra
      isDragging && "opacity-90 scale-[1.03] shadow-xl"
    )}>
      <Card className={cn(
        "h-full flex flex-col transition-all overflow-hidden",
        isComplete ? "border-primary/50 shadow-md" : "border-dashed border-muted-foreground/30",
        compact && "min-h-[320px]",
        // Ring no card quando dragging
        isDragging && "ring-2 ring-primary/50"
      )}>
        {/* YouTube Thumbnail Header - when has thumbnail */}
        {hasYouTubeThumbnail && (
          <div 
            className="relative w-full aspect-video bg-muted overflow-hidden"
            onMouseEnter={() => setIsHoveringThumb(true)}
            onMouseLeave={() => setIsHoveringThumb(false)}
          >
            <img
              src={localThumbnailUrl!}
              alt="Thumbnail"
              className="w-full h-full object-contain"
            />
            {/* Hover overlay with controls */}
            <div 
              className={cn(
                "absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity duration-200",
                isHoveringThumb ? "opacity-100" : "opacity-0"
              )}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingThumb}
                className="gap-1.5 h-7 text-xs"
              >
                <RefreshCw className={cn("w-3 h-3", isUploadingThumb && "animate-spin")} />
                {isUploadingThumb ? "..." : "Trocar"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleThumbnailChange(null)}
                className="gap-1.5 h-7 text-xs"
              >
                <X className="w-3 h-3" />
                Remover
              </Button>
            </div>
            {/* Hidden file input for replacing */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleThumbnailUpload(file);
              }}
              className="hidden"
            />
          </div>
        )}

        <div className={cn("flex items-center gap-2 pb-2", compact ? "p-3" : "p-4")}>
          {!isMobile && (
            <div {...attributes} {...listeners} className={cn(
              "cursor-grab active:cursor-grabbing text-muted-foreground",
              (!isComplete) && "opacity-30 cursor-not-allowed"
            )}>
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          {localContentType && <ContentIcon className={cn("w-4 h-4 text-primary", compact && "w-3.5 h-3.5")} />}
          <Input
            placeholder="Título (opcional)"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={(e) => handleBlur("title", e.target.value)}
            className={cn("flex-1 border-0 bg-transparent focus-visible:ring-0 px-1", compact ? "h-7 text-xs" : "h-8 text-sm")}
          />
          <Button
            variant="ghost"
            size="icon"
            className={cn(compact ? "h-5 w-5" : "h-6 w-6")}
            onClick={() => onDelete(id)}
          >
            <X className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
          </Button>
        </div>

        <div className={cn("flex-1 flex flex-col pb-4", compact ? "gap-2 px-3" : "gap-3 px-4")}>
          <Select value={localContentType} onValueChange={(value) => {
            setLocalContentType(value);
            handleBlur("content_type", value);
          }}>
            <SelectTrigger className={cn(compact ? "h-8 text-xs" : "h-9")}>
              <SelectValue placeholder="Tipo de Conteúdo *" />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Thumbnail Uploader - Only for YouTube when NO thumbnail exists */}
          {localContentType === "YouTube" && !localThumbnailUrl && (
            <ThumbnailUploader
              thumbnailUrl={localThumbnailUrl}
              onThumbnailChange={handleThumbnailChange}
              scriptId={id}
            />
          )}

          <div className="flex-1 flex flex-col">
            <Textarea
              placeholder="Descreva sua ideia central... (mínimo 20 caracteres) *"
              value={localCentralIdea}
              onChange={(e) => setLocalCentralIdea(e.target.value)}
              onBlur={(e) => handleBlur("central_idea", e.target.value)}
              className={cn("flex-1 resize-none", compact ? "min-h-[80px]" : "min-h-[120px]")}
            />
            <span className={cn(
              "mt-1 text-right",
              compact ? "text-[10px]" : "text-xs",
              localCentralIdea.length < 20 ? "text-destructive" : "text-muted-foreground"
            )}>
              {localCentralIdea.length}/20 caracteres
            </span>
          </div>

          <Input
            placeholder="URL de Referência (opcional)"
            value={localReferenceUrl}
            onChange={(e) => setLocalReferenceUrl(e.target.value)}
            onBlur={(e) => handleBlur("reference_url", e.target.value)}
            className={cn(compact ? "h-8 text-xs" : "h-9")}
            type="url"
          />

          {isMobile && isComplete && onSchedule && (
            <DatePickerModal onDateSelect={onSchedule} triggerClassName="w-full" />
          )}
        </div>

        {isComplete && (
          <div className="px-4 pb-3 text-xs text-center text-muted-foreground">
            Arraste para o calendário para agendar
          </div>
        )}
      </Card>
    </div>
  );
};
