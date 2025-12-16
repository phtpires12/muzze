import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, GripVertical, Video, Clapperboard, Music, FileText } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { DatePickerModal } from "./DatePickerModal";
import { useDeviceType } from "@/hooks/useDeviceType";
import { ThumbnailUploader } from "@/components/ThumbnailUploader";

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
  const deviceType = useDeviceType();
  const [localTitle, setLocalTitle] = useState(title || "");
  const [localContentType, setLocalContentType] = useState(contentType || "");
  const [localCentralIdea, setLocalCentralIdea] = useState(centralIdea || "");
  const [localReferenceUrl, setLocalReferenceUrl] = useState(referenceUrl || "");
  const [localThumbnailUrl, setLocalThumbnailUrl] = useState<string | null>(thumbnailUrl || null);

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

  return (
    <div ref={setNodeRef} style={style} className={cn("h-full", isDragging && "opacity-50")}>
      <Card className={cn(
        "h-full flex flex-col transition-all",
        isComplete ? "border-primary/50 shadow-md" : "border-dashed border-muted-foreground/30",
        compact && "min-h-[320px]"
      )}>
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

          {/* Thumbnail - Only for YouTube */}
          {localContentType === "YouTube" && (
            <ThumbnailUploader
              thumbnailUrl={localThumbnailUrl}
              onThumbnailChange={(url) => {
                setLocalThumbnailUrl(url);
                onUpdate(id, { thumbnail_url: url });
              }}
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
