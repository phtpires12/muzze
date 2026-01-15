import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LevelDefinition } from "@/lib/gamification";
import { Sparkles } from "lucide-react";

export const LevelUpModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [levelInfo, setLevelInfo] = useState<LevelDefinition | null>(null);

  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      const { level, levelInfo } = event.detail;
      setLevelInfo(levelInfo);
      setIsOpen(true);
    };

    window.addEventListener('levelUp', handleLevelUp as EventListener);

    return () => {
      window.removeEventListener('levelUp', handleLevelUp as EventListener);
    };
  }, []);

  if (!levelInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Parabéns! 🎉</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white animate-scale-in shadow-2xl"
                style={{ background: levelInfo.color }}
              >
                {levelInfo.level}
              </div>
              <Sparkles className="w-6 h-6 text-accent absolute -top-2 -right-2 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                Você subiu para o Nível {levelInfo.level}!
              </h2>
              <p className="text-xl font-semibold text-primary">
                {levelInfo.name}
              </p>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {levelInfo.description}
              </p>
            </div>
          </div>

          {levelInfo.rewards.length > 0 && (
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm text-center">Recompensas desbloqueadas:</h3>
              <div className="space-y-1">
                {levelInfo.rewards.map((reward, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>{reward}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => setIsOpen(false)}
            className="w-full"
            size="lg"
          >
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
