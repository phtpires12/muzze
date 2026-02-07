import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCelebration } from "@/contexts/CelebrationContext";
import { useSession } from "@/hooks/useSession";
import { DraggableSessionTimer } from "@/components/DraggableSessionTimer";
import { AutoHideNav } from "@/components/AutoHideNav";
import { ShotlistPanel } from "@/components/editing/ShotlistPanel";
import { MusicPanel, MusicReference } from "@/components/editing/MusicPanel";
import { CompleteEditingButton } from "@/components/editing/CompleteEditingButton";
import { useWorkflowTemplate, getPrevStageUrl } from "@/hooks/useWorkflowTemplate";
import { WorkflowTemplateId } from "@/lib/workflow-templates";
import { ShotItem } from "@/lib/shotlist-generator";
import { generateSignedUrlsBatch } from "@/lib/storage-helpers";
import { parseShotList } from "@/lib/shot-list-parser";

interface ScriptData {
  id: string;
  title: string;
  shot_list: string[] | null;
  music_reference: MusicReference | null;
  reference_url: string | null;
}

export default function EditingWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scriptId = searchParams.get("scriptId");
  const { toast } = useToast();
  const { triggerFullCelebration, isShowingAnyCelebration } = useCelebration();
  
  const [script, setScript] = useState<ScriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  
  // Session for optional timer
  const { session, startSession, pauseSession, resumeSession, endSession, saveCurrentStageTime } = useSession({
    attachBeforeUnloadListener: true
  });
  
  // Workflow template for dynamic navigation
  const [scriptWorkflow, setScriptWorkflow] = useState<WorkflowTemplateId | null>(null);
  const { prevStage, currentTemplate } = useWorkflowTemplate({ scriptWorkflow });

  // Resolve image URLs from storage paths
  const resolveImageUrls = useCallback(async (shotItems: ShotItem[]) => {
    const allPaths: string[] = [];
    shotItems.forEach(shot => {
      (shot.shotImagePaths || []).forEach(path => {
        if (path && !allPaths.includes(path)) {
          allPaths.push(path);
        }
      });
    });
    
    if (allPaths.length === 0) return;
    
    const urlMap = await generateSignedUrlsBatch(allPaths, 86400); // 24h
    
    // Convert Map to Record for the component
    const urlRecord: Record<string, string> = {};
    urlMap.forEach((url, path) => {
      urlRecord[path] = url;
    });
    
    setResolvedUrls(urlRecord);
  }, []);

  // Start session when page loads
  useEffect(() => {
    if (!session.isActive && !isShowingAnyCelebration) {
      startSession('edit');
    }
  }, [session.isActive, isShowingAnyCelebration, startSession]);

  // Load script data
  useEffect(() => {
    if (!scriptId) {
      toast({
        title: "Erro",
        description: "ID do conteúdo não encontrado",
        variant: "destructive",
      });
      navigate('/calendario');
      return;
    }

    const loadScript = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('scripts')
        .select('id, title, shot_list, workflow_template, reference_url')
        .eq('id', scriptId)
        .single();

      if (error || !data) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar o conteúdo",
          variant: "destructive",
        });
        navigate('/calendario');
        return;
      }

      // Parse new fields (they may not exist in the database yet if types haven't regenerated)
      // We'll handle this gracefully
      const scriptWithNewFields = data as any;
      
      setScript({
        id: data.id,
        title: data.title,
        shot_list: data.shot_list,
        music_reference: scriptWithNewFields.music_reference || null,
        editing_notes: scriptWithNewFields.editing_notes || '',
        reference_url: data.reference_url || null,
      });
      
      if (data.workflow_template) {
        setScriptWorkflow(data.workflow_template as WorkflowTemplateId);
      }
      
      // Parse shot list using the centralized parser (handles JSON strings)
      const parsedShots = parseShotList(data.shot_list);
      
      if (parsedShots.length > 0) {
        resolveImageUrls(parsedShots);
      }
      
      setLoading(false);
    };

    loadScript();
  }, [scriptId, navigate, toast, resolveImageUrls]);

  // Convert shot_list to ShotItem objects using centralized parser
  const shots = parseShotList(script?.shot_list);

  // Handle updating a shot (for video linking)
  const handleUpdateShot = useCallback(async (shotId: string, updates: Partial<ShotItem>) => {
    if (!scriptId || !script?.shot_list) return;
    
    const updatedShotList = (script.shot_list as any[]).map((item: any, index) => {
      // Parse JSON string if needed to get the real ID
      let parsed = item;
      if (typeof item === 'string') {
        try {
          parsed = JSON.parse(item);
        } catch {
          // Plain text fallback - use index-based ID
          parsed = { id: `shot-${index}`, scriptSegment: item };
        }
      }
      
      const itemId = parsed.id || `shot-${index}`;
      
      if (itemId === shotId) {
        // Apply updates to the parsed object
        const updated = { ...parsed, ...updates };
        // Return as JSON string to maintain format consistency
        return JSON.stringify(updated);
      }
      
      // Return original item unchanged (keep as string if it was string)
      return item;
    });

    const { error } = await supabase
      .from('scripts')
      .update({ shot_list: updatedShotList as any })
      .eq('id', scriptId);

    if (!error) {
      setScript(prev => prev ? { ...prev, shot_list: updatedShotList } : null);
    }
  }, [scriptId, script?.shot_list]);

  // Save handlers

  const handleSaveMusic = useCallback(async (music: MusicReference | null) => {
    if (!scriptId) return;
    setSaving(true);
    await supabase
      .from('scripts')
      .update({ music_reference: music as any })
      .eq('id', scriptId);
    setScript(prev => prev ? { ...prev, music_reference: music } : null);
    setSaving(false);
  }, [scriptId]);

  const handleComplete = useCallback(async () => {
    if (!scriptId) return;

    // Update script status
    const { error } = await supabase
      .from('scripts')
      .update({ 
        status: 'completed',
        publish_status: 'pronto_para_postar',
      })
      .eq('id', scriptId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível concluir a edição",
        variant: "destructive",
      });
      return;
    }

    // Save timer session
    await saveCurrentStageTime();

    // End session with celebration
    const result = await endSession();
    if (result) {
      const sessionSummary = {
        duration: result.duration || session.elapsedSeconds || 0,
        xpGained: result.xpGained || 0,
        stage: 'edit',
      };

      const alreadyCounted = (result as any).alreadyCounted || false;
      const shouldShowStreak = (result as any).shouldShowCelebration && !alreadyCounted;
      const streakCountResult = shouldShowStreak ? ((result as any).newStreak || 0) : 0;

      await triggerFullCelebration(sessionSummary, streakCountResult, result.xpGained || 0, () => {
        navigate('/calendario');
      });
    } else {
      toast({
        title: "🎉 Edição Concluída!",
        description: "Seu conteúdo está pronto para publicar!",
      });
      navigate('/calendario');
    }
  }, [scriptId, saveCurrentStageTime, endSession, session.elapsedSeconds, triggerFullCelebration, navigate, toast]);

  const handleGoBack = useCallback(async () => {
    if (!scriptId) return;
    
    await saveCurrentStageTime();
    
    const prev = prevStage('editing');
    const prevStatus = prev || 'recording';
    
    await supabase
      .from('scripts')
      .update({ status: prevStatus })
      .eq('id', scriptId);
    
    const url = getPrevStageUrl('editing', currentTemplate, scriptId);
    navigate(url || `/shot-list/record?scriptId=${scriptId}`);
  }, [scriptId, saveCurrentStageTime, prevStage, currentTemplate, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando workspace...</p>
        </div>
      </div>
    );
  }

  if (!script) {
    return null;
  }

  const progress = session.targetSeconds 
    ? Math.min(100, (session.elapsedSeconds / session.targetSeconds) * 100)
    : 0;

  return (
    <div 
      className="min-h-screen bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={handleGoBack}
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">
                Mesa de Edição
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {script.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-28">
        <div className="space-y-4">
          {/* Music Panel - Prioridade: entender o ritmo do vídeo */}
          <MusicPanel
            music={script.music_reference}
            onSave={handleSaveMusic}
          />

          {/* Reference Link Panel - Se existir */}
          {script.reference_url && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Referência</span>
                </div>
                <a
                  href={script.reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:text-blue-400 underline truncate max-w-[200px]"
                >
                  Abrir referência
                </a>
              </div>
            </div>
          )}

          {/* Shotlist Panel */}
          <ShotlistPanel 
            shots={shots} 
            onUpdateShot={handleUpdateShot}
            resolvedUrls={resolvedUrls}
          />

          {/* Complete Button - inline at bottom of content */}
          <div className="pt-4 pb-8">
            <CompleteEditingButton 
              onComplete={handleComplete}
              isLoading={saving}
            />
          </div>
        </div>
      </div>

      {/* Floating Timer */}
      {session.isActive && (
        <DraggableSessionTimer
          stage="Edição"
          icon="Scissors"
          elapsedSeconds={session.elapsedSeconds}
          targetSeconds={session.targetSeconds}
          isStreakMode={session.isStreakMode}
          dailyGoalMinutes={session.dailyGoalMinutes}
          isPaused={session.isPaused}
          onPause={pauseSession}
          onResume={resumeSession}
          onStop={async () => {
            await endSession();
            navigate('/');
          }}
          progress={progress}
          dailyBaselineSeconds={session.dailyBaselineSeconds}
          hidden={isShowingAnyCelebration}
        />
      )}

      {/* Auto-hide Navigation */}
      <AutoHideNav />
    </div>
  );
}
