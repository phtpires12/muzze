import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SessionStage = "idea" | "ideation" | "script" | "review" | "record" | "edit";

export interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  stage: SessionStage;
  elapsedSeconds: number; // Timer GLOBAL - não reseta ao mudar de etapa
  stageElapsedSeconds: number; // Timer da etapa atual - reseta ao mudar
  startedAt: Date | null;
  sessionId: string | null;
  targetSeconds: number; // Meta fixa de 25 min (para streak)
  isStreakMode: boolean; // Modo ofensiva (após 25 min)
  dailyGoalMinutes: number; // Meta diária do usuário
  contentId: string | null; // ID do conteúdo sendo trabalhado
}

// Backward compatibility - estrutura antiga
export interface MuzzeSessionType {
  stage: "" | "ideation" | "script" | "record" | "edit" | "review";
  duration: number | null;
  contentId: string | null;
}

interface SessionContextValue {
  // Novo timer global
  timer: TimerState;
  startTimer: (stage: SessionStage) => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  changeTimerStage: (newStage: SessionStage) => Promise<void>;
  setContentId: (id: string | null) => void;
  saveStageTime: () => Promise<void>;
  
  // Backward compatibility
  muzzeSession: MuzzeSessionType;
  setMuzzeSession: (context: Partial<MuzzeSessionType>) => void;
  resetMuzzeSession: () => void;
}

interface SessionContextProviderProps {
  children: ReactNode;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const defaultTimerState: TimerState = {
  isActive: false,
  isPaused: false,
  stage: "ideation",
  elapsedSeconds: 0,
  stageElapsedSeconds: 0,
  startedAt: null,
  sessionId: null,
  targetSeconds: 25 * 60,
  isStreakMode: false,
  dailyGoalMinutes: 60,
  contentId: null,
};

// Carregar estado inicial do localStorage
const loadTimerState = (): TimerState => {
  try {
    const saved = localStorage.getItem('muzze_global_timer');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Verificar se a sessão é órfã (muito antiga)
      if (parsed.startedAt) {
        const startedAt = new Date(parsed.startedAt);
        const age = Date.now() - startedAt.getTime();
        
        if (age > TWO_HOURS_MS) {
          console.log('[SessionContext] Timer órfão detectado, resetando...');
          localStorage.removeItem('muzze_global_timer');
          return defaultTimerState;
        }
        
        parsed.startedAt = startedAt;
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('[SessionContext] Error loading timer state:', error);
  }
  return defaultTimerState;
};

export const SessionContextProvider = ({ children }: SessionContextProviderProps) => {
  const { toast } = useToast();
  const [timer, setTimer] = useState<TimerState>(loadTimerState);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stageStartRef = useRef<Date | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Persistir estado em localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('muzze_global_timer', JSON.stringify(timer));
  }, [timer]);

  // Sync contentId to global window object (para hooks externos)
  useEffect(() => {
    (window as any).__muzzeSessionContentId = timer.contentId;
  }, [timer.contentId]);

  // Timer tick - incrementa os dois contadores
  useEffect(() => {
    if (timer.isActive && !timer.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          const newElapsedSeconds = prev.elapsedSeconds + 1;
          const newStageElapsedSeconds = prev.stageElapsedSeconds + 1;
          const streakThreshold = 25 * 60;
          
          // Detectar entrada no modo streak
          const wasStreakMode = prev.isStreakMode;
          const isStreakMode = newElapsedSeconds >= streakThreshold;
          
          // Celebrar ao entrar em modo streak
          if (!wasStreakMode && isStreakMode) {
            toast({
              title: "🔥 Modo Ofensiva Ativado!",
              description: "Continue criando para bater sua meta diária!",
            });
          }
          
          return {
            ...prev,
            elapsedSeconds: newElapsedSeconds,
            stageElapsedSeconds: newStageElapsedSeconds,
            isStreakMode,
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isActive, timer.isPaused, toast]);

  // Auto-save incremental de stage_times a cada 30 segundos
  useEffect(() => {
    if (timer.isActive && !timer.isPaused) {
      autoSaveIntervalRef.current = setInterval(() => {
        saveStageTime();
      }, 30000);
    } else {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [timer.isActive, timer.isPaused]);

  // Função para salvar tempo da etapa atual no banco
  const saveStageTime = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (stageStartRef.current && timer.stageElapsedSeconds > 0) {
        const now = new Date();

        await supabase.from('stage_times').insert({
          user_id: user.id,
          stage: timer.stage,
          started_at: stageStartRef.current.toISOString(),
          ended_at: now.toISOString(),
          duration_seconds: timer.stageElapsedSeconds,
          content_item_id: timer.contentId || null,
        });

        console.log(`[SessionContext] ✅ Salvou ${timer.stageElapsedSeconds}s na etapa ${timer.stage}`);

        // Resetar contadores da etapa após salvar
        stageStartRef.current = now;
        setTimer(prev => ({ 
          ...prev, 
          stageElapsedSeconds: 0,
        }));
      }
    } catch (error) {
      console.error('[SessionContext] Erro ao salvar stage_time:', error);
    }
  }, [timer.stage, timer.stageElapsedSeconds, timer.contentId]);

  // Iniciar timer
  const startTimer = useCallback(async (initialStage: SessionStage) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date();
      stageStartRef.current = now;

      // Buscar meta diária do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_goal_minutes')
        .eq('user_id', user.id)
        .single();

      setTimer({
        isActive: true,
        isPaused: false,
        stage: initialStage,
        elapsedSeconds: 0,
        stageElapsedSeconds: 0,
        startedAt: now,
        sessionId: crypto.randomUUID(),
        targetSeconds: 25 * 60,
        isStreakMode: false,
        dailyGoalMinutes: profile?.daily_goal_minutes || 60,
        contentId: null,
      });

      // Track analytics
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'session_started',
        payload: { stage: initialStage }
      });

