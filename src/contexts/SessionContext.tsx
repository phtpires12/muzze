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
  lastActivityAt: Date | null; // Última interação do usuário
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
  validateSessionFreshness: () => boolean;
  
  // Backward compatibility
  muzzeSession: MuzzeSessionType;
  setMuzzeSession: (context: Partial<MuzzeSessionType>) => void;
  resetMuzzeSession: () => void;
}

interface SessionContextProviderProps {
  children: ReactNode;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

// Constantes de proteção
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const MAX_STAGE_SECONDS = 1800; // 30 minutos máximo por save
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos de inatividade = encerrar sessão
const BACKGROUND_PAUSE_MS = 2 * 60 * 1000; // 2 minutos em background = pausar

const defaultTimerState: TimerState = {
  isActive: false,
  isPaused: false,
  stage: "ideation",
  elapsedSeconds: 0,
  stageElapsedSeconds: 0,
  startedAt: null,
  lastActivityAt: null,
  sessionId: null,
  targetSeconds: 25 * 60,
  isStreakMode: false,
  dailyGoalMinutes: 60,
  contentId: null,
};

// Verificar se sessão é órfã baseado em lastActivityAt
const isSessionOrphan = (state: TimerState): boolean => {
  if (!state.isActive) return false;
  
  const lastActivity = state.lastActivityAt 
    ? new Date(state.lastActivityAt) 
    : state.startedAt 
      ? new Date(state.startedAt) 
      : null;
  
  if (!lastActivity) return false;
  
  const age = Date.now() - lastActivity.getTime();
  return age > TWO_HOURS_MS;
};

// Carregar estado inicial do localStorage COM validação de órfãos
const loadTimerState = (): TimerState => {
  try {
    // Limpar chave antiga também
    const savedOld = localStorage.getItem('muzze_session_state');
    if (savedOld) {
      try {
        const parsedOld = JSON.parse(savedOld);
        if (parsedOld.startedAt) {
          const startedAt = new Date(parsedOld.startedAt);
          const age = Date.now() - startedAt.getTime();
          if (age > TWO_HOURS_MS) {
            localStorage.removeItem('muzze_session_state');
            console.log('[SessionContext] Chave antiga órfã removida');
          }
        }
      } catch {
        localStorage.removeItem('muzze_session_state');
      }
    }

    const saved = localStorage.getItem('muzze_global_timer');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Converter datas de string para Date
      if (parsed.startedAt) {
        parsed.startedAt = new Date(parsed.startedAt);
      }
      if (parsed.lastActivityAt) {
        parsed.lastActivityAt = new Date(parsed.lastActivityAt);
      }
      
      // Verificar se a sessão é órfã
      if (isSessionOrphan(parsed)) {
        console.log('[SessionContext] Timer órfão detectado no carregamento, resetando...');
        localStorage.removeItem('muzze_global_timer');
        return defaultTimerState;
      }
      
      // PROTEÇÃO: Validar stageElapsedSeconds no carregamento
      if (parsed.stageElapsedSeconds > MAX_STAGE_SECONDS) {
        console.warn(`[SessionContext] stageElapsedSeconds corrompido no load: ${parsed.stageElapsedSeconds}, resetando para 0`);
        parsed.stageElapsedSeconds = 0;
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('[SessionContext] Error loading timer state:', error);
    localStorage.removeItem('muzze_global_timer');
  }
  return defaultTimerState;
};

export const SessionContextProvider = ({ children }: SessionContextProviderProps) => {
  const { toast } = useToast();
  const [timer, setTimer] = useState<TimerState>(loadTimerState);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const hiddenSinceRef = useRef<number | null>(null);
  
  // REFS CRÍTICOS para evitar stale closures
  const stageStartRef = useRef<Date | null>(null);
  const stageElapsedRef = useRef<number>(0);
  const lastRealInteractionRef = useRef<number>(Date.now());
  const timerRef = useRef<TimerState>(timer);
  
  // Manter timerRef atualizado
  useEffect(() => {
    timerRef.current = timer;
    stageElapsedRef.current = timer.stageElapsedSeconds;
  }, [timer]);

  // Validar frescor da sessão
  const validateSessionFreshness = useCallback((): boolean => {
    if (!timerRef.current.isActive) return true;
    
    if (isSessionOrphan(timerRef.current)) {
      console.log('[SessionContext] Sessão órfã detectada via validateSessionFreshness');
      setTimer(defaultTimerState);
      localStorage.removeItem('muzze_global_timer');
      return false;
    }
    
    return true;
  }, []);

  // RASTREAR INTERAÇÃO REAL DO USUÁRIO
  useEffect(() => {
    const updateLastInteraction = () => {
      lastRealInteractionRef.current = Date.now();
    };
    
    document.addEventListener('click', updateLastInteraction, { passive: true });
    document.addEventListener('keydown', updateLastInteraction, { passive: true });
    document.addEventListener('touchstart', updateLastInteraction, { passive: true });
    document.addEventListener('scroll', updateLastInteraction, { passive: true });
    
    return () => {
      document.removeEventListener('click', updateLastInteraction);
      document.removeEventListener('keydown', updateLastInteraction);
      document.removeEventListener('touchstart', updateLastInteraction);
      document.removeEventListener('scroll', updateLastInteraction);
    };
  }, []);

  // Função para salvar tempo - USA REFS para valores críticos
  const saveStageTime = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const currentTimer = timerRef.current;
      const currentStageElapsed = stageElapsedRef.current;
      const currentStageStart = stageStartRef.current;

      // Se não há tempo para salvar, retornar
      if (!currentStageStart || currentStageElapsed <= 0) {
        return;
      }

      // Proteção: evitar saves duplicados muito próximos (min 10s entre saves)
      const now = Date.now();
      if (now - lastSaveTimeRef.current < 10000) {
        console.log('[SessionContext] Save ignorado - muito próximo do anterior');
        return;
      }

      const nowDate = new Date();
      
      // VALIDAÇÃO TRIPLA: Calcular duração real baseada em timestamps
      const realDurationFromTimestamps = Math.floor((nowDate.getTime() - currentStageStart.getTime()) / 1000);
      
      // Usar o MENOR valor entre: contador, cálculo real, e máximo permitido
      const safeDuration = Math.min(
        currentStageElapsed,
        realDurationFromTimestamps,
        MAX_STAGE_SECONDS
      );

      // Se duração é suspeita (muito maior que real), logar e usar valor calculado
      if (currentStageElapsed > realDurationFromTimestamps + 60) {
        console.warn(`[SessionContext] ⚠️ Duração suspeita: contador=${currentStageElapsed}s, real=${realDurationFromTimestamps}s, usando ${safeDuration}s`);
      }

      // Só salvar se tiver pelo menos 1 segundo
      if (safeDuration < 1) {
        console.log('[SessionContext] Duração muito baixa, ignorando save');
        return;
      }

      lastSaveTimeRef.current = now;

      await supabase.from('stage_times').insert({
        user_id: user.id,
        stage: currentTimer.stage,
        started_at: currentStageStart.toISOString(),
        ended_at: nowDate.toISOString(),
        duration_seconds: safeDuration,
        content_item_id: currentTimer.contentId || null,
      });

      console.log(`[SessionContext] ✅ Salvou ${safeDuration}s na etapa ${currentTimer.stage}`);

      // Resetar contadores da etapa após salvar
      stageStartRef.current = nowDate;
      setTimer(prev => ({ 
        ...prev, 
        stageElapsedSeconds: 0,
        lastActivityAt: nowDate,
      }));
    } catch (error) {
      console.error('[SessionContext] Erro ao salvar stage_time:', error);
    }
  }, []);

  // Verificar frescor e inatividade quando o app fica visível/invisível
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // Aba ficou escondida - marcar o momento e SALVAR IMEDIATAMENTE
        hiddenSinceRef.current = Date.now();
        
        if (timerRef.current.isActive && !timerRef.current.isPaused && stageElapsedRef.current > 0) {
          console.log('[SessionContext] Aba escondida, salvando tempo atual...');
          await saveStageTime();
        }
      } else if (document.visibilityState === 'visible') {
        // Aba voltou visível
        const currentTimer = timerRef.current;
        
        // Verificar se sessão é órfã
        if (currentTimer.isActive && isSessionOrphan(currentTimer)) {
          console.log('[SessionContext] Sessão órfã detectada ao voltar ao app');
          setTimer(defaultTimerState);
          localStorage.removeItem('muzze_global_timer');
          toast({
            title: "Sessão expirada",
            description: "Sua sessão anterior expirou. Inicie uma nova.",
          });
          hiddenSinceRef.current = null;
          return;
        }
        
        // Verificar se ficou escondida por muito tempo
        if (hiddenSinceRef.current && currentTimer.isActive && !currentTimer.isPaused) {
          const hiddenDuration = Date.now() - hiddenSinceRef.current;
          
          if (hiddenDuration > INACTIVITY_TIMEOUT_MS) {
            // 30+ min em background = encerrar sessão
            console.log(`[SessionContext] Aba inativa por ${Math.round(hiddenDuration / 60000)} min, encerrando sessão`);
            setTimer(defaultTimerState);
            localStorage.removeItem('muzze_global_timer');
            toast({
              title: "Sessão encerrada automaticamente",
              description: "Você ficou ausente por mais de 30 minutos.",
            });
          } else if (hiddenDuration > BACKGROUND_PAUSE_MS) {
            // 2+ min em background = pausar
            console.log(`[SessionContext] Aba inativa por ${Math.round(hiddenDuration / 60000)} min, pausando timer`);
            setTimer(prev => ({ ...prev, isPaused: true, lastActivityAt: new Date() }));
            toast({
              title: "Sessão pausada automaticamente",
              description: "Você ficou ausente. Clique em retomar para continuar.",
            });
          }
        }
        hiddenSinceRef.current = null;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [toast, saveStageTime]);

  // Persistir estado em localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('muzze_global_timer', JSON.stringify(timer));
  }, [timer]);

  // Sync contentId to global window object
  useEffect(() => {
    (window as any).__muzzeSessionContentId = timer.contentId;
  }, [timer.contentId]);

  // Timer tick - incrementa os dois contadores COM PROTEÇÕES
  useEffect(() => {
    if (timer.isActive && !timer.isPaused) {
      intervalRef.current = setInterval(() => {
        // VERIFICAR INATIVIDADE REAL (30 min sem interação = encerrar)
        const timeSinceLastInteraction = Date.now() - lastRealInteractionRef.current;
        if (timeSinceLastInteraction > INACTIVITY_TIMEOUT_MS) {
          console.log(`[SessionContext] Inatividade detectada (${Math.round(timeSinceLastInteraction / 60000)} min), encerrando sessão`);
          
          // Salvar antes de encerrar
          saveStageTime();
          
          setTimer(defaultTimerState);
          localStorage.removeItem('muzze_global_timer');
          toast({
            title: "Sessão encerrada",
            description: "Inatividade detectada por mais de 30 minutos.",
          });
          return;
        }

        setTimer(prev => {
          const newElapsedSeconds = prev.elapsedSeconds + 1;
          let newStageElapsedSeconds = prev.stageElapsedSeconds + 1;
          
          // PROTEÇÃO: limitar stageElapsedSeconds
          if (newStageElapsedSeconds > MAX_STAGE_SECONDS) {
            console.warn(`[SessionContext] stageElapsedSeconds atingiu máximo (${MAX_STAGE_SECONDS}), resetando...`);
            // Forçar save e resetar
            saveStageTime();
            newStageElapsedSeconds = 0;
          }
          
          const streakThreshold = 25 * 60;
          const wasStreakMode = prev.isStreakMode;
          const isStreakMode = newElapsedSeconds >= streakThreshold;
          
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
            lastActivityAt: new Date(),
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
  }, [timer.isActive, timer.isPaused, toast, saveStageTime]);

  // Auto-save incremental a cada 30 segundos
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
  }, [timer.isActive, timer.isPaused, saveStageTime]);

  // Iniciar timer
  const startTimer = useCallback(async (initialStage: SessionStage) => {
    try {
      // LIMPAR QUALQUER ESTADO ÓRFÃO ANTES DE INICIAR NOVA SESSÃO
      localStorage.removeItem('muzze_global_timer');
      localStorage.removeItem('muzze_session_state');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date();
      stageStartRef.current = now;
      stageElapsedRef.current = 0;
      lastRealInteractionRef.current = Date.now();

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
        lastActivityAt: now,
        sessionId: crypto.randomUUID(),
        targetSeconds: 25 * 60,
        isStreakMode: false,
        dailyGoalMinutes: profile?.daily_goal_minutes || 60,
        contentId: null,
      });

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
    const now = new Date();
    lastRealInteractionRef.current = Date.now();
    setTimer(prev => ({ ...prev, isPaused: true, lastActivityAt: now }));
    toast({
      title: "Sessão pausada",
      description: "Continue quando estiver pronto",
    });
  }, [toast]);

  // Retomar timer
  const resumeTimer = useCallback(() => {
    const now = new Date();
    lastRealInteractionRef.current = Date.now();
    stageStartRef.current = now; // Reiniciar contagem da etapa
    setTimer(prev => ({ ...prev, isPaused: false, lastActivityAt: now, stageElapsedSeconds: 0 }));
    toast({
      title: "Sessão retomada",
      description: "Continue criando!",
    });
  }, [toast]);

  // Resetar timer
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

      const currentStageElapsed = stageElapsedRef.current;
      const currentStageStart = stageStartRef.current;
      const currentTimer = timerRef.current;

      // Salvar tempo da etapa ANTERIOR no banco
      if (currentStageStart && currentStageElapsed > 0) {
        const now = new Date();
        const realDuration = Math.floor((now.getTime() - currentStageStart.getTime()) / 1000);
        const safeDuration = Math.min(currentStageElapsed, realDuration, MAX_STAGE_SECONDS);

        if (safeDuration > 0) {
          await supabase.from('stage_times').insert({
            user_id: user.id,
            stage: currentTimer.stage,
            started_at: currentStageStart.toISOString(),
            ended_at: now.toISOString(),
            duration_seconds: safeDuration,
            content_item_id: currentTimer.contentId || null,
          });

          console.log(`[SessionContext] ✅ Salvou ${safeDuration}s da etapa ${currentTimer.stage} antes de mudar`);
        }
      }

      // Mudar etapa
      const now = new Date();
      stageStartRef.current = now;
      lastRealInteractionRef.current = Date.now();
      
      setTimer(prev => ({ 
        ...prev, 
        stage: newStage,
        stageElapsedSeconds: 0,
        lastActivityAt: now,
      }));

      console.log(`[SessionContext] Etapa mudada para ${newStage}`);
    } catch (error: any) {
      console.error('[SessionContext] Erro ao mudar etapa:', error);
      toast({
        title: "Erro ao mudar etapa",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Definir contentId
  const setContentId = useCallback((id: string | null) => {
    lastRealInteractionRef.current = Date.now();
    setTimer(prev => ({ ...prev, contentId: id, lastActivityAt: new Date() }));
  }, []);

  // ============ Backward Compatibility ============
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
        timer, 
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        changeTimerStage,
        setContentId,
        saveStageTime,
        validateSessionFreshness,
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
  if (context === undefined) {
    throw new Error("useSessionContext must be used within a SessionContextProvider");
  }
  return context;
};
