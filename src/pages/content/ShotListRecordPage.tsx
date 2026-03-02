import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNavigationBlocker } from '@/core/hooks';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Filter, ArrowRight, AlignLeft, FileDown } from "lucide-react";
import { ExportPDFButton } from "@/components/content/shotlist/ExportPDFButton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/core/hooks';
import { ShotListTable, ShotItem } from "@/components/content/shotlist/ShotListTable";
import { ImageGalleryModal } from "@/components/content/shotlist/ImageGalleryModal";
import { PhraseByPhraseMode } from "@/components/content/shotlist/PhraseByPhraseMode";
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { DraggableSessionTimer } from "@/components/shared";
import { AutoHideNav } from "@/components/layout/AutoHideNav";
import { useSession } from '@/core/hooks';
import { useDailyGoalProgress } from '@/core/hooks';
import { useTimerPermission } from '@/core/hooks';
import { useProfileWithLevel } from '@/core/hooks';
import { useFirstInputTrigger } from '@/core/hooks';
import { cn } from '@/core/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useStreakCelebration } from '@/core/hooks';
import { useCelebration } from '@/core/contexts';
import SessionSummary from "@/components/content";
import { StreakCelebration } from "@/components/shared";
import { TrophyCelebration } from "@/components/shared";
import { extractPathFromUrl, generateSignedUrlsBatch } from '@/core/utils';
import { useWorkflowTemplate, getNextStageUrl, getPrevStageUrl } from '@/core/hooks';
import { WorkflowTemplateId, getStageLabel } from '@/core/constants';
import { ROUTES } from "@/routes/routes";


interface ContentSections {
  gancho?: string;
  setup?: string;
  desenvolvimento?: string;
  conclusao?: string;
}

