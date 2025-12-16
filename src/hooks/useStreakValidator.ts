import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { calculateFreezeCost, MAX_STREAK_FREEZES } from '@/lib/gamification';

interface LostDaysResult {
  hasLostDays: boolean;
  lostDaysCount: number;
  availableFreezes: number;
  currentStreak: number;
  lastEventDate: string | null;
  canUseFreeze: boolean;
}

export const useStreakValidator = () => {
  const { profile, refetch: refetchProfile } = useProfile();
  const [result, setResult] = useState<LostDaysResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  const freezeCost = calculateFreezeCost(profile?.min_streak_minutes || 20);

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
        });
        setIsLoading(false);
        setHasChecked(true);
        return;
      }

      const timezone = userProfile.timezone || 'America/Sao_Paulo';
      const availableFreezes = userProfile.streak_freezes || 0;

      // Get today's date in user's timezone
      const now = new Date();
      const userDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const today = userDate.toISOString().split('T')[0];

      const lastEventDate = streak.last_event_date;
      
      // If no last event, no days lost (fresh user)
      if (!lastEventDate) {
        setResult({
          hasLostDays: false,
          lostDaysCount: 0,
          availableFreezes,
          currentStreak: streak.current_streak || 0,
          lastEventDate: null,
          canUseFreeze: false,
        });
        setIsLoading(false);
        setHasChecked(true);
        return;
      }

      // Calculate days between last event and today
      const lastDate = new Date(lastEventDate + 'T12:00:00');
      const todayDate = new Date(today + 'T12:00:00');
      
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // If last event was today or yesterday, no lost days
      if (diffDays <= 1) {
        setResult({
          hasLostDays: false,
          lostDaysCount: 0,
          availableFreezes,
          currentStreak: streak.current_streak || 0,
          lastEventDate,
          canUseFreeze: false,
        });
        setIsLoading(false);
        setHasChecked(true);
        return;
      }

      // Lost days = days between last event and yesterday (not counting today)
      const lostDaysCount = diffDays - 1;
      const canUseFreeze = availableFreezes >= lostDaysCount && lostDaysCount > 0;

      setResult({
        hasLostDays: lostDaysCount > 0 && streak.current_streak > 0,
        lostDaysCount,
        availableFreezes,
        currentStreak: streak.current_streak || 0,
        lastEventDate,
        canUseFreeze,
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
    if (!result || !result.canUseFreeze) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('streak_freezes, timezone')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) return false;

      const timezone = userProfile.timezone || 'America/Sao_Paulo';
      const now = new Date();
      const userDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));

      // Calculate the dates that need freezes
      const lastEventDate = new Date(result.lastEventDate + 'T12:00:00');
      
      // Insert freeze usage for each lost day
      for (let i = 1; i <= result.lostDaysCount; i++) {
        const freezeDate = new Date(lastEventDate);
        freezeDate.setDate(freezeDate.getDate() + i);

        await supabase.from('streak_freeze_usage').insert({
          user_id: user.id,
          used_at: freezeDate.toISOString(),
        });
      }

      // Deduct freezes from profile
      const newFreezeCount = userProfile.streak_freezes - result.lostDaysCount;
      await supabase
        .from('profiles')
        .update({ streak_freezes: Math.max(0, newFreezeCount) })
        .eq('user_id', user.id);

      // Update last_event_date to yesterday (so next session counts as continuation)
      const yesterday = new Date(userDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await supabase
        .from('streaks')
        .update({ last_event_date: yesterdayStr })
        .eq('user_id', user.id);

      await refetchProfile();
      return true;
    } catch (error) {
      console.error('[useStreakValidator] Error using freezes:', error);
      return false;
    }
  }, [result, refetchProfile]);

  // Buy freezes and use them to recover streak
  const buyFreezesAndRecover = useCallback(async () => {
    if (!result || !profile) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Calculate how many freezes to buy
      const freezesToBuy = result.lostDaysCount - result.availableFreezes;
      if (freezesToBuy <= 0) return false;

      // Check limit
      const newTotalFreezes = result.availableFreezes + freezesToBuy;
      if (newTotalFreezes > MAX_STREAK_FREEZES) {
        console.error('[buyFreezesAndRecover] Would exceed max freezes limit');
        return false;
      }

      // Calculate cost and check XP
      const totalCost = freezesToBuy * freezeCost;
      const userXP = profile.xp_points || 0;
      if (userXP < totalCost) {
        console.error('[buyFreezesAndRecover] Insufficient XP');
        return false;
      }

      // Get fresh profile data
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('streak_freezes, timezone, xp_points')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) return false;

      const timezone = userProfile.timezone || 'America/Sao_Paulo';
      const now = new Date();
      const userDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));

      // 1. Buy freezes: Deduct XP and add freezes to profile
      const currentFreezes = userProfile.streak_freezes || 0;
      const newFreezesAfterBuy = currentFreezes + freezesToBuy;
      
      await supabase
        .from('profiles')
        .update({
          xp_points: (userProfile.xp_points || 0) - totalCost,
          streak_freezes: newFreezesAfterBuy
        })
        .eq('user_id', user.id);

      // 2. Use all needed freezes to cover lost days
      const lastEventDate = new Date(result.lastEventDate + 'T12:00:00');
      
      for (let i = 1; i <= result.lostDaysCount; i++) {
        const freezeDate = new Date(lastEventDate);
        freezeDate.setDate(freezeDate.getDate() + i);

        await supabase.from('streak_freeze_usage').insert({
          user_id: user.id,
          used_at: freezeDate.toISOString(),
        });
      }

      // 3. Deduct all used freezes from profile
      const finalFreezeCount = newFreezesAfterBuy - result.lostDaysCount;
      await supabase
        .from('profiles')
        .update({ streak_freezes: Math.max(0, finalFreezeCount) })
        .eq('user_id', user.id);

      // 4. Update last_event_date to yesterday
      const yesterday = new Date(userDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await supabase
        .from('streaks')
        .update({ last_event_date: yesterdayStr })
        .eq('user_id', user.id);

      await refetchProfile();
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
