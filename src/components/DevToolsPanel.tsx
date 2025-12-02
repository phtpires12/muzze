import { useState } from "react";
import { Wrench, Flame, Trophy, Trash2, X } from "lucide-react";
import { Button } from "./ui/button";
import { useUserRole } from "@/hooks/useUserRole";

interface DevToolsPanelProps {
  onSimulateSession?: () => void;
  onSimulateTrophy?: () => void;
}

export const DevToolsPanel = ({ onSimulateSession, onSimulateTrophy }: DevToolsPanelProps) => {
  const { isDeveloper, isAdmin } = useUserRole();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only render for developers/admins
  if (!isDeveloper && !isAdmin) return null;

  const handleClearStorage = () => {
    localStorage.removeItem('session_state');
    localStorage.removeItem('unlocked_trophies');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      {isExpanded ? (
        <div className="bg-background/95 backdrop-blur-sm border-2 border-primary/50 rounded-lg shadow-xl p-4 min-w-[280px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Dev Tools</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {onSimulateSession && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSimulateSession}
                className="justify-start"
              >
                <Flame className="w-4 h-4 mr-2 text-orange-500" />
                Simular Sessão Completa
              </Button>
            )}

            {onSimulateTrophy && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSimulateTrophy}
                className="justify-start"
              >
                <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                Simular Troféu
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearStorage}
              className="justify-start"
            >
              <Trash2 className="w-4 h-4 mr-2 text-red-500" />
              Limpar localStorage
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="h-10 w-10 p-0 border-primary/50 hover:bg-primary/10"
        >
          <Wrench className="w-4 h-4 text-primary" />
        </Button>
      )}
    </div>
  );
};
