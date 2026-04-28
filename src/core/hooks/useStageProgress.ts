import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreativeStage } from "@/types/workspace";

/**
 * useStageProgress
 *
 * Hook centralizado para atualizar o progresso do usuário em cada etapa de produção.
 * Grava o progresso no campo `stage_progress` (jsonb) da tabela `scripts`.
 * Também pode marcar o `production_schedule` correspondente como concluído
 * quando o progresso atingir 100%.
 *
 * @param scriptId - ID do script sendo trabalhado
 */
export function useStageProgress(scriptId: string | null | undefined) {
  // Throttle para evitar muitas gravações em sequência rápida
  const lastUpdateRef = useRef<Record<string, number>>({});
  const THROTTLE_MS = 5000; // 5 segundos entre atualizações da mesma etapa

  /**
   * Atualiza o progresso de uma etapa específica.
   * @param stage - Etapa do workflow (script, review, recording, editing, etc.)
   * @param progress - Valor de 0 a 100 representando o progresso neste stage
   */
  const updateProgress = useCallback(async (stage: CreativeStage, progress: number) => {
    if (!scriptId) return;

    const now = Date.now();
    const lastUpdate = lastUpdateRef.current[stage] || 0;

    // Throttle: só atualiza se passou tempo suficiente
    if (now - lastUpdate < THROTTLE_MS) return;
    lastUpdateRef.current[stage] = now;

    const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

    try {
      // 1. Busca o stage_progress atual para fazer merge (não sobrescrever outras etapas)
      const { data: scriptData } = await supabase
        .from('scripts')
        .select('stage_progress')
        .eq('id', scriptId)
        .single();

      const currentProgress = (scriptData?.stage_progress as Record<string, number> | null) || {};
      const updatedProgress = { ...currentProgress, [stage]: clampedProgress };

      // 2. Salva o progresso atualizado
      await supabase
        .from('scripts')
        .update({ stage_progress: updatedProgress })
        .eq('id', scriptId);

      // 3. Se atingiu 100%, marca o production_schedule correspondente como concluído
      if (clampedProgress === 100) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;
        if (userId) {
          await supabase
            .from('production_schedules')
            .update({ completed: true })
            .eq('script_id', scriptId)
            .eq('user_id', userId)
            .eq('stage', stage)
            .eq('completed', false);
        }
      }
    } catch (error) {
      // Silencioso: progresso é best-effort, não crítico
      console.warn('[useStageProgress] Failed to update progress:', error);
    }
  }, [scriptId]);

  /**
   * Calcula progresso de roteiro baseado na quantidade de parágrafos não-vazios
   * em relação a um target esperado (default: 8 parágrafos = 100%).
   */
  const calculateScriptProgress = useCallback((htmlContent: string, targetParagraphs = 8): number => {
    if (!htmlContent) return 0;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const paragraphs = doc.querySelectorAll('p, h1, h2, h3');
    let filledCount = 0;
    paragraphs.forEach(p => {
      if (p.textContent?.trim() && p.textContent.trim().length > 5) {
        filledCount++;
      }
    });
    return Math.min(100, Math.round((filledCount / targetParagraphs) * 100));
  }, []);

  /**
   * Calcula progresso de gravação baseado na porcentagem de shots marcados.
   */
  const calculateRecordingProgress = useCallback((shots: { isCompleted: boolean }[]): number => {
    if (shots.length === 0) return 0;
    const completedCount = shots.filter(s => s.isCompleted).length;
    return Math.round((completedCount / shots.length) * 100);
  }, []);

  /**
   * Calcula progresso de edição baseado em tempo de sessão ativo (segundos).
   * Target: 30 minutos = 100%.
   */
  const calculateEditingProgress = useCallback((elapsedSeconds: number, targetMinutes = 30): number => {
    return Math.min(100, Math.round((elapsedSeconds / (targetMinutes * 60)) * 100));
  }, []);

  return {
    updateProgress,
    calculateScriptProgress,
    calculateRecordingProgress,
    calculateEditingProgress,
  };
}
