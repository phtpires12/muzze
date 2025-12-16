import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { 
  Film, 
  Music, 
  Volume2, 
  Sparkles, 
  Type, 
  Palette,
  Check,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EDITING_STEP_IDS } from "@/lib/kanban-columns";

interface EditStep {
  id: string;
  label: string;
  icon: any;
  color: string;
}

interface StepState {
  isActive: boolean;
  isCompleted: boolean;
  elapsedSeconds: number;
}

interface EditingChecklistProps {
  scriptId?: string;
  onAllCompleted: () => void;
}

const EDIT_STEPS: EditStep[] = [
  { id: "decupagem", label: "Decupagem", icon: Film, color: "text-blue-500" },
  { id: "musica", label: "Música", icon: Music, color: "text-pink-500" },
  { id: "efeitosSonoros", label: "Efeitos Sonoros", icon: Volume2, color: "text-orange-500" },
  { id: "efeitosVisuais", label: "Efeitos Visuais", icon: Sparkles, color: "text-purple-500" },
  { id: "legenda", label: "Legenda/Textos", icon: Type, color: "text-cyan-500" },
  { id: "cor", label: "Cor", icon: Palette, color: "text-green-500" },
];

export const EditingChecklist = ({ scriptId, onAllCompleted }: EditingChecklistProps) => {
  const { toast } = useToast();
  
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({
    decupagem: { isActive: false, isCompleted: false, elapsedSeconds: 0 },
    musica: { isActive: false, isCompleted: false, elapsedSeconds: 0 },
    efeitosSonoros: { isActive: false, isCompleted: false, elapsedSeconds: 0 },
    efeitosVisuais: { isActive: false, isCompleted: false, elapsedSeconds: 0 },
    legenda: { isActive: false, isCompleted: false, elapsedSeconds: 0 },
    cor: { isActive: false, isCompleted: false, elapsedSeconds: 0 },
  });

  // Carregar progresso salvo do banco
  useEffect(() => {
    const loadProgress = async () => {
      if (!scriptId) return;
      
      try {
        const { data, error } = await supabase
          .from('scripts')
          .select('editing_progress')
          .eq('id', scriptId)
          .single();
        
        if (error) throw error;
        
        if (data?.editing_progress?.length) {
          setStepStates(prev => {
            const updated = { ...prev };
            (data.editing_progress as string[]).forEach((stepId: string) => {
              if (updated[stepId]) {
                updated[stepId].isCompleted = true;
              }
            });
            return updated;
          });
        }
      } catch (error) {
        console.error('Error loading editing progress:', error);
      }
    };
    
    loadProgress();
  }, [scriptId]);

  // Persistir progresso no banco
  const persistProgress = useCallback(async (completedSteps: string[]) => {
    if (!scriptId) return;
    
    try {
      await supabase
        .from('scripts')
        .update({ editing_progress: completedSteps })
        .eq('id', scriptId);
    } catch (error) {
      console.error('Error persisting editing progress:', error);
    }
  }, [scriptId]);

  // Timer effect - incrementa cronômetros ativos
  useEffect(() => {
    const interval = setInterval(() => {
      setStepStates((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (updated[key].isActive && !updated[key].isCompleted) {
            updated[key].elapsedSeconds += 1;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStepClick = async (stepId: string) => {
    setStepStates((prev) => {
      const updated = { ...prev };
      
      // Se já completada, não fazer nada
      if (updated[stepId].isCompleted) return prev;
      
      // Se está ativa, marcar como completada
      if (updated[stepId].isActive) {
        updated[stepId].isActive = false;
        updated[stepId].isCompleted = true;
        
        // Calcular etapas completadas para persistir
        const completedSteps = Object.entries(updated)
          .filter(([_, state]) => state.isCompleted)
          .map(([id]) => id);
        
        // Persistir no banco
        persistProgress(completedSteps);
        
        // Feedback de sucesso
        toast({
          title: `✓ ${EDIT_STEPS.find(s => s.id === stepId)?.label} completa!`,
          description: `Tempo: ${formatTime(updated[stepId].elapsedSeconds)}`,
        });
        
        // Verificar se todas foram completadas
        const allCompleted = Object.values(updated).every(s => s.isCompleted);
        if (allCompleted) {
          // Atualizar status e publish_status no banco
          if (scriptId) {
            supabase
              .from('scripts')
              .update({ 
                status: 'completed',
                publish_status: 'pronto_para_postar'
              })
              .eq('id', scriptId)
              .then(() => {
                console.log('Script marked as completed and ready to post');
              });
          }
          
          // Delay para o usuário ver a última sub-etapa ficando verde
          setTimeout(() => {
            onAllCompleted();
          }, 1000);
        }
        
        return updated;
      }
      
      // Se não está ativa, desativar todas e ativar esta
      Object.keys(updated).forEach((key) => {
        updated[key].isActive = false;
      });
      updated[stepId].isActive = true;
      
      return updated;
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {EDIT_STEPS.map((step) => {
        const Icon = step.icon;
        const state = stepStates[step.id];
        
        return (
          <button
            key={step.id}
            onClick={() => handleStepClick(step.id)}
            disabled={state.isCompleted}
            className={cn(
              "p-4 rounded-xl border-2 transition-all duration-300",
              "flex flex-col items-center gap-2",
              state.isCompleted 
                ? "bg-green-500/20 border-green-500 cursor-default" 
                : state.isActive
                ? "bg-accent/10 border-primary shadow-lg animate-pulse"
                : "bg-card border-border/20 hover:border-primary/50 hover:bg-accent/10"
            )}
          >
            {/* Ícone */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              state.isCompleted 
                ? "bg-green-500" 
                : "bg-gradient-to-br from-accent/20 to-primary/20"
            )}>
              {state.isCompleted ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Icon className={cn("w-5 h-5", step.color)} />
              )}
            </div>
            
            {/* Label */}
            <span className={cn(
              "text-sm font-medium text-center",
              state.isCompleted ? "text-green-600 dark:text-green-400" : "text-foreground"
            )}>
              {step.label}
            </span>
            
            {/* Timer */}
            <div className={cn(
              "text-xs font-mono flex items-center gap-1",
              state.isCompleted 
                ? "text-green-600 dark:text-green-400" 
                : state.isActive
                ? "text-primary"
                : "text-muted-foreground"
            )}>
              {!state.isCompleted && state.isActive && (
                <Clock className="w-3 h-3" />
              )}
              {state.elapsedSeconds > 0 ? formatTime(state.elapsedSeconds) : "--:--"}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// Export step IDs for use elsewhere
export { EDITING_STEP_IDS };
