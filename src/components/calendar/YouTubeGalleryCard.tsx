import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ImagePlus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PublishStatus } from "./PublishStatusBadge";

interface Script {
  id: string;
  title: string;
  content: string | null;
  content_type: string | null;
  publish_date: string | null;
  created_at: string;
  shot_list: string[];
  status: string | null;
  central_idea: string | null;
  reference_url: string | null;
  thumbnail_url?: string | null;
  publish_status?: PublishStatus | null;
}

interface YouTubeGalleryCardProps {
  script: Script;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const getScriptStage = (script: Script): string => {
  if (script.publish_status === 'postado') return 'posted';
  if (script.publish_status === 'pronto_para_postar') return 'ready';
  if (script.publish_status === 'perdido') return 'lost';
  
  if (script.status === "editing") return "editing";
  if (script.status === "recording" || (script.shot_list && script.shot_list.length > 0)) return "recording";
  if (script.status === "review") return "review";
  if (script.status === "draft" || (script.content && script.content.length > 100)) return "script";
  return "ideation";
};

const getStageLabel = (script: Script): string => {
  if (script.publish_status === 'postado') return 'Postado';
  if (script.publish_status === 'pronto_para_postar') return 'Pronto';
  if (script.publish_status === 'perdido') return 'Data perdida';
  
  const stageLabels: Record<string, string> = {
    'draft_idea': 'Ideação',
    'draft': 'Roteiro',
    'review': 'Revisão',
    'recording': 'Gravação',
    'editing': 'Edição',
  };
  return stageLabels[script.status || ''] || 'Ideação';
};

const getStatusColor = (script: Script): string => {
  const stage = getScriptStage(script);
  const statusColors: Record<string, string> = {
    'ideation': 'bg-zinc-400',
    'script': 'bg-purple-500',
    'review': 'bg-blue-400',
    'recording': 'bg-orange-500',
    'editing': 'bg-cyan-500',
    'ready': 'bg-green-500',
    'posted': 'bg-emerald-500',
    'lost': 'bg-red-500',
  };
  return statusColors[stage] || 'bg-zinc-400';
};

export function YouTubeGalleryCard({ script, onClick, onDelete }: YouTubeGalleryCardProps) {
  return (
    <Card 
      className="group/card cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden bg-card border-border"
      onClick={onClick}
    >
      {/* Thumbnail Container - 16:9 aspect ratio */}
      <div className="relative w-full aspect-video bg-muted overflow-hidden">
        {/* Delete button - top right corner */}
        <button
          className="absolute top-2 right-2 p-1.5 rounded-md bg-destructive/10 
                     opacity-0 group-hover/card:opacity-100 transition-opacity z-10
                     hover:bg-destructive/20"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
        
        {script.thumbnail_url ? (
          <img 
            src={script.thumbnail_url} 
            alt={script.title || "Thumbnail"}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ImagePlus className="w-10 h-10 mb-2 opacity-40" />
            <span className="text-xs">Sem thumbnail</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Título */}
        <h3 className="font-medium text-sm leading-snug line-clamp-2 text-foreground">
          {script.title?.trim() || "Sem título"}
        </h3>
        
        {/* Data */}
        <p className="text-sm text-muted-foreground">
          {script.publish_date 
            ? format(parseISO(script.publish_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
            : "Sem data agendada"}
        </p>
        
        {/* URL de Referência como Chip */}
        {script.reference_url && (
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground max-w-[180px] truncate">
              {script.reference_url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 25)}...
            </span>
          </div>
        )}
        
        {/* Status Badge (estilo Notion com bolinha) */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${getStatusColor(script)}`} />
          <span className="text-xs font-medium text-muted-foreground">
            {getStageLabel(script)}
          </span>
        </div>
      </div>
    </Card>
  );
}
