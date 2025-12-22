import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, startOfDay, format } from "date-fns";

export interface StuckScript {
  id: string;
  title: string;
  status: string | null;
  publish_date: string;
  updated_at: string;
  daysUntilPublish: number;
  daysSinceUpdate: number;
  urgencyLevel: "warning" | "urgent" | "critical";
}

// Thresholds: days until publish -> min days since last update
const ALERT_THRESHOLDS = [
  { daysUntilPublish: 7, minDaysStuck: 5, urgencyLevel: "warning" as const },
  { daysUntilPublish: 5, minDaysStuck: 3, urgencyLevel: "urgent" as const },
  { daysUntilPublish: 3, minDaysStuck: 2, urgencyLevel: "critical" as const },
];

// Snooze storage key
const SNOOZE_KEY = "muzze_stuck_content_snooze";

interface SnoozeData {
  [scriptId: string]: {
    snoozedAtThreshold: number; // the threshold level when snoozed (7, 5, or 3)
    snoozedAt: number; // timestamp
  };
}

export function useStuckContent() {
  const [stuckScripts, setStuckScripts] = useState<StuckScript[]>([]);
  const [currentStuckScript, setCurrentStuckScript] = useState<StuckScript | null>(null);
  const [isStuckPopupOpen, setIsStuckPopupOpen] = useState(false);

  const getSnoozeData = (): SnoozeData => {
    try {
      const data = localStorage.getItem(SNOOZE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };

  const setSnoozeData = (data: SnoozeData) => {
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(data));
  };

  // Check if script should be shown based on snooze status
  // Snooze lasts until the next threshold is reached
  const isScriptSnoozed = (scriptId: string, currentDaysUntilPublish: number): boolean => {
    const snoozeData = getSnoozeData();
    const snooze = snoozeData[scriptId];
    
    if (!snooze) return false;
    
    // If snoozed at 7 days, only show again when reaches 5 days or less
    // If snoozed at 5 days, only show again when reaches 3 days or less
    // If snoozed at 3 days, show again next day (no more thresholds)
    
    if (snooze.snoozedAtThreshold === 7 && currentDaysUntilPublish > 5) {
      return true;
    }
    if (snooze.snoozedAtThreshold === 5 && currentDaysUntilPublish > 3) {
      return true;
    }
    if (snooze.snoozedAtThreshold === 3) {
      // For critical level, snooze for 24 hours
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      if (Date.now() < snooze.snoozedAt + twentyFourHoursMs) {
        return true;
      }
    }
    
    return false;
  };

  const snoozeScript = (scriptId: string, currentThreshold: number) => {
    const snoozeData = getSnoozeData();
    snoozeData[scriptId] = {
      snoozedAtThreshold: currentThreshold,
      snoozedAt: Date.now(),
    };
    setSnoozeData(snoozeData);
  };

  const fetchStuckScripts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = startOfDay(new Date());
    const sevenDaysFromNow = format(
      new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      "yyyy-MM-dd"
    );
    const todayStr = format(today, "yyyy-MM-dd");

    // Fetch scripts with publish_date in the next 7 days that are still "planejado"
    const { data, error } = await supabase
      .from("scripts")
      .select("id, title, status, publish_date, updated_at")
      .eq("user_id", user.id)
      .gte("publish_date", todayStr)
      .lte("publish_date", sevenDaysFromNow)
      .eq("publish_status", "planejado")
      .order("publish_date", { ascending: true });

    if (error) {
      console.error("Error fetching stuck scripts:", error);
      return;
    }

    if (!data || data.length === 0) {
      setStuckScripts([]);
      setCurrentStuckScript(null);
      return;
    }

    // Filter scripts that match our "stuck" criteria
    const stuckOnes: StuckScript[] = [];

    for (const script of data) {
      if (!script.publish_date || !script.updated_at) continue;

      const publishDate = startOfDay(new Date(script.publish_date));
      const updatedAt = startOfDay(new Date(script.updated_at));
      
      const daysUntilPublish = differenceInDays(publishDate, today);
      const daysSinceUpdate = differenceInDays(today, updatedAt);

      // Find matching threshold
      for (const threshold of ALERT_THRESHOLDS) {
        if (
          daysUntilPublish <= threshold.daysUntilPublish &&
          daysSinceUpdate >= threshold.minDaysStuck
        ) {
          stuckOnes.push({
            id: script.id,
            title: script.title,
            status: script.status,
            publish_date: script.publish_date,
            updated_at: script.updated_at,
            daysUntilPublish,
            daysSinceUpdate,
            urgencyLevel: threshold.urgencyLevel,
          });
          break; // Only add once per script
        }
      }
    }

    setStuckScripts(stuckOnes);

    // Find first non-snoozed script to show
    const scriptToShow = stuckOnes.find(
      (script) => !isScriptSnoozed(script.id, script.daysUntilPublish)
    );
    setCurrentStuckScript(scriptToShow || null);
  }, []);

  // Sync popup state with currentStuckScript - use functional updates to avoid stale closures
  useEffect(() => {
    setIsStuckPopupOpen(!!currentStuckScript);
  }, [currentStuckScript]);

  // Handle "pause temporarily" action
  const pauseTemporarily = (script: StuckScript) => {
    // Determine which threshold we're at
    let thresholdLevel = 3;
    if (script.daysUntilPublish > 5) {
      thresholdLevel = 7;
    } else if (script.daysUntilPublish > 3) {
      thresholdLevel = 5;
    }

    snoozeScript(script.id, thresholdLevel);
    showNextPopup(script.id);
  };

  const showNextPopup = (currentScriptId: string) => {
    const remaining = stuckScripts.filter(
      (s) => s.id !== currentScriptId && !isScriptSnoozed(s.id, s.daysUntilPublish)
    );

    if (remaining.length > 0) {
      setCurrentStuckScript(remaining[0]);
      setIsStuckPopupOpen(true);
    } else {
      setCurrentStuckScript(null);
      setIsStuckPopupOpen(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStuckScripts();
  }, [fetchStuckScripts]);

  return {
    stuckScripts,
    currentStuckScript,
    isStuckPopupOpen,
    setIsStuckPopupOpen,
    pauseTemporarily,
    refetch: fetchStuckScripts,
  };
}
