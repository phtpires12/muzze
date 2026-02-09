import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MusicData {
  url: string;
  name?: string;
  type: 'spotify' | 'youtube' | 'soundcloud' | 'other';
}

function detectMusicType(url: string): MusicData['type'] {
  if (url.includes('spotify.com') || url.includes('open.spotify')) return 'spotify';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('soundcloud.com')) return 'soundcloud';
  return 'other';
}

export function buildMusicReference(url: string, name: string): MusicData | null {
  if (!url.trim()) return null;
  return {
    url: url.trim(),
    name: name.trim() || undefined,
    type: detectMusicType(url.trim()),
  };
}

interface MusicInputProps {
  url: string;
  name: string;
  onUrlChange: (url: string) => void;
  onNameChange: (name: string) => void;
  onUrlBlur?: () => void;
  onNameBlur?: () => void;
  required?: boolean;
  compact?: boolean;
}

export function MusicInput({
  url,
  name,
  onUrlChange,
  onNameChange,
  onUrlBlur,
  onNameBlur,
  required = false,
  compact = false,
}: MusicInputProps) {
  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      <Label className="flex items-center gap-1.5">
        <Music className={cn("text-muted-foreground", compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
        Música {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        placeholder="Link da música (Spotify, YouTube, etc)"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onBlur={onUrlBlur}
        type="url"
        className={cn(compact && "h-8 text-xs", "bg-background/50")}
      />
      <Input
        placeholder="Nome da música (opcional)"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onBlur={onNameBlur}
        className={cn(compact && "h-8 text-xs", "bg-background/50")}
      />
    </div>
  );
}
