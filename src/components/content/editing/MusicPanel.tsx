import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  Music, 
  ExternalLink, 
  Trash2,
  Edit2,
  Check,
  X
} from "lucide-react";
import { cn } from '@/core/utils';
import { useToast } from '@/core/hooks';

export interface MusicReference {
  url: string;
  name?: string;
  artist?: string;
  type: 'spotify' | 'youtube' | 'soundcloud' | 'other';
}

interface MusicPanelProps {
  music: MusicReference | null;
  onSave: (music: MusicReference | null) => void;
}

function detectMusicType(url: string): MusicReference['type'] {
  if (url.includes('spotify.com') || url.includes('open.spotify')) return 'spotify';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('soundcloud.com')) return 'soundcloud';
  return 'other';
}

function getTypeName(type: MusicReference['type']) {
  switch (type) {
    case 'spotify': return 'Spotify';
    case 'youtube': return 'YouTube';
    case 'soundcloud': return 'SoundCloud';
    default: return 'Link';
  }
}

function getTypeColor(type: MusicReference['type']) {
  switch (type) {
    case 'spotify': return 'text-green-500';
    case 'youtube': return 'text-red-500';
    case 'soundcloud': return 'text-orange-500';
    default: return 'text-muted-foreground';
  }
}

export function MusicPanel({ music, onSave }: MusicPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(music?.url || '');
  const [name, setName] = useState(music?.name || '');
  const [artist, setArtist] = useState(music?.artist || '');
  const { toast } = useToast();

  const handleSave = () => {
    if (!url.trim()) {
      onSave(null);
      setIsEditing(false);
      return;
    }

    onSave({
      url: url.trim(),
      name: name.trim() || undefined,
      artist: artist.trim() || undefined,
      type: detectMusicType(url.trim()),
    });

    setIsEditing(false);
    toast({
      title: "Música salva",
      description: "Referência de música atualizada",
    });
  };

  const handleCancel = () => {
    setUrl(music?.url || '');
    setName(music?.name || '');
    setArtist(music?.artist || '');
    setIsEditing(false);
  };

  const handleRemove = () => {
    setUrl('');
    setName('');
    setArtist('');
    onSave(null);
    toast({
      title: "Música removida",
      description: "Referência de música removida",
    });
  };

  const handleOpen = () => {
    if (music?.url) {
      window.open(music.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-border bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Música</h3>
                <p className="text-xs text-muted-foreground">
                  {music ? (music.name || getTypeName(music.type)) : 'Nenhuma música definida'}
                </p>
              </div>
            </div>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {isEditing || !music ? (
              // Edit mode
              <div className="space-y-3">
                <Input
                  placeholder="Link da música (Spotify, YouTube, etc)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nome da música"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Artista"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm" className="flex-1">
                    <Check className="w-4 h-4 mr-1" />
                    Salvar
                  </Button>
                  {music && (
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              // View mode
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-muted", getTypeColor(music.type))}>
                  <Music className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {music.name || 'Música sem nome'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {music.artist ? `${music.artist} • ` : ''}{getTypeName(music.type)}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpen}
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
