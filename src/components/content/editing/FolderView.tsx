import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Folder, ChevronRight, ArrowLeft, Video, Film } from "lucide-react";
import { cn } from '@/core/utils';
import { ShotItem, inferRollType } from '@/core/utils';

type RollType = 'a-roll' | 'b-roll';

interface FolderStats {
  type: RollType;
  label: string;
  totalCount: number;
  linkedCount: number;
}

interface FolderViewProps {
  shots: ShotItem[];
  onSelectFolder: (type: RollType) => void;
}

function calculateFolderStats(shots: ShotItem[]): FolderStats[] {
  const aRollShots = shots.filter(s => inferRollType(s) === 'a-roll');
  const bRollShots = shots.filter(s => inferRollType(s) === 'b-roll');

  return [
    {
      type: 'a-roll',
      label: 'A-roll',
      totalCount: aRollShots.length,
      linkedCount: aRollShots.filter(s => s.videoUrl).length,
    },
    {
      type: 'b-roll',
      label: 'B-roll',
      totalCount: bRollShots.length,
      linkedCount: bRollShots.filter(s => s.videoUrl).length,
    },
  ];
}

function FolderCard({ stats, onClick }: { stats: FolderStats; onClick: () => void }) {
  const progress = stats.totalCount > 0 
    ? Math.round((stats.linkedCount / stats.totalCount) * 100) 
    : 0;
  
  const isComplete = stats.linkedCount === stats.totalCount && stats.totalCount > 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left"
      disabled={stats.totalCount === 0}
    >
      <Card className={cn(
        "p-4 transition-all duration-200",
        stats.totalCount > 0 
          ? "hover:border-primary/50 hover:shadow-md cursor-pointer" 
          : "opacity-50 cursor-not-allowed"
      )}>
        <div className="flex items-center gap-4">
          {/* Folder Icon */}
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            stats.type === 'a-roll' 
              ? "bg-blue-500/10" 
              : "bg-amber-500/10"
          )}>
            <Folder className={cn(
              "w-6 h-6",
              stats.type === 'a-roll' 
                ? "text-blue-500" 
                : "text-amber-500"
            )} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{stats.label}</h3>
              {isComplete && (
                <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                  ✓ Completo
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.totalCount} cenas
              {stats.linkedCount > 0 && ` • ${stats.linkedCount} com vídeo`}
            </p>
          </div>

          {/* Progress & Arrow */}
          {stats.totalCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-sm font-medium text-foreground">{progress}%</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {stats.totalCount > 0 && (
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-300",
                stats.type === 'a-roll' ? "bg-blue-500" : "bg-amber-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </Card>
    </button>
  );
}

export function FolderView({ shots, onSelectFolder }: FolderViewProps) {
  const folderStats = calculateFolderStats(shots);

  return (
    <div className="space-y-3 px-2 py-2">
      {folderStats.map(stats => (
        <FolderCard 
          key={stats.type}
          stats={stats}
          onClick={() => onSelectFolder(stats.type)}
        />
      ))}
    </div>
  );
}

interface FolderHeaderProps {
  type: RollType;
  count: number;
  onBack: () => void;
}

export function FolderHeader({ type, count, onBack }: FolderHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>
      <div className="flex items-center gap-2">
        <Folder className={cn(
          "w-5 h-5",
          type === 'a-roll' ? "text-blue-500" : "text-amber-500"
        )} />
        <span className="font-semibold text-foreground">
          {type === 'a-roll' ? 'A-roll' : 'B-roll'}
        </span>
        <Badge variant="secondary" className="text-xs">
          {count} cenas
        </Badge>
      </div>
    </div>
  );
}
