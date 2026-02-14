import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ContinuityType = "recent" | "expiring" | "stalled";

export interface ContinuityOption {
  id: string;
  type: ContinuityType;
  title: string;
  stage: string;
  subtitle: string;
  metadata: string;
  urgencyBadge?: {
    label: string;
    variant: "warning" | "urgent" | "info";
  };
  scriptId: string;
}

interface ScriptRow {
  id: string;
  title: string;
  status: string | null;
  updated_at: string;
  publish_date: string | null;
  publish_status: string | null;
}

const getStageLabel = (status: string | null): string => {
  switch (status) {
    case "editing":
      return "Edição";
    case "review":
      return "Revisão";
    case "recording":
      return "Gravação";
    case "draft":
      return "Roteiro";
    case "draft_idea":
      return "Ideação";
    default:
      return "Em progresso";
  }
};

export function useContinuityOptions() {
  const [options, setOptions] = useState<ContinuityOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOptions = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const today = startOfDay(new Date());
    const todayStr = format(today, "yyyy-MM-dd");
    const sevenDaysAgo = format(subDays(today, 7), "yyyy-MM-dd'T'HH:mm:ss");
    const fourteenDaysAgo = format(subDays(today, 14), "yyyy-MM-dd'T'HH:mm:ss");

    const results: ContinuityOption[] = [];
    const usedIds = new Set<string>();

    // 1. Última atividade (recent) - script mais recentemente atualizado nos últimos 7 dias
    const { data: recentScript } = await supabase
      .from("scripts")
      .select("id, title, status, updated_at, publish_date, publish_status")
      .eq("user_id", user.id)
      .neq("publish_status", "postado")
      .gte("updated_at", sevenDaysAgo)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentScript) {
      usedIds.add(recentScript.id);
      results.push({
        id: `recent-${recentScript.id}`,
        type: "recent",
        title: recentScript.title,
        stage: recentScript.status || "draft_idea",
        subtitle: `Etapa: ${getStageLabel(recentScript.status)}`,
        metadata: `Última edição: ${format(new Date(recentScript.updated_at), "dd 'de' MMM., HH:mm", { locale: ptBR })}`,
        scriptId: recentScript.id,
      });
    }

    // 2. Próximo de expirar (expiring) - publish_date mais próximo que ainda não foi postado
    const { data: expiringScript } = await supabase
      .from("scripts")
      .select("id, title, status, updated_at, publish_date, publish_status")
      .eq("user_id", user.id)
      .gte("publish_date", todayStr)
      .neq("publish_status", "postado")
      .order("publish_date", { ascending: true })
      .limit(5);

    if (expiringScript && expiringScript.length > 0) {
      // Encontrar o primeiro que não foi usado ainda
      const script = expiringScript.find((s) => !usedIds.has(s.id));
      if (script && script.publish_date) {
        usedIds.add(script.id);
        const publishDate = startOfDay(new Date(script.publish_date + "T00:00:00"));
        const daysUntilPublish = differenceInDays(publishDate, today);

        let urgencyVariant: "warning" | "urgent" | "info" = "info";
        if (daysUntilPublish <= 2) {
          urgencyVariant = "urgent";
        } else if (daysUntilPublish <= 5) {
          urgencyVariant = "warning";
        }

        results.push({
          id: `expiring-${script.id}`,
          type: "expiring",
          title: script.title,
          stage: script.status || "draft_idea",
          subtitle: `Etapa: ${getStageLabel(script.status)}`,
          metadata: `Publicar em ${format(publishDate, "dd 'de' MMM.", { locale: ptBR })}`,
          urgencyBadge: {
            label: daysUntilPublish === 0 
              ? "Publicar hoje!" 
              : daysUntilPublish === 1 
                ? "Publicar amanhã" 
                : `${daysUntilPublish} dias para publicar`,
            variant: urgencyVariant,
          },
          scriptId: script.id,
        });
      }
    }

    // 3. Paralisado há mais tempo (stalled) - sem atualização há 14+ dias
    const { data: stalledScript } = await supabase
      .from("scripts")
      .select("id, title, status, updated_at, publish_date, publish_status")
      .eq("user_id", user.id)
      .neq("publish_status", "postado")
      .in("status", ["draft", "draft_idea", "review", "recording", "editing"])
      .lt("updated_at", fourteenDaysAgo)
      .order("updated_at", { ascending: true })
      .limit(5);

    if (stalledScript && stalledScript.length > 0) {
      const script = stalledScript.find((s) => !usedIds.has(s.id));
      if (script) {
        usedIds.add(script.id);
        const updatedAt = startOfDay(new Date(script.updated_at));
        const daysSinceUpdate = differenceInDays(today, updatedAt);

        let urgencyVariant: "warning" | "urgent" | "info" = "info";
        if (daysSinceUpdate >= 30) {
          urgencyVariant = "urgent";
        } else if (daysSinceUpdate >= 14) {
          urgencyVariant = "warning";
        }

        results.push({
          id: `stalled-${script.id}`,
          type: "stalled",
          title: script.title,
          stage: script.status || "draft_idea",
          subtitle: `Etapa: ${getStageLabel(script.status)}`,
          metadata: `Última edição: ${format(updatedAt, "dd 'de' MMM.", { locale: ptBR })}`,
          urgencyBadge: {
            label: `Parado há ${daysSinceUpdate} dias`,
            variant: urgencyVariant,
          },
          scriptId: script.id,
        });
      }
    }

    // Reordenar: publicação para hoje vem primeiro
    const todayExpiringIndex = results.findIndex(
      (r) => r.type === "expiring" && r.urgencyBadge?.label === "Publicar hoje!"
    );
    if (todayExpiringIndex > 0) {
      const [todayItem] = results.splice(todayExpiringIndex, 1);
      results.unshift(todayItem);
    }

    setOptions(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    loading,
    refetch: fetchOptions,
  };
}
