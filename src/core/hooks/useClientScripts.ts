import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/core/contexts";
import { CreativeStage } from "@/types/workspace";

export interface ClientScript {
  id: string;
  title: string;
  central_idea: string | null;
  content: string | null;
  content_type: string | null;
  thumbnail_url: string | null;
  shot_list: string[] | null;
  reference_links: string[] | null;
  reference_url: string | null;
  publish_date: string | null;
  publish_status: string | null;
  published_at: string | null;
  status: string | null;
  workflow_template: string | null;
  stage_progress: Record<string, any> | null;
  client_approved_at: string | null;
  workspace_id: string;
  user_id: string;
  main_video_url?: string | null;
}

/**
 * Hook que retorna os scripts visíveis ao cliente, filtrados pelas etapas
 * liberadas pelo owner do workspace (allowed_timer_stages do workspace_member).
 */
export const useClientScripts = () => {
  const { activeWorkspace } = useWorkspaceContext();
  const [scripts, setScripts] = useState<ClientScript[]>([]);
  const [allowedStages, setAllowedStages] = useState<CreativeStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScripts = useCallback(async () => {
    if (!activeWorkspace) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Buscar permissões do membro
      const { data: memberData } = await supabase
        .from("workspace_members")
        .select("allowed_timer_stages, can_edit_stages")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      const stages = ((memberData?.allowed_timer_stages || []) as CreativeStage[]);
      setAllowedStages(stages.length ? stages : ["recording"]);

      // Buscar scripts do workspace
      const { data: scriptsData, error } = await supabase
        .from("scripts")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("publish_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      setScripts((scriptsData || []) as unknown as ClientScript[]);
    } catch (err) {
      console.error("Error fetching client scripts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  /**
   * Determina a etapa "atual" do script com base no stage_progress.
   * Considera-se a etapa atual a primeira da ordem que ainda não foi concluída.
   */
  const getCurrentStage = (script: ClientScript): CreativeStage => {
    const progress = script.stage_progress || {};
    const order: CreativeStage[] = [
      "ideation",
      "script",
      "review",
      "recording",
      "editing",
      "design",
    ];
    for (const stage of order) {
      if (!progress[stage]?.completed) return stage;
    }
    return "editing";
  };

  // Scripts pendentes para o cliente: nas etapas liberadas e ainda não aprovados
  const pendingScripts = scripts.filter((s) => {
    if (s.client_approved_at) return false;
    if (s.publish_status === "postado") return false;
    const stage = getCurrentStage(s);
    return allowedStages.includes(stage);
  });

  // Scripts publicados (para a aba de calendário)
  const publishedScripts = scripts.filter(
    (s) => s.publish_status === "postado" || !!s.published_at
  );

  return {
    scripts,
    pendingScripts,
    publishedScripts,
    allowedStages,
    isLoading,
    refetch: fetchScripts,
    getCurrentStage,
  };
};