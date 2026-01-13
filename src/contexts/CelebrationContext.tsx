import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TROPHIES, checkNewTrophies, UserStats } from "@/lib/gamification";
import { startOfWeek, addDays, format, isSameDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface WeekDay {
  date: Date;
  dayName: string;
  status: 'completed' | 'freeze' | 'missed' | 'future' | 'today';
}

export interface SessionSummaryData {
  duration: number;
  xpGained: number;
  stage: string;
  autoRedirectDestination?: string | null;
}

export interface CelebrationData {
  showSessionSummary: boolean;
  sessionSummary: SessionSummaryData | null;
  showStreakCelebration: boolean;
  streakCount: number;
  weekDays: WeekDay[];
  showTrophyCelebration: boolean;
  unlockedTrophies: Trophy[];
  currentTrophy: Trophy | null;
  xpGained: number;
}

interface CelebrationContextType {
  celebrationData: CelebrationData;
  triggerFullCelebration: (
    sessionSummary: SessionSummaryData,
    streakCount: number,
    xpGained: number,
    onComplete?: () => void
  ) => Promise<void>;
  triggerCelebration: (streakCount: number, xpGained: number, onComplete?: () => void) => Promise<void>;
  triggerTrophyDirectly: (trophy: Trophy, xpGained: number) => void;
  dismissSessionSummary: () => void;
  dismissStreakCelebration: () => void;
  dismissTrophyCelebration: () => void;
  resetCelebrations: () => void;
  isShowingAnyCelebration: boolean;
}

const initialCelebrationData: CelebrationData = {
  showSessionSummary: false,
  sessionSummary: null,
  showStreakCelebration: false,
  showTrophyCelebration: false,
  streakCount: 0,
  weekDays: [],
  unlockedTrophies: [],
  currentTrophy: null,
  xpGained: 0,
};

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error("useCelebration must be used within CelebrationContextProvider");
  }
  return context;
};

