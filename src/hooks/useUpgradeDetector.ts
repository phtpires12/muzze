import { useState, useEffect, useRef } from "react";
import { usePlanCapabilitiesOptional } from "@/contexts/PlanContext";

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, studio: 2 };

export const useUpgradeDetector = () => {
  const plan = usePlanCapabilitiesOptional();
  const previousPlan = useRef<string | null>(null);
  const [upgradedTo, setUpgradedTo] = useState<'pro' | 'studio' | null>(null);

  const planType = plan?.planType ?? null;

  useEffect(() => {
    if (!planType || plan?.loading) return;

    const prev = previousPlan.current;
    previousPlan.current = planType;

    // Skip first render (initial load)
    if (prev === null) return;

    // Check if it's an upgrade
    if (prev !== planType && (PLAN_RANK[planType] ?? 0) > (PLAN_RANK[prev] ?? 0)) {
      // Check sessionStorage to avoid repeating in the same session
      const key = `upgrade_celebrated_${planType}`;
      if (sessionStorage.getItem(key)) return;

      sessionStorage.setItem(key, 'true');
      console.log(`[UpgradeDetector] 🎉 Upgrade detected: ${prev} → ${planType}`);
      setUpgradedTo(planType as 'pro' | 'studio');
    }
  }, [planType, plan?.loading]);

  const dismiss = () => setUpgradedTo(null);

  return { upgradedTo, dismiss };
};
