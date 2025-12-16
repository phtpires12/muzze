import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { 
  Film, 
  Music, 
  Volume2, 
  Sparkles, 
  Type, 
  Palette,
  Check,
  Play,
  Pause
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

type StepStatus = 'idle' | 'active' | 'paused' | 'completed';

interface StepState {
  status: StepStatus;
  elapsedSeconds: number;
}

interface EditingChecklistProps {
  scriptId?: string;
  onAllCompleted: () => void;
}

interface EditingTimesData {
  [key: string]: {
    seconds: number;
    completed: boolean;
  };
}

const EDIT_STEPS: EditStep[] = [
  { id: "decupagem", label: "Decupagem", icon: Film, color: "text-blue-500" },
  { id: "musica", label: "Música", icon: Music, color: "text-pink-500" },
  { id: "efeitosSonoros", label: "Efeitos Sonoros", icon: Volume2, color: "text-orange-500" },
  { id: "efeitosVisuais", label: "Efeitos Visuais", icon: Sparkles, color: "text-purple-500" },
  { id: "legenda", label: "Legenda/Textos", icon: Type, color: "text-cyan-500" },
  { id: "cor", label: "Cor", icon: Palette, color: "text-green-500" },
];

const initialStepStates: Record<string, StepState> = {
  decupagem: { status: 'idle', elapsedSeconds: 0 },
  musica: { status: 'idle', elapsedSeconds: 0 },
  efeitosSonoros: { status: 'idle', elapsedSeconds: 0 },
  efeitosVisuais: { status: 'idle', elapsedSeconds: 0 },
  legenda: { status: 'idle', elapsedSeconds: 0 },
  cor: { status: 'idle', elapsedSeconds: 0 },
};

export const EditingChecklist = ({ scriptId, onAllCompleted }: EditingChecklistProps) => {
  const { toast } = useToast();
  const [stepStates, setStepStates] = useState<Record<string, StepState>>(initialStepStates);
  const stepStatesRef = useRef(stepStates);
  const scriptIdRef = useRef(scriptId);

  // Keep refs in sync
  useEffect(() => {
    stepStatesRef.current = stepStates;
  }, [stepStates]);

  useEffect(() => {
    scriptIdRef.current = scriptId;
  }, [scriptId]);

  // Build times JSON for persistence
  const buildTimesJson = useCallback((states: Record<string, StepState>): EditingTimesData => {
    const times: EditingTimesData = {};
    Object.entries(states).forEach(([stepId, state]) => {
      times[stepId] = {
        seconds: state.elapsedSeconds,
        completed: state.status === 'completed'
      };
    });
    return times;
  }, []);

  // Persist times to database
  const persistTimes = useCallback(async (states: Record<string, StepState>) => {
    if (!scriptIdRef.current) return;
    
    try {
      const completedIds = Object.entries(states)
        .filter(([_, s]) => s.status === 'completed')
        .map(([id]) => id);

      await supabase
        .from('scripts')
        .update({ 
          editing_progress: completedIds,
          editing_times: buildTimesJson(states)
        })
        .eq('id', scriptIdRef.current);
    } catch (error) {
      console.error('Error persisting editing times:', error);
    }
  }, [buildTimesJson]);

  // Load saved progress from database
  useEffect(() => {
    const loadProgress = async () => {
      if (!scriptId) return;
      
      try {
        const { data, error } = await supabase
          .from('scripts')
          .select('editing_times, editing_progress')
          .eq('id', scriptId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setStepStates(prev => {
            const updated = { ...prev };
            
            // Load from editing_times (new format with time)
            if (data.editing_times && typeof data.editing_times === 'object') {
              const times = data.editing_times as EditingTimesData;
              Object.entries(times).forEach(([stepId, stepData]) => {
                if (updated[stepId] && stepData) {
                  updated[stepId].elapsedSeconds = stepData.seconds || 0;
                  updated[stepId].status = stepData.completed ? 'completed' : 
                                          (stepData.seconds > 0 ? 'paused' : 'idle');
                }
              });
            } 
            // Fallback to editing_progress (old format, just IDs)
            else if (data.editing_progress?.length) {
              (data.editing_progress as string[]).forEach((stepId: string) => {
                if (updated[stepId]) {
                  updated[stepId].status = 'completed';
                }
              });
            }
            
            return updated;
          });
        }
      } catch (error) {
        console.error('Error loading editing progress:', error);
      }
    };
    
    loadProgress();
  }, [scriptId]);

  // Timer effect - increment active timers
  useEffect(() => {
    const interval = setInterval(() => {
      setStepStates((prev) => {
        const hasActive = Object.values(prev).some(s => s.status === 'active');
        if (!hasActive) return prev;
        
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (updated[key].status === 'active') {
            updated[key] = {
              ...updated[key],
              elapsedSeconds: updated[key].elapsedSeconds + 1
            };
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-save every 10 seconds when active
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const hasActive = Object.values(stepStatesRef.current).some(s => s.status === 'active');
      if (hasActive && scriptIdRef.current) {
        persistTimes(stepStatesRef.current);
      }
    }, 10000);
    
    return () => clearInterval(autoSaveInterval);
  }, [persistTimes]);

  // Save on page exit
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (scriptIdRef.current) {
        // Use sendBeacon for reliability on page unload
        const hasProgress = Object.values(stepStatesRef.current).some(
          s => s.elapsedSeconds > 0 || s.status === 'completed'
        );
        if (hasProgress) {
          persistTimes(stepStatesRef.current);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      handleBeforeUnload(); // Save on unmount
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [persistTimes]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause
  const handleStepClick = (stepId: string) => {
    setStepStates((prev) => {
      const step = prev[stepId];
      
      // If completed, don't do anything
      if (step.status === 'completed') return prev;
      
      const updated = { ...prev };
      
      // Pause all other active steps first
      Object.keys(updated).forEach((key) => {
        if (key !== stepId && updated[key].status === 'active') {
          updated[key] = { ...updated[key], status: 'paused' };
        }
      });
      
      // Toggle between active <-> paused/idle
      if (step.status === 'active') {
        // Pause
        updated[stepId] = { ...updated[stepId], status: 'paused' };
        persistTimes(updated);
        
        toast({
          title: `⏸ ${EDIT_STEPS.find(s => s.id === stepId)?.label} pausada`,
          description: `Tempo: ${formatTime(updated[stepId].elapsedSeconds)}`,
        });
      } else {
        // Start or resume
        updated[stepId] = { ...updated[stepId], status: 'active' };
      }
      
      return updated;
    });
  };

  // Complete a step
  const completeStep = async (stepId: string) => {
    const stepLabel = EDIT_STEPS.find(s => s.id === stepId)?.label;
    
    setStepStates((prev) => {
      const updated = { ...prev };
      updated[stepId] = { ...updated[stepId], status: 'completed' };
      
      // Calculate completed steps for persistence
      const completedSteps = Object.entries(updated)
        .filter(([_, state]) => state.status === 'completed')
        .map(([id]) => id);
      
      // Check if all completed
      const allCompleted = Object.values(updated).every(s => s.status === 'completed');
      
      // Persist to database
      if (scriptId) {
        supabase
          .from('scripts')
          .update({ 
            editing_progress: completedSteps,
            editing_times: buildTimesJson(updated),
            ...(allCompleted ? { status: 'completed', publish_status: 'pronto_para_postar' } : {})
          })
          .eq('id', scriptId)
          .then(() => {
            console.log('Step completed and saved');
          });
      }
      
      // Trigger onAllCompleted after delay
      if (allCompleted) {
        setTimeout(() => {
          onAllCompleted();
        }, 1000);
      }
      
      return updated;
    });
    
    toast({
      title: `✓ ${stepLabel} completa!`,
      description: `Tempo total: ${formatTime(stepStates[stepId].elapsedSeconds)}`,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {EDIT_STEPS.map((step) => {
        const Icon = step.icon;
        const state = stepStates[step.id];
        
        return (
          <div
            key={step.id}
            className={cn(
              "p-4 rounded-xl border-2 transition-all duration-300 relative",
              "flex flex-col items-center gap-2",
              state.status === 'completed' && "bg-green-500/20 border-green-500",
              state.status === 'active' && "bg-primary/10 border-primary shadow-lg animate-pulse",
              state.status === 'paused' && "bg-amber-500/10 border-amber-500",
              state.status === 'idle' && "bg-card border-border/20"
            )}
          >
            {/* Main clickable area */}
            <button
              onClick={() => handleStepClick(step.id)}
              disabled={state.status === 'completed'}
              className={cn(
                "flex flex-col items-center gap-2 w-full",
                state.status !== 'completed' && "hover:opacity-80 cursor-pointer",
                state.status === 'completed' && "cursor-default"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                state.status === 'completed' && "bg-green-500",
                state.status === 'active' && "bg-primary",
                state.status === 'paused' && "bg-amber-500",
                state.status === 'idle' && "bg-gradient-to-br from-accent/20 to-primary/20"
              )}>
                {state.status === 'completed' && <Check className="w-5 h-5 text-white" />}
                {state.status === 'active' && <Pause className="w-5 h-5 text-white" />}
                {state.status === 'paused' && <Play className="w-5 h-5 text-white" />}
                {state.status === 'idle' && <Icon className={cn("w-5 h-5", step.color)} />}
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-sm font-medium text-center",
                state.status === 'completed' && "text-green-600 dark:text-green-400",
                state.status === 'paused' && "text-amber-600 dark:text-amber-400"
              )}>
                {step.label}
              </span>
              
              {/* Timer */}
              <div className={cn(
                "text-xs font-mono",
                state.status === 'completed' && "text-green-600 dark:text-green-400",
                state.status === 'active' && "text-primary",
                state.status === 'paused' && "text-amber-600 dark:text-amber-400",
                state.status === 'idle' && "text-muted-foreground"
              )}>
                {state.elapsedSeconds > 0 ? formatTime(state.elapsedSeconds) : "--:--"}
              </div>
            </button>
            
            {/* Check button - only visible when paused with time */}
            {state.status === 'paused' && state.elapsedSeconds > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  completeStep(step.id);
                }}
                className={cn(
                  "mt-1 px-3 py-1 rounded-full text-xs font-medium",
                  "bg-green-500 text-white hover:bg-green-600 transition-colors",
                  "flex items-center gap-1"
                )}
              >
                <Check className="w-3 h-3" />
                Concluir
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Export step IDs for use elsewhere
export { EDITING_STEP_IDS };
