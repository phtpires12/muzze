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
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ScriptEditorProps {
  onClose?: () => void;
  scriptId?: string;
}

export const ScriptEditor = ({ onClose, scriptId }: ScriptEditorProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("Novo Roteiro");
  const [content, setContent] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [newReference, setNewReference] = useState("");
  const [shotList, setShotList] = useState<string[]>([]);
  const [contentType, setContentType] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

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
  }, [title, content, references, shotList, contentType, publishDate]);

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
        setContent(data.content || "");
        setReferences(data.reference_links || []);
        setShotList(data.shot_list || []);
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
        content,
        reference_links: references.filter(ref => ref.trim() !== ""),
        shot_list: shotList.filter(item => item.trim() !== ""),
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

          {/* Shot List */}
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-2 min-w-[180px] text-sm text-muted-foreground pt-2">
              <ListChecks className="w-4 h-4" />
              <span>Shot List</span>
            </div>
            <div className="flex-1">
              {shotList.length === 0 ? (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShotList([""])}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Adicionar item
                </Button>
              ) : (
                <div className="space-y-2">
                  {shotList.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newList = [...shotList];
                          newList[index] = e.target.value;
                          setShotList(newList);
                        }}
                        placeholder="Descrição do plano..."
                        className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShotList(shotList.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShotList([...shotList, ""])}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    + Adicionar mais
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="space-y-4">
          <div className="border-l-4 border-primary/30 pl-4">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              📝 ROTEIRO
            </h3>
          </div>
          
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva seu roteiro aqui... 

Você pode organizar em seções como:
- INTRO (Gancho)
- DESENVOLVIMENTO
- CONCLUSÃO"
            className="min-h-[400px] text-base leading-relaxed resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          />
        </div>
      </div>
    </div>
  );
};
