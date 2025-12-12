import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShotListTable, ShotItem } from "@/components/shotlist/ShotListTable";
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { DraggableSessionTimer } from "@/components/DraggableSessionTimer";
import { AutoHideNav } from "@/components/AutoHideNav";
import { useSession } from "@/hooks/useSession";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { useWindowPortal } from "@/hooks/useWindowPortal";
import { cn } from "@/lib/utils";
import { useStreakCelebration } from "@/hooks/useStreakCelebration";
import SessionSummary from "@/components/SessionSummary";
import { StreakCelebration } from "@/components/StreakCelebration";
import { TrophyCelebration } from "@/components/TrophyCelebration";

const ShotListReview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scriptId = searchParams.get("scriptId");
  const { toast } = useToast();

  const [shots, setShots] = useState<ShotItem[]>([]);
  const [scriptTitle, setScriptTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedShots, setLastSavedShots] = useState<ShotItem[]>([]);

  // Unified Session System
  const {
    session,
    startSession,
    changeStage,
    pauseSession,
    resumeSession,
    endSession,
    saveCurrentStageTime,
  } = useSession({ 
    attachBeforeUnloadListener: false 
  });
  
  const isAppVisible = useAppVisibility();

  // Celebration system
  const { 
    celebrationData, 
    triggerFullCelebration,
    dismissSessionSummary,
    dismissStreakCelebration: originalDismissStreakCelebration,
    dismissTrophyCelebration: originalDismissTrophyCelebration,
  } = useStreakCelebration();

  // Wrapper para encerrar sessão com celebração
  const handleEndSession = async () => {
    const result = await endSession();
    if (result) {
      const sessionSummary = {
        duration: result.duration || 0,
        xpGained: result.xpGained || 0,
        stage: 'review' as const,
      };
      const streakCount = (result as any).newStreak || 0;
      await triggerFullCelebration(sessionSummary, streakCount, result.xpGained || 0);
    }
  };

  // Handlers de dismiss com navegação
  const handleDismissSessionSummary = () => {
    dismissSessionSummary();
    if (celebrationData.streakCount === 0 && celebrationData.unlockedTrophies.length === 0) {
      navigate("/");
    }
  };

  const handleDismissStreakCelebration = () => {
    originalDismissStreakCelebration();
    if (celebrationData.unlockedTrophies.length === 0) {
      navigate("/");
    }
  };

  const handleDismissTrophyCelebration = () => {
    originalDismissTrophyCelebration();
    const remainingTrophies = celebrationData.unlockedTrophies.slice(1);
    if (remainingTrophies.length === 0) {
      navigate("/");
    }
  };

  useEffect(() => {
    if (!scriptId || scriptId === 'null' || scriptId === 'undefined') {
      toast({
        title: "Erro",
        description: "ID do roteiro inválido. Redirecionando...",
        variant: "destructive",
      });
      navigate('/calendario');
      return;
    }
    
    loadShotList();
    
    // Start session for review stage
    if (!session.isActive) {
      startSession("review");
    } else if (session.stage !== "review") {
      changeStage("review");
    }
  }, [scriptId]);

  const loadShotList = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('title, shot_list')
        .eq('id', scriptId)
        .single();

      if (error) throw error;

      setScriptTitle(data.title);

      if (data.shot_list && Array.isArray(data.shot_list) && data.shot_list.length > 0) {
        const parsedShots: ShotItem[] = data.shot_list.map((item: any) => {
          // Se o item for uma string JSON, fazer parse primeiro
          const shotData = typeof item === 'string' ? JSON.parse(item) : item;
          
          return {
            id: shotData.id || crypto.randomUUID(),
            scriptSegment: shotData.scriptSegment || shotData.script_segment || '',
            scene: shotData.scene || '',
            shotImageUrls: shotData.shotImageUrls 
              ? shotData.shotImageUrls 
              : shotData.shotImageUrl || shotData.shot_image_url 
                ? [shotData.shotImageUrl || shotData.shot_image_url]
                : [],
            location: shotData.location || '',
            sectionName: shotData.sectionName || shotData.section_name || '',
            isCompleted: shotData.isCompleted || shotData.is_completed || false,
          };
        });
        setShots(parsedShots);
        setLastSavedShots(parsedShots); // Marcar como salvo após carregar
      } else {
        setShots([]);
        setLastSavedShots([]);
      }
    } catch (error) {
      console.error('Error loading shot list:', error);
      toast({
        title: "Erro ao carregar Shot List",
        description: "Não foi possível carregar a lista de takes",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!scriptId) return;
    
    setIsSaving(true);
    try {
      // Usar uma Promise para garantir que pegamos o estado mais recente
      const currentShots = await new Promise<ShotItem[]>((resolve) => {
        setShots((prevShots) => {
          resolve(prevShots);
          return prevShots;
        });
      });

      const { error } = await supabase
        .from('scripts')
        .update({ shot_list: currentShots as any })
        .eq('id', scriptId);

      if (error) throw error;

      setLastSavedShots(currentShots);
      setHasUnsavedChanges(false);

      toast({
        title: "Shot List salva!",
        description: "Suas alterações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Error saving shot list:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a Shot List",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save com debounce
  const autoSave = useCallback(
    async (shotsToSave: ShotItem[]) => {
      if (!scriptId || shotsToSave.length === 0) return;
      
      try {
        const { error } = await supabase
          .from('scripts')
          .update({ shot_list: shotsToSave as any })
          .eq('id', scriptId);

        if (error) throw error;
        
        setLastSavedShots(shotsToSave);
        setHasUnsavedChanges(false);
        console.log('Auto-saved successfully');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    },
    [scriptId]
  );

  // Debounce manual sem lodash
  useEffect(() => {
    if (shots.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      autoSave(shots);
    }, 2000); // Auto-save 2 segundos após parar de editar

    return () => clearTimeout(timeoutId);
  }, [shots, autoSave]);

  // Detectar mudanças não salvas
  useEffect(() => {
    if (lastSavedShots.length > 0) {
      const hasChanges = JSON.stringify(shots) !== JSON.stringify(lastSavedShots);
      setHasUnsavedChanges(hasChanges);
    }
  }, [shots, lastSavedShots]);

  const addShot = () => {
    const newShot: ShotItem = {
      id: crypto.randomUUID(),
      scriptSegment: '',
      scene: '',
      shotImageUrls: [],
      location: '',
      sectionName: '',
      isCompleted: false,
    };
    setShots([...shots, newShot]);
  };

  const splitShotAtCursor = (shotId: string, cursorPosition: number) => {
    setShots(currentShots => {
      const shotIndex = currentShots.findIndex(s => s.id === shotId);
      if (shotIndex === -1) return currentShots;

      const shot = currentShots[shotIndex];
      const beforeText = shot.scriptSegment.substring(0, cursorPosition);
      const afterText = shot.scriptSegment.substring(cursorPosition);

      const updatedShot = { ...shot, scriptSegment: beforeText };
      const newShot: ShotItem = {
        id: crypto.randomUUID(),
        scriptSegment: afterText,
        scene: shot.scene,
        shotImageUrls: [],
        location: shot.location,
        sectionName: shot.sectionName,
        isCompleted: false,
      };

      const newShots = [...currentShots];
      newShots[shotIndex] = updatedShot;
      newShots.splice(shotIndex + 1, 0, newShot);

      return newShots;
    });
  };

  const removeShot = (id: string) => {
    setShots(shots.filter(s => s.id !== id));
  };

  const updateShot = (id: string, field: keyof ShotItem, value: string) => {
    setShots(shots.map(s => 
      s.id === id 
        ? { 
            ...s, 
            [field]: field === 'isCompleted' 
              ? value === 'true' 
              : field === 'shotImageUrls' 
                ? JSON.parse(value)
                : value 
          }
        : s
    ));
  };

  const handleImageUpload = async (shotId: string, file: File) => {
    const shot = shots.find(s => s.id === shotId);
    const currentUrls = shot?.shotImageUrls || [];
    
    if (currentUrls.length >= 3) {
      toast({
        title: "Limite atingido",
        description: "Máximo de 3 imagens por take",
        variant: "destructive",
      });
      return;
    }

    setUploadingImages(prev => new Set(prev).add(shotId));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('shot-references')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // P4 Security: Usar URLs assinadas ao invés de públicas
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('shot-references')
        .createSignedUrl(filePath, 3600); // 1 hora de validade

      if (signedUrlError || !signedUrlData) {
        throw new Error('Failed to generate signed URL');
      }

      const newUrls = [...currentUrls, signedUrlData.signedUrl];
      updateShot(shotId, 'shotImageUrls', JSON.stringify(newUrls));

      toast({
        title: "Imagem enviada!",
        description: `${newUrls.length}/3 imagens adicionadas`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar a imagem",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(shotId);
        return newSet;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setShots((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Window portal system - pops out timer when user leaves app
  const progress = session.isStreakMode
    ? Math.min((session.elapsedSeconds / (session.dailyGoalMinutes * 60)) * 100, 100)
    : Math.min((session.elapsedSeconds / session.targetSeconds) * 100, 100);

  const { isOpen, openPortal, closePortal, Portal } = useWindowPortal({
    title: "Timer - Revisão",
    width: 500,
    height: 500,
  });

  // Open/close portal based on app visibility
  useEffect(() => {
    if (!session.isActive) return;

    if (!isAppVisible && !session.isPaused) {
      openPortal();
    } else if (isAppVisible) {
      closePortal();
    }
  }, [isAppVisible, session.isPaused, session.isActive]);

  const handleAdvanceToRecord = async () => {
    await handleSave();
    await saveCurrentStageTime();
    
    // Update status to 'recording'
    await supabase
      .from('scripts')
      .update({ status: 'recording' })
      .eq('id', scriptId);
    
    navigate(`/shot-list/record?scriptId=${scriptId}`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Header */}
        <div className="md:hidden mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await saveCurrentStageTime();
                navigate(`/session?stage=review&scriptId=${scriptId}`);
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Shot List</h1>
              <p className="text-xs text-muted-foreground truncate">{scriptTitle}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              size="sm"
              variant="outline"
              className={cn(
                "flex-1",
                hasUnsavedChanges && "border-orange-500 text-orange-500"
              )}
            >
              {isSaving ? 'Salvando...' : hasUnsavedChanges ? '● Salvar' : 'Salvo ✓'}
            </Button>
            <Button
              onClick={handleAdvanceToRecord}
              disabled={isSaving}
              size="sm"
              className="flex-1"
            >
              Avançar
            </Button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={async () => {
                await saveCurrentStageTime();
                navigate(`/session?stage=review&scriptId=${scriptId}`);
              }}
              className="hover:bg-accent/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Shot List - Revisão</h1>
              <p className="text-sm text-muted-foreground">{scriptTitle}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              variant="outline"
              className={hasUnsavedChanges ? "border-orange-500 text-orange-500" : ""}
            >
              {isSaving ? 'Salvando...' : hasUnsavedChanges ? '● Salvar' : 'Salvo ✓'}
            </Button>
            <Button
              onClick={handleAdvanceToRecord}
              disabled={isSaving}
            >
              Avançar para Gravação
            </Button>
          </div>
        </div>

        {/* Desktop Add Shot Button */}
        <div className="hidden md:block mb-4">
          <Button
            onClick={addShot}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Take
          </Button>
        </div>

        {/* Mobile FAB - Add Shot */}
        <Button
          onClick={addShot}
          size="lg"
          className="md:hidden fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg z-40 p-0"
        >
          <Plus className="w-6 h-6" />
        </Button>

        {/* Unified Session Timer (in-app) - Hidden when user leaves app */}
        {!isOpen && (
          <DraggableSessionTimer
            stage="Revisão"
            icon={session.isStreakMode ? "Flame" : "CheckCircle"}
            elapsedSeconds={session.elapsedSeconds}
            targetSeconds={session.isStreakMode 
              ? session.dailyGoalMinutes * 60 
              : session.targetSeconds}
            isPaused={session.isPaused}
            isStreakMode={session.isStreakMode}
            dailyGoalMinutes={session.dailyGoalMinutes}
            onPause={pauseSession}
            onResume={resumeSession}
            onStop={handleEndSession}
            progress={progress}
          />
        )}

        {/* Timer in External Popup Window */}
        <Portal>
          <DraggableSessionTimer
            stage="Revisão"
            icon={session.isStreakMode ? "Flame" : "CheckCircle"}
            elapsedSeconds={session.elapsedSeconds}
            targetSeconds={session.isStreakMode 
              ? session.dailyGoalMinutes * 60 
              : session.targetSeconds}
            isPaused={session.isPaused}
            isStreakMode={session.isStreakMode}
            dailyGoalMinutes={session.dailyGoalMinutes}
            onPause={pauseSession}
            onResume={resumeSession}
            onStop={handleEndSession}
            progress={progress}
            isPopup={true}
          />
        </Portal>

        {/* Shot List Table */}
        {shots.length > 0 ? (
          <ShotListTable
            shots={shots}
            onUpdate={updateShot}
            onRemove={removeShot}
            onImageUpload={handleImageUpload}
            onSplitAtCursor={splitShotAtCursor}
            onDragEnd={handleDragEnd}
            showCheckbox={false}
            mode="review"
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum take adicionado ainda.</p>
            <p className="text-sm mt-2">Clique em "Adicionar Take" para começar.</p>
          </div>
        )}
      </div>

      {/* Auto-hide Navigation */}
      <AutoHideNav />

      {/* Celebration Components */}
      <SessionSummary
        show={celebrationData.showSessionSummary}
        duration={celebrationData.sessionSummary?.duration || 0}
        xpGained={celebrationData.sessionSummary?.xpGained || 0}
        stage={celebrationData.sessionSummary?.stage || 'review'}
        onContinue={handleDismissSessionSummary}
      />

      <StreakCelebration
        show={celebrationData.showStreakCelebration}
        streakCount={celebrationData.streakCount}
        weekDays={celebrationData.weekDays}
        onContinue={handleDismissStreakCelebration}
      />

      <TrophyCelebration
        show={celebrationData.showTrophyCelebration}
        trophy={celebrationData.currentTrophy}
        xpGained={celebrationData.xpGained}
        onContinue={handleDismissTrophyCelebration}
      />
    </div>
  );
};

export default ShotListReview;
