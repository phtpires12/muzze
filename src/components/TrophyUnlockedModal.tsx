import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { useNavigate } from "react-router-dom";
import { Trophy as TrophyType } from "@/lib/gamification";
import { Sparkles } from "lucide-react";

interface TrophyUnlockEvent {
  trophy: TrophyType;
  xpGained: number;
}

export const TrophyUnlockedModal = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentTrophy, setCurrentTrophy] = useState<TrophyUnlockEvent | null>(null);
  const [queue, setQueue] = useState<TrophyUnlockEvent[]>([]);

  useEffect(() => {
    const handleTrophyUnlocked = (event: Event) => {
      const customEvent = event as CustomEvent<TrophyUnlockEvent>;
      const trophyEvent = customEvent.detail;
      
      setQueue(prev => [...prev, trophyEvent]);
    };

    window.addEventListener('trophyUnlocked', handleTrophyUnlocked);
    return () => window.removeEventListener('trophyUnlocked', handleTrophyUnlocked);
  }, []);

  useEffect(() => {
    if (queue.length > 0 && !isOpen) {
      setCurrentTrophy(queue[0]);
      setIsOpen(true);
    }
  }, [queue, isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setCurrentTrophy(null);
    setQueue(prev => prev.slice(1));
  };

  const handleViewLevels = () => {
    handleClose();
    navigate('/levels');
  };

  if (!currentTrophy) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <AuroraBackground 
          variant="full" 
          intensity="medium" 
          animated={true}
          className="p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Troféu Desbloqueado! 🎉
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="text-7xl animate-bounce">
              {currentTrophy.trophy.icon}
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">{currentTrophy.trophy.name}</h3>
              <p className="text-sm text-muted-foreground">
                {currentTrophy.trophy.description}
              </p>
            </div>
            
            <Badge variant="secondary" className="text-lg px-4 py-2 gap-2">
              <Sparkles className="w-4 h-4" />
              +{currentTrophy.xpGained} XP
            </Badge>
            
            {queue.length > 1 && (
              <p className="text-xs text-muted-foreground">
                +{queue.length - 1} troféu(s) na fila
              </p>
            )}
          </div>
        
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleClose}
            >
            Continuar
          </Button>
            <Button 
              className="flex-1"
              onClick={handleViewLevels}
            >
              Ver Níveis
            </Button>
          </div>
        </AuroraBackground>
      </DialogContent>
    </Dialog>
  );
};
