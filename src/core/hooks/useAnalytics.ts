import { supabase } from "@/integrations/supabase/client";

export const useAnalytics = () => {
  const trackEvent = async (event: string, payload?: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event,
      payload: payload || null
    });
  };

  return { trackEvent };
};