const ShotListRecord = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scriptId = searchParams.get("scriptId");
  const { toast } = useToast();

  const [shots, setShots] = useState<ShotItem[]>([]);
  const [resolvedUrls, setResolvedUrls] = useState<Map<string, string>>(new Map());
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptContent, setScriptContent] = useState<ContentSections | null>(null);
  const [isShotListEmpty, setIsShotListEmpty] = useState<boolean | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [galleryOpenShotId, setGalleryOpenShotId] = useState<string | null>(null);

  // Undo stack for structural changes (split, remove, reorder)
  const [undoStack, setUndoStack] = useState<ShotItem[][]>([]);
  const MAX_UNDO_HISTORY = 20;

  // Workflow template state
  const [scriptWorkflow, setScriptWorkflow] = useState<WorkflowTemplateId | null>(null);
  const { nextStage, prevStage, currentTemplate, isStageIncluded } = useWorkflowTemplate({ scriptWorkflow });

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

  const { goalMinutes } = useProfileWithLevel();
  const { progress: dailyProgress } = useDailyGoalProgress({ goalMinutes });

  // Timer permission check
  const { canUseTimer } = useTimerPermission(scriptId, 'recording');

  // Global celebration context (for hiding timer during celebrations)
  const { isShowingAnyCelebration } = useCelebration();

  // First input trigger hook - detecta primeira ação e descongela o timer
  useFirstInputTrigger({
    enabled: session.isActive && !isShowingAnyCelebration,
  });

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
        stage: 'record' as const,
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
        navigate(ROUTES.HOME);
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
        navigate(ROUTES.HOME);
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
        navigate(ROUTES.HOME);
      }
    }
  };

  // Filter states
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);

  // Toggle mode: permite alternar entre Shot List e Frase-a-Frase quando há conteúdo na shot list
  const [forcePhraseByPhraseMode, setForcePhraseByPhraseMode] = useState(false);
  const [hasShotListContent, setHasShotListContent] = useState(false);

  useEffect(() => {
    if (!scriptId || scriptId === 'null' || scriptId === 'undefined') {
      toast({
        title: "Erro",
        description: "ID do roteiro inválido. Redirecionando...",
        variant: "destructive",
      });
      navigate(ROUTES.CALENDARIO);
      return;
    }

    loadShotList();

    // Start session for recording stage
    if (!session.isActive) {
      startSession("record");
    } else if (session.stage !== "record") {
      changeStage("record");
    }
  }, [scriptId]);

  // Auto-save effect (debounced)
  useEffect(() => {
    // Não fazer auto-save no primeiro render ou se não há shots
    if (shots.length === 0 || !scriptId) return;

    // Limpar timeout anterior se existir
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }

    // Marcar como "não salvo"
    setAutoSaveStatus('unsaved');

    // Agendar salvamento para 3 segundos depois
    const timeout = setTimeout(async () => {
      setAutoSaveStatus('saving');

      try {
        const { error } = await supabase
          .from('scripts')
          .update({ shot_list: shots as any })
          .eq('id', scriptId);

        if (error) throw error;

        setAutoSaveStatus('saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('unsaved');
        toast({
          title: "Erro ao salvar automaticamente",
          description: "Suas alterações não foram salvas. Tente novamente.",
          variant: "destructive",
        });
      }
    }, 3000);

    setSaveTimeoutId(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [shots]);

  const loadShotList = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('title, shot_list, content, workflow_template')
        .eq('id', scriptId)
        .single();

      if (error) throw error;

      setScriptTitle(data.title);

      // Load workflow template for dynamic navigation
      setScriptWorkflow(data.workflow_template as WorkflowTemplateId | null);

      // Guardar conteúdo do roteiro para o Modo Frase-a-Frase
      if (data.content) {
        const contentData = typeof data.content === 'string'
          ? JSON.parse(data.content)
          : data.content;
        setScriptContent(contentData);
      }

      // Verificar se shot list está preenchida
      const hasFilledShotList = data.shot_list &&
        Array.isArray(data.shot_list) &&
        data.shot_list.length > 0 &&
        data.shot_list.some((item: any) => {
          const shotData = typeof item === 'string' ? JSON.parse(item) : item;
          const scriptSegment = shotData.scriptSegment || shotData.script_segment || '';
          return scriptSegment.trim() !== '';
        });

      setHasShotListContent(hasFilledShotList);
      setIsShotListEmpty(!hasFilledShotList);

      if (data.shot_list && Array.isArray(data.shot_list) && data.shot_list.length > 0) {
        let needsMigration = false;

        const parsedShots: ShotItem[] = data.shot_list.map((item: any) => {
          const shotData = typeof item === 'string' ? JSON.parse(item) : item;

          // Migrar shotImageUrls -> shotImagePaths se necessário
          let paths: string[] = shotData.shotImagePaths || [];

          if (paths.length === 0 && shotData.shotImageUrls?.length > 0) {
            // Extrair paths de URLs legadas
            paths = shotData.shotImageUrls
              .map((url: string) => extractPathFromUrl(url))
              .filter((p: string | null): p is string => p !== null);
            needsMigration = true;
          }

          return {
            id: shotData.id || crypto.randomUUID(),
            scriptSegment: shotData.scriptSegment || shotData.script_segment || '',
            scene: shotData.scene || '',
            shotImagePaths: paths,
            location: shotData.location || '',
            sectionName: shotData.sectionName || shotData.section_name || '',
            isCompleted: shotData.isCompleted || shotData.is_completed || false,
          };
        });

        setShots(parsedShots);

        // Se houve migração, salvar versão atualizada
        if (needsMigration) {
          await supabase
            .from('scripts')
            .update({ shot_list: parsedShots as any })
            .eq('id', scriptId);
          console.log('Migrated shot_list to use paths instead of URLs');
        }

        // Resolver signed URLs para todos os paths
        await resolveAllImageUrls(parsedShots);
      } else {
        setShots([]);
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

  // Função para resolver URLs em lote
  const resolveAllImageUrls = async (shots: ShotItem[]) => {
    const allPaths: string[] = [];
    shots.forEach(shot => {
      (shot.shotImagePaths || []).forEach(path => {
        if (path && !allPaths.includes(path)) {
          allPaths.push(path);
        }
      });
    });

    if (allPaths.length === 0) return;

    const urlMap = await generateSignedUrlsBatch(allPaths, 86400); // 24h
    setResolvedUrls(urlMap);
  };

  const handleAdvanceToEdit = async () => {
    // Se ainda está salvando, aguardar
    if (autoSaveStatus === 'saving') {
      toast({
        title: "Aguarde...",
        description: "Salvando alterações antes de avançar",
      });
      return;
    }

    // Determine next stage based on workflow
    const next = nextStage('recording');
    const nextStatus = next || 'editing';

    // Se há mudanças não salvas, salvar primeiro
    if (autoSaveStatus === 'unsaved') {
      setAutoSaveStatus('saving');

      try {
        const { error } = await supabase
          .from('scripts')
          .update({ shot_list: shots as any })
          .eq('id', scriptId);

        if (error) throw error;

        setAutoSaveStatus('saved');
        toast({
          title: "Progresso salvo!",
          description: `Avançando para a etapa de ${getStageLabel(nextStatus)}...`,
        });

        // Salvar tempo da sessão
        await saveCurrentStageTime();

        // Update status
        await supabase
          .from('scripts')
          .update({ status: nextStatus })
          .eq('id', scriptId);

        // Navigate to next stage
        const url = getNextStageUrl('recording', currentTemplate, scriptId!);
        setTimeout(() => {
          navigate(url || `/editing-workspace?scriptId=${scriptId}`);
        }, 500);

      } catch (error) {
        console.error('Error saving before advancing:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar antes de avançar",
          variant: "destructive",
        });
        setAutoSaveStatus('unsaved');
      }
    } else {
      // Já está salvo, salvar tempo e avançar
      await saveCurrentStageTime();

      // Update status
      await supabase
        .from('scripts')
        .update({ status: nextStatus })
        .eq('id', scriptId);

      const url = getNextStageUrl('recording', currentTemplate, scriptId!);
      navigate(url || `/editing-workspace?scriptId=${scriptId}`);
    }
  };

  // SaveStatusIndicator Component
  const SaveStatusIndicator = ({ status }: { status: 'saved' | 'saving' | 'unsaved' }) => {
    const statusConfig = {
      saved: {
        color: 'bg-green-500',
        text: 'Salvo',
        pulse: false
      },
      saving: {
        color: 'bg-yellow-500',
        text: 'Salvando...',
        pulse: true
      },
      unsaved: {
        color: 'bg-red-500',
        text: 'Não salvo',
        pulse: true
      }
    };

    const config = statusConfig[status];

    return (
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2.5 h-2.5 rounded-full",
          config.color,
          config.pulse && "animate-pulse"
        )} />
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {config.text}
        </span>
      </div>
    );
  };

  // Helper to save state to undo stack before destructive operations
  const pushToUndoStack = useCallback((currentShots: ShotItem[]) => {
    setUndoStack(prev => {
      // Deep clone to avoid references
      const snapshot = JSON.parse(JSON.stringify(currentShots));
      const newStack = [...prev, snapshot];
      // Limit history size
      if (newStack.length > MAX_UNDO_HISTORY) {
        return newStack.slice(-MAX_UNDO_HISTORY);
      }
      return newStack;
    });
  }, []);

  // Global Ctrl+Z listener for undoing structural changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        // Check if we're inside an editor or input
        const target = e.target as HTMLElement;
        const isInEditor = target.closest('.ProseMirror') ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA';

        // If inside editor, let TipTap handle local undo
        if (isInEditor) return;

        // Global undo (undo split/remove/reorder)
        if (undoStack.length > 0) {
          e.preventDefault();

          setUndoStack(prev => {
            const newStack = [...prev];
            const previousState = newStack.pop();

            if (previousState) {
              setShots(previousState);
              toast({
                title: "Desfeito!",
                description: "Ação desfeita com sucesso",
              });
            }

            return newStack;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack.length, toast]);

  // Global Shift+Enter listener for splitting take at cursor
  useEffect(() => {
    const handleSplitKeyDown = (e: KeyboardEvent) => {
      // Shift+Enter SEM Ctrl/Cmd = novo take
      if (e.key === 'Enter' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        const editor = target.closest('.ProseMirror');

        if (!editor) return;

        // Encontrar o card/row pai que contém o shot
        const shotContainer = editor.closest('[data-shot-id]');
        if (!shotContainer) return;

        const shotId = shotContainer.getAttribute('data-shot-id');
        if (!shotId) return;

        e.preventDefault();
        e.stopPropagation();

        // Obter posição do cursor no texto puro
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editor);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const cursorPosition = preCaretRange.toString().length;

        // Chamar split
        splitShotAtCursor(shotId, cursorPosition);
      }
    };

    window.addEventListener('keydown', handleSplitKeyDown, true);
    return () => window.removeEventListener('keydown', handleSplitKeyDown, true);
  }, []);

  // Helper to split HTML at text position (preserving HTML structure)
  const splitHtmlAtTextPosition = (html: string, textPosition: number): { before: string; after: string } => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);
    let charCount = 0;
    let splitNode: Text | null = null;
    let splitOffset = 0;

    while (walker.nextNode()) {
      const textNode = walker.currentNode as Text;
      const nodeLength = textNode.textContent?.length || 0;

      if (charCount + nodeLength >= textPosition) {
        splitNode = textNode;
        splitOffset = textPosition - charCount;
        break;
      }
      charCount += nodeLength;
    }

    if (!splitNode) {
      return { before: html, after: '' };
    }

    // Split the text node at the exact position
    const afterTextNode = splitNode.splitText(splitOffset);

    // Get the "before" HTML (everything up to the split point)
    const beforeHtml = tempDiv.innerHTML;

    // For "after": collect all text from the split point onwards
    const afterDiv = document.createElement('div');
    let currentNode: Node | null = afterTextNode;

    // Clone remaining content from split point
    while (currentNode) {
      afterDiv.appendChild(currentNode.cloneNode(true));
      currentNode = currentNode.nextSibling;
    }

    // Also get remaining siblings of parent elements
    let parent = afterTextNode.parentNode;
    while (parent && parent !== tempDiv) {
      let sibling = parent.nextSibling;
      while (sibling) {
        afterDiv.appendChild(sibling.cloneNode(true));
        sibling = sibling.nextSibling;
      }
      parent = parent.parentNode;
    }

    let afterHtml = afterDiv.innerHTML.trim();

    // Wrap in <p> if needed for consistency
    if (afterHtml && !afterHtml.startsWith('<p>') && !afterHtml.startsWith('<')) {
      afterHtml = `<p>${afterHtml}</p>`;
    }

    // Clean up the "before" HTML by removing the after content
    // Re-create from scratch for clean split
    const cleanBeforeDiv = document.createElement('div');
    cleanBeforeDiv.innerHTML = html;

    const cleanWalker = document.createTreeWalker(cleanBeforeDiv, NodeFilter.SHOW_TEXT, null);
    let cleanCharCount = 0;

    while (cleanWalker.nextNode()) {
      const textNode = cleanWalker.currentNode as Text;
      const nodeLength = textNode.textContent?.length || 0;

      if (cleanCharCount + nodeLength >= textPosition) {
        // Truncate this node and remove everything after
        const truncateAt = textPosition - cleanCharCount;
        textNode.textContent = textNode.textContent?.substring(0, truncateAt) || '';

        // Remove all following siblings and their parent's following siblings
        let nodeToRemove = textNode.nextSibling;
        while (nodeToRemove) {
          const next = nodeToRemove.nextSibling;
          nodeToRemove.parentNode?.removeChild(nodeToRemove);
          nodeToRemove = next;
        }

        let parentEl = textNode.parentNode;
        while (parentEl && parentEl !== cleanBeforeDiv) {
          let siblingToRemove = parentEl.nextSibling;
          while (siblingToRemove) {
            const next = siblingToRemove.nextSibling;
            siblingToRemove.parentNode?.removeChild(siblingToRemove);
            siblingToRemove = next;
          }
          parentEl = parentEl.parentNode;
        }
        break;
      }
      cleanCharCount += nodeLength;
    }

    return { before: cleanBeforeDiv.innerHTML, after: afterHtml };
  };

  const splitShotAtCursor = (shotId: string, cursorPosition: number) => {
    setShots(currentShots => {
      // Save state before split for undo
      pushToUndoStack(currentShots);

      const shotIndex = currentShots.findIndex(s => s.id === shotId);
      if (shotIndex === -1) return currentShots;

      const shot = currentShots[shotIndex];

      // Use HTML-aware splitting
      const { before, after } = splitHtmlAtTextPosition(shot.scriptSegment, cursorPosition);

      const updatedShot = { ...shot, scriptSegment: before };
      const newShot: ShotItem = {
        id: crypto.randomUUID(),
        scriptSegment: after,
        scene: '',
        shotImagePaths: [],
        location: '',
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
    // Save state before removal for undo
    pushToUndoStack(shots);
    setShots(shots.filter(s => s.id !== id));
  };

  const updateShot = (id: string, field: keyof ShotItem, value: string) => {
    setShots(shots.map(s =>
      s.id === id
        ? {
          ...s,
          [field]: field === 'isCompleted'
            ? value === 'true'
            : field === 'shotImagePaths'
              ? JSON.parse(value)
              : value
        }
        : s
    ));
  };

  const handleImageUpload = async (shotId: string, file: File) => {
    const shot = shots.find(s => s.id === shotId);
    const currentPaths = shot?.shotImagePaths || [];

    if (currentPaths.length >= 3) {
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
      const filePath = `${user.id}/${scriptId}/${shotId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('shot-references')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Salvar apenas o PATH no banco
      const newPaths = [...currentPaths, filePath];
      updateShot(shotId, 'shotImagePaths', JSON.stringify(newPaths));

      // Gerar signed URL para preview local imediato
      const { data: signedUrlData } = await supabase.storage
        .from('shot-references')
        .createSignedUrl(filePath, 86400);

      if (signedUrlData?.signedUrl) {
        setResolvedUrls(prev => new Map(prev).set(filePath, signedUrlData.signedUrl));
      }

      toast({
        title: "Imagem enviada!",
        description: `${newPaths.length}/3 imagens adicionadas`,
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
        // Save state before reorder for undo
        pushToUndoStack(items);

        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Calculate progress
  const progressPercentage = useMemo(() => {
    if (shots.length === 0) return 0;
    const completed = shots.filter(s => s.isCompleted).length;
    return Math.round((completed / shots.length) * 100);
  }, [shots]);

  // Filter shots
  const filteredShots = useMemo(() => {
    return shots.filter(shot => {
      if (filterLocation !== "all" && shot.location !== filterLocation) return false;
      if (showOnlyIncomplete && shot.isCompleted) return false;
      return true;
    });
  }, [shots, filterLocation, showOnlyIncomplete]);

  // Get unique locations for filters
  const uniqueLocations = useMemo(() =>
    Array.from(new Set(shots.map(s => s.location).filter(Boolean))),
    [shots]
  );

  // Calculate timer progress
  const progress = session.isStreakMode
    ? Math.min((session.elapsedSeconds / (session.dailyGoalMinutes * 60)) * 100, 100)
    : Math.min((session.elapsedSeconds / session.targetSeconds) * 100, 100);

  // Handler para voltar ao estágio anterior (usado no Modo Frase-a-Frase)
  const handleBackToPreviousStage = async () => {
    if (!scriptId) {
      console.error('scriptId não encontrado para atualizar status');
      return;
    }

    await saveCurrentStageTime();

    // Determine previous stage based on workflow
    const prev = prevStage('recording');
    const prevStatus = prev || 'review';

    const { error } = await supabase
      .from('scripts')
      .update({ status: prevStatus })
      .eq('id', scriptId);
    if (error) {
      console.error(`Erro ao atualizar status para ${prevStatus}:`, error);
    }

    // Navigate to previous stage
    const url = getPrevStageUrl('recording', currentTemplate, scriptId);
    navigate(url || `/session?stage=review&scriptId=${scriptId}`);
  };

  // Salvar o modo de gravação usado (teleprompter ou shotlist) para navegação futura
  useEffect(() => {
    if (scriptId && isShotListEmpty !== null) {
      const mode = isShotListEmpty ? 'teleprompter' : 'shotlist';
      localStorage.setItem(`recording-mode-${scriptId}`, mode);
    }
  }, [scriptId, isShotListEmpty]);

  // Loading state enquanto determina qual modo usar
  if (isShotListEmpty === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Modo Frase-a-Frase: quando a shot list está vazia OU usuário forçou o modo
  const showPhraseByPhraseMode = (isShotListEmpty && scriptContent) || (forcePhraseByPhraseMode && scriptContent);

  if (showPhraseByPhraseMode && scriptContent) {
    return (
      <>
        <PhraseByPhraseMode
          scriptId={scriptId!}
          scriptTitle={scriptTitle}
          scriptContent={scriptContent}
          onAdvanceToEdit={handleAdvanceToEdit}
          onBack={handleBackToPreviousStage}
          session={{
            isActive: session.isActive,
            isPaused: session.isPaused,
            elapsedSeconds: session.elapsedSeconds,
            targetSeconds: session.targetSeconds,
            isStreakMode: session.isStreakMode,
            dailyGoalMinutes: session.dailyGoalMinutes,
            dailyBaselineSeconds: session.dailyBaselineSeconds,
          }}
          onPauseSession={pauseSession}
          onResumeSession={resumeSession}
          onEndSession={handleEndSession}
          isShowingAnyCelebration={isShowingAnyCelebration}
          canUseTimer={canUseTimer}
          canSwitchToShotList={hasShotListContent}
          onSwitchToShotList={() => setForcePhraseByPhraseMode(false)}
        />

        {/* Celebration modals */}
        <SessionSummary
          show={celebrationData.showSessionSummary}
          duration={celebrationData.sessionSummary?.duration || 0}
          xpGained={celebrationData.sessionSummary?.xpGained || 0}
          stage={celebrationData.sessionSummary?.stage || 'record'}
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
      </>
    );
  }

  // Modo Shot List (comportamento atual)
  return (
    <div
      className="min-h-screen bg-background p-4 md:p-6"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)'
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Mobile Header */}
        <div className="md:hidden mb-4 space-y-3">
          {/* Linha 1: Navegação + Título + Status */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={async () => {
                if (!scriptId) {
                  console.error('scriptId não encontrado para atualizar status');
                  return;
                }
                await saveCurrentStageTime();
                const { error } = await supabase
                  .from('scripts')
                  .update({ status: 'review' })
                  .eq('id', scriptId);
                if (error) {
                  console.error('Erro ao atualizar status para review:', error);
                }
                navigate(`/shot-list/review?scriptId=${scriptId}`);
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">Gravação</h1>
              <p className="text-xs text-muted-foreground truncate">{scriptTitle}</p>
            </div>
            <ExportPDFButton
              shots={shots}
              scriptTitle={scriptTitle}
              mode="record"
              size="icon"
              variant="ghost"
              iconOnly
            />
            <SaveStatusIndicator status={autoSaveStatus} />
          </div>

          {/* Linha 2: Botão Avançar em largura total */}
          <Button
            id="record-advance"
            onClick={handleAdvanceToEdit}
            disabled={autoSaveStatus === 'saving'}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Avançar para Edição
          </Button>

          {/* Mobile Progress Card - Compacto */}
          <div className="bg-card p-3 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-foreground">Progresso</span>
              <span className="text-lg font-bold text-primary">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 mb-1.5" />
            <p className="text-xs text-muted-foreground">
              {shots.filter(s => s.isCompleted).length}/{shots.length} takes
            </p>
          </div>

          {/* Mobile: Botões de Filtros e Toggle de Modo */}
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                  {(filterLocation !== "all" || showOnlyIncomplete) && (
                    <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                      {[filterLocation !== "all" && "Locação", showOnlyIncomplete && "Incompletos"].filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[300px]">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Locação:</label>
                    <Select value={filterLocation} onValueChange={setFilterLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {uniqueLocations.map(loc => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="incomplete-only-mobile" className="text-sm font-medium text-foreground">
                      Apenas não gravados
                    </label>
                    <Switch
                      checked={showOnlyIncomplete}
                      onCheckedChange={setShowOnlyIncomplete}
                      id="incomplete-only-mobile"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Botão para alternar para Modo Frase-a-Frase */}
            {hasShotListContent && scriptContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setForcePhraseByPhraseMode(true)}
                className="gap-2"
              >
                <AlignLeft className="w-4 h-4" />
                Teleprompter
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={async () => {
                if (!scriptId) {
                  console.error('scriptId não encontrado para atualizar status');
                  return;
                }
                await saveCurrentStageTime();
                const { error } = await supabase
                  .from('scripts')
                  .update({ status: 'review' })
                  .eq('id', scriptId);
                if (error) {
                  console.error('Erro ao atualizar status para review:', error);
                }
                navigate(`/shot-list/review?scriptId=${scriptId}`);
              }}
              className="hover:bg-accent/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Revisão
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Shot List - Gravação</h1>
              <p className="text-sm text-muted-foreground">{scriptTitle}</p>
            </div>
          </div>

          {/* Indicador de status + Toggle + Botão de Edição */}
          <div className="flex items-center gap-4">
            <SaveStatusIndicator status={autoSaveStatus} />

            <ExportPDFButton
              shots={shots}
              scriptTitle={scriptTitle}
              mode="record"
              variant="outline"
              size="sm"
            />

            {/* Botão para alternar para Modo Frase-a-Frase */}
            {hasShotListContent && scriptContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setForcePhraseByPhraseMode(true)}
                className="gap-2"
              >
                <AlignLeft className="w-4 h-4" />
                Modo Teleprompter
              </Button>
            )}

            <Button
              onClick={handleAdvanceToEdit}
              disabled={autoSaveStatus === 'saving'}
              className="min-w-[160px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Avançar para Edição
            </Button>
          </div>
        </div>

        {/* Unified Session Timer - Hidden during celebrations */}
        <DraggableSessionTimer
          stage="Gravação"
          icon={session.isStreakMode ? "Flame" : "Video"}
          elapsedSeconds={session.elapsedSeconds}
          targetSeconds={session.isStreakMode
            ? session.dailyGoalMinutes * 60
            : session.targetSeconds}
          isPaused={session.isPaused}
          isFrozen={session.isFrozen}
          isStreakMode={session.isStreakMode}
          dailyGoalMinutes={session.dailyGoalMinutes}
          onPause={pauseSession}
          onResume={resumeSession}
          onStop={handleEndSession}
          progress={progress}
          dailyBaselineSeconds={session.dailyBaselineSeconds}
          permissionEnabled={canUseTimer}
          hidden={isShowingAnyCelebration}
        />

        {/* Desktop Progress */}
        <div className="hidden md:block bg-card p-6 rounded-lg border border-border mb-6">
          <h3 className="font-semibold text-foreground mb-4">Progresso</h3>
          <Progress value={progressPercentage} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            {shots.filter(s => s.isCompleted).length} de {shots.length} takes concluídos ({progressPercentage}%)
          </p>
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:block bg-card p-4 rounded-lg border border-border mb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Locação:</label>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueLocations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={showOnlyIncomplete}
                onCheckedChange={setShowOnlyIncomplete}
                id="incomplete-only"
              />
              <label htmlFor="incomplete-only" className="text-sm font-medium text-foreground">
                Apenas não gravados
              </label>
            </div>
          </div>
        </div>

        {/* Shot List Table */}
        {filteredShots.length > 0 ? (
          <ShotListTable
            shots={filteredShots}
            resolvedUrls={resolvedUrls}
            onUpdate={updateShot}
            onRemove={removeShot}
            onImageUpload={handleImageUpload}
            onSplitAtCursor={splitShotAtCursor}
            onDragEnd={handleDragEnd}
            showCheckbox={true}
            mode="record"
            availableLocations={uniqueLocations}
            onImageClick={(shotId) => setGalleryOpenShotId(shotId)}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum take para mostrar com os filtros selecionados.</p>
          </div>
        )}

        {/* Image Gallery Modal */}
        <ImageGalleryModal
          shots={shots}
          resolvedUrls={resolvedUrls}
          currentShotId={galleryOpenShotId}
          onClose={() => setGalleryOpenShotId(null)}
        />
      </div>

      {/* Auto-hide Navigation */}
      <AutoHideNav />

      {/* Celebration Components */}
      <SessionSummary
        show={celebrationData.showSessionSummary}
        duration={celebrationData.sessionSummary?.duration || 0}
        xpGained={celebrationData.sessionSummary?.xpGained || 0}
        stage={celebrationData.sessionSummary?.stage || 'record'}
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
    </div>
  );
};

export default ShotListRecord;
