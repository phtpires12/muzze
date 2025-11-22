import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProjectType = "idea" | "script" | "shotlist";
export type SessionStage = "ideation" | "script" | "record" | "edit" | "review";

export interface InProgressProject {
  type: ProjectType;
  id: string;
  title: string;
  stage: SessionStage;
  updatedAt: Date;
  status?: string;
}

export const useInProgressProjects = () => {
  const [projects, setProjects] = useState<InProgressProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInProgressProjects();
  }, []);

  const fetchInProgressProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      // Buscar scripts em andamento
      const { data: scripts } = await supabase
        .from("scripts")
        .select("*")
        .eq("user_id", user.id)
        .gte("updated_at", twoDaysAgo.toISOString())
        .order("updated_at", { ascending: false });

      const projectsList: InProgressProject[] = [];

      if (scripts) {
        for (const script of scripts) {
          // Buscar tempo trabalhado neste projeto
          const { data: stageTimes } = await supabase
            .from("stage_times")
            .select("duration_seconds")
            .eq("content_item_id", script.id);

          const totalTimeWorked = stageTimes?.reduce((sum, st) => sum + (st.duration_seconds || 0), 0) || 0;
          const minutesWorked = Math.floor(totalTimeWorked / 60);

          // Critérios híbridos: tempo OU conteúdo
          let shouldInclude = false;

          // Ideias não desenvolvidas (draft_idea)
          if (script.status === "draft_idea") {
            // Pelo menos 3 minutos trabalhados OU tem central_idea preenchida
            const hasMinTime = minutesWorked >= 3;
            const hasContent = script.central_idea && script.central_idea.trim().length > 0;
            shouldInclude = hasMinTime || hasContent;

            if (shouldInclude) {
              projectsList.push({
                type: "idea",
                id: script.id,
                title: script.title || "Ideia sem título",
                stage: "ideation",
                updatedAt: new Date(script.updated_at),
                status: script.status,
              });
            }
          }
          // Roteiros em draft (em desenvolvimento)
          else if (script.status === "draft" || script.status === "in_progress") {
            // Pelo menos 5 minutos trabalhados OU mais de 100 caracteres
            const hasMinTime = minutesWorked >= 5;
            const hasContent = script.content && script.content.length > 100;
            shouldInclude = hasMinTime || hasContent;

            if (shouldInclude) {
              projectsList.push({
                type: "script",
                id: script.id,
                title: script.title,
                stage: "script",
                updatedAt: new Date(script.updated_at),
                status: script.status,
              });
            }
          }
          // Roteiros em revisão
          else if (script.status === "review") {
            // Pelo menos 3 minutos trabalhados OU tem conteúdo
            const hasMinTime = minutesWorked >= 3;
            const hasContent = script.content && script.content.length > 50;
            shouldInclude = hasMinTime || hasContent;

            if (shouldInclude) {
              projectsList.push({
                type: "script",
                id: script.id,
                title: script.title,
                stage: "review",
                updatedAt: new Date(script.updated_at),
                status: script.status,
              });
            }
          }
          // Shot lists para gravação (scripts com shot_list preenchida)
          else if (script.shot_list && script.shot_list.length > 0 && script.status !== "published") {
            // Pelo menos 3 minutos trabalhados OU tem pelo menos 1 item
            const hasMinTime = minutesWorked >= 3;
            const hasContent = script.shot_list.length >= 1;
            shouldInclude = hasMinTime || hasContent;

            if (shouldInclude) {
              projectsList.push({
                type: "shotlist",
                id: script.id,
                title: script.title,
                stage: "record",
                updatedAt: new Date(script.updated_at),
                status: script.status,
              });
            }
          }
        }
      }

      setProjects(projectsList);
    } catch (error) {
      console.error("Error fetching in-progress projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const mostRecentProject = projects.length > 0 ? projects[0] : null;
  const hasInProgressProjects = projects.length > 0;

  return {
    projects,
    mostRecentProject,
    hasInProgressProjects,
    loading,
    refetch: fetchInProgressProjects,
  };
};
