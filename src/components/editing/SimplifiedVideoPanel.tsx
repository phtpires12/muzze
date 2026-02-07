import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Film, Link2, ExternalLink, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type VideoType = 'google_drive' | 'dropbox' | 'youtube' | 'other';

function detectVideoType(url: string): VideoType {
  if (url.includes('drive.google.com')) return 'google_drive';
  if (url.includes('dropbox.com')) return 'dropbox';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'other';
}

function getVideoTypeLabel(type: VideoType): string {
  switch (type) {
    case 'google_drive': return 'Google Drive';
    case 'dropbox': return 'Dropbox';
    case 'youtube': return 'YouTube';
    default: return 'Link';
  }
}

interface SimplifiedVideoPanelProps {
  mainVideoUrl?: string | null;
  mainVideoType?: VideoType | null;
  onSave: (url: string | null, type: VideoType | null) => void;
}

export function SimplifiedVideoPanel({ 
  mainVideoUrl, 
  mainVideoType, 
  onSave 
}: SimplifiedVideoPanelProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [linkInput, setLinkInput] = useState('');

  const handleLinkVideo = useCallback(() => {
    if (!linkInput.trim()) return;
    
    const videoType = detectVideoType(linkInput.trim());
    onSave(linkInput.trim(), videoType);
    setLinkInput('');
    setIsLinking(false);
  }, [linkInput, onSave]);

  const handleRemoveVideo = useCallback(() => {
    onSave(null, null);
  }, [onSave]);

  return (
    <Card className="overflow-hidden border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Arquivo de Vídeo</h3>
            <p className="text-xs text-muted-foreground">
              Vincule o vídeo principal do seu conteúdo
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {mainVideoUrl ? (
          /* Has video linked */
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Film className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium text-foreground">
                  Vídeo Principal
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {getVideoTypeLabel(mainVideoType || 'other')}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(mainVideoUrl, '_blank')}
                title="Abrir vídeo"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveVideo}
                className="text-destructive hover:text-destructive"
                title="Remover vídeo"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : isLinking ? (
          /* Linking mode */
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-border">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Film className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Vídeo Principal</p>
                <p className="text-xs text-muted-foreground">
                  Cole o link do Google Drive, Dropbox ou YouTube
                </p>
              </div>
            </div>
            
            <Input
              placeholder="Cole o link do vídeo..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLinkVideo()}
              autoFocus
            />
            
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={handleLinkVideo}
                disabled={!linkInput.trim()}
              >
                Vincular
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsLinking(false);
                  setLinkInput('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          /* No video - show link button */
          <button
            onClick={() => setIsLinking(true)}
            className="w-full"
          >
            <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Film className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">Vídeo Principal</p>
                <p className="text-xs text-muted-foreground">
                  Clique para vincular o arquivo de vídeo
                </p>
              </div>
              <Link2 className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>
        )}
      </div>
    </Card>
  );
}
