import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, List, MapPin, AlertTriangle, GripVertical, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface ShotItem {
  id: string;
  description: string;
  imageUrl?: string;
  location?: string;
  isComplex?: boolean;
  order: number;
}

interface ShotlistPanelProps {
  shots: ShotItem[];
  scriptId: string;
  onShotsChange?: (shots: ShotItem[]) => void;
}

type FilterType = 'chronological' | 'location' | 'complexity';

export function ShotlistPanel({ shots, scriptId, onShotsChange }: ShotlistPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<FilterType>('chronological');
  const [localShots, setLocalShots] = useState<ShotItem[]>(shots);

  // Sync local state with props
  useMemo(() => {
    setLocalShots(shots);
  }, [shots]);

  const filteredShots = useMemo(() => {
    const sorted = [...localShots];
    
    switch (filter) {
      case 'location':
        return sorted.sort((a, b) => (a.location || '').localeCompare(b.location || ''));
      case 'complexity':
        return sorted.sort((a, b) => {
          if (a.isComplex && !b.isComplex) return -1;
          if (!a.isComplex && b.isComplex) return 1;
          return a.order - b.order;
        });
      case 'chronological':
      default:
        return sorted.sort((a, b) => a.order - b.order);
    }
  }, [localShots, filter]);

  const toggleComplexity = async (shotId: string) => {
    const updatedShots = localShots.map(shot => 
      shot.id === shotId ? { ...shot, isComplex: !shot.isComplex } : shot
    );
    setLocalShots(updatedShots);
    onShotsChange?.(updatedShots);
  };

  const complexCount = localShots.filter(s => s.isComplex).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-border bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <List className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Shotlist</h3>
                <p className="text-xs text-muted-foreground">
                  {localShots.length} cenas {complexCount > 0 && `• ${complexCount} complexas`}
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
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={filter === 'chronological' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('chronological')}
                className="flex-shrink-0"
              >
                <List className="w-4 h-4 mr-1" />
                Ordem
              </Button>
              <Button
                variant={filter === 'location' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('location')}
                className="flex-shrink-0"
              >
                <MapPin className="w-4 h-4 mr-1" />
                Locação
              </Button>
              <Button
                variant={filter === 'complexity' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('complexity')}
                className="flex-shrink-0"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Complexas
              </Button>
            </div>

            {/* Shots List */}
            {filteredShots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <List className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma cena na shotlist</p>
                <p className="text-xs">Adicione cenas durante a etapa de roteiro</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredShots.map((shot, index) => (
                  <div
                    key={shot.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      shot.isComplex 
                        ? "border-yellow-500/30 bg-yellow-500/5" 
                        : "border-border bg-background"
                    )}
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="w-4 h-4 opacity-50" />
                      <span className="text-xs font-mono w-5">{index + 1}</span>
                    </div>
                    
                    {shot.imageUrl && (
                      <img 
                        src={shot.imageUrl} 
                        alt={`Cena ${index + 1}`}
                        className="w-16 h-12 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">
                        {shot.description}
                      </p>
                      {shot.location && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {shot.location}
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComplexity(shot.id)}
                      className={cn(
                        "flex-shrink-0",
                        shot.isComplex && "text-yellow-500"
                      )}
                    >
                      <Star className={cn(
                        "w-4 h-4",
                        shot.isComplex && "fill-yellow-500"
                      )} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
