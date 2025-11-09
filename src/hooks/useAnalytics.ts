import { supabase } from "@/integrations/supabase/client";

export const useAnalytics = () => {
  const trackEvent = async (event: string, payload?: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event,
          payload: payload || {}
        });
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  return { trackEvent };
};
