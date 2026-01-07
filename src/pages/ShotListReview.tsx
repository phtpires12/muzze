import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNavigationBlocker } from "@/hooks/useNavigationBlocker";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, RefreshCw, FileDown } from "lucide-react";
import { ExportPDFButton } from "@/components/shotlist/ExportPDFButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShotListTable, ShotItem } from "@/components/shotlist/ShotListTable";
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { DraggableSessionTimer } from "@/components/DraggableSessionTimer";
import { AutoHideNav } from "@/components/AutoHideNav";
import { useSession } from "@/hooks/useSession";
import { useDailyGoalProgress } from "@/hooks/useDailyGoalProgress";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { useWindowPortal } from "@/hooks/useWindowPortal";
import { useTimerPermission } from "@/hooks/useTimerPermission";
import { cn } from "@/lib/utils";
import { useStreakCelebration } from "@/hooks/useStreakCelebration";
import { useCelebration } from "@/contexts/CelebrationContext";
import SessionSummary from "@/components/SessionSummary";
import { StreakCelebration } from "@/components/StreakCelebration";
import { TrophyCelebration } from "@/components/TrophyCelebration";
import { ImageGalleryModal } from "@/components/shotlist/ImageGalleryModal";
import { generateShotListFromContent, normalizeText } from "@/lib/shotlist-generator";

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
  const [galleryOpenShotId, setGalleryOpenShotId] = useState<string | null>(null);
  
  // Sync modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncChanges, setSyncChanges] = useState<{
    toAdd: ShotItem[];
    toRemove: ShotItem[];
    toKeep: ShotItem[];
    hasFilledData: boolean;
  } | null>(null);

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
  const { progress: dailyProgress } = useDailyGoalProgress();
  
  // Timer permission check
  const { canUseTimer } = useTimerPermission(scriptId, 'review');

  // Global celebration context (for hiding timer during celebrations)
  const { isShowingAnyCelebration } = useCelebration();

  // State para modal de confirmação de encerramento
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  
  // State para controlar se devemos prosseguir com navegação bloqueada
  const [shouldProceedWithBlocker, setShouldProceedWithBlocker] = useState(false);

  // Memoizar callback para evitar recriações desnecessárias
  const handleNavigationBlocked = useCallback(() => {
    setShowEndConfirmation(true);
  }, []);

  // Interceptar navegação via swipe/browser back quando há sessão ativa
  const blocker = useNavigationBlocker({
    onNavigationBlocked: handleNavigationBlocked,
    shouldBlock: true,
  });

  // Celebration system (local, for legacy flow)
  const { 
    celebrationData, 
    triggerFullCelebration,
    dismissSessionSummary,
    dismissStreakCelebration: originalDismissStreakCelebration,
    dismissTrophyCelebration: originalDismissTrophyCelebration,
  } = useStreakCelebration();

  // Wrapper para encerrar sessão com celebração
  const handleEndSession = async () => {
    // Guardar se devemos prosseguir com navegação bloqueada após celebração
    const blockerWasActive = blocker.state === "blocked";
    setShouldProceedWithBlocker(blockerWasActive);
    
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

  // Handler para confirmar encerramento via modal
  const handleConfirmEndSession = async () => {
    setShowEndConfirmation(false);
    await handleEndSession();
  };

  // Handler para cancelar encerramento
  const handleCancelEndSession = () => {
    setShowEndConfirmation(false);
    if (blocker.state === "blocked") {
      blocker.reset?.();
    }
  };

  // Handlers de dismiss com navegação
  const handleDismissSessionSummary = () => {
    dismissSessionSummary();
    if (celebrationData.streakCount === 0 && celebrationData.unlockedTrophies.length === 0) {
      if (shouldProceedWithBlocker) {
        blocker.proceed?.();
        setShouldProceedWithBlocker(false);
      } else {
        navigate("/");
      }
    }
  };

  const handleDismissStreakCelebration = () => {
    originalDismissStreakCelebration();
    if (celebrationData.unlockedTrophies.length === 0) {
      if (shouldProceedWithBlocker) {
        blocker.proceed?.();
        setShouldProceedWithBlocker(false);
      } else {
        navigate("/");
      }
    }
  };

  const handleDismissTrophyCelebration = () => {
    originalDismissTrophyCelebration();
    const remainingTrophies = celebrationData.unlockedTrophies.slice(1);
    if (remainingTrophies.length === 0) {
      if (shouldProceedWithBlocker) {
        blocker.proceed?.();
        setShouldProceedWithBlocker(false);
      } else {
        navigate("/");
      }
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
    
    const autoPopupEnabled = localStorage.getItem('timer-auto-popup-enabled') !== 'false';

    if (!isAppVisible && !session.isPaused && autoPopupEnabled) {
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

  // Calculate sync changes between current shots and script content
  const calculateSyncChanges = async () => {
    if (!scriptId) return;
    
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('content')
        .eq('id', scriptId)
        .single();
      
      if (error || !data?.content) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar o roteiro",
          variant: "destructive",
        });
        return;
      }
      
      const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      const proposedShots = generateShotListFromContent(content);
      
      // Create maps for comparison
      const currentNormalized = new Map(
        shots.map(s => [normalizeText(s.scriptSegment), s])
      );
      const proposedNormalized = new Set(
        proposedShots.map(s => normalizeText(s.scriptSegment))
      );
      
      // Identify changes
      const toKeep = shots.filter(s => proposedNormalized.has(normalizeText(s.scriptSegment)));
      const toRemove = shots.filter(s => !proposedNormalized.has(normalizeText(s.scriptSegment)));
      const toAdd = proposedShots.filter(s => !currentNormalized.has(normalizeText(s.scriptSegment)));
      
      // Check if any removed slots have filled data
      const hasFilledData = toRemove.some(s => 
        s.scene || s.location || (s.shotImageUrls && s.shotImageUrls.length > 0)
      );
      
      setSyncChanges({ toAdd, toRemove, toKeep, hasFilledData });
      setShowSyncModal(true);
    } catch (error) {
      console.error('Error calculating sync changes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível calcular as alterações",
        variant: "destructive",
      });
    }
  };

  // Apply sync changes
  const applySyncChanges = async () => {
    if (!syncChanges || !scriptId) return;
    
    try {
      const newShots = [...syncChanges.toKeep, ...syncChanges.toAdd];
      
      const { error } = await supabase
        .from('scripts')
        .update({ shot_list: newShots as any })
        .eq('id', scriptId);
      
      if (error) throw error;
      
      setShots(newShots);
      setLastSavedShots(newShots);
      setHasUnsavedChanges(false);
      setShowSyncModal(false);
      setSyncChanges(null);
      
      toast({
        title: "Sincronizado!",
        description: `${syncChanges.toAdd.length} adicionados, ${syncChanges.toRemove.length} removidos`,
      });
    } catch (error) {
      console.error('Error applying sync changes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível sincronizar",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="min-h-screen bg-background p-4 md:p-6 pb-24 md:pb-6"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
    >
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
              title="Voltar para Revisão do Roteiro"
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
              onClick={calculateSyncChanges}
              size="sm"
              variant="ghost"
              className="px-2"
              title="Sincronizar com Revisão"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <ExportPDFButton
              shots={shots}
              scriptTitle={scriptTitle}
              mode="review"
              size="icon"
              variant="ghost"
              iconOnly
            />
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
              Voltar para Revisão
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Shot List - Revisão</h1>
              <p className="text-sm text-muted-foreground">{scriptTitle}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ExportPDFButton
              shots={shots}
              scriptTitle={scriptTitle}
              mode="review"
              variant="outline"
              size="sm"
            />
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

        {/* Desktop Add Shot and Sync Buttons */}
        <div className="hidden md:flex gap-2 mb-4">
          <Button
            onClick={addShot}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Take
          </Button>
          <Button
            onClick={calculateSyncChanges}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizar com Revisão
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

        {/* Unified Session Timer (in-app) - Hidden when user leaves app or during celebrations */}
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
            todayMinutesFromDB={dailyProgress.actualMinutes}
            permissionEnabled={canUseTimer}
            savedSecondsThisSession={session.savedSecondsThisSession}
            hidden={isShowingAnyCelebration}
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
            todayMinutesFromDB={dailyProgress.actualMinutes}
            permissionEnabled={canUseTimer}
            savedSecondsThisSession={session.savedSecondsThisSession}
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
            onImageClick={(shotId) => setGalleryOpenShotId(shotId)}
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

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        shots={shots}
        currentShotId={galleryOpenShotId}
        onClose={() => setGalleryOpenShotId(null)}
      />

      {/* Alert Dialog para confirmar encerramento de sessão via swipe/back */}
      <AlertDialog open={showEndConfirmation} onOpenChange={(open) => {
        if (!open) handleCancelEndSession();
        else setShowEndConfirmation(true);
      }}>
        <AlertDialogContent className="z-[150]">
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao encerrar, seu tempo será salvo e você verá o resumo da sua sessão criativa.
              Tem certeza que deseja finalizar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelEndSession}>Continuar trabalhando</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEndSession}>
              Sim, encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sync Modal */}
      <AlertDialog open={showSyncModal} onOpenChange={setShowSyncModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sincronizar Shot List</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {syncChanges && (
                  <>
                    {syncChanges.toAdd.length > 0 && (
                      <p className="text-green-600">+ Adicionar {syncChanges.toAdd.length} novos slots</p>
                    )}
                    {syncChanges.toRemove.length > 0 && (
                      <p className="text-red-600">- Remover {syncChanges.toRemove.length} slots</p>
                    )}
                    {syncChanges.toAdd.length === 0 && syncChanges.toRemove.length === 0 && (
                      <p className="text-muted-foreground">Nenhuma alteração detectada.</p>
                    )}
                    {syncChanges.hasFilledData && (
                      <p className="text-amber-600 font-medium mt-2">
                        ⚠️ Alguns slots a serem removidos possuem cena, locação ou imagens preenchidas. Esses dados serão perdidos.
                      </p>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={applySyncChanges}
              disabled={syncChanges?.toAdd.length === 0 && syncChanges?.toRemove.length === 0}
            >
              Confirmar Sincronização
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ShotListReview;
