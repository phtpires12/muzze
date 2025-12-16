import { YouTubeGalleryCard } from "./YouTubeGalleryCard";
import { PublishStatus } from "./PublishStatusBadge";
import { Youtube } from "lucide-react";

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

interface YouTubeGalleryViewProps {
  scripts: Script[];
  onViewScript: (scriptId: string) => void;
}

export function YouTubeGalleryView({ scripts, onViewScript }: YouTubeGalleryViewProps) {
  if (scripts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Youtube className="w-16 h-16 mb-4 opacity-30" />
        <p className="font-medium text-lg">Nenhum vídeo do YouTube</p>
        <p className="text-sm mt-1">Crie um novo conteúdo do tipo YouTube para visualizar aqui.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {scripts.map((script) => (
        <YouTubeGalleryCard 
          key={script.id} 
          script={script} 
          onClick={() => onViewScript(script.id)} 
        />
      ))}
    </div>
  );
}
