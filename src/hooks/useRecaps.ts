import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Recap, RecapComputedStats } from '@/types/recap';

export const useRecaps = () => {
  const [availableRecaps, setAvailableRecaps] = useState<Recap[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailableRecaps = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_recaps')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_eligible', true)
        .order('period_end', { ascending: false });

      if (error) {
        console.error('Error fetching recaps:', error);
        setAvailableRecaps([]);
      } else {
        // Transform the data to match our Recap type
        const transformedRecaps: Recap[] = (data || []).map(recap => ({
          ...recap,
          computed_stats: (recap.computed_stats as RecapComputedStats) || {
            stageBreakdown: {},
            bestDay: null,
            bestDayMinutes: 0,
            weeklyGoalHitCount: 0,
            totalWeeks: 4,
            previousPeriodMinutes: null,
            favoriteStage: null,
          },
        }));
        setAvailableRecaps(transformedRecaps);
      }
    } catch (err) {
      console.error('Error in fetchAvailableRecaps:', err);
      setAvailableRecaps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailableRecaps();
  }, [fetchAvailableRecaps]);

  const markAsViewed = useCallback(async (recapId: string) => {
    const { error } = await supabase
      .from('user_recaps')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', recapId);

    if (error) {
      console.error('Error marking recap as viewed:', error);
    } else {
      setAvailableRecaps(prev => 
        prev.map(recap => 
          recap.id === recapId 
            ? { ...recap, viewed_at: new Date().toISOString() }
            : recap
        )
      );
    }
  }, []);

  const saveUserInputs = useCallback(async (
    recapId: string, 
    followersCount: number, 
    hadViral: boolean
  ) => {
    const { error } = await supabase
      .from('user_recaps')
      .update({ 
        followers_count: followersCount, 
        had_viral: hadViral 
      })
      .eq('id', recapId);

    if (error) {
      console.error('Error saving user inputs:', error);
      return false;
    }

    setAvailableRecaps(prev => 
      prev.map(recap => 
        recap.id === recapId 
          ? { ...recap, followers_count: followersCount, had_viral: hadViral }
          : recap
      )
    );
    return true;
  }, []);

  const getRecapById = useCallback((recapId: string): Recap | undefined => {
    return availableRecaps.find(recap => recap.id === recapId);
  }, [availableRecaps]);

  const unviewedCount = availableRecaps.filter(r => !r.viewed_at).length;

  return { 
    availableRecaps, 
    loading, 
    markAsViewed, 
    saveUserInputs,
    getRecapById,
    unviewedCount,
    refetch: fetchAvailableRecaps 
  };
};
