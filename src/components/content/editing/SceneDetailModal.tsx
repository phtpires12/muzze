import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader,
  DrawerTitle 
} from "@/components/ui/drawer";
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Link2, 
  ExternalLink, 
  X, 
  ImageIcon,
  Film
} from "lucide-react";
import { cn } from '@/core/utils';
import { ShotItem } from '@/core/utils';
import { stripHtml } from '@/core/utils';
import { useIsMobile } from '@/core/hooks';

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

interface SceneDetailModalProps {
  shot: ShotItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateShot?: (shotId: string, updates: Partial<ShotItem>) => void;
  resolvedUrl?: string;
  currentIndex: number;
  totalScenes: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}

function SceneDetailContent({
  shot,
  resolvedUrl,
  currentIndex,
  totalScenes,
  onNavigate,
  onUpdateShot,
  onClose,
}: Omit<SceneDetailModalProps, 'isOpen'>) {
  const [isLinking, setIsLinking] = useState(false);
  const [linkInput, setLinkInput] = useState('');

  // Reset linking state when shot changes
  useEffect(() => {
    setIsLinking(false);
    setLinkInput('');
  }, [shot?.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  const handleLinkVideo = useCallback(() => {
    if (!linkInput.trim() || !onUpdateShot || !shot) return;
    
    const videoType = detectVideoType(linkInput.trim());
    onUpdateShot(shot.id, {
      videoUrl: linkInput.trim(),
      videoType,
    });
    setLinkInput('');
    setIsLinking(false);
  }, [linkInput, onUpdateShot, shot]);

  const handleRemoveVideo = useCallback(() => {
    if (!onUpdateShot || !shot) return;
    onUpdateShot(shot.id, {
      videoUrl: undefined,
      videoType: undefined,
    });
  }, [onUpdateShot, shot]);

  if (!shot) return null;

  const thumbnailUrl = resolvedUrl;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalScenes - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Hero Thumbnail */}
      <AspectRatio ratio={16 / 9} className="bg-muted flex-shrink-0">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={`Cena ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <span className="text-sm opacity-60">Cena {currentIndex + 1}</span>
            </div>
          </div>
        )}
      </AspectRatio>

      {/* Header with Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          {shot.sectionName && (
            <Badge variant="outline" className="border-primary/30">
              {shot.sectionName}
            </Badge>
          )}
          {shot.location && (
            <Badge variant="secondary" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {shot.location}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Cena {currentIndex + 1} de {totalScenes}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onNavigate('prev')}
              disabled={!canGoPrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onNavigate('next')}
              disabled={!canGoNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Full Script Text */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
          {stripHtml(shot.scriptSegment) || 'Sem texto para esta cena'}
        </p>
      </div>

      {/* Video Link Section */}
      <div className="p-4 border-t border-border flex-shrink-0">
        {shot.videoUrl ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-1.5 text-primary flex-1 min-w-0">
              <Film className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {getVideoTypeLabel(shot.videoType || 'other')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => window.open(shot.videoUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={handleRemoveVideo}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : isLinking ? (
          <div className="space-y-3">
            <Input
              placeholder="Cole o link do vídeo (Drive, Dropbox, YouTube)..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLinkVideo()}
              className="h-10"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
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
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setIsLinking(true)}
          >
            <Link2 className="w-4 h-4" />
            Vincular Vídeo
          </Button>
        )}
      </div>
    </div>
  );
}

export function SceneDetailModal(props: SceneDetailModalProps) {
  const { isOpen, onClose, shot } = props;
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Detalhes da Cena</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-2rem)]">
            <SceneDetailContent {...props} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh]">
        <SceneDetailContent {...props} />
      </DialogContent>
    </Dialog>
  );
}
