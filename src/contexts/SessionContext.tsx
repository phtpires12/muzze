import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getDailyGoalMinutesForLevel, getEffectiveLevel, calculateXPWithStreakBonus, calculateLevelByXP, getLevelInfo } from "@/lib/gamification";
import { getTodayKey, getYesterdayKey, getDayBoundsUTC } from "@/lib/timezone-utils";
export type SessionStage = "idea" | "ideation" | "script" | "review" | "record" | "edit";

export interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  isFrozen: boolean; // NOVO: timer ativo mas aguardando primeira ação do usuário
  frozenSince: Date | null; // NOVO: quando o timer foi congelado
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
  startTimer: (stage: SessionStage, frozen?: boolean) => Promise<void>; // MODIFICADO: aceita frozen opcional
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  changeTimerStage: (newStage: SessionStage) => Promise<void>;
  setContentId: (id: string | null) => void;
  saveStageTime: () => Promise<void>;
  validateSessionFreshness: () => boolean;
  autoEndSession: () => Promise<void>; // Encerramento automático com verificação de streak
  unfreezeTimer: () => void; // NOVO: descongelar timer na primeira ação
  
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
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos de inatividade = encerrar sessão (era 30)
const BACKGROUND_PAUSE_MS = 2 * 60 * 1000; // 2 minutos em background = pausar
const MAX_SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas = limite máximo absoluto de sessão

// Meta padrão (nível 4+) - será sobrescrita ao iniciar sessão com base no nível real
const DEFAULT_STREAK_GOAL_MINUTES = 25;

