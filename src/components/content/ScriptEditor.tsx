import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor, htmlToText, textToHtml } from "@/components/ui/rich-text-editor";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Calendar as CalendarIcon,
  FileText,
  Link as LinkIcon,
  ListChecks,
  Tag,
  X,
  ArrowLeft,
  Check,
  ArrowRight,
  Copy,
  StickyNote,
  ChevronRight
} from "lucide-react";
import { cn } from '@/core/utils';
import { supabase } from "@/integrations/supabase/client";
import { sanitizeContentSections } from '@/core/utils';
import { useToast } from '@/core/hooks';
import { useNavigate } from "react-router-dom";
import { useNavigationBlocker } from '@/core/hooks';
import { useSessionContext } from '@/core/contexts';
import { useSession } from '@/core/hooks';
import { useWorkspaceContext } from '@/core/contexts';
import { useProfileContext } from '@/core/contexts';
import { useCelebration } from '@/core/contexts';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ThumbnailUploader } from "@/components/content";
import { generateShotListFromContent } from '@/core/utils';
import { FEATURES } from '@/core/constants';
import { MasterScriptEditor } from "@/components/content";
import { useWorkflowTemplate, getNextStageUrl } from '@/core/hooks';
import { WorkflowTemplateId, getStageLabel, DEFAULT_SECTIONS, CAROUSEL_SECTIONS, ContentSection } from '@/core/constants';
import { ROUTES } from "@/routes/routes";


interface ScriptEditorProps {
  onClose?: () => void;
  scriptId?: string;
  isReviewMode?: boolean;
}

