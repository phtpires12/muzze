import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Film, ChevronLeft, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCelebration } from "@/contexts/CelebrationContext";
import { useSession } from "@/hooks/useSession";
import { DraggableSessionTimer } from "@/components/DraggableSessionTimer";
import { AutoHideNav } from "@/components/AutoHideNav";
import { ShotlistPanel } from "@/components/editing/ShotlistPanel";
import { VideoReferencesPanel, VideoReference } from "@/components/editing/VideoReferencesPanel";
import { MusicPanel, MusicReference } from "@/components/editing/MusicPanel";
import { EditingNotesPanel } from "@/components/editing/EditingNotesPanel";
import { CompleteEditingButton } from "@/components/editing/CompleteEditingButton";
import { useWorkflowTemplate, getPrevStageUrl } from "@/hooks/useWorkflowTemplate";
import { WorkflowTemplateId, getStageLabel } from "@/lib/workflow-templates";
import { ShotItem } from "@/lib/shotlist-generator";
import { generateSignedUrlsBatch } from "@/lib/storage-helpers";
import { parseShotList } from "@/lib/shot-list-parser";
import { cn } from "@/lib/utils";

interface ScriptData {
  id: string;
  title: string;
  shot_list: string[] | null;
  video_references: VideoReference[] | null;
  music_reference: MusicReference | null;
  editing_notes: string | null;
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
        .select('id, title, shot_list, workflow_template')
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
        video_references: scriptWithNewFields.video_references || [],
        music_reference: scriptWithNewFields.music_reference || null,
        editing_notes: scriptWithNewFields.editing_notes || '',
      });
      
      if (data.workflow_template) {
        setScriptWorkflow(data.workflow_template as WorkflowTemplateId);
      }
      
      // Resolve image URLs for thumbnails
      const parsedShots: ShotItem[] = (data.shot_list || []).map((item: any, index: number) => {
        if (typeof item === 'string') {
          return { id: `shot-${index}`, scriptSegment: item, scene: '', location: '', shotImagePaths: [] };
        }
        return {
          id: item.id || `shot-${index}`,
          scriptSegment: item.scriptSegment || item.description || '',
          scene: item.scene || '',
          location: item.location || '',
          shotImagePaths: item.shotImagePaths || [],
          sectionName: item.sectionName,
          isCompleted: item.isCompleted,
          videoUrl: item.videoUrl,
          videoType: item.videoType,
        };
      });
      
      if (parsedShots.length > 0) {
        resolveImageUrls(parsedShots);
      }
      
      setLoading(false);
    };

    loadScript();
  }, [scriptId, navigate, toast, resolveImageUrls]);

  // Convert shot_list to ShotItem objects (handles both string and object formats)
  const shots: ShotItem[] = (script?.shot_list || []).map((item: any, index) => {
    // Legacy format: simple string
    if (typeof item === 'string') {
      return {
        id: `shot-${index}`,
        scriptSegment: item,
        scene: '',
        location: '',
        shotImagePaths: [],
      };
    }
    
    // Current format: object with scriptSegment, shotImagePaths, location, etc.
    return {
      id: item.id || `shot-${index}`,
      scriptSegment: item.scriptSegment || item.description || '',
      scene: item.scene || '',
      location: item.location || '',
      shotImagePaths: item.shotImagePaths || [],
      sectionName: item.sectionName,
      isCompleted: item.isCompleted,
      videoUrl: item.videoUrl,
      videoType: item.videoType,
    };
  });

  // Handle updating a shot (for video linking)
  const handleUpdateShot = useCallback(async (shotId: string, updates: Partial<ShotItem>) => {
    if (!scriptId || !script?.shot_list) return;
    
    const updatedShotList = (script.shot_list as any[]).map((item: any, index) => {
      const itemId = typeof item === 'string' ? `shot-${index}` : (item.id || `shot-${index}`);
      if (itemId === shotId) {
        if (typeof item === 'string') {
          return {
            id: itemId,
            scriptSegment: item,
            scene: '',
            location: '',
            shotImagePaths: [],
            ...updates,
          };
        }
        return { ...item, ...updates };
      }
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
  const saveVideoReferences = useCallback(async (refs: VideoReference[]) => {
    if (!scriptId) return;
    setSaving(true);
    await supabase
      .from('scripts')
      .update({ video_references: refs as any })
      .eq('id', scriptId);
    setScript(prev => prev ? { ...prev, video_references: refs } : null);
    setSaving(false);
  }, [scriptId]);

  const handleAddVideoRef = useCallback((ref: Omit<VideoReference, 'id' | 'addedAt'>) => {
    const newRef: VideoReference = {
      ...ref,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
    };
    const updated = [...(script?.video_references || []), newRef];
    saveVideoReferences(updated);
  }, [script?.video_references, saveVideoReferences]);

  const handleRemoveVideoRef = useCallback((id: string) => {
    const updated = (script?.video_references || []).filter(r => r.id !== id);
    saveVideoReferences(updated);
  }, [script?.video_references, saveVideoReferences]);

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

  const handleSaveNotes = useCallback(async (notes: string) => {
    if (!scriptId) return;
    await supabase
      .from('scripts')
      .update({ editing_notes: notes })
      .eq('id', scriptId);
    setScript(prev => prev ? { ...prev, editing_notes: notes } : null);
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
              size="sm"
              onClick={handleGoBack}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <Video className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline text-xs">
                {prevStage('editing') ? getStageLabel(prevStage('editing')!) : 'Gravação'}
              </span>
            </Button>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-500 flex-shrink-0" />
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
      <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
        <div className="space-y-4">
          {/* Shotlist Panel */}
          <ShotlistPanel 
            shots={shots} 
            onUpdateShot={handleUpdateShot}
            resolvedUrls={resolvedUrls}
          />

          {/* Video References Panel */}
          <VideoReferencesPanel
            references={script.video_references || []}
            onAdd={handleAddVideoRef}
            onRemove={handleRemoveVideoRef}
          />

          {/* Music Panel */}
          <MusicPanel
            music={script.music_reference}
            onSave={handleSaveMusic}
          />

          {/* Notes Panel */}
          <EditingNotesPanel
            notes={script.editing_notes || ''}
            onSave={handleSaveNotes}
          />
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        <div className="max-w-4xl mx-auto">
          <CompleteEditingButton 
            onComplete={handleComplete}
            isLoading={saving}
          />
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