const defaultTimerState: TimerState = {
  isActive: false,
  isPaused: false,
  stage: "idea",
  elapsedSeconds: 0,
  stageElapsedSeconds: 0,
  startedAt: null,
  lastActivityAt: null,
  sessionId: null,
  targetSeconds: DEFAULT_STREAK_GOAL_MINUTES * 60, // Será sobrescrito com meta por nível
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

  // NOVA FUNÇÃO: autoEndSession - encerramento automático COM verificação de streak
  // Esta função consulta o BANCO para verificar se a meta diária foi atingida
  // e atualiza o streak corretamente (mesmo que o timer local esteja desatualizado)
  const autoEndSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[autoEndSession] Usuário não autenticado, apenas resetando timer');
        stageStartRef.current = null;
        setTimer(defaultTimerState);
        localStorage.removeItem('muzze_global_timer');
        return;
      }

      // 1. Salvar tempo da etapa atual (se houver)
      if (stageElapsedRef.current > 0 && stageStartRef.current) {
        await saveStageTime();
      }

      // 2. Buscar profile para obter timezone e nível
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone, xp_points, highest_level')
        .eq('user_id', user.id)
        .single();

      const timezone = profile?.timezone || 'America/Sao_Paulo';
      const effectiveLevel = getEffectiveLevel(profile?.xp_points || 0, profile?.highest_level || 1);
      const streakGoalMinutes = getDailyGoalMinutesForLevel(effectiveLevel);

      // 3. Calcular minutos criados hoje DIRETAMENTE DO BANCO (fonte de verdade)
      const todayKey = getTodayKey(timezone);
      const { startUTC, endUTC } = getDayBoundsUTC(todayKey, timezone);

      const { data: todaySessions } = await supabase
        .from('stage_times')
        .select('duration_seconds')
        .eq('user_id', user.id)
        .gte('started_at', startUTC.toISOString())
        .lte('started_at', endUTC.toISOString());

      const creativeMinutesToday = (todaySessions || []).reduce(
        (sum, session) => sum + (session.duration_seconds || 0) / 60,
        0
      );

      console.log(`[autoEndSession] Minutos criativos hoje (DB): ${creativeMinutesToday.toFixed(2)}min, Meta: ${streakGoalMinutes}min`);

      // 4. Se atingiu a meta, verificar e atualizar streak
      if (creativeMinutesToday >= streakGoalMinutes) {
        console.log('[autoEndSession] Meta atingida! Verificando streak...');
        
        const yesterdayKey = getYesterdayKey(timezone);
        
        // Buscar streak atual
        const { data: streak } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!streak) {
          // Criar novo streak
          await supabase.from('streaks').insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_event_date: todayKey,
          });
          console.log('[autoEndSession] Novo streak criado: 1 dia');
          toastRef.current({
            title: "🔥 Ofensiva salva!",
            description: "Sua sessão foi encerrada automaticamente. Ofensiva: 1 dia!",
          });
        } else if (streak.last_event_date !== todayKey) {
          // Atualizar streak se ainda não foi contado hoje
          let newStreak: number;
          if (streak.last_event_date === yesterdayKey) {
            newStreak = (streak.current_streak || 0) + 1;
          } else {
            newStreak = 1; // Gap - reset
          }

          const newLongest = Math.max(streak.longest_streak || 0, newStreak);

          await supabase
            .from('streaks')
            .update({
              current_streak: newStreak,
              longest_streak: newLongest,
              last_event_date: todayKey,
            })
            .eq('user_id', user.id);

          console.log(`[autoEndSession] Streak atualizado: ${streak.current_streak} -> ${newStreak}`);
          toastRef.current({
            title: "🔥 Ofensiva salva!",
            description: `Sessão encerrada automaticamente. Ofensiva: ${newStreak} dia${newStreak > 1 ? 's' : ''}!`,
          });
        } else {
          // Já contado hoje
          console.log('[autoEndSession] Streak já contado hoje');
          toastRef.current({
            title: "Sessão encerrada",
            description: "Sua sessão foi salva automaticamente.",
          });
        }

        // Calcular e salvar XP
        const totalMinutes = Math.floor(creativeMinutesToday);
        const { data: currentStreak } = await supabase
          .from('streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .maybeSingle();

        const streakDays = currentStreak?.current_streak || 0;
        const { totalXP } = calculateXPWithStreakBonus(totalMinutes, streakDays);

        // Atualizar XP no perfil
        const newXP = (profile?.xp_points || 0) + totalXP;
        const newLevel = calculateLevelByXP(newXP);
        const updates: any = { xp_points: newXP };
        if (newLevel > (profile?.highest_level || 1)) {
          updates.highest_level = newLevel;
        }

        await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', user.id);

        // Dispatch level up event se subiu de nível
        const previousLevel = calculateLevelByXP(profile?.xp_points || 0);
        if (newLevel > previousLevel) {
          const levelInfo = getLevelInfo(newLevel);
          window.dispatchEvent(new CustomEvent('levelUp', { 
            detail: { level: newLevel, levelInfo } 
          }));
        }
      } else {
        // Não atingiu a meta
        console.log('[autoEndSession] Meta não atingida, sessão salva sem streak');
        toastRef.current({
          title: "Sessão encerrada",
          description: `Sessão salva. Faltam ${Math.ceil(streakGoalMinutes - creativeMinutesToday)}min para a ofensiva de hoje.`,
        });
      }

      // 5. Analytics
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event: 'session_auto_ended',
        payload: { 
          creativeMinutesToday,
          streakGoalMinutes,
          reason: 'auto_end',
        }
      });

      // 6. Reset timer
      stageStartRef.current = null;
      setTimer(defaultTimerState);
      localStorage.removeItem('muzze_global_timer');
      console.log('[autoEndSession] Timer resetado');
    } catch (error) {
      console.error('[autoEndSession] Erro:', error);
      // Em caso de erro, ainda reseta o timer para evitar loops
      stageStartRef.current = null;
      setTimer(defaultTimerState);
      localStorage.removeItem('muzze_global_timer');
    }
  }, [saveStageTime]);

  // Ref estável para autoEndSession
  const autoEndSessionRef = useRef<() => Promise<void>>(autoEndSession);
  useEffect(() => {
    autoEndSessionRef.current = autoEndSession;
  }, [autoEndSession]);

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
            // 15+ min em background = encerrar sessão COM VERIFICAÇÃO DE STREAK
            console.log(`[SessionContext] Aba inativa por ${Math.round(hiddenDuration / 60000)} min, encerrando sessão com autoEndSession`);
            await autoEndSessionRef.current();
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
        
        // VERIFICAR INATIVIDADE REAL (15 min sem interação = encerrar)
        const timeSinceLastInteraction = Date.now() - lastRealInteractionRef.current;
        if (timeSinceLastInteraction > INACTIVITY_TIMEOUT_MS) {
          console.log(`[SessionContext] Inatividade detectada (${Math.round(timeSinceLastInteraction / 60000)} min), encerrando sessão com autoEndSession`);
          
          // Usar autoEndSession para garantir verificação de streak
          autoEndSessionRef.current();
          return;
        }

        // VERIFICAR LIMITE MÁXIMO DE SESSÃO (4 horas)
        const currentTimer = timerRef.current;
        if (currentTimer.startedAt) {
          const sessionDuration = Date.now() - new Date(currentTimer.startedAt).getTime();
          if (sessionDuration > MAX_SESSION_DURATION_MS) {
            console.log(`[SessionContext] Sessão atingiu limite máximo de 4 horas, encerrando com autoEndSession`);
            autoEndSessionRef.current();
            return;
          }
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
          
          // Usar targetSeconds que já foi calculado com base no nível do usuário
          const streakThreshold = prev.targetSeconds;
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

      // Buscar meta diária do perfil, timezone e nível para meta dinâmica
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_goal_minutes, timezone, xp_points, highest_level')
        .eq('user_id', user.id)
        .single();

      // Calcular meta de ofensiva baseada no nível do usuário
      const effectiveLevel = getEffectiveLevel(profile?.xp_points || 0, profile?.highest_level || 1);
      const streakGoalMinutes = getDailyGoalMinutesForLevel(effectiveLevel);
      console.log(`[SessionContext] Nível efetivo: ${effectiveLevel}, Meta de ofensiva: ${streakGoalMinutes}min`);

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
        targetSeconds: streakGoalMinutes * 60, // Meta dinâmica baseada no nível
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
        autoEndSession, // NOVO: encerramento automático com verificação de streak
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
