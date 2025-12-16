import { useMemo, useState } from "react";
import { YouTubeGalleryCard } from "./YouTubeGalleryCard";
import { PublishStatus } from "./PublishStatusBadge";
import { Youtube, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  onDeleteScript: (e: React.MouseEvent, scriptId: string) => void;
}

type SortBy = "date" | "title" | "status";
type SortOrder = "asc" | "desc";

export function YouTubeGalleryView({ scripts, onViewScript, onDeleteScript }: YouTubeGalleryViewProps) {
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const sortedScripts = useMemo(() => {
    return [...scripts].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "date") {
        const dateA = a.publish_date || a.created_at;
        const dateB = b.publish_date || b.created_at;
        comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
      } else if (sortBy === "title") {
        comparison = (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "status") {
        comparison = (a.status || "").localeCompare(b.status || "");
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [scripts, sortBy, sortOrder]);

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
    <div>
      {/* Sorting controls */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {scripts.length} vídeo{scripts.length !== 1 ? "s" : ""}
        </p>
        
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[140px] h-9">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2 opacity-50" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="title">Título</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="h-9 w-9"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" 
              ? <ArrowUp className="w-4 h-4" /> 
              : <ArrowDown className="w-4 h-4" />
            }
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedScripts.map((script) => (
          <YouTubeGalleryCard 
            key={script.id} 
            script={script} 
            onClick={() => onViewScript(script.id)}
            onDelete={(e) => onDeleteScript(e, script.id)}
          />
        ))}
      </div>
    </div>
  );
}
