import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, isAfter, startOfDay } from "date-fns";

interface OverdueScript {
  id: string;
  title: string;
  publish_date: string;
  publish_status: string;
  created_at: string;
}

const SNOOZE_KEY = "muzze_overdue_snooze";
const SNOOZE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

interface SnoozeData {
  [scriptId: string]: number; // timestamp when snooze expires
}

export function useOverdueContent() {
  const [overdueScripts, setOverdueScripts] = useState<OverdueScript[]>([]);
  const [currentPopupScript, setCurrentPopupScript] = useState<OverdueScript | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

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

  const isScriptSnoozed = (scriptId: string): boolean => {
    const snoozeData = getSnoozeData();
    const expiresAt = snoozeData[scriptId];
    if (!expiresAt) return false;
    return Date.now() < expiresAt;
  };

  const snoozeScript = (scriptId: string) => {
    const snoozeData = getSnoozeData();
    snoozeData[scriptId] = Date.now() + SNOOZE_DURATION_MS;
    setSnoozeData(snoozeData);
  };

  const fetchOverdueScripts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = format(startOfDay(new Date()), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("scripts")
      .select("id, title, publish_date, publish_status, created_at")
      .eq("user_id", user.id)
      .lt("publish_date", today)
      .in("publish_status", ["planejado", "pronto_para_postar", "perdido"])
      .order("publish_date", { ascending: true });

    if (error) {
      console.error("Error fetching overdue scripts:", error);
      return;
    }

    setOverdueScripts(data || []);

    // Find the first non-snoozed script to show popup
    const scriptToShow = (data || []).find(script => !isScriptSnoozed(script.id));
    setCurrentPopupScript(scriptToShow || null);
    // Don't set isPopupOpen here - let the useEffect handle it
  }, []);

  // Sync popup state with currentPopupScript - use functional updates to avoid stale closures
  useEffect(() => {
    setIsPopupOpen(!!currentPopupScript);
  }, [currentPopupScript]);

  const markAsPosted = async (scriptId: string) => {
    await supabase
      .from("scripts")
      .update({
        publish_status: "postado",
        published_at: new Date().toISOString(),
      })
      .eq("id", scriptId);

    // Remove from overdue list
    setOverdueScripts(prev => prev.filter(s => s.id !== scriptId));
    showNextPopup(scriptId);
  };

  const reschedule = async (scriptId: string, newDate: Date) => {
    await supabase
      .from("scripts")
      .update({
        publish_date: format(newDate, "yyyy-MM-dd"),
      })
      .eq("id", scriptId);

    // Remove from overdue list
    setOverdueScripts(prev => prev.filter(s => s.id !== scriptId));
    showNextPopup(scriptId);
  };

  const remindLater = (scriptId: string) => {
    snoozeScript(scriptId);
    showNextPopup(scriptId);
  };

  const showNextPopup = (currentScriptId: string) => {
    const remaining = overdueScripts.filter(
      s => s.id !== currentScriptId && !isScriptSnoozed(s.id)
    );
    
    if (remaining.length > 0) {
      setCurrentPopupScript(remaining[0]);
      setIsPopupOpen(true);
    } else {
      setCurrentPopupScript(null);
      setIsPopupOpen(false);
    }
  };

  const markAsLost = async (scriptId: string) => {
    await supabase
      .from("scripts")
      .update({ publish_status: "perdido" })
      .eq("id", scriptId);
  };

  useEffect(() => {
    fetchOverdueScripts();
  }, [fetchOverdueScripts]);

  return {
    overdueScripts,
    currentPopupScript,
    isPopupOpen,
    setIsPopupOpen,
    markAsPosted,
    reschedule,
    remindLater,
    markAsLost,
    refetch: fetchOverdueScripts,
  };
}