      console.log(`[SessionContext] ✅ Timer iniciado na etapa ${initialStage}`);
    } catch (error: any) {
      console.error('[SessionContext] Erro ao iniciar timer:', error);
      toast({
        title: "Erro ao iniciar sessão",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Pausar timer
  const pauseTimer = useCallback(() => {
    setTimer(prev => ({ ...prev, isPaused: true }));
    toast({
      title: "Sessão pausada",
      description: "Continue quando estiver pronto",
    });
  }, [toast]);

  // Retomar timer
  const resumeTimer = useCallback(() => {
    setTimer(prev => ({ ...prev, isPaused: false }));
    toast({
      title: "Sessão retomada",
      description: "Continue criando!",
    });
  }, [toast]);

  // Resetar timer (quando volta para home ou finaliza)
  const resetTimer = useCallback(() => {
    stageStartRef.current = null;
    setTimer(defaultTimerState);
    localStorage.removeItem('muzze_global_timer');
    console.log('[SessionContext] Timer resetado');
  }, []);

  // Mudar etapa SEM resetar o timer global
  const changeTimerStage = useCallback(async (newStage: SessionStage) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Salvar tempo da etapa ANTERIOR no banco
      if (stageStartRef.current && timer.stageElapsedSeconds > 0) {
        const now = new Date();

        await supabase.from('stage_times').insert({
          user_id: user.id,
          stage: timer.stage,
          started_at: stageStartRef.current.toISOString(),
          ended_at: now.toISOString(),
          duration_seconds: timer.stageElapsedSeconds,
          content_item_id: timer.contentId || null,
        });

        console.log(`[SessionContext] ✅ Salvou ${timer.stageElapsedSeconds}s da etapa ${timer.stage} antes de mudar`);
      }

      // Mudar etapa - reseta APENAS o timer da etapa
      const now = new Date();
      stageStartRef.current = now;
      
      setTimer(prev => ({ 
        ...prev, 
        stage: newStage,
        stageElapsedSeconds: 0,
        // elapsedSeconds continua! (timer global não reseta)
        // isStreakMode continua! (modo streak persiste)
      }));

      console.log(`[SessionContext] Etapa mudada para ${newStage}, elapsedSeconds mantido`);
    } catch (error: any) {
      console.error('[SessionContext] Erro ao mudar etapa:', error);
      toast({
        title: "Erro ao mudar etapa",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [timer.stage, timer.stageElapsedSeconds, timer.contentId, toast]);

  // Definir contentId
  const setContentId = useCallback((id: string | null) => {
    setTimer(prev => ({ ...prev, contentId: id }));
  }, []);

  // ============ Backward Compatibility ============
  // Derivar muzzeSession do timer para compatibilidade
  const muzzeSession: MuzzeSessionType = {
    stage: timer.isActive ? timer.stage as MuzzeSessionType['stage'] : "",
    duration: timer.elapsedSeconds || null,
    contentId: timer.contentId,
  };

  const setMuzzeSession = useCallback((context: Partial<MuzzeSessionType>) => {
    if (context.contentId !== undefined) {
      setContentId(context.contentId);
    }
    if (context.stage !== undefined && context.stage !== "") {
      setTimer(prev => ({ ...prev, stage: context.stage as SessionStage }));
    }
  }, [setContentId]);

  const resetMuzzeSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return (
    <SessionContext.Provider 
      value={{ 
        // Novo timer global
        timer, 
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        changeTimerStage,
        setContentId,
        saveStageTime,
        
        // Backward compatibility
        muzzeSession,
        setMuzzeSession,
        resetMuzzeSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within SessionContextProvider");
  }
  return context;
};
