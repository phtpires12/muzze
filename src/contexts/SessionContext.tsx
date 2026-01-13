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
  savedSecondsThisSession: number; // Segundos já salvos no banco NESTA sessão (evita contagem dupla)
  dailyBaselineSeconds: number; // Snapshot dos segundos criados ANTES desta sessão (imutável durante sessão)
  hadPauseInSession: boolean; // Se o usuário pausou durante esta sessão
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
  stage: "idea",
  elapsedSeconds: 0,
  stageElapsedSeconds: 0,
  startedAt: null,
  lastActivityAt: null,
  sessionId: null,
  targetSeconds: 25 * 60,
  isStreakMode: false,
  dailyGoalMinutes: 60,
  contentId: null,
  savedSecondsThisSession: 0,
  dailyBaselineSeconds: 0, // Será populado ao iniciar sessão
  hadPauseInSession: false,
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

// NOVA POLÍTICA: NUNCA restaurar sessões do localStorage
// O tempo já está salvo no banco de dados (stage_times), não precisamos de persistência local
// Isso elimina completamente o problema de sessões órfãs
const loadTimerState = (): TimerState => {
  // Sempre limpar qualquer estado anterior
  localStorage.removeItem('muzze_global_timer');
  localStorage.removeItem('muzze_session_state');
  
  console.log('[SessionContext] Iniciando sem sessão prévia (sessões órfãs eliminadas)');
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
  
  // DEBUG: Contadores para rastrear criação de intervals
  const intervalCreateCountRef = useRef<number>(0);
  const autoSaveCreateCountRef = useRef<number>(0);
  
  // FIX: Version refs para invalidar intervals antigos (version guard pattern)
  const tickVersionRef = useRef<number>(0);
  const autoSaveVersionRef = useRef<number>(0);
  
  // DEBUG: Rastrear valores anteriores para detectar saltos
  const lastDebugRemainingRef = useRef<number | null>(null);
  const lastDebugElapsedRef = useRef<number | null>(null);
  const lastDebugBaselineRef = useRef<number | null>(null);
  
  // FIX: REFS ESTÁVEIS para toast e saveStageTime - evita recriação de intervals
  const toastRef = useRef(toast);
  const saveStageTimeRef = useRef<() => Promise<void>>(() => Promise.resolve());
  
  // Manter refs atualizados (esse effect NÃO causa recriação de intervals)
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  
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
      
      // DEBUG: Log antes do save
      console.log(`[AUTOSAVE] before save: elapsedSeconds=${currentTimer.elapsedSeconds}, stageElapsedSeconds=${currentStageElapsed}, dailyBaselineSeconds=${currentTimer.dailyBaselineSeconds}, savedSecondsThisSession=${currentTimer.savedSecondsThisSession}`);

      const { error } = await supabase.from('stage_times').insert({
        user_id: user.id,
        stage: currentTimer.stage,
        started_at: currentStageStart.toISOString(),
        ended_at: nowDate.toISOString(),
        duration_seconds: safeDuration,
        content_item_id: currentTimer.contentId || null,
        had_pause: currentTimer.hadPauseInSession,
        was_abandoned: false,
      });
      
      // DEBUG: Log resultado do save
      if (error) {
        console.error(`[AUTOSAVE] Supabase error:`, error);
      } else {
        console.log(`[AUTOSAVE] ✅ Saved ${safeDuration}s to DB`);
      }

      console.log(`[SessionContext] ✅ Salvou ${safeDuration}s na etapa ${currentTimer.stage}`);

      // Resetar contadores da etapa e ATUALIZAR savedSecondsThisSession
      // IMPORTANTE: NÃO alteramos elapsedSeconds nem dailyBaselineSeconds aqui!
      stageStartRef.current = nowDate;
      setTimer(prev => {
        console.log(`[AUTOSAVE] after save setTimer: elapsedSeconds=${prev.elapsedSeconds} (unchanged), stageElapsedSeconds=0, savedSecondsThisSession=${prev.savedSecondsThisSession} + ${safeDuration}`);
        return { 
          ...prev, 
          stageElapsedSeconds: 0,
          lastActivityAt: nowDate,
          savedSecondsThisSession: prev.savedSecondsThisSession + safeDuration, // RASTREAR tempo já salvo
        };
      });
    } catch (error) {
      console.error('[SessionContext] Erro ao salvar stage_time:', error);
    }
  }, []);

  // FIX: Manter saveStageTimeRef atualizado
  useEffect(() => {
    saveStageTimeRef.current = saveStageTime;
  }, [saveStageTime]);

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
  // FIX: Version guard pattern - nunca cria interval duplicado, invalida callbacks antigos
  useEffect(() => {
    // Incrementar versão - invalida qualquer interval anterior
    tickVersionRef.current += 1;
    const currentVersion = tickVersionRef.current;
    
    // Se já existe interval ativo, deixar cleanup lidar (não limpar no corpo)
    if (intervalRef.current) {
      console.log(`[TIMER] skipping creation - interval already exists, version=${currentVersion}`);
      return;
    }
    
    if (timer.isActive && !timer.isPaused) {
      intervalCreateCountRef.current += 1;
      const currentCount = intervalCreateCountRef.current;
      
      const id = setInterval(() => {
        // VERSION GUARD: se versão mudou, este interval é obsoleto
        if (tickVersionRef.current !== currentVersion) {
          console.log(`[TIMER] interval obsolete (version mismatch: ${currentVersion} vs ${tickVersionRef.current}), clearing id=${id}`);
          clearInterval(id);
          return;
        }
        
        // VERIFICAR INATIVIDADE REAL (30 min sem interação = encerrar)
        const timeSinceLastInteraction = Date.now() - lastRealInteractionRef.current;
        if (timeSinceLastInteraction > INACTIVITY_TIMEOUT_MS) {
          console.log(`[SessionContext] Inatividade detectada (${Math.round(timeSinceLastInteraction / 60000)} min), encerrando sessão`);
          
          // Salvar antes de encerrar (usando ref estável)
          saveStageTimeRef.current();
          
          setTimer(defaultTimerState);
          localStorage.removeItem('muzze_global_timer');
          toastRef.current({
            title: "Sessão encerrada",
            description: "Inatividade detectada por mais de 30 minutos.",
          });
          return;
        }

        setTimer(prev => {
          const newElapsedSeconds = prev.elapsedSeconds + 1;
          let newStageElapsedSeconds = prev.stageElapsedSeconds + 1;
          
          // DEBUG: Log a cada 10s para monitorar valores
          if (newElapsedSeconds % 10 === 0) {
            const goalSeconds = prev.dailyGoalMinutes * 60;
            const totalCreatedToday = prev.dailyBaselineSeconds + newElapsedSeconds;
            const remainingSeconds = Math.max(0, goalSeconds - totalCreatedToday);
            const bonusSeconds = Math.max(0, totalCreatedToday - goalSeconds);
            const mode = remainingSeconds > 0 ? 'normal' : 'bonus';
            
            // Detectar salto: remaining aumentou?
            if (lastDebugRemainingRef.current !== null && remainingSeconds > lastDebugRemainingRef.current) {
              console.error(`[TIMER-JUMP-DETECTED] remaining subiu! ${lastDebugRemainingRef.current} -> ${remainingSeconds}`, {
                prevElapsed: lastDebugElapsedRef.current,
                newElapsed: newElapsedSeconds,
                prevBaseline: lastDebugBaselineRef.current,
                baseline: prev.dailyBaselineSeconds,
                intervalCount: currentCount,
                version: currentVersion,
              });
            }
            
            // Detectar salto: elapsed diminuiu?
            if (lastDebugElapsedRef.current !== null && newElapsedSeconds < lastDebugElapsedRef.current) {
              console.error(`[TIMER-JUMP-DETECTED] elapsed caiu! ${lastDebugElapsedRef.current} -> ${newElapsedSeconds}`, {
                baseline: prev.dailyBaselineSeconds,
                intervalCount: currentCount,
                version: currentVersion,
              });
            }
            
            console.log(`[TIMER TICK] elapsed=${newElapsedSeconds}, baseline=${prev.dailyBaselineSeconds}, remaining=${remainingSeconds}, bonus=${bonusSeconds}, mode=${mode}, intervalCount=${currentCount}, version=${currentVersion}`);
            
            lastDebugRemainingRef.current = remainingSeconds;
            lastDebugElapsedRef.current = newElapsedSeconds;
            lastDebugBaselineRef.current = prev.dailyBaselineSeconds;
          }
          
          // PROTEÇÃO: limitar stageElapsedSeconds
          if (newStageElapsedSeconds > MAX_STAGE_SECONDS) {
            console.warn(`[SessionContext] stageElapsedSeconds atingiu máximo (${MAX_STAGE_SECONDS}), resetando...`);
            // Forçar save e resetar (usando ref estável)
            saveStageTimeRef.current();
            newStageElapsedSeconds = 0;
          }
          
          const streakThreshold = 25 * 60;
          const wasStreakMode = prev.isStreakMode;
          const isStreakMode = newElapsedSeconds >= streakThreshold;
          
          if (!wasStreakMode && isStreakMode) {
            toastRef.current({
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
      
      intervalRef.current = id;
      console.log(`[TIMER] interval created id=${id}, count=${currentCount}, version=${currentVersion}`);
    }

    // Cleanup: ÚNICA lugar onde limpamos o interval
    return () => {
      if (intervalRef.current) {
        console.log(`[TIMER] interval cleared (cleanup) id=${intervalRef.current}, version=${currentVersion}`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer.isActive, timer.isPaused]);

  // Auto-save incremental a cada 30 segundos
  // FIX: Version guard pattern - nunca cria interval duplicado
  useEffect(() => {
    // Incrementar versão - invalida qualquer interval anterior
    autoSaveVersionRef.current += 1;
    const currentVersion = autoSaveVersionRef.current;
    
    // Se já existe interval ativo, deixar cleanup lidar
    if (autoSaveIntervalRef.current) {
      console.log(`[AUTOSAVE] skipping creation - interval already exists, version=${currentVersion}`);
      return;
    }
    
    if (timer.isActive && !timer.isPaused) {
      autoSaveCreateCountRef.current += 1;
      const currentCount = autoSaveCreateCountRef.current;
      
      const id = setInterval(() => {
        // VERSION GUARD: se versão mudou, este interval é obsoleto
        if (autoSaveVersionRef.current !== currentVersion) {
          console.log(`[AUTOSAVE] interval obsolete (version mismatch: ${currentVersion} vs ${autoSaveVersionRef.current}), clearing id=${id}`);
          clearInterval(id);
          return;
        }
        
        console.log(`[AUTOSAVE] triggered, count=${currentCount}, version=${currentVersion}, elapsed=${timerRef.current.elapsedSeconds}, stageElapsed=${timerRef.current.stageElapsedSeconds}`);
        saveStageTimeRef.current();
      }, 30000);
      
      autoSaveIntervalRef.current = id;
      console.log(`[AUTOSAVE] interval created id=${id}, count=${currentCount}, version=${currentVersion}`);
    }

    // Cleanup: ÚNICA lugar onde limpamos o interval
    return () => {
      if (autoSaveIntervalRef.current) {
        console.log(`[AUTOSAVE] interval cleared (cleanup) id=${autoSaveIntervalRef.current}, version=${currentVersion}`);
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    };
  }, [timer.isActive, timer.isPaused]);

  // Iniciar timer
  const startTimer = useCallback(async (initialStage: SessionStage) => {
    try {
      // NORMALIZAR: "ideation" é sinônimo de "idea"
      const normalizedStage: SessionStage = initialStage === "ideation" ? "idea" : initialStage;
      
      // LIMPAR QUALQUER ESTADO ÓRFÃO ANTES DE INICIAR NOVA SESSÃO
      localStorage.removeItem('muzze_global_timer');
      localStorage.removeItem('muzze_session_state');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const now = new Date();
      stageStartRef.current = now;
      stageElapsedRef.current = 0;
      lastRealInteractionRef.current = Date.now();

      // Buscar meta diária do perfil e timezone
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_goal_minutes, timezone')
        .eq('user_id', user.id)
        .single();

      const timezone = profile?.timezone || 'America/Sao_Paulo';

      // Calcular dailyBaselineSeconds: quanto tempo JÁ foi criado hoje ANTES desta sessão
      const userDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const startOfDay = new Date(userDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(userDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: todaySessions } = await supabase
        .from('stage_times')
        .select('duration_seconds')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      const dailyBaselineSeconds = (todaySessions || []).reduce(
        (sum, s) => sum + (s.duration_seconds || 0), 0
      );

      console.log(`[SessionContext] dailyBaselineSeconds capturado: ${dailyBaselineSeconds}s (${Math.floor(dailyBaselineSeconds / 60)}min)`);

      setTimer({
        isActive: true,
        isPaused: false,
        stage: normalizedStage,
        elapsedSeconds: 0,
        stageElapsedSeconds: 0,
        startedAt: now,
        lastActivityAt: now,
        sessionId: crypto.randomUUID(),
        targetSeconds: 25 * 60,
        isStreakMode: false,
        dailyGoalMinutes: profile?.daily_goal_minutes || 60,
        contentId: null,
        savedSecondsThisSession: 0,
        dailyBaselineSeconds, // Snapshot imutável durante esta sessão
        hadPauseInSession: false, // Nova sessão = sem pausa ainda
      });

      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'session_started',
        payload: { stage: normalizedStage, dailyBaselineSeconds }
      });

      console.log(`[SessionContext] ✅ Timer iniciado na etapa ${normalizedStage}`);
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
    setTimer(prev => ({ 
      ...prev, 
      isPaused: true, 
      lastActivityAt: now,
      hadPauseInSession: true, // Marcar que houve pausa
    }));
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
            had_pause: currentTimer.hadPauseInSession,
            was_abandoned: false,
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
