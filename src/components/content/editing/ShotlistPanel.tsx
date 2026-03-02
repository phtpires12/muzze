import { useState, useCallback, useMemo } from "react";
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
  Film,
  LayoutGrid,
  Folder
} from "lucide-react";
import { cn } from '@/core/utils';
import { ShotItem, inferRollType } from '@/core/utils';
import { stripHtml } from '@/core/utils';
import { SceneDetailModal } from "./SceneDetailModal";
import { FolderView, FolderHeader } from "./FolderView";
import { SimplifiedVideoPanel } from "./SimplifiedVideoPanel";

type RollType = 'a-roll' | 'b-roll';
type ViewMode = 'gallery' | 'folders';
type FilterType = 'all' | RollType;
type VideoType = 'google_drive' | 'dropbox' | 'youtube' | 'other';

interface ShotlistPanelProps {
  shots: ShotItem[];
  onUpdateShot?: (shotId: string, updates: Partial<ShotItem>) => void;
  resolvedUrls?: Record<string, string>;
  // Props for simplified mode (no shot list)
  mainVideoUrl?: string | null;
  mainVideoType?: VideoType | null;
  onSaveMainVideo?: (url: string | null, type: VideoType | null) => void;
}

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
  const rollType = inferRollType(shot);

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
          
          {/* Roll Type Badge */}
          <Badge 
            variant="secondary" 
            className={cn(
              "absolute top-2 left-2 text-xs backdrop-blur-sm",
              rollType === 'a-roll' 
                ? "bg-blue-500/80 text-white border-blue-600" 
                : "bg-amber-500/80 text-white border-amber-600"
            )}
          >
            {rollType === 'a-roll' ? 'A-roll' : 'B-roll'}
          </Badge>
          
          {/* Location Badge Overlay */}
          {shot.location && (
            <Badge 
              variant="secondary" 
              className="absolute bottom-2 left-2 text-xs bg-background/80 backdrop-blur-sm"
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
                  <Film className="w-3 h-3" />
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

interface FilterButtonsProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: { all: number; aRoll: number; bRoll: number };
}

function FilterButtons({ filter, onFilterChange, counts }: FilterButtonsProps) {
  return (
    <div className="flex gap-1 px-2 py-2">
      <Button
        variant={filter === 'all' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onFilterChange('all')}
        className="text-xs h-7"
      >
        Todas ({counts.all})
      </Button>
      <Button
        variant={filter === 'a-roll' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onFilterChange('a-roll')}
        className="text-xs h-7"
      >
        A-roll ({counts.aRoll})
      </Button>
      <Button
        variant={filter === 'b-roll' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onFilterChange('b-roll')}
        className="text-xs h-7"
      >
        B-roll ({counts.bRoll})
      </Button>
    </div>
  );
}

export function ShotlistPanel({ 
  shots, 
  onUpdateShot,
  resolvedUrls = {},
  mainVideoUrl,
  mainVideoType,
  onSaveMainVideo
}: ShotlistPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(null);
  const [folderDrillDown, setFolderDrillDown] = useState<RollType | null>(null);

  // Calculate counts
  const counts = useMemo(() => {
    const aRollShots = shots.filter(s => inferRollType(s) === 'a-roll');
    const bRollShots = shots.filter(s => inferRollType(s) === 'b-roll');
    return {
      all: shots.length,
      aRoll: aRollShots.length,
      bRoll: bRollShots.length,
    };
  }, [shots]);

  // Filter shots based on current filter
  const filteredShots = useMemo(() => {
    if (filter === 'all') return shots;
    return shots.filter(s => inferRollType(s) === filter);
  }, [shots, filter]);

  // For folder drill-down view
  const folderFilteredShots = useMemo(() => {
    if (!folderDrillDown) return shots;
    return shots.filter(s => inferRollType(s) === folderDrillDown);
  }, [shots, folderDrillDown]);

  const linkedCount = shots.filter(s => s.videoUrl).length;

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    setSelectedSceneIndex(prev => {
      if (prev === null) return null;
      const currentShots = folderDrillDown ? folderFilteredShots : filteredShots;
      if (direction === 'prev' && prev > 0) return prev - 1;
      if (direction === 'next' && prev < currentShots.length - 1) return prev + 1;
      return prev;
    });
  }, [folderDrillDown, folderFilteredShots, filteredShots]);

  const handleFolderSelect = useCallback((type: RollType) => {
    setFolderDrillDown(type);
  }, []);

  const handleFolderBack = useCallback(() => {
    setFolderDrillDown(null);
  }, []);

  // Get selected shot from appropriate list
  const currentDisplayShots = folderDrillDown ? folderFilteredShots : filteredShots;
  const selectedShot = selectedSceneIndex !== null ? currentDisplayShots[selectedSceneIndex] : null;
  const selectedResolvedUrl = selectedShot?.shotImagePaths?.[0] 
    ? resolvedUrls[selectedShot.shotImagePaths[0]] 
    : undefined;

  // If no shots, show simplified panel
  if (shots.length === 0) {
    return (
      <SimplifiedVideoPanel
        mainVideoUrl={mainVideoUrl}
        mainVideoType={mainVideoType}
        onSave={onSaveMainVideo || (() => {})}
      />
    );
  }

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
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div 
                className="flex gap-0.5 bg-muted rounded-lg p-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant={viewMode === 'gallery' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    setViewMode('gallery');
                    setFolderDrillDown(null);
                  }}
                  title="Galeria"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'folders' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    setViewMode('folders');
                    setFilter('all');
                  }}
                  title="Pastas"
                >
                  <Folder className="w-4 h-4" />
                </Button>
              </div>
              
              <ChevronDown className={cn(
                "w-5 h-5 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="pb-4">
            {viewMode === 'gallery' && !folderDrillDown ? (
              <>
                {/* Filter Buttons */}
                <FilterButtons 
                  filter={filter} 
                  onFilterChange={setFilter} 
                  counts={counts}
                />
                
                {/* Horizontal Gallery */}
                <div 
                  className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-2 px-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {filteredShots.map((shot, index) => (
                    <SceneCard
                      key={shot.id}
                      shot={shot}
                      index={shots.indexOf(shot)}
                      resolvedUrl={resolvedUrls[shot.shotImagePaths?.[0] || '']}
                      onUpdateShot={onUpdateShot}
                      onClick={() => setSelectedSceneIndex(index)}
                    />
                  ))}
                </div>

                {/* Navigation Dots */}
                <div className="flex justify-center gap-1.5 pt-2">
                  {filteredShots.slice(0, 12).map((shot) => (
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
                  {filteredShots.length > 12 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      +{filteredShots.length - 12}
                    </span>
                  )}
                </div>
              </>
            ) : viewMode === 'folders' && !folderDrillDown ? (
              /* Folder View */
              <FolderView shots={shots} onSelectFolder={handleFolderSelect} />
            ) : folderDrillDown ? (
              /* Folder Drill-Down (Gallery with Back Button) */
              <>
                <FolderHeader 
                  type={folderDrillDown} 
                  count={folderFilteredShots.length}
                  onBack={handleFolderBack}
                />
                
                {/* Horizontal Gallery for Folder */}
                <div 
                  className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-2 px-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {folderFilteredShots.map((shot, index) => (
                    <SceneCard
                      key={shot.id}
                      shot={shot}
                      index={shots.indexOf(shot)}
                      resolvedUrl={resolvedUrls[shot.shotImagePaths?.[0] || '']}
                      onUpdateShot={onUpdateShot}
                      onClick={() => setSelectedSceneIndex(index)}
                    />
                  ))}
                </div>

                {/* Navigation Dots */}
                <div className="flex justify-center gap-1.5 pt-2">
                  {folderFilteredShots.slice(0, 12).map((shot) => (
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
                  {folderFilteredShots.length > 12 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      +{folderFilteredShots.length - 12}
                    </span>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </CollapsibleContent>
      </Card>

      {/* Scene Detail Modal */}
      <SceneDetailModal
        shot={selectedShot}
        isOpen={selectedSceneIndex !== null}
        onClose={() => setSelectedSceneIndex(null)}
        onUpdateShot={onUpdateShot}
        resolvedUrl={selectedResolvedUrl}
        currentIndex={selectedSceneIndex ?? 0}
        totalScenes={currentDisplayShots.length}
        onNavigate={handleNavigate}
      />
    </Collapsible>
  );
}