export const ScriptEditor = ({ onClose, scriptId, isReviewMode = false }: ScriptEditorProps) => {
  // Estado local para rastrear o ID após a primeira criação (corrige duplicação no auto-save)
  const [createdScriptId, setCreatedScriptId] = useState<string | null>(null);
  const effectiveScriptId = scriptId || createdScriptId;
  const { toast } = useToast();
  const navigate = useNavigate();
  const { timer, setMuzzeSession } = useSessionContext();
  const { saveCurrentStageTime, endSession } = useSession();
  const { activeWorkspace } = useWorkspaceContext();
  const { profile } = useProfileContext();
  const { triggerFullCelebration } = useCelebration();
  const [title, setTitle] = useState("Novo Roteiro");
  const [content, setContent] = useState<Record<string, string>>({});
  const [originalContent, setOriginalContent] = useState<Record<string, string>>({});
  const [references, setReferences] = useState<string[]>([]);
  const [newReference, setNewReference] = useState("");
  const [contentType, setContentType] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [reviewedSections, setReviewedSections] = useState<Record<string, boolean>>({});

  // Dynamic Sections config
  const isCarousel = contentType === "Carrossel";
  const currentSectionsConfig = useMemo(() => {
    return isCarousel ? CAROUSEL_SECTIONS : DEFAULT_SECTIONS;
  }, [isCarousel]);

  // Track removed sections to hide them
  const [removedSectionKeys, setRemovedSectionKeys] = useState<string[]>([]);

  const activeSectionsConfig = useMemo(() => {
    return currentSectionsConfig.filter(s => !removedSectionKeys.includes(s.key));
  }, [currentSectionsConfig, removedSectionKeys]);

  const handleRemoveSection = useCallback((key: string) => {
    setRemovedSectionKeys(prev => [...prev, key]);
    setContent(prev => {
      const newContent = { ...prev };
      delete newContent[key];
      return newContent;
    });
  }, []);
  const [showComparison, setShowComparison] = useState(false);
  const [hasLoadedOriginal, setHasLoadedOriginal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'sections' | 'full-text'>('sections');
  const [showScheduleAlert, setShowScheduleAlert] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [showEndSessionConfirmation, setShowEndSessionConfirmation] = useState(false);
  const [hasShotList, setHasShotList] = useState(false);

  // Workflow template state
  const [scriptWorkflow, setScriptWorkflow] = useState<WorkflowTemplateId | null>(null);
  const { nextStage, currentTemplate, isStageIncluded } = useWorkflowTemplate({ scriptWorkflow });

  // Memoizar callback para evitar recriações desnecessárias
  const handleNavigationBlocked = useCallback(() => {
    // Mostrar o mesmo modal de confirmação que o botão "Voltar" mostra
    if (!publishDate && effectiveScriptId) {
      setShowScheduleAlert(true);
    } else {
      setShowEndSessionConfirmation(true);
    }
  }, [publishDate, effectiveScriptId]);

  // Interceptar navegação via swipe/browser back quando há sessão ativa
  const blocker = useNavigationBlocker({
    onNavigationBlocked: handleNavigationBlocked,
    shouldBlock: true,
  });

  // Refs for auto-resize textareas (kept for readonly Textareas)
  const ganchoRef = useRef<HTMLTextAreaElement>(null);
  const setupRef = useRef<HTMLTextAreaElement>(null);
  const desenvolvimentoRef = useRef<HTMLTextAreaElement>(null);
  const conclusaoRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize function (for readonly Textareas only)
  const autoResize = (element: HTMLTextAreaElement | null) => {
    if (element) {
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    }
  };

  // Convert content to plain text for copying
  const getPlainText = (html: string) => htmlToText(html);

  useEffect(() => {
    if (effectiveScriptId) {
      loadScript();
    }
  }, [effectiveScriptId, isReviewMode]);

  // Auto-save effect
  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Set up auto-save every 5 seconds (reduced from 30s for more frequent saves)
    autoSaveTimer.current = setTimeout(() => {
      handleAutoSave();
    }, 5000);

    // Cleanup - only clear timer, DON'T call handleAutoSave (state may be stale)
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [title, content, references, contentType, publishDate, thumbnailUrl, notes]);

  const loadScript = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', effectiveScriptId)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);

        let loadedContent;
        try {
          loadedContent = typeof data.content === 'string'
            ? JSON.parse(data.content)
            : data.content;

          loadedContent = sanitizeContentSections(loadedContent || {});

          // Identify removed sections if any AND filter out legacy keys
          const loadedKeys = Object.keys(loadedContent);
          const currentType = data.content_type || "";
          const expectedConfig = currentType === "Carrossel" ? CAROUSEL_SECTIONS : DEFAULT_SECTIONS;
          const expectedKeys = expectedConfig.map(s => s.key);

          // Remove chaves do banco que não fazem mais parte da configuração (ex: de 7 para 4 seções)
          const validContent: Record<string, string> = {};
          expectedKeys.forEach(k => {
            if (loadedContent[k] !== undefined) {
              validContent[k] = loadedContent[k];
            } else {
              validContent[k] = '';
            }
          });
          loadedContent = validContent;

          if (loadedKeys.length > 0) {
            // Só detecta seções removidas MANUALMENTE pelo usuário (que estão no expectedKeys mas faltam no loadedKeys)
            const hasAnyExpectedKey = expectedConfig.some(s => loadedKeys.includes(s.key));
            if (hasAnyExpectedKey) {
              const missingKeys = expectedConfig
                .filter(s => !loadedKeys.includes(s.key))
                .map(s => s.key);
              setRemovedSectionKeys(missingKeys);
            } else {
              // Conteúdo salvo em formato diferente — começa com todas as seções ativas
              setRemovedSectionKeys([]);
            }
          }
        } catch {
          loadedContent = {};
        }

        setContent(loadedContent);

        // Load original content for comparison in review mode
        if (isReviewMode && !hasLoadedOriginal) {
          let originalLoadedContent;
          try {
            // Try to load from original_content column first
            if (data.original_content) {
              originalLoadedContent = typeof data.original_content === 'string'
                ? JSON.parse(data.original_content)
                : data.original_content;
            } else {
              // Fallback to current content if no original_content saved yet
              originalLoadedContent = loadedContent;
            }

            // Ensure all sections exist and sanitize
            originalLoadedContent = sanitizeContentSections(originalLoadedContent || {});
          } catch {
            originalLoadedContent = {};
          }

          setOriginalContent(originalLoadedContent);
          setHasLoadedOriginal(true);
        }

        // Auto-resize textareas after content loads
        setTimeout(() => {
          autoResize(ganchoRef.current);
          autoResize(setupRef.current);
          autoResize(desenvolvimentoRef.current);
          autoResize(conclusaoRef.current);
        }, 0);

        // Load references - prefer reference_links array, but fallback to reference_url from Ideas stage
        const savedReferences = data.reference_links || [];
        if (!savedReferences.length && data.reference_url) {
          // If no reference_links but has reference_url (from IdeaForm), convert to array
          savedReferences.push(data.reference_url);
        }
        setReferences(savedReferences);
        setContentType(data.content_type || "");
        setPublishDate(data.publish_date || "");
        setThumbnailUrl(data.thumbnail_url || null);

        // Load notes - pre-fill with central_idea if notes is empty
        const loadedNotes = data.notes;
        if (!loadedNotes && data.central_idea) {
          setNotes(data.central_idea);
        } else {
          setNotes(loadedNotes || "");
        }

        // Check if shot_list exists
        setHasShotList(data.shot_list && Array.isArray(data.shot_list) && data.shot_list.length > 0);

        // Load workflow template for dynamic navigation
        // Se content_type é 'Carrossel', forçar o template carousel independente do workflow_template salvo
        const effectiveWorkflow = data.content_type === 'Carrossel'
          ? 'carousel'
          : (data.workflow_template as WorkflowTemplateId | null);
        setScriptWorkflow(effectiveWorkflow);

        setIsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading script:', error);
      toast({
        title: "Erro ao carregar roteiro",
        description: "Não foi possível carregar o roteiro.",
        variant: "destructive",
      });
    }
  };

  const handleAutoSave = async () => {
    // PROTEÇÃO: Não salvar se os dados ainda não foram carregados (evita sobrescrever com defaults)
    if (!isLoaded && effectiveScriptId) {
      console.log('[DEBUG - ScriptEditor] ⚠️ Auto-save bloqueado: dados ainda não carregados');
      return;
    }

    console.log('[DEBUG - ScriptEditor] Auto-save iniciado', {
      effectiveScriptId,
      hasContent: Object.values(content).some(val => typeof val === 'string' && val.trim() !== ''),
      contentKeys: Object.keys(content),
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[DEBUG - ScriptEditor] No user found, skipping save');
        return;
      }

      // Sanitize content before saving to remove empty/residual anchor tags
      const sanitizedContent = sanitizeContentSections(content);

      const scriptData: any = {
        user_id: user.id,
        title,
        content: JSON.stringify(sanitizedContent),
        reference_links: references.filter(ref => ref.trim() !== ""),
        content_type: contentType,
        publish_date: publishDate || null,
        thumbnail_url: thumbnailUrl,
        workspace_id: activeWorkspace?.id,
        notes: notes,
      };

      // Atualizar status automaticamente baseado no modo atual
      if (!isReviewMode) {
        // Se está na etapa de roteiro, garantir que status é 'draft'
        scriptData.status = 'draft';
        scriptData.original_content = JSON.stringify(sanitizedContent);
      } else {
        // Se está na etapa de revisão, garantir que status é 'review'
        scriptData.status = 'review';
      }

      // Se é um novo script, salvar o workflow_template atual
      if (!effectiveScriptId) {
        scriptData.workflow_template = profile?.current_workflow || 'classic';
      }

      if (effectiveScriptId) {
        const { error } = await supabase
          .from('scripts')
          .update(scriptData)
          .eq('id', effectiveScriptId);

        if (error) throw error;
        console.log('[DEBUG - ScriptEditor] ✅ Script atualizado com sucesso');
      } else {
        const { data, error } = await supabase
          .from('scripts')
          .insert(scriptData)
          .select()
          .single();

        if (error) throw error;

        console.log('[DEBUG - ScriptEditor] ✅ Novo script criado com sucesso', data?.id);

        // Salvar o ID criado no state local para que o próximo auto-save faça UPDATE
        if (data?.id) {
          setCreatedScriptId(data.id);
          window.history.replaceState({}, '', `/ session ? stage = script & scriptId=${data.id} `);
        }
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('[DEBUG - ScriptEditor] ❌ Erro no auto-save:', error);
    }
  };

  const handleBackClick = () => {
    // Se não tem publish_date e tem scriptId, mostra alerta de agendamento
    if (!publishDate && effectiveScriptId) {
      setShowScheduleAlert(true);
      return;
    }

    // Se há sessão ativa, mostrar popup de confirmação de encerramento
    if (timer.isActive) {
      setShowEndSessionConfirmation(true);
      return;
    }

    // Caso contrário, sai normalmente
    proceedWithBack();
  };

  const handleConfirmEndSession = async () => {
    setShowEndSessionConfirmation(false);

    // Capturar dados ANTES de encerrar
    const capturedDuration = timer.elapsedSeconds || 0;
    const capturedStage = timer.stage || 'script';

    // Salvar tempo da etapa atual
    await saveCurrentStageTime();

    // Encerrar sessão
    const result = await endSession();

    // Preparar dados de celebração
    const sessionSummary = {
      duration: result?.duration || capturedDuration,
      xpGained: result?.xpGained || 0,
      stage: capturedStage,
      autoRedirectDestination: '/calendario',
    };

    const streakCount = result?.shouldShowCelebration && !result?.alreadyCounted
      ? (result?.newStreak || 0)
      : 0;

    // Se havia uma navegação bloqueada (swipe), prosseguir com ela após celebração
    const shouldProceedWithBlocker = blocker.state === "blocked";

    // Disparar celebração global
    await triggerFullCelebration(
      sessionSummary,
      streakCount,
      result?.xpGained || 0,
      () => {
        if (shouldProceedWithBlocker) {
          blocker.proceed?.();
        } else {
          navigate(ROUTES.CALENDARIO);
        }
      }
    );
  };

  const handleCancelEndSession = () => {
    setShowEndSessionConfirmation(false);
    // Se havia uma navegação bloqueada, resetar o bloqueador
    if (blocker.state === "blocked") {
      blocker.reset?.();
    }
  };

  const proceedWithBack = async (shouldAutoSchedule = false) => {
    // Auto-agendar para hoje com status "perdido" se não tiver publish_date
    if (shouldAutoSchedule && !publishDate && effectiveScriptId) {
      const today = format(new Date(), "yyyy-MM-dd");
      await supabase
        .from('scripts')
        .update({
          publish_date: today,
          publish_status: 'perdido'
        })
        .eq('id', effectiveScriptId);
    }

    // Se há sessão ativa, mostrar popup de confirmação de encerramento
    if (timer.isActive) {
      setShowEndSessionConfirmation(true);
      return;
    }

    // Salvar tempo da sessão antes de navegar (caso não haja sessão ativa)
    await saveCurrentStageTime();
    navigate(ROUTES.CALENDARIO);
  };

  const handleScheduleAndBack = async () => {
    if (scheduleDate && effectiveScriptId) {
      const formattedDate = format(scheduleDate, "yyyy-MM-dd");
      await supabase
        .from('scripts')
        .update({
          publish_date: formattedDate,
          publish_status: 'planejado'
        })
        .eq('id', effectiveScriptId);

      // Atualiza state local
      setPublishDate(formattedDate);
    }
    setShowScheduleAlert(false);
    await proceedWithBack(false);
  };

  const handleCancelScheduleAlert = () => {
    setShowScheduleAlert(false);
    // Se havia uma navegação bloqueada, resetar o bloqueador
    if (blocker.state === "blocked") {
      blocker.reset?.();
    }
  };

  const handleNextStage = async () => {
    console.log('[DEBUG - ScriptEditor] handleNextStage called');
    console.log('[DEBUG - ScriptEditor] Current mode:', isReviewMode ? 'review' : 'script');
    console.log('[DEBUG - ScriptEditor] Current scriptId:', effectiveScriptId);

    // Validate that script has content before advancing to review
    if (!isReviewMode) {
      const hasContent = Object.values(content).some(val => typeof val === 'string' && val.trim() !== '');

      if (!hasContent) {
        toast({
          title: "Roteiro vazio",
          description: "Você precisa escrever algo no roteiro antes de avançar para a revisão.",
          variant: "destructive",
        });
        return;
      }
    }

    // Save current changes before advancing
    console.log('[DEBUG - ScriptEditor] Salvando antes de navegar...');
    await handleAutoSave();
    console.log('[DEBUG - ScriptEditor] ✅ Auto-save completed');

    // Salvar tempo da sessão
    await saveCurrentStageTime();
    console.log('[DEBUG - ScriptEditor] ✅ Stage time saved');

    // Add small delay to ensure DB commit completes
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('[DEBUG - ScriptEditor] Delay completado, prosseguindo com navegação');

    // Navigate to next stage based on workflow template
    const currentCreativeStage = isReviewMode ? 'review' : 'script';
    const next = nextStage(currentCreativeStage);

    console.log('[DEBUG - ScriptEditor] Current stage:', currentCreativeStage);
    console.log('[DEBUG - ScriptEditor] Next stage from workflow:', next);

    // Check if all sections are reviewed when in review mode
    if (isReviewMode) {
      const allReviewed = Object.values(reviewedSections).every(v => v);
      console.log('[DEBUG - ScriptEditor] All sections reviewed:', allReviewed);
      if (!allReviewed) {
        toast({
          title: "Atenção",
          description: "Você ainda não marcou todas as seções como revisadas. Deseja continuar mesmo assim?",
        });
      }
    }

    // Preserve scriptId in the URL
    const params = new URLSearchParams(window.location.search);
    const currentScriptId = effectiveScriptId || params.get('scriptId');

    if (!currentScriptId) {
      toast({
        title: "Erro ao avançar",
        description: "Não foi possível identificar o roteiro. Tente salvar novamente.",
        variant: "destructive",
      });
      return;
    }

    if (!next) {
      // Último estágio - não deveria acontecer, mas tratamos
      toast({
        title: "Fluxo concluído",
        description: "Você já está na última etapa do workflow.",
      });
      return;
    }

    // Update status in database based on next stage
    await supabase
      .from('scripts')
      .update({ status: next })
      .eq('id', currentScriptId);

    // Get dynamic URL based on workflow
    const url = getNextStageUrl(currentCreativeStage, currentTemplate, currentScriptId);

    if (!url) {
      toast({
        title: "Erro ao avançar",
        description: "Não foi possível determinar o próximo estágio.",
        variant: "destructive",
      });
      return;
    }

    console.log('[DEBUG - ScriptEditor] Navegando para:', url);
    navigate(url);

    const nextLabel = getStageLabel(next);
    toast({
      title: `Avançando para ${nextLabel} `,
      description: `Seu roteiro foi salvo.${next === 'recording' ? 'Prepare-se para gravar!' : next === 'review' ? 'Hora de revisar!' : 'Próxima etapa!'} `,
    });
  };

  const toggleSectionReview = (section: string) => {
    setReviewedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddReference = () => {
    if (newReference.trim() !== "") {
      setReferences([...references, newReference.trim()]);
      setNewReference("");
    }
  };

  const handleReferenceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddReference();
    }
  };

  const copyToClipboard = async (text: string, sectionName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Texto copiado!",
        description: `${sectionName} copiado para a área de transferência.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  const getFullText = (contentObj: Record<string, string>) => {
    return activeSectionsConfig
      .map(config => htmlToText(contentObj[config.key] || ''))
      .filter(Boolean)
      .join('\n\n');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-28 sm:pb-32 scroll-pb-28 sm:scroll-pb-32">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header with action buttons - com safe-area para Dynamic Island */}
        <div
          className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="gap-2 self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3 justify-between md:justify-end">
            {lastSaved && (
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <Check className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                Salvo {new Date(lastSaved).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full h-8 w-8 md:h-10 md:w-10"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Thumbnail (YouTube only) */}
        {contentType === "YouTube" && (
          <ThumbnailUploader
            thumbnailUrl={thumbnailUrl}
            onThumbnailChange={setThumbnailUrl}
            scriptId={effectiveScriptId}
          />
        )}

        {/* Title */}
        <div id="script-title" className="mb-4 md:mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl md:text-4xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            placeholder="Título do Roteiro"
          />
        </div>

        {/* Properties Grid - z-0 to stay below editor */}
        <div className="mb-6 md:mb-8 space-y-3 relative z-0">
          {/* Content Type */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-2 md:min-w-[180px] text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Tipo de Conteúdo</span>
            </div>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-full md:flex-1 border-none bg-transparent focus:ring-0 focus:ring-offset-0 text-foreground">
                <SelectValue placeholder="Selecione o tipo de conteúdo">
                  {contentType && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {contentType}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover z-[100]">
                <SelectItem value="Reels">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Reels
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="YouTube">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      YouTube
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="TikTok">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      TikTok
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="Carrossel">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Carrossel
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Publish Date */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-2 md:min-w-[180px] text-sm text-muted-foreground">
              <CalendarIcon className="w-4 h-4" />
              <span>Data de Publicação</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full md:w-auto justify-start text-left font-normal border-none bg-transparent hover:bg-accent/20",
                    !publishDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {publishDate
                    ? format(new Date(publishDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })
                    : "Selecione uma data"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[200]" align="start">
                <Calendar
                  mode="single"
                  selected={publishDate ? new Date(publishDate + 'T00:00:00') : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setPublishDate(format(date, "yyyy-MM-dd"));
                    }
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* References */}
          <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-2 md:min-w-[180px] text-sm text-muted-foreground md:pt-2">
              <LinkIcon className="w-4 h-4" />
              <span>Referências</span>
            </div>
            <div className="w-full md:flex-1 space-y-2">
              {/* Display confirmed references as clickable buttons */}
              {references.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {references.map((ref, index) => (
                    <div key={index} className="flex items-center gap-1 group/ref">
                      {/* Link clicável - separado do botão de remover */}
                      <a
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 h-8 px-3 border border-input rounded-md text-xs hover:bg-accent/10 transition-colors max-w-[200px]"
                      >
                        <LinkIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{ref}</span>
                      </a>

                      {/* Botão de remover - SEPARADO do link */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover/ref:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReferences(references.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input for new reference */}
              <div className="flex gap-2">
                <Input
                  value={newReference}
                  onChange={(e) => setNewReference(e.target.value)}
                  onKeyDown={handleReferenceKeyDown}
                  placeholder="Colar https://..."
                  className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddReference}
                  disabled={!newReference.trim()}
                  className="h-8 text-xs flex-shrink-0"
                >
                  Link
                </Button>
              </div>
            </div>
          </div>

          {/* Shot List - Only in Review Mode (not for Carousel — goes to Design) */}
          {isReviewMode && !isCarousel && (
            <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
              <div className="flex items-center gap-2 md:min-w-[180px] text-sm text-muted-foreground md:pt-2">
                <ListChecks className="w-4 h-4" />
                <span>Shot List</span>
              </div>
              <div className="w-full md:flex-1">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const params = new URLSearchParams(window.location.search);
                    const currentScriptId = effectiveScriptId || params.get('scriptId');

                    if (!currentScriptId) {
                      toast({
                        title: "Erro",
                        description: "Salve o roteiro antes de abrir a Shot List",
                        variant: "destructive",
                      });
                      return;
                    }

                    if (hasShotList) {
                      // Already has shot list, just navigate
                      navigate(`/ shot - list / review ? scriptId = ${currentScriptId} `);
                    } else {
                      // Generate shot list from content
                      const contentObj = typeof content === 'string' ? JSON.parse(content) : content;
                      const shots = generateShotListFromContent(contentObj);

                      if (shots.length === 0) {
                        toast({
                          title: "Aviso",
                          description: "Nenhum parágrafo encontrado para criar a Shot List",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Save to database
                      const { error } = await supabase
                        .from('scripts')
                        .update({ shot_list: shots as any })
                        .eq('id', currentScriptId);

                      if (error) {
                        toast({
                          title: "Erro",
                          description: "Não foi possível criar a Shot List",
                          variant: "destructive",
                        });
                        return;
                      }

                      toast({
                        title: "Shot List criada!",
                        description: `${shots.length} slots gerados a partir do roteiro`,
                      });

                      navigate(`/ shot - list / review ? scriptId = ${currentScriptId}`);
                    }
                  }}
                  className="gap-2 w-full md:w-auto"
                >
                  <ListChecks className="w-4 h-4" />
                  {hasShotList ? 'Abrir Shot List' : 'Criar Shot List'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Notes - Collapsible */}
        <Collapsible open={notesOpen} onOpenChange={setNotesOpen} className="mb-6">
          <CollapsibleTrigger className="flex items-center gap-2 p-3 rounded-lg hover:bg-accent/10 transition-colors w-full text-left group">
            <StickyNote className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground flex-1">Anotações</span>
            <ChevronRight className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              notesOpen && "rotate-90"
            )} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Pensamentos soltos, lembretes, instruções de thumbnail..."
              className="min-h-[120px] text-sm resize-none border-border/40 bg-muted/20"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Este espaço é pré-preenchido com sua ideia central e pode ser usado para anotações livres.
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Content Editor - z-10 to stay above properties and isolate stacking */}
        <div id="script-editor" className="space-y-4 relative z-10 isolation-isolate">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="border-l-4 border-primary/30 pl-4">
              <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                {isReviewMode ? '👁️ REVISÃO' : '📝 ROTEIRO'}
              </h3>
            </div>

            {/* Desktop: Button inline */}
            <Button
              id={isReviewMode ? 'review-advance' : 'script-advance'}
              onClick={handleNextStage}
              className="hidden md:flex gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              size="lg"
            >
              {isReviewMode
                ? `Avançar para ${nextStage('review') ? getStageLabel(nextStage('review')!) : 'Próxima Etapa'}`
                : 'Avançar para Revisão'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile: Fixed Bottom Button - acima da navbar do iPhone */}
          <div
            className="md:hidden fixed left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-40"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
          >
            <Button
              onClick={handleNextStage}
              className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
              size="lg"
            >
              {isReviewMode
                ? `Avançar para ${nextStage('review') ? getStageLabel(nextStage('review')!) : 'Próxima Etapa'}`
                : 'Avançar para Revisão'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {isCarousel && !isReviewMode && (
            <div className="bg-muted/30 p-3 rounded-lg border border-border/40 mb-4">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica para o Design:</strong> Pressione <strong>Shift+Enter</strong> (ou Shift+Return) para marcar uma quebra de página. Cada trecho vai gerar um slide separado na próxima etapa!
              </p>
            </div>
          )}

          {isReviewMode && (
            <div className="bg-muted/30 p-4 rounded-lg border border-border/40 mb-4">
              <p className="text-sm text-muted-foreground mb-3">
                💡 Dica: Leia seu texto frase por frase em voz alta, finja que já está gravando-o.
                {isCarousel && " Lembre-se: Use Shift+Enter para criar quebras de slide para o Design."}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                  className="gap-2"
                >
                  {showComparison ? 'Ocultar Comparação' : 'Comparar Versões'}
                </Button>

                {showComparison && (
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant={viewMode === 'sections' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('sections')}
                      className="h-8 text-xs"
                    >
                      Por Seções
                    </Button>
                    <Button
                      variant={viewMode === 'full-text' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('full-text')}
                      className="h-8 text-xs"
                    >
                      Texto Corrido
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {showComparison && isReviewMode ? (
            viewMode === 'full-text' ? (
              // Full text mode - continuous text view
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                {/* Original Version - Full Text (Read-only) */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Original
                  </h4>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-base font-semibold text-foreground">
                        📄 Texto Completo
                      </h5>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(getFullText(originalContent), "Texto Completo (Original)")}
                        className="h-8 w-8 hover:bg-accent"
                        title="Copiar texto completo original"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={getFullText(originalContent)}
                      readOnly
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="min-h-[400px] text-sm md:text-base leading-relaxed resize-none border-border/40 bg-muted/20 focus-visible:ring-0"
                    />
                  </div>
                </div>

                {/* Edited Version - Full Text (Read-only for display, edits happen in sections) */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                    Versão Editada
                  </h4>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-base font-semibold text-foreground">
                        📄 Texto Completo
                      </h5>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(getFullText(content), "Texto Completo")}
                        className="h-8 w-8 hover:bg-accent"
                        title="Copiar texto completo editado"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={getFullText(content)}
                      readOnly
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="min-h-[400px] text-sm md:text-base leading-relaxed resize-none border-primary/40 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Para editar, alterne para visualização "Por Seções"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Side-by-side comparison view by sections
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                {/* Original Version (Read-only) */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Original
                  </h4>

                  <div className="space-y-4">
                    {activeSectionsConfig.map(config => (
                      <div key={`original - ${config.key} `}>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                            {config.label}
                          </h5>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(htmlToText(originalContent[config.key] || ''), `${config.label} (Original)`)}
                            className="h-8 w-8 hover:bg-accent"
                            title="Copiar texto original"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={htmlToText(originalContent[config.key] || '')}
                          readOnly
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="min-h-[100px] md:min-h-[120px] text-sm md:text-base leading-relaxed resize-none border-border/40 bg-muted/20 focus-visible:ring-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edited Version (Editable) */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                    Versão Editada
                  </h4>

                  <div className="space-y-4">
                    {activeSectionsConfig.map(config => (
                      <div key={`edited - ${config.key} `}>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                            {config.label}
                          </h5>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(getPlainText(content[config.key] || ''), config.label)}
                              className="h-8 w-8 hover:bg-accent"
                              title="Copiar texto editado"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <input
                              type="checkbox"
                              id={`${config.key} -check`}
                              checked={reviewedSections[config.key] || false}
                              onChange={() => toggleSectionReview(config.key)}
                              className="w-4 h-4 rounded border-border cursor-pointer"
                            />
                          </div>
                        </div>
                        <RichTextEditor
                          content={content[config.key] || ''}
                          onChange={(html) => setContent({ ...content, [config.key]: html })}
                          className="border-primary/40 bg-background"
                          minHeight="60px"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : FEATURES.MASTER_EDITOR ? (
            // Master Editor: Single unified editor with section headers
            <MasterScriptEditor
              key={effectiveScriptId || 'new-script'}
              content={content}
              onChange={setContent}
              isLoaded={isLoaded}
              editable={!isReviewMode || viewMode === 'sections'}
              className="min-h-[400px]"
              sectionConfig={activeSectionsConfig}
              removableSections={isCarousel}
              onRemoveSection={handleRemoveSection}
            />
          ) : (
            // Legacy: 4 separate editors (default when feature flag is off)
            <div className="space-y-4">
              {activeSectionsConfig.map(config => (
                <div key={`legacy - ${config.key} `}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                      {config.label}
                    </h5>
                    <div className="flex items-center gap-2">
                      {isReviewMode && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(getPlainText(content[config.key] || ''), config.label)}
                            className="h-8 w-8 hover:bg-accent"
                            title="Copiar texto"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <input
                            type="checkbox"
                            id={`${config.key} -check - single`}
                            checked={reviewedSections[config.key] || false}
                            onChange={() => toggleSectionReview(config.key)}
                            className="w-4 h-4 rounded border-border cursor-pointer"
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <RichTextEditor
                    content={content[config.key] || ''}
                    onChange={(html) => setContent({ ...content, [config.key]: html })}
                    placeholder={`Escreva o ${config.label.toLowerCase()}...`}
                    className="border-none focus-within:ring-0 bg-transparent"
                    minHeight="60px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alert Dialog para agendar antes de sair */}
      <AlertDialog open={showScheduleAlert} onOpenChange={(open) => {
        if (!open) handleCancelScheduleAlert();
        else setShowScheduleAlert(true);
      }}>
        <AlertDialogContent className="z-[150]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Agendar Publicação?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Este conteúdo não tem data de publicação. Sem uma data, ele pode ser difícil de encontrar depois.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !scheduleDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduleDate ? format(scheduleDate, "PPP", { locale: ptBR }) : "Escolha uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[200]" align="start">
                <Calendar
                  mode="single"
                  selected={scheduleDate}
                  onSelect={setScheduleDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => {
                setShowScheduleAlert(false);
                proceedWithBack(true);
              }}
              className="text-muted-foreground"
            >
              Continuar Sem Agendar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleScheduleAndBack}
              disabled={!scheduleDate}
              className="bg-primary hover:bg-primary/90"
            >
              Agendar e Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog para confirmar encerramento de sessão ativa */}
      <AlertDialog open={showEndSessionConfirmation} onOpenChange={(open) => {
        if (!open) handleCancelEndSession();
        else setShowEndSessionConfirmation(true);
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
