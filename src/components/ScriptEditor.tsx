import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar,
  FileText,
  Link as LinkIcon,
  ListChecks,
  Tag,
  X,
  ArrowLeft,
  Check,
  ArrowRight,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSessionContext } from "@/contexts/SessionContext";

interface ScriptEditorProps {
  onClose?: () => void;
  scriptId?: string;
  isReviewMode?: boolean;
}

export const ScriptEditor = ({ onClose, scriptId, isReviewMode = false }: ScriptEditorProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setMuzzeSession } = useSessionContext();
  const [title, setTitle] = useState("Novo Roteiro");
  const [content, setContent] = useState({
    gancho: "",
    setup: "",
    desenvolvimento: "",
    conclusao: ""
  });
  const [originalContent, setOriginalContent] = useState({
    gancho: "",
    setup: "",
    desenvolvimento: "",
    conclusao: ""
  });
  const [references, setReferences] = useState<string[]>([]);
  const [newReference, setNewReference] = useState("");
  const [contentType, setContentType] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [reviewedSections, setReviewedSections] = useState<{[key: string]: boolean}>({
    gancho: false,
    setup: false,
    desenvolvimento: false,
    conclusao: false,
  });
  const [showComparison, setShowComparison] = useState(false);
  const [hasLoadedOriginal, setHasLoadedOriginal] = useState(false);
  const [viewMode, setViewMode] = useState<'sections' | 'full-text'>('sections');

  // Refs for auto-resize textareas
  const ganchoRef = useRef<HTMLTextAreaElement>(null);
  const setupRef = useRef<HTMLTextAreaElement>(null);
  const desenvolvimentoRef = useRef<HTMLTextAreaElement>(null);
  const conclusaoRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize function
  const autoResize = (element: HTMLTextAreaElement | null) => {
    if (element) {
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    if (scriptId) {
      loadScript();
    }
  }, [scriptId, isReviewMode]);

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
  }, [title, content, references, contentType, publishDate]);

  const loadScript = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        
        let loadedContent;
        try {
          loadedContent = typeof data.content === 'string' 
            ? JSON.parse(data.content)
            : data.content;
          
          // Ensure all sections exist
          loadedContent = {
            gancho: loadedContent?.gancho || "",
            setup: loadedContent?.setup || "",
            desenvolvimento: loadedContent?.desenvolvimento || "",
            conclusao: loadedContent?.conclusao || ""
          };
        } catch {
          loadedContent = { gancho: "", setup: "", desenvolvimento: "", conclusao: "" };
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
            
            // Ensure all sections exist
            originalLoadedContent = {
              gancho: originalLoadedContent?.gancho || "",
              setup: originalLoadedContent?.setup || "",
              desenvolvimento: originalLoadedContent?.desenvolvimento || "",
              conclusao: originalLoadedContent?.conclusao || ""
            };
          } catch {
            originalLoadedContent = { gancho: "", setup: "", desenvolvimento: "", conclusao: "" };
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
    console.log('[DEBUG - ScriptEditor] Auto-save iniciado', {
      scriptId,
      hasContent: !!(content.gancho || content.setup || content.desenvolvimento || content.conclusao),
      contentPreview: {
        gancho: content.gancho?.substring(0, 50),
        setup: content.setup?.substring(0, 50),
        desenvolvimento: content.desenvolvimento?.substring(0, 50),
        conclusao: content.conclusao?.substring(0, 50),
      }
    });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[DEBUG - ScriptEditor] No user found, skipping save');
        return;
      }

      const scriptData: any = {
        user_id: user.id,
        title,
        content: JSON.stringify(content),
        reference_links: references.filter(ref => ref.trim() !== ""),
        content_type: contentType,
        publish_date: publishDate || null,
      };

      // Save original_content only when NOT in review mode (preserve original during review)
      if (!isReviewMode) {
        scriptData.original_content = JSON.stringify(content);
      }

      if (scriptId) {
        const { error } = await supabase
          .from('scripts')
          .update(scriptData)
          .eq('id', scriptId);

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
        
        // Update URL with new script ID without reloading
        if (data?.id) {
          window.history.replaceState({}, '', `/session?stage=script&scriptId=${data.id}`);
        }
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('[DEBUG - ScriptEditor] ❌ Erro no auto-save:', error);
    }
  };

  const handleBack = () => {
    navigate('/calendario');
  };

  const handleNextStage = async () => {
    console.log('[DEBUG - ScriptEditor] handleNextStage called');
    console.log('[DEBUG - ScriptEditor] Current mode:', isReviewMode ? 'review' : 'script');
    console.log('[DEBUG - ScriptEditor] Current scriptId:', scriptId);
    
    // Validate that script has content before advancing to review
    if (!isReviewMode) {
      const hasContent = content.gancho.trim() || 
                        content.setup.trim() || 
                        content.desenvolvimento.trim() || 
                        content.conclusao.trim();
      
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
    
    // Add small delay to ensure DB commit completes
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('[DEBUG - ScriptEditor] Delay completado, prosseguindo com navegação');
    
    // Navigate to next stage based on current mode
    const nextStage = isReviewMode ? 'record' : 'review';
    const nextLabel = isReviewMode ? 'Gravação' : 'Revisão';
    
    console.log('[DEBUG - ScriptEditor] Next stage:', nextStage);
    
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
    const currentScriptId = scriptId || params.get('scriptId');
    
    if (!currentScriptId) {
      toast({
        title: "Erro ao avançar",
        description: "Não foi possível identificar o roteiro. Tente salvar novamente.",
        variant: "destructive",
      });
      return;
    }
    
    const url = `/session?stage=${nextStage}&scriptId=${currentScriptId}`;
    
    console.log('[DEBUG - ScriptEditor] Navegando para:', url);
    navigate(url);
    
    toast({
      title: `Avançando para ${nextLabel}`,
      description: `Seu roteiro foi salvo. ${isReviewMode ? 'Prepare-se para gravar!' : 'Hora de revisar!'}`,
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

  const getFullText = (contentObj: typeof content) => {
    return [
      contentObj.gancho,
      contentObj.setup,
      contentObj.desenvolvimento,
      contentObj.conclusao
    ].filter(Boolean).join('\n\n');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header with action buttons */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
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

        {/* Title */}
        <div className="mb-4 md:mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl md:text-4xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            placeholder="Título do Roteiro"
          />
        </div>

        {/* Properties Grid */}
        <div className="mb-6 md:mb-8 space-y-3">
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
                <SelectItem value="X (Twitter)">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      X (Twitter)
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Publish Date */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-2 md:min-w-[180px] text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Data de Publicação</span>
            </div>
            <Input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full md:flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
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
                    <div key={index} className="flex items-center gap-1 group/ref max-w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 pr-1 max-w-full"
                        asChild
                      >
                        <a href={ref} target="_blank" rel="noopener noreferrer" className="truncate">
                          <LinkIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="max-w-[150px] md:max-w-[200px] truncate text-xs">
                            {ref}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1 flex-shrink-0 opacity-0 group-hover/ref:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              setReferences(references.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </a>
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

          {/* Shot List - Only in Review Mode */}
          {isReviewMode && (
            <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
              <div className="flex items-center gap-2 md:min-w-[180px] text-sm text-muted-foreground md:pt-2">
                <ListChecks className="w-4 h-4" />
                <span>Shot List</span>
              </div>
              <div className="w-full md:flex-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    const currentScriptId = scriptId || params.get('scriptId');
                    
                    if (!currentScriptId) {
                      toast({
                        title: "Erro",
                        description: "Salve o roteiro antes de abrir a Shot List",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    navigate(`/shot-list/review?scriptId=${currentScriptId}`);
                  }}
                  className="gap-2 w-full md:w-auto"
                >
                  <ListChecks className="w-4 h-4" />
                  Abrir Shot List
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Content Editor */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="border-l-4 border-primary/30 pl-4">
              <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                {isReviewMode ? '👁️ REVISÃO' : '📝 ROTEIRO'}
              </h3>
            </div>
            
            {/* Desktop: Button inline */}
            <Button
              onClick={handleNextStage}
              className="hidden md:flex gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              size="lg"
            >
              {isReviewMode ? 'Avançar para Gravação' : 'Avançar para Revisão'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile: Fixed Bottom Button */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-40">
            <Button
              onClick={handleNextStage}
              className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
              size="lg"
            >
              {isReviewMode ? 'Avançar para Gravação' : 'Avançar para Revisão'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {isReviewMode && (
            <div className="bg-muted/30 p-4 rounded-lg border border-border/40 mb-4">
              <p className="text-sm text-muted-foreground mb-3">
                💡 Dica: Leia seu texto frase por frase em voz alta, finja que já está gravando-o.
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Version (Read-only) */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Original
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                          🪝 Gancho
                        </h5>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(originalContent.gancho, "Gancho (Original)")}
                          className="h-8 w-8 hover:bg-accent"
                          title="Copiar texto original"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={originalContent.gancho}
                        readOnly
                        className="min-h-[100px] md:min-h-[120px] text-sm md:text-base leading-relaxed resize-none border-border/40 bg-muted/20 focus-visible:ring-0"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                          🤨 Setup (Contexto)
                        </h5>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(originalContent.setup, "Setup (Original)")}
                          className="h-8 w-8 hover:bg-accent"
                          title="Copiar texto original"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={originalContent.setup}
                        readOnly
                        className="min-h-[100px] md:min-h-[120px] text-sm md:text-base leading-relaxed resize-none border-border/40 bg-muted/20 focus-visible:ring-0"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                          🦅 Desenvolvimento
                        </h5>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(originalContent.desenvolvimento, "Desenvolvimento (Original)")}
                          className="h-8 w-8 hover:bg-accent"
                          title="Copiar texto original"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={originalContent.desenvolvimento}
                        readOnly
                        className="min-h-[100px] md:min-h-[120px] text-sm md:text-base leading-relaxed resize-none border-border/40 bg-muted/20 focus-visible:ring-0"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                          📩 Conclusão (Fecho de Loop)
                        </h5>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(originalContent.conclusao, "Conclusão (Original)")}
                          className="h-8 w-8 hover:bg-accent"
                          title="Copiar texto original"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={originalContent.conclusao}
                        readOnly
                        className="min-h-[100px] md:min-h-[120px] text-sm md:text-base leading-relaxed resize-none border-border/40 bg-muted/20 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Edited Version (Editable) */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                    Versão Editada
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                          🪝 Gancho
                        </h5>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(content.gancho, "Gancho")}
                            className="h-8 w-8 hover:bg-accent"
                            title="Copiar texto editado"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <input
                            type="checkbox"
                            id="gancho-check"
                            checked={reviewedSections.gancho}
                            onChange={() => toggleSectionReview('gancho')}
                            className="w-4 h-4 rounded border-border cursor-pointer"
                          />
                        </div>
                      </div>
                      <Textarea
                        value={content.gancho}
                        onChange={(e) => setContent({...content, gancho: e.target.value})}
                        onInput={(e) => autoResize(e.currentTarget)}
                        className="min-h-[60px] text-sm md:text-base leading-relaxed overflow-hidden border-primary/40 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                          🤨 Setup (Contexto)
                        </h5>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(content.setup, "Setup")}
                            className="h-8 w-8 hover:bg-accent"
                            title="Copiar texto editado"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <input
                            type="checkbox"
                            id="setup-check"
                            checked={reviewedSections.setup}
                            onChange={() => toggleSectionReview('setup')}
                            className="w-4 h-4 rounded border-border cursor-pointer"
                          />
                        </div>
                      </div>
                      <Textarea
                        value={content.setup}
                        onChange={(e) => setContent({...content, setup: e.target.value})}
                        onInput={(e) => autoResize(e.currentTarget)}
                        className="min-h-[60px] text-sm md:text-base leading-relaxed overflow-hidden border-primary/40 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                          🦅 Desenvolvimento
                        </h5>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(content.desenvolvimento, "Desenvolvimento")}
                            className="h-8 w-8 hover:bg-accent"
                            title="Copiar texto editado"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <input
                            type="checkbox"
                            id="desenvolvimento-check"
                            checked={reviewedSections.desenvolvimento}
                            onChange={() => toggleSectionReview('desenvolvimento')}
                            className="w-4 h-4 rounded border-border cursor-pointer"
                          />
                        </div>
                      </div>
                      <Textarea
                        value={content.desenvolvimento}
                        onChange={(e) => setContent({...content, desenvolvimento: e.target.value})}
                        onInput={(e) => autoResize(e.currentTarget)}
                        className="min-h-[60px] text-sm md:text-base leading-relaxed overflow-hidden border-primary/40 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                          📩 Conclusão (Fecho de Loop)
                        </h5>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(content.conclusao, "Conclusão")}
                            className="h-8 w-8 hover:bg-accent"
                            title="Copiar texto editado"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <input
                            type="checkbox"
                            id="conclusao-check"
                            checked={reviewedSections.conclusao}
                            onChange={() => toggleSectionReview('conclusao')}
                            className="w-4 h-4 rounded border-border cursor-pointer"
                          />
                        </div>
                      </div>
                      <Textarea
                        value={content.conclusao}
                        onChange={(e) => setContent({...content, conclusao: e.target.value})}
                        onInput={(e) => autoResize(e.currentTarget)}
                        className="min-h-[60px] text-sm md:text-base leading-relaxed overflow-hidden border-primary/40 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            // Single editor view (default for both script and review mode)
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                    🪝 Gancho
                  </h5>
                  <div className="flex items-center gap-2">
                    {isReviewMode && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(content.gancho, "Gancho")}
                          className="h-8 w-8 hover:bg-accent"
                          title="Copiar texto"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <input
                          type="checkbox"
                          id="gancho-check-single"
                          checked={reviewedSections.gancho}
                          onChange={() => toggleSectionReview('gancho')}
                          className="w-4 h-4 rounded border-border cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>
                <Textarea
                  ref={ganchoRef}
                  value={content.gancho}
                  onChange={(e) => setContent({...content, gancho: e.target.value})}
                  onInput={(e) => autoResize(e.currentTarget)}
                  placeholder="Escreva o gancho inicial..."
                  className="min-h-[60px] text-sm md:text-base leading-relaxed overflow-hidden border-none focus-visible:ring-0 bg-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                    🤨 Setup (Contexto)
                  </h5>
                  <div className="flex items-center gap-2">
                    {isReviewMode && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(content.setup, "Setup")}
                          className="h-8 w-8 hover:bg-accent"
                          title="Copiar texto"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <input
                          type="checkbox"
                          id="setup-check-single"
                          checked={reviewedSections.setup}
                          onChange={() => toggleSectionReview('setup')}
                          className="w-4 h-4 rounded border-border cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>
                <Textarea
                  ref={setupRef}
                  value={content.setup}
                  onChange={(e) => setContent({...content, setup: e.target.value})}
                  onInput={(e) => autoResize(e.currentTarget)}
                  placeholder="Forneça o contexto necessário..."
                  className="min-h-[60px] text-sm md:text-base leading-relaxed overflow-hidden border-none focus-visible:ring-0 bg-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                    🦅 Desenvolvimento
                  </h5>
                  <div className="flex items-center gap-2">
                    {isReviewMode && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(content.desenvolvimento, "Desenvolvimento")}
                          className="h-8 w-8 hover:bg-accent"
                          title="Copiar texto"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <input
                          type="checkbox"
                          id="desenvolvimento-check-single"
                          checked={reviewedSections.desenvolvimento}
                          onChange={() => toggleSectionReview('desenvolvimento')}
                          className="w-4 h-4 rounded border-border cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>
                <Textarea
                  ref={desenvolvimentoRef}
                  value={content.desenvolvimento}
                  onChange={(e) => setContent({...content, desenvolvimento: e.target.value})}
                  onInput={(e) => autoResize(e.currentTarget)}
                  placeholder="Desenvolva o conteúdo principal..."
                  className="min-h-[60px] text-sm md:text-base leading-relaxed overflow-hidden border-none focus-visible:ring-0 bg-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                    📩 Conclusão (Fecho de Loop)
                  </h5>
                  <div className="flex items-center gap-2">
                    {isReviewMode && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(content.conclusao, "Conclusão")}
                          className="h-8 w-8 hover:bg-accent"
                          title="Copiar texto"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <input
                          type="checkbox"
                          id="conclusao-check-single"
                          checked={reviewedSections.conclusao}
                          onChange={() => toggleSectionReview('conclusao')}
                          className="w-4 h-4 rounded border-border cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>
                <Textarea
                  ref={conclusaoRef}
                  value={content.conclusao}
                  onChange={(e) => setContent({...content, conclusao: e.target.value})}
                  onInput={(e) => autoResize(e.currentTarget)}
                  placeholder="Conclua e feche o loop..."
                  className="min-h-[60px] text-sm md:text-base leading-relaxed overflow-hidden border-none focus-visible:ring-0 bg-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