export const CelebrationContextProvider = ({ children }: { children: ReactNode }) => {
  const [celebrationData, setCelebrationData] = useState<CelebrationData>(initialCelebrationData);
  const [onCompleteCallback, setOnCompleteCallback] = useState<(() => void) | null>(null);

  const isShowingAnyCelebration = 
    celebrationData.showSessionSummary || 
    celebrationData.showStreakCelebration || 
    celebrationData.showTrophyCelebration;

  const fetchWeekProgress = async (userId: string): Promise<WeekDay[]> => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekDays: WeekDay[] = [];

      for (let i = 0; i < 7; i++) {
        const currentDay = addDays(weekStart, i);
        const dayName = format(currentDay, 'EEE', { locale: ptBR });

        if (isAfter(currentDay, today)) {
          weekDays.push({ date: currentDay, dayName, status: 'future' });
          continue;
        }

        if (isSameDay(currentDay, today)) {
          weekDays.push({ date: currentDay, dayName, status: 'today' });
          continue;
        }

        const dayStart = new Date(currentDay);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDay);
        dayEnd.setHours(23, 59, 59, 999);

        const { data: freezeUsage } = await supabase
          .from('streak_freeze_usage')
          .select('*')
          .eq('user_id', userId)
          .gte('used_at', dayStart.toISOString())
          .lte('used_at', dayEnd.toISOString())
          .maybeSingle();

        if (freezeUsage) {
          weekDays.push({ date: currentDay, dayName, status: 'freeze' });
          continue;
        }

        const { data: sessions } = await supabase
          .from('stage_times')
          .select('duration_seconds')
          .eq('user_id', userId)
          .gte('started_at', dayStart.toISOString())
          .lte('started_at', dayEnd.toISOString());

        const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60 || 0;

        weekDays.push({
          date: currentDay,
          dayName,
          status: totalMinutes >= 25 ? 'completed' : 'missed'
        });
      }

      return weekDays;
    } catch (error) {
      console.error('Error fetching week progress:', error);
      return [];
    }
  };

  const checkForNewTrophies = async (userId: string): Promise<Trophy[]> => {
    try {
      // 1. Buscar troféus já desbloqueados do banco
      const { data: userTrophies } = await supabase
        .from('user_trophies')
        .select('trophy_id, shown')
        .eq('user_id', userId);

      const unlockedTrophyIds = (userTrophies || []).map(t => t.trophy_id);

      // 2. Buscar stats atuais - todas as queries em paralelo
      const [profileRes, streakRes, scriptsRes, scriptsCompletedRes, ideasOrganizedRes, summaryRes] = await Promise.all([
        supabase.from('profiles').select('xp_points').eq('user_id', userId).single(),
        supabase.from('streaks').select('current_streak, longest_streak').eq('user_id', userId).single(),
        supabase.from('scripts').select('id, status').eq('user_id', userId),
        supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['completed', 'publicado']),
        supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('user_id', userId).neq('status', 'draft_idea'),
        supabase.rpc('get_stage_time_summary'),
      ]);

      const profile = profileRes.data;
      const streak = streakRes.data;
      const scripts = scriptsRes.data;
      const summary = summaryRes.data?.[0];

      const totalHours = (summary?.total_seconds ?? 0) / 3600;
      const sessionsOver25Min = summary?.sessions_over_25 ?? 0;
      const sessionsWithoutPause = summary?.sessions_without_pause ?? 0;
      const sessionsWithoutAbandon = summary?.sessions_without_abandon ?? 0;
      const usedStages = summary?.used_stages ?? [];
      const hadStreakReset = (streak?.longest_streak || 0) > (streak?.current_streak || 0) && (streak?.current_streak || 0) >= 1;

      const stats: UserStats = {
        totalPoints: profile?.xp_points || 0,
        totalXP: profile?.xp_points || 0,
        level: 1,
        streak: streak?.current_streak || 0,
        longestStreak: streak?.longest_streak || 0,
        totalHours,
        scriptsCreated: scripts?.length || 0,
        scriptsCompleted: scriptsCompletedRes.count || 0,
        shotListsCreated: 0,
        ideasCreated: scripts?.filter(s => s.status === 'draft_idea').length || 0,
        ideasOrganized: ideasOrganizedRes.count || 0,
        trophies: unlockedTrophyIds,
        sessionsOver25Min,
        sessionsWithoutPause,
        sessionsWithoutAbandon,
        usedStages,
        hadStreakReset,
      };

      // 3. Verificar novos troféus
      const newTrophies = checkNewTrophies(stats);

      // 4. Salvar novos troféus no banco
      if (newTrophies.length > 0) {
        await supabase.from('user_trophies').insert(
          newTrophies.map(t => ({
            user_id: userId,
            trophy_id: t.id,
            shown: false,
          }))
        );
      }

      // 5. Filtrar apenas troféus não mostrados ainda
      const trophiesToShow = newTrophies.filter(t => {
        const existing = userTrophies?.find(ut => ut.trophy_id === t.id);
        return !existing?.shown;
      });

      // 6. Marcar como mostrados no banco
      if (trophiesToShow.length > 0) {
        await supabase
          .from('user_trophies')
          .update({ shown: true })
          .eq('user_id', userId)
          .in('trophy_id', trophiesToShow.map(t => t.id));
      }

      return trophiesToShow;
    } catch (error) {
      console.error('Error checking trophies:', error);
      return [];
    }
  };

  const triggerFullCelebration = useCallback(async (
    sessionSummary: SessionSummaryData,
    streakCount: number,
    xpGained: number,
    onComplete?: () => void
  ) => {
    console.log('[CelebrationContext] triggerFullCelebration chamado', { sessionSummary, streakCount, xpGained });
    
    if (onComplete) {
      setOnCompleteCallback(() => onComplete);
    }

    // ✅ MOSTRAR SESSIONSUMMARY IMEDIATAMENTE - sem esperar dados
    setCelebrationData({
      showSessionSummary: true,
      sessionSummary,
      showStreakCelebration: false,
      showTrophyCelebration: false,
      streakCount,
      weekDays: [], // Inicialmente vazio, carregado depois
      unlockedTrophies: [],
      currentTrophy: null,
      xpGained,
    });

    // ✅ Carregar dados em BACKGROUND (não bloqueia a UI)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[CelebrationContext] Sem usuário autenticado');
        return;
      }

      const [weekDays, newTrophies] = await Promise.all([
        fetchWeekProgress(user.id),
        checkForNewTrophies(user.id),
      ]);

      console.log('[CelebrationContext] Dados carregados em background');
      
      // Atualizar dados quando disponíveis (celebração já está visível)
      setCelebrationData(prev => ({
        ...prev,
        weekDays,
        unlockedTrophies: newTrophies,
      }));
    } catch (error) {
      console.error('[CelebrationContext] Erro ao carregar dados em background:', error);
    }
  }, []);

  const triggerCelebration = useCallback(async (
    streakCount: number, 
    xpGained: number, 
    onComplete?: () => void
  ) => {
    if (onComplete) {
      setOnCompleteCallback(() => onComplete);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onComplete?.();
      return;
    }

    const weekDays = await fetchWeekProgress(user.id);
    const newTrophies = await checkForNewTrophies(user.id);

    setCelebrationData({
      showSessionSummary: false,
      sessionSummary: null,
      showStreakCelebration: true,
      showTrophyCelebration: false,
      streakCount,
      weekDays,
      unlockedTrophies: newTrophies,
      currentTrophy: null,
      xpGained,
    });
  }, []);

  const triggerTrophyDirectly = useCallback((trophy: Trophy, xpGained: number) => {
    setCelebrationData({
      showSessionSummary: false,
      sessionSummary: null,
      showStreakCelebration: false,
      showTrophyCelebration: true,
      streakCount: 0,
      weekDays: [],
      unlockedTrophies: [trophy],
      currentTrophy: trophy,
      xpGained,
    });
  }, []);

  const executeOnComplete = useCallback(() => {
    console.log('[CelebrationContext] Todas celebrações finalizadas, executando callback');
    if (onCompleteCallback) {
      onCompleteCallback();
      setOnCompleteCallback(null);
    }
  }, [onCompleteCallback]);

  const dismissSessionSummary = useCallback(() => {
    console.log('[CelebrationContext] dismissSessionSummary');
    const { streakCount, unlockedTrophies } = celebrationData;

    if (streakCount > 0) {
      setCelebrationData(prev => ({
        ...prev,
        showSessionSummary: false,
        showStreakCelebration: true,
      }));
    } else if (unlockedTrophies.length > 0) {
      setCelebrationData(prev => ({
        ...prev,
        showSessionSummary: false,
        showTrophyCelebration: true,
        currentTrophy: unlockedTrophies[0],
      }));
    } else {
      setCelebrationData(initialCelebrationData);
      executeOnComplete();
    }
  }, [celebrationData, executeOnComplete]);

  const dismissStreakCelebration = useCallback(() => {
    console.log('[CelebrationContext] dismissStreakCelebration');
    if (celebrationData.unlockedTrophies.length > 0) {
      setCelebrationData(prev => ({
        ...prev,
        showStreakCelebration: false,
        showTrophyCelebration: true,
        currentTrophy: prev.unlockedTrophies[0],
      }));
    } else {
      setCelebrationData(initialCelebrationData);
      executeOnComplete();
    }
  }, [celebrationData.unlockedTrophies, executeOnComplete]);

  const dismissTrophyCelebration = useCallback(() => {
    console.log('[CelebrationContext] dismissTrophyCelebration');
    const remainingTrophies = celebrationData.unlockedTrophies.slice(1);

    if (remainingTrophies.length > 0) {
      setCelebrationData(prev => ({
        ...prev,
        currentTrophy: remainingTrophies[0],
        unlockedTrophies: remainingTrophies,
      }));
    } else {
      setCelebrationData(initialCelebrationData);
      executeOnComplete();
    }
  }, [celebrationData.unlockedTrophies, executeOnComplete]);

  const resetCelebrations = useCallback(() => {
    setCelebrationData(initialCelebrationData);
    setOnCompleteCallback(null);
  }, []);

  return (
    <CelebrationContext.Provider value={{
      celebrationData,
      triggerFullCelebration,
      triggerCelebration,
      triggerTrophyDirectly,
      dismissSessionSummary,
      dismissStreakCelebration,
      dismissTrophyCelebration,
      resetCelebrations,
      isShowingAnyCelebration,
    }}>
      {children}
    </CelebrationContext.Provider>
  );
};
