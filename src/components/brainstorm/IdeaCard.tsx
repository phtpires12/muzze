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

const CONTENT_TYPES = [
  { value: "video", label: "Vídeo", icon: Video },
  { value: "reel", label: "Reel", icon: Clapperboard },
  { value: "tiktok", label: "TikTok", icon: Music },
  { value: "short", label: "Short", icon: Video },
  { value: "podcast", label: "Podcast", icon: Music },
  { value: "post", label: "Post", icon: FileText },
];

interface IdeaCardProps {
  id: string;
  title?: string;
  contentType?: string;
  centralIdea?: string;
  referenceUrl?: string;
  onUpdate: (id: string, data: { title?: string; content_type?: string; central_idea?: string; reference_url?: string }) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

export const IdeaCard = ({
  id,
  title = "",
  contentType = "",
  centralIdea = "",
  referenceUrl = "",
  onUpdate,
  onDelete,
  isDragging = false,
}: IdeaCardProps) => {
  const [localTitle, setLocalTitle] = useState(title || "");
  const [localContentType, setLocalContentType] = useState(contentType || "");
  const [localCentralIdea, setLocalCentralIdea] = useState(centralIdea || "");
  const [localReferenceUrl, setLocalReferenceUrl] = useState(referenceUrl || "");

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

  return (
    <div ref={setNodeRef} style={style} className={cn("h-full", isDragging && "opacity-50")}>
      <Card className={cn(
        "h-full flex flex-col transition-all",
        isComplete ? "border-primary/50 shadow-md" : "border-dashed border-muted-foreground/30"
      )}>
        <div className="flex items-center gap-2 p-4 pb-2">
          <div {...attributes} {...listeners} className={cn(
            "cursor-grab active:cursor-grabbing text-muted-foreground",
            (!isComplete) && "opacity-30 cursor-not-allowed"
          )}>
            <GripVertical className="w-4 h-4" />
          </div>
          {localContentType && <ContentIcon className="w-4 h-4 text-primary" />}
          <Input
            placeholder="Título (opcional)"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={(e) => handleBlur("title", e.target.value)}
            className="flex-1 h-8 text-sm border-0 bg-transparent focus-visible:ring-0 px-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onDelete(id)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col gap-3 px-4 pb-4">
          <Select value={localContentType} onValueChange={(value) => {
            setLocalContentType(value);
            handleBlur("content_type", value);
          }}>
            <SelectTrigger className="h-9">
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

          <div className="flex-1 flex flex-col">
            <Textarea
              placeholder="Descreva sua ideia central... (mínimo 20 caracteres) *"
              value={localCentralIdea}
              onChange={(e) => setLocalCentralIdea(e.target.value)}
              onBlur={(e) => handleBlur("central_idea", e.target.value)}
              className="flex-1 min-h-[120px] resize-none"
            />
            <span className={cn(
              "text-xs mt-1 text-right",
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
            className="h-9"
            type="url"
          />
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
