import { useState, useEffect, useRef, useCallback } from "react";
import { usePlanCapabilitiesOptional } from "@/contexts/PlanContext";
import { supabase } from "@/integrations/supabase/client";

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, studio: 2 };

export const useUpgradeDetector = () => {
  const plan = usePlanCapabilitiesOptional();
  const [upgradedTo, setUpgradedTo] = useState<'pro' | 'studio' | null>(null);
  const hasChecked = useRef(false);

  const planType = plan?.planType ?? null;

  const persistCelebration = useCallback(async (celebratedPlan: 'pro' | 'studio') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use jsonb merge operator via raw update
    await supabase
      .from('profiles')
      .update({ upgrade_celebrated: { [celebratedPlan]: true } } as any)
      .eq('user_id', user.id);
  }, []);

  const dismiss = useCallback(async (options?: { persist?: boolean }) => {
    const persist = options?.persist ?? false;
    if (persist && upgradedTo) {
      // Mark as seen server-side
      await persistCelebration(upgradedTo);
    }
    setUpgradedTo(null);
  }, [upgradedTo, persistCelebration]);

  const simulateUpgrade = useCallback((plan: 'pro' | 'studio') => {
    console.log(`[UpgradeDetector] 🧪 Simulating upgrade → ${plan}`);
    setUpgradedTo(plan);
  }, []);

  useEffect(() => {
    // Wait until plan is loaded and not already checked this mount
    if (!planType || plan?.loading || hasChecked.current) return;
    if (PLAN_RANK[planType] === 0) {
      // Free plan — nothing to celebrate
      hasChecked.current = true;
      return;
    }

    const checkAndTrigger = async () => {
      hasChecked.current = true;

      // sessionStorage guard: avoid double-firing within the same session
      const sessionKey = `upgrade_celebrated_session_${planType}`;
      if (sessionStorage.getItem(sessionKey)) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile to check upgrade_celebrated and created_at
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('upgrade_celebrated, created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !profile) return;

      // Don't show for brand-new accounts (created less than 2 minutes ago)
      const createdAt = profile.created_at ? new Date(profile.created_at) : null;
      if (createdAt) {
        const ageMs = Date.now() - createdAt.getTime();
        if (ageMs < 2 * 60 * 1000) {
          console.log('[UpgradeDetector] New account, skipping celebration');
          return;
        }
      }

      // Check if this plan was already celebrated (server-side flag)
      const celebrated = profile.upgrade_celebrated as Record<string, boolean> | null;
      if (celebrated?.[planType] === true) {
        console.log(`[UpgradeDetector] Already celebrated ${planType}, skipping`);
        return;
      }

      // All checks passed — show celebration
      sessionStorage.setItem(sessionKey, 'true');
      console.log(`[UpgradeDetector] 🎉 Showing upgrade celebration for: ${planType}`);
      setUpgradedTo(planType as 'pro' | 'studio');
    };

    checkAndTrigger();
  }, [planType, plan?.loading]);

  // Expose simulateUpgrade on window for DevTools
  useEffect(() => {
    (window as any).__simulateUpgrade = simulateUpgrade;
    return () => { delete (window as any).__simulateUpgrade; };
  }, [simulateUpgrade]);

  return { upgradedTo, dismiss, simulateUpgrade, persistCelebration };
};
