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
  ArrowRight
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

  useEffect(() => {
    if (scriptId) {
      loadScript();
    }
  }, [scriptId]);

  // Auto-save effect
  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Set up auto-save every 30 seconds
    autoSaveTimer.current = setTimeout(() => {
      handleAutoSave();
    }, 30000);

    // Cleanup on unmount
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
        
        // Store original content when entering review mode
        if (isReviewMode) {
          setOriginalContent(loadedContent);
        }
        setReferences(data.reference_links || []);
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const scriptData = {
        user_id: user.id,
        title,
        content: JSON.stringify(content),
        reference_links: references.filter(ref => ref.trim() !== ""),
        content_type: contentType,
        publish_date: publishDate || null,
      };

      if (scriptId) {
        const { error } = await supabase
          .from('scripts')
          .update(scriptData)
          .eq('id', scriptId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('scripts')
          .insert(scriptData)
          .select()
          .single();

        if (error) throw error;
        
        // Update URL with new script ID without reloading
        if (data?.id) {
          window.history.replaceState({}, '', `/session?stage=script&scriptId=${data.id}`);
        }
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error auto-saving script:', error);
    }
  };

  const handleBack = () => {
    navigate('/calendario');
  };

  const handleNextStage = async () => {
    console.log('[ScriptEditor] handleNextStage called');
    console.log('[ScriptEditor] Current mode:', isReviewMode ? 'review' : 'script');
    console.log('[ScriptEditor] Current scriptId:', scriptId);
    
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
    await handleAutoSave();
    console.log('[ScriptEditor] Auto-save completed');
    
    // Navigate to next stage based on current mode
    const nextStage = isReviewMode ? 'record' : 'review';
    const nextLabel = isReviewMode ? 'Gravação' : 'Revisão';
    
    console.log('[ScriptEditor] Next stage:', nextStage);
    
    // Check if all sections are reviewed when in review mode
    if (isReviewMode) {
      const allReviewed = Object.values(reviewedSections).every(v => v);
      console.log('[ScriptEditor] All sections reviewed:', allReviewed);
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
    const url = currentScriptId 
      ? `/session?stage=${nextStage}&scriptId=${currentScriptId}`
      : `/session?stage=${nextStage}`;
    
    console.log('[ScriptEditor] Navigating to:', url);
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with action buttons */}
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                Salvo {new Date(lastSaved).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {onClose && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-4xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            placeholder="Título do Roteiro"
          />
        </div>

        {/* Properties Grid */}
        <div className="mb-8 space-y-3">
          {/* Content Type */}
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-2 min-w-[180px] text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Tipo de Conteúdo</span>
            </div>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="flex-1 border-none bg-transparent focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Selecione o tipo de conteúdo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Reels">Reels</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="X (Twitter)">X (Twitter)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Publish Date */}
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-2 min-w-[180px] text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Data de Publicação</span>
            </div>
            <Input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* References */}
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-2 min-w-[180px] text-sm text-muted-foreground pt-2">
              <LinkIcon className="w-4 h-4" />
              <span>Referências</span>
            </div>
            <div className="flex-1 space-y-2">
              {/* Display confirmed references as clickable buttons */}
              {references.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {references.map((ref, index) => (
                    <div key={index} className="flex items-center gap-1 group/ref">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 pr-1"
                        asChild
                      >
                        <a href={ref} target="_blank" rel="noopener noreferrer">
                          <LinkIcon className="w-3 h-3" />
                          <span className="max-w-[200px] truncate text-xs">
                            {ref}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1 opacity-0 group-hover/ref:opacity-100 transition-opacity"
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
                  className="h-8 text-xs"
                >
                  Link
                </Button>
              </div>
            </div>
          </div>

          {/* Shot List - Only in Review Mode */}
          {isReviewMode && (
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
              <div className="flex items-center gap-2 min-w-[180px] text-sm text-muted-foreground pt-2">
                <ListChecks className="w-4 h-4" />
                <span>Shot List</span>
              </div>
              <div className="flex-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    const currentScriptId = scriptId || params.get('scriptId');
                    navigate(`/shot-list?scriptId=${currentScriptId}`);
                  }}
                  className="gap-2"
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
          <div className="flex items-center justify-between mb-4">
            <div className="border-l-4 border-primary/30 pl-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {isReviewMode ? '👁️ REVISÃO' : '📝 ROTEIRO'}
              </h3>
            </div>
            
            <Button
              onClick={handleNextStage}
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="gap-2"
              >
                {showComparison ? 'Ocultar Comparação' : 'Comparar Versões'}
              </Button>
            </div>
          )}

          {showComparison && isReviewMode ? (
            // Side-by-side comparison view
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original Version (Read-only) */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Original
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                      🪝 Gancho
                    </h5>
                    <Textarea
                      value={originalContent.gancho}
                      readOnly
                      className="min-h-[100px] text-base leading-relaxed resize-none border-border/40 bg-muted/20 focus-visible:ring-0"
                    />
                  </div>

                  <div>
                    <h5 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                      🤨 Setup (Contexto)
                    </h5>
                    <Textarea
                      value={originalContent.setup}
                      readOnly
                      className="min-h-[100px] text-base leading-relaxed resize-none border-border/40 bg-muted/20 focus-visible:ring-0"
                    />
                  </div>

                  <div>
                    <h5 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                      🦅 Desenvolvimento
                    </h5>
                    <Textarea
                      value={originalContent.desenvolvimento}
                      readOnly
                      className="min-h-[100px] text-base leading-relaxed resize-none border-border/40 bg-muted/20 focus-visible:ring-0"
                    />
                  </div>

                  <div>
                    <h5 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                      📩 Conclusão (Fecho de Loop)
                    </h5>
                    <Textarea
                      value={originalContent.conclusao}
                      readOnly
                      className="min-h-[100px] text-base leading-relaxed resize-none border-border/40 bg-muted/20 focus-visible:ring-0"
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
                      <input
                        type="checkbox"
                        id="gancho-check"
                        checked={reviewedSections.gancho}
                        onChange={() => toggleSectionReview('gancho')}
                        className="w-4 h-4 rounded border-border cursor-pointer"
                      />
                    </div>
                    <Textarea
                      value={content.gancho}
                      onChange={(e) => setContent({...content, gancho: e.target.value})}
                      className="min-h-[100px] text-base leading-relaxed resize-none border-primary/40 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                        🤨 Setup (Contexto)
                      </h5>
                      <input
                        type="checkbox"
                        id="setup-check"
                        checked={reviewedSections.setup}
                        onChange={() => toggleSectionReview('setup')}
                        className="w-4 h-4 rounded border-border cursor-pointer"
                      />
                    </div>
                    <Textarea
                      value={content.setup}
                      onChange={(e) => setContent({...content, setup: e.target.value})}
                      className="min-h-[100px] text-base leading-relaxed resize-none border-primary/40 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                        🦅 Desenvolvimento
                      </h5>
                      <input
                        type="checkbox"
                        id="desenvolvimento-check"
                        checked={reviewedSections.desenvolvimento}
                        onChange={() => toggleSectionReview('desenvolvimento')}
                        className="w-4 h-4 rounded border-border cursor-pointer"
                      />
                    </div>
                    <Textarea
                      value={content.desenvolvimento}
                      onChange={(e) => setContent({...content, desenvolvimento: e.target.value})}
                      className="min-h-[100px] text-base leading-relaxed resize-none border-primary/40 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                        📩 Conclusão (Fecho de Loop)
                      </h5>
                      <input
                        type="checkbox"
                        id="conclusao-check"
                        checked={reviewedSections.conclusao}
                        onChange={() => toggleSectionReview('conclusao')}
                        className="w-4 h-4 rounded border-border cursor-pointer"
                      />
                    </div>
                    <Textarea
                      value={content.conclusao}
                      onChange={(e) => setContent({...content, conclusao: e.target.value})}
                      className="min-h-[100px] text-base leading-relaxed resize-none border-primary/40 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Single editor view (default for both script and review mode)
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                    🪝 Gancho
                  </h5>
                  {isReviewMode && (
                    <input
                      type="checkbox"
                      id="gancho-check-single"
                      checked={reviewedSections.gancho}
                      onChange={() => toggleSectionReview('gancho')}
                      className="w-4 h-4 rounded border-border cursor-pointer"
                    />
                  )}
                </div>
                <Textarea
                  value={content.gancho}
                  onChange={(e) => setContent({...content, gancho: e.target.value})}
                  placeholder="Escreva o gancho inicial..."
                  className="min-h-[100px] text-base leading-relaxed resize-none border-none focus-visible:ring-0 bg-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                    🤨 Setup (Contexto)
                  </h5>
                  {isReviewMode && (
                    <input
                      type="checkbox"
                      id="setup-check-single"
                      checked={reviewedSections.setup}
                      onChange={() => toggleSectionReview('setup')}
                      className="w-4 h-4 rounded border-border cursor-pointer"
                    />
                  )}
                </div>
                <Textarea
                  value={content.setup}
                  onChange={(e) => setContent({...content, setup: e.target.value})}
                  placeholder="Forneça o contexto necessário..."
                  className="min-h-[100px] text-base leading-relaxed resize-none border-none focus-visible:ring-0 bg-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                    🦅 Desenvolvimento
                  </h5>
                  {isReviewMode && (
                    <input
                      type="checkbox"
                      id="desenvolvimento-check-single"
                      checked={reviewedSections.desenvolvimento}
                      onChange={() => toggleSectionReview('desenvolvimento')}
                      className="w-4 h-4 rounded border-border cursor-pointer"
                    />
                  )}
                </div>
                <Textarea
                  value={content.desenvolvimento}
                  onChange={(e) => setContent({...content, desenvolvimento: e.target.value})}
                  placeholder="Desenvolva o conteúdo principal..."
                  className="min-h-[100px] text-base leading-relaxed resize-none border-none focus-visible:ring-0 bg-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-base font-semibold text-foreground flex items-center gap-2">
                    📩 Conclusão (Fecho de Loop)
                  </h5>
                  {isReviewMode && (
                    <input
                      type="checkbox"
                      id="conclusao-check-single"
                      checked={reviewedSections.conclusao}
                      onChange={() => toggleSectionReview('conclusao')}
                      className="w-4 h-4 rounded border-border cursor-pointer"
                    />
                  )}
                </div>
                <Textarea
                  value={content.conclusao}
                  onChange={(e) => setContent({...content, conclusao: e.target.value})}
                  placeholder="Conclua e feche o loop..."
                  className="min-h-[100px] text-base leading-relaxed resize-none border-none focus-visible:ring-0 bg-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
