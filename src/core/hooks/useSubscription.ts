import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Subscription {
  id: string;
  status: 'active' | 'cancelled' | 'refunded' | 'expired';
  plan_type: 'pro' | 'studio';
  started_at: string;
  cancelled_at: string | null;
  refunded_at: string | null;
  expires_at: string | null;
  zouti_subscription_id: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('id, status, plan_type, started_at, cancelled_at, refunded_at, expires_at, zouti_subscription_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching subscription:', fetchError);
        setError(fetchError.message);
        return;
      }

      setSubscription(data as Subscription | null);
      setError(null);
    } catch (err) {
      console.error('Error in useSubscription:', err);
      setError('Erro ao carregar assinatura');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  // Calculate if within 7-day refund window
  const isWithinRefundWindow = (): boolean => {
    if (!subscription?.started_at) return false;
    const startDate = new Date(subscription.started_at);
    const now = new Date();
    const daysDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  };

  // Calculate days remaining in refund window
  const daysRemainingInRefundWindow = (): number => {
    if (!subscription?.started_at) return 0;
    const startDate = new Date(subscription.started_at);
    const now = new Date();
    const daysDiff = 7 - (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(daysDiff));
  };

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    isWithinRefundWindow,
    daysRemainingInRefundWindow,
  };
}
