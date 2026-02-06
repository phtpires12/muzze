import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  Video, 
  MapPin, 
  Link2, 
  ExternalLink, 
  X, 
  ImageIcon,
  Film
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShotItem } from "@/lib/shotlist-generator";
import { stripHtml } from "@/lib/shot-list-parser";
import { SceneDetailModal } from "./SceneDetailModal";

interface ShotlistPanelProps {
  shots: ShotItem[];
  onUpdateShot?: (shotId: string, updates: Partial<ShotItem>) => void;
  resolvedUrls?: Record<string, string>;
}

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

function getVideoTypeIcon(type: VideoType) {
  // All video types use the same icon for simplicity
  return <Film className="w-3 h-3" />;
}

interface SceneCardProps {
  shot: ShotItem;
  index: number;
  resolvedUrl?: string;
  onUpdateShot?: (shotId: string, updates: Partial<ShotItem>) => void;
  onClick?: () => void;
}

function SceneCard({ shot, index, resolvedUrl, onUpdateShot, onClick }: SceneCardProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [linkInput, setLinkInput] = useState('');

  const handleLinkVideo = useCallback(() => {
    if (!linkInput.trim() || !onUpdateShot) return;
    
    const videoType = detectVideoType(linkInput.trim());
    onUpdateShot(shot.id, {
      videoUrl: linkInput.trim(),
      videoType,
    });
    setLinkInput('');
    setIsLinking(false);
  }, [linkInput, onUpdateShot, shot.id]);

  const handleRemoveVideo = useCallback(() => {
    if (!onUpdateShot) return;
    onUpdateShot(shot.id, {
      videoUrl: undefined,
      videoType: undefined,
    });
  }, [onUpdateShot, shot.id]);

  const thumbnailUrl = resolvedUrl || (shot.shotImagePaths?.[0] ? undefined : undefined);

  return (
    <div 
      className="flex-shrink-0 w-[280px] sm:w-[320px] snap-center cursor-pointer group"
      onClick={onClick}
    >
      <Card className="overflow-hidden border border-border bg-card h-full transition-shadow group-hover:shadow-lg group-hover:border-primary/30">
        {/* 16:9 Thumbnail Area */}
        <AspectRatio ratio={16 / 9} className="bg-muted">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={`Cena ${index + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                <span className="text-xs opacity-60">Cena {index + 1}</span>
              </div>
            </div>
          )}
          
          {/* Location Badge Overlay */}
          {shot.location && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 left-2 text-xs bg-background/80 backdrop-blur-sm"
            >
              <MapPin className="w-3 h-3 mr-1" />
              {shot.location}
            </Badge>
          )}
          
          {/* Section Name Badge */}
          {shot.sectionName && (
            <Badge 
              variant="outline" 
              className="absolute top-2 right-2 text-xs bg-background/80 backdrop-blur-sm border-primary/30"
            >
              {shot.sectionName}
            </Badge>
          )}
        </AspectRatio>

        {/* Content Area */}
        <div className="p-3 space-y-3">
          {/* Script Text (HTML stripped for clean display) */}
          <p className="text-sm text-foreground line-clamp-2 min-h-[2.5rem]">
            {stripHtml(shot.scriptSegment) || 'Sem texto'}
          </p>

          {/* Video Link Section */}
          <div 
            className="pt-2 border-t border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {shot.videoUrl ? (
              /* Has video linked */
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-1.5 text-primary flex-1 min-w-0">
                  {getVideoTypeIcon(shot.videoType || 'other')}
                  <span className="text-xs font-medium truncate">
                    {getVideoTypeLabel(shot.videoType || 'other')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => window.open(shot.videoUrl, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={handleRemoveVideo}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : isLinking ? (
              /* Linking mode */
              <div className="space-y-2">
                <Input
                  placeholder="Cole o link do vídeo..."
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLinkVideo()}
                  className="h-8 text-xs"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={handleLinkVideo}
                    disabled={!linkInput.trim()}
                  >
                    Vincular
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
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
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-2"
                onClick={() => setIsLinking(true)}
              >
                <Link2 className="w-3.5 h-3.5" />
                Vincular Vídeo
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function ShotlistPanel({ 
  shots, 
  onUpdateShot,
  resolvedUrls = {}
}: ShotlistPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const linkedCount = shots.filter(s => s.videoUrl).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-border bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Video className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Shotlist</h3>
                <p className="text-xs text-muted-foreground">
                  {shots.length} cenas {linkedCount > 0 && `• ${linkedCount} com vídeo`}
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
          <div className="px-2 pb-4">
            {shots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma cena na shotlist</p>
                <p className="text-xs">Adicione cenas durante a etapa de roteiro</p>
              </div>
            ) : (
              <>
                {/* Horizontal Gallery */}
                <div 
                  className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-2 px-2 -mx-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {shots.map((shot, index) => (
                    <SceneCard
                      key={shot.id}
                      shot={shot}
                      index={index}
                      resolvedUrl={resolvedUrls[shot.shotImagePaths?.[0] || '']}
                      onUpdateShot={onUpdateShot}
                    />
                  ))}
                </div>

                {/* Navigation Dots */}
                <div className="flex justify-center gap-1.5 pt-2">
                  {shots.slice(0, 12).map((shot) => (
                    <div 
                      key={shot.id}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        shot.videoUrl 
                          ? "bg-primary" 
                          : "bg-muted-foreground/30"
                      )}
                    />
                  ))}
                  {shots.length > 12 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      +{shots.length - 12}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
