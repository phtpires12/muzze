import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TROPHIES, getUserStats } from "@/lib/gamification";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

export const TrophyCard = () => {
  const [stats, setStats] = useState(getUserStats());
  
  useEffect(() => {
    const handleStorageChange = () => {
      setStats(getUserStats());
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  const unlockedTrophies = TROPHIES.filter(t => stats.trophies.includes(t.id));
  const lockedTrophies = TROPHIES.filter(t => !stats.trophies.includes(t.id));
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Troféus</h3>
        <Badge variant="secondary">{unlockedTrophies.length}/{TROPHIES.length}</Badge>
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {unlockedTrophies.map((trophy) => (
          <div
            key={trophy.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20"
          >
            <div className="text-3xl">{trophy.icon}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{trophy.name}</h4>
              <p className="text-xs text-muted-foreground">{trophy.description}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                +{trophy.points} pontos
              </Badge>
            </div>
          </div>
        ))}
        
        {lockedTrophies.map((trophy) => (
          <div
            key={trophy.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 opacity-50"
          >
            <div className="text-3xl grayscale">{trophy.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{trophy.name}</h4>
                <Lock className="w-3 h-3 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">{trophy.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
