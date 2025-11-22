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
          // Ideias não desenvolvidas (draft_idea)
          if (script.status === "draft_idea") {
            projectsList.push({
              type: "idea",
              id: script.id,
              title: script.title || "Ideia sem título",
              stage: "ideation",
              updatedAt: new Date(script.updated_at),
              status: script.status,
            });
          }
          // Roteiros em draft (em desenvolvimento)
          else if (script.status === "draft" || script.status === "in_progress") {
            projectsList.push({
              type: "script",
              id: script.id,
              title: script.title,
              stage: "script",
              updatedAt: new Date(script.updated_at),
              status: script.status,
            });
          }
          // Roteiros em revisão
          else if (script.status === "review") {
            projectsList.push({
              type: "script",
              id: script.id,
              title: script.title,
              stage: "review",
              updatedAt: new Date(script.updated_at),
              status: script.status,
            });
          }
          // Shot lists para gravação (scripts com shot_list preenchida)
          else if (script.shot_list && script.shot_list.length > 0 && script.status !== "published") {
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
