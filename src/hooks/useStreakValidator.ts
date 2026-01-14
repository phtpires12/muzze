import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MAX_STREAK_FREEZES } from '@/lib/gamification';
import { getTodayKey, getYesterdayKey, diffDays } from '@/lib/timezone-utils';

interface LostDaysResult {
  hasLostDays: boolean;
  lostDaysCount: number;
  availableFreezes: number;
  currentStreak: number;
  lastEventDate: string | null;
  canUseFreeze: boolean;
  wasRecentlyReset: boolean; // True if cron already reset the streak
  originalStreak: number; // The streak value before reset (for recovery)
}

interface UseStreakValidatorParams {
  profile: any;
  refetchProfile?: () => void;
  // Valores derivados do useProfileWithLevel
  effectiveLevel: number;
  goalMinutes: number;
  freezeCost: number;
}

export const useStreakValidator = ({ 
  profile, 
  refetchProfile,
  effectiveLevel,
  goalMinutes,
  freezeCost,
}: UseStreakValidatorParams) => {
  const [result, setResult] = useState<LostDaysResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  const checkLostDays = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get streak data
      const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get profile data for timezone and freezes
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('timezone, streak_freezes')
        .eq('user_id', user.id)
        .single();

      if (!streak || !userProfile) {
        setResult({
          hasLostDays: false,
          lostDaysCount: 0,
          availableFreezes: userProfile?.streak_freezes || 0,
          currentStreak: streak?.current_streak || 0,
          lastEventDate: null,
          canUseFreeze: false,
          wasRecentlyReset: false,
          originalStreak: 0,
        });
        setIsLoading(false);
        setHasChecked(true);
        return;
      }

      const timezone = userProfile.timezone || 'America/Sao_Paulo';
      const availableFreezes = userProfile.streak_freezes || 0;

      // Usar utilitários centrais de timezone
      const todayKey = getTodayKey(timezone);
      const lastEventDate = streak.last_event_date;
      
      console.log(`[useStreakValidator] timezone: ${timezone}, todayKey: ${todayKey}, lastEventDate: ${lastEventDate}`);

      // If no last event, no days lost (fresh user)
      if (!lastEventDate) {
        setResult({
          hasLostDays: false,
          lostDaysCount: 0,
          availableFreezes,
          currentStreak: streak.current_streak || 0,
          lastEventDate: null,
          canUseFreeze: false,
          wasRecentlyReset: false,
          originalStreak: 0,
        });
        setIsLoading(false);
        setHasChecked(true);
        return;
      }

      // Calculate days between last event and today usando utilitários de timezone
      const daysDiff = diffDays(lastEventDate, todayKey);

      console.log(`[useStreakValidator] daysDiff: ${daysDiff} (lastEventDate: ${lastEventDate}, todayKey: ${todayKey})`);

      // If last event was today or yesterday, no lost days
      if (daysDiff <= 1) {
        setResult({
          hasLostDays: false,
          lostDaysCount: 0,
          availableFreezes,
          currentStreak: streak.current_streak || 0,
          lastEventDate,
          canUseFreeze: false,
          wasRecentlyReset: false,
          originalStreak: streak.current_streak || 0,
        });
        setIsLoading(false);
        setHasChecked(true);
        return;
      }

      // Lost days = days between last event and yesterday (not counting today)
      const lostDaysCount = daysDiff - 1;
      const canUseFreeze = availableFreezes >= lostDaysCount && lostDaysCount > 0;

      // Detect if streak was already reset by cron job
      // If current_streak is 0 but longest_streak > 0 and there are lost days,
      // the cron already reset it but user hasn't seen the modal yet
      const wasRecentlyReset = streak.current_streak === 0 && 
                               streak.longest_streak > 0 && 
                               lostDaysCount > 0;

      // Use longest_streak as the "original" streak if it was reset
      const originalStreak = wasRecentlyReset ? streak.longest_streak : (streak.current_streak || 0);

      setResult({
        // Show modal if: has lost days with active streak OR was recently reset by cron
        hasLostDays: (lostDaysCount > 0 && streak.current_streak > 0) || wasRecentlyReset,
        lostDaysCount,
        availableFreezes,
        currentStreak: originalStreak, // Show the streak they're about to lose (or lost)
        lastEventDate,
        canUseFreeze,
        wasRecentlyReset,
        originalStreak,
      });
      setIsLoading(false);
      setHasChecked(true);
    } catch (error) {
      console.error('[useStreakValidator] Error:', error);
      setIsLoading(false);
      setHasChecked(true);
    }
  }, []);

  // Use freezes to recover streak
  const useFreezesToRecover = useCallback(async () => {
    if (!result || !result.canUseFreeze) {
      console.error('[useFreezesToRecover] Cannot use freeze:', { result });
      return false;
    }

    // Validar lastEventDate antes de usar
    if (!result.lastEventDate) {
      console.error('[useFreezesToRecover] lastEventDate is null');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('streak_freezes, timezone')
        .eq('user_id', user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('[useFreezesToRecover] Failed to fetch profile:', profileError);
        return false;
      }

      // Verificar novamente se tem freezes suficientes (dados frescos)
      if ((userProfile.streak_freezes || 0) < result.lostDaysCount) {
        console.error('[useFreezesToRecover] Insufficient freezes (fresh check)');
        return false;
      }

      const timezone = userProfile.timezone || 'America/Sao_Paulo';

      // Validar lastEventDate antes de usar
      const lastEventDateStr = result.lastEventDate;
      if (!lastEventDateStr) {
        console.error('[useFreezesToRecover] lastEventDate is null after re-check');
        return false;
      }
      
      // Insert freeze usage for each lost day usando dayKeys
      const [ly, lm, ld] = lastEventDateStr.split('-').map(Number);
      const lastEventDate = new Date(ly, lm - 1, ld, 12, 0, 0);
      
      for (let i = 1; i <= result.lostDaysCount; i++) {
        const freezeDate = new Date(lastEventDate);
        freezeDate.setDate(freezeDate.getDate() + i);
        
        // Gravar como meia-noite UTC do dia em questão na timezone do usuário
        const freezeDayKey = `${freezeDate.getFullYear()}-${String(freezeDate.getMonth() + 1).padStart(2, '0')}-${String(freezeDate.getDate()).padStart(2, '0')}`;
        
        await supabase.from('streak_freeze_usage').insert({
          user_id: user.id,
          used_at: new Date(`${freezeDayKey}T12:00:00Z`).toISOString(),
        });
      }

      // Deduct freezes from profile
      const newFreezeCount = userProfile.streak_freezes - result.lostDaysCount;
      await supabase
        .from('profiles')
        .update({ streak_freezes: Math.max(0, newFreezeCount) })
        .eq('user_id', user.id);

      // Update last_event_date to yesterday (usando timezone utils)
      const yesterdayKey = getYesterdayKey(timezone);

      // If streak was reset by cron, restore it; otherwise just update last_event_date
      if (result.wasRecentlyReset) {
        await supabase
          .from('streaks')
          .update({ 
            current_streak: result.originalStreak,
            last_event_date: yesterdayKey 
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('streaks')
          .update({ last_event_date: yesterdayKey })
          .eq('user_id', user.id);
      }

      // Limpar o resultado para evitar reprocessamento
      setResult(prev => prev ? { 
        ...prev, 
        hasLostDays: false,
        lostDaysCount: 0,
        canUseFreeze: false 
      } : null);

      if (refetchProfile) await refetchProfile();
      return true;
    } catch (error) {
      console.error('[useStreakValidator] Error using freezes:', error);
      return false;
    }
  }, [result, refetchProfile]);

  // Buy freezes and use them to recover streak
  const buyFreezesAndRecover = useCallback(async () => {
    if (!result || !profile) {
      console.error('[buyFreezesAndRecover] Missing result or profile');
      return false;
    }

    // Validar lastEventDate antes de usar
    if (!result.lastEventDate) {
      console.error('[buyFreezesAndRecover] lastEventDate is null');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[buyFreezesAndRecover] No user');
        return false;
      }

      // Calculate how many freezes to buy
      const freezesToBuy = result.lostDaysCount - result.availableFreezes;
      if (freezesToBuy <= 0) {
        console.error('[buyFreezesAndRecover] No freezes to buy');
        return false;
      }

      // Check limit
      const newTotalFreezes = result.availableFreezes + freezesToBuy;
      if (newTotalFreezes > MAX_STREAK_FREEZES) {
        console.error('[buyFreezesAndRecover] Would exceed max freezes limit');
        return false;
      }

      // SEMPRE buscar dados FRESCOS do banco antes de qualquer operação
      const { data: freshProfile, error: profileError } = await supabase
        .from('profiles')
        .select('streak_freezes, timezone, xp_points')
        .eq('user_id', user.id)
        .single();

      if (profileError || !freshProfile) {
        console.error('[buyFreezesAndRecover] Failed to fetch fresh profile:', profileError);
        return false;
      }

      // Validar com dados FRESCOS (não cache)
      const totalCost = freezesToBuy * freezeCost;
      const freshXP = freshProfile.xp_points || 0;
      
      if (freshXP < totalCost) {
        console.error('[buyFreezesAndRecover] Insufficient XP (fresh check):', freshXP, '<', totalCost);
        return false;
      }

      // Validar lastEventDate antes de criar Date
      const lastEventDateStr = result.lastEventDate;
      const lastEventDate = new Date(lastEventDateStr + 'T12:00:00');
      if (isNaN(lastEventDate.getTime())) {
        console.error('[buyFreezesAndRecover] Invalid lastEventDate:', lastEventDateStr);
        return false;
      }

      const timezone = freshProfile.timezone || 'America/Sao_Paulo';
      const now = new Date();
      const userDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));

      // TUDO VALIDADO - Agora executar operações
      console.log('[buyFreezesAndRecover] Starting operations:', {
        freezesToBuy,
        totalCost,
        freshXP,
        lostDaysCount: result.lostDaysCount
      });

      // 1. Buy freezes: Deduct XP and add freezes to profile (operação atômica)
      const currentFreezes = freshProfile.streak_freezes || 0;
      const newFreezesAfterBuy = currentFreezes + freezesToBuy;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          xp_points: freshXP - totalCost,
          streak_freezes: newFreezesAfterBuy
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[buyFreezesAndRecover] Failed to update profile:', updateError);
        return false;
      }

      // 2. Use all needed freezes to cover lost days
      for (let i = 1; i <= result.lostDaysCount; i++) {
        const freezeDate = new Date(lastEventDate);
        freezeDate.setDate(freezeDate.getDate() + i);

        const { error: freezeError } = await supabase.from('streak_freeze_usage').insert({
          user_id: user.id,
          used_at: freezeDate.toISOString(),
        });

        if (freezeError) {
          console.error('[buyFreezesAndRecover] Failed to insert freeze usage:', freezeError);
          // Continuar mesmo com erro (melhor ter o XP debitado e streak salvo)
        }
      }

      // 3. Deduct all used freezes from profile
      const finalFreezeCount = newFreezesAfterBuy - result.lostDaysCount;
      const { error: finalUpdateError } = await supabase
        .from('profiles')
        .update({ streak_freezes: Math.max(0, finalFreezeCount) })
        .eq('user_id', user.id);

      if (finalUpdateError) {
        console.error('[buyFreezesAndRecover] Failed to update final freeze count:', finalUpdateError);
        // Continuar (XP já foi debitado, streak precisa ser atualizado)
      }

      // 4. Update last_event_date to yesterday (and restore streak if it was reset)
      const yesterday = new Date(userDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (result.wasRecentlyReset) {
        const { error: streakError } = await supabase
          .from('streaks')
          .update({ 
            current_streak: result.originalStreak,
            last_event_date: yesterdayStr 
          })
          .eq('user_id', user.id);

        if (streakError) {
          console.error('[buyFreezesAndRecover] Failed to restore streak:', streakError);
          return false;
        }
      } else {
        const { error: streakError } = await supabase
          .from('streaks')
          .update({ last_event_date: yesterdayStr })
          .eq('user_id', user.id);

        if (streakError) {
          console.error('[buyFreezesAndRecover] Failed to update last_event_date:', streakError);
          return false;
        }
      }

      // Limpar o resultado para evitar reprocessamento
      setResult(prev => prev ? { 
        ...prev, 
        hasLostDays: false,
        lostDaysCount: 0,
        canUseFreeze: false 
      } : null);

      if (refetchProfile) await refetchProfile();
      console.log('[buyFreezesAndRecover] Success!');
      return true;
    } catch (error) {
      console.error('[useStreakValidator] Error buying freezes and recovering:', error);
      return false;
    }
  }, [result, profile, freezeCost, refetchProfile]);

  // Reset streak (user chose not to use freezes)
  const resetStreak = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      await supabase
        .from('streaks')
        .update({ 
          current_streak: 0,
          last_event_date: null,
        })
        .eq('user_id', user.id);

      // Limpar o resultado para fechar o modal e evitar reprocessamento
      setResult(prev => prev ? { 
        ...prev, 
        hasLostDays: false,
        lostDaysCount: 0,
        canUseFreeze: false,
        currentStreak: 0,
        originalStreak: 0,
      } : null);

      return true;
    } catch (error) {
      console.error('[useStreakValidator] Error resetting streak:', error);
      return false;
    }
  }, []);

  // Mark as handled (dismiss modal)
  const dismissCheck = useCallback(() => {
    setResult(prev => prev ? { ...prev, hasLostDays: false } : null);
  }, []);

  useEffect(() => {
    if (!hasChecked) {
      checkLostDays();
    }
  }, [hasChecked, checkLostDays]);

  // Auto-use freezes if available (without modal)
  const autoUseFreezesIfAvailable = useCallback(async (): Promise<{ success: boolean; freezesUsed: number }> => {
    if (!result?.canUseFreeze) {
      return { success: false, freezesUsed: 0 };
    }
    
    const success = await useFreezesToRecover();
    return { 
      success, 
      freezesUsed: success ? result.lostDaysCount : 0 
    };
  }, [result, useFreezesToRecover]);

  return {
    result,
    isLoading,
    hasChecked,
    checkLostDays,
    useFreezesToRecover,
    buyFreezesAndRecover,
    resetStreak,
    dismissCheck,
    autoUseFreezesIfAvailable,
    freezeCost,
    maxFreezes: MAX_STREAK_FREEZES,
  };
};
