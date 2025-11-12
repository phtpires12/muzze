import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Camera, Upload, GripVertical, X, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ShotItem {
  id: string;
  scriptSegment: string; // Apenas o trecho específico do roteiro desta linha
  scene: string;
  shotImageUrl: string;
  location: string;
  sectionName?: string; // Nome da seção (Gancho, Setup, etc.)
}

const SortableRow = ({ shot, index, onUpdate, onRemove, onImageUpload, onSplitAtCursor }: {
  shot: ShotItem;
  index: number;
  onUpdate: (id: string, field: keyof ShotItem, value: string) => void;
  onRemove: (id: string) => void;
  onImageUpload: (id: string, file: File) => void;
  onSplitAtCursor: (id: string, cursorPosition: number) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editableDivRef = useRef<HTMLDivElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(shot.id, file);
    }
  };

  const handleRemoveImage = async () => {
    if (shot.shotImageUrl) {
      try {
        const fileName = shot.shotImageUrl.split('/').pop();
        if (fileName) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.storage
              .from('shot-references')
              .remove([`${user.id}/${fileName}`]);
          }
        }
      } catch (error) {
        console.error('Error removing image:', error);
      }
      onUpdate(shot.id, 'shotImageUrl', '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      const selection = window.getSelection();
      if (!selection || !editableDivRef.current) return;
      
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editableDivRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const cursorPosition = preCaretRange.toString().length;
      
      onSplitAtCursor(shot.id, cursorPosition);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    onUpdate(shot.id, 'scriptSegment', newText);
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-t border-border hover:bg-muted/20">
      <td className="p-4 w-12">
        <div className="flex flex-col gap-2">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-2">
          {shot.sectionName && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {shot.sectionName}
            </span>
          )}
          <div
            ref={editableDivRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            suppressContentEditableWarning
            className="min-h-[80px] text-sm p-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-pre-wrap"
          >
            {shot.scriptSegment}
          </div>
          <span className="text-xs text-muted-foreground">Pressione Enter para dividir</span>
        </div>
      </td>
      <td className="p-4">
        <Input
          value={shot.scene}
          onChange={(e) => onUpdate(shot.id, 'scene', e.target.value)}
          placeholder="Ex: Tarde na garagem"
          className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
        />
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {shot.shotImageUrl ? (
            <div className="relative group">
              <img
                src={shot.shotImageUrl}
                alt="Referência"
                className="w-32 h-20 object-cover rounded border border-border cursor-pointer"
                onClick={handleImageClick}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleImageClick}
              className="gap-2 w-32"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          )}
        </div>
      </td>
      <td className="p-4">
        <Input
          value={shot.location}
          onChange={(e) => onUpdate(shot.id, 'location', e.target.value)}
          placeholder="Ex: Tarde no quarto"
          className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
        />
      </td>
      <td className="p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(shot.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
};

const ShotList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scriptId = searchParams.get("scriptId");
  const { toast } = useToast();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [shots, setShots] = useState<ShotItem[]>([]);
  const [scriptContent, setScriptContent] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [history, setHistory] = useState<ShotItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (scriptId) {
      loadShotList();
      loadScriptContent();
    }
  }, [scriptId]);

  // Undo/Redo com Ctrl+Z e Ctrl+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const saveToHistory = (newShots: ShotItem[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newShots)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShots(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setShots(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (scriptId && shots.length > 0) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSave(true);
      }, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [shots, scriptId]);

  // Função para quebrar o roteiro em parágrafos
  const parseScriptIntoParagraphs = (content: string): Array<{ sectionName: string; paragraph: string }> => {
    const paragraphs: Array<{ sectionName: string; paragraph: string }> = [];
    
    try {
      const parsedContent = JSON.parse(content);
      
      const sections = [
        { name: 'Gancho', content: parsedContent.gancho },
        { name: 'Setup', content: parsedContent.setup },
        { name: 'Desenvolvimento', content: parsedContent.desenvolvimento },
        { name: 'Conclusão', content: parsedContent.conclusao }
      ];
      
      sections.forEach(section => {
        if (section.content && section.content.trim()) {
          // Dividir por parágrafos (quebras de linha duplas ou simples)
          const sectionParagraphs = section.content
            .split(/\n\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
          
          sectionParagraphs.forEach(paragraph => {
            paragraphs.push({
              sectionName: section.name,
              paragraph: paragraph
            });
          });
        }
      });
    } catch {
      // Se não for JSON, dividir por parágrafos simples
      const simpleParagraphs = content
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
      
      simpleParagraphs.forEach(paragraph => {
        paragraphs.push({
          sectionName: '',
          paragraph: paragraph
        });
      });
    }
    
    return paragraphs;
  };

  const loadScriptContent = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('content')
        .eq('id', scriptId)
        .single();

      if (error) throw error;

      if (data?.content) {
        setScriptContent(data.content);
      }
    } catch (error) {
      console.error('Error loading script content:', error);
    }
  };

  const loadShotList = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('shot_list, content')
        .eq('id', scriptId)
        .single();

      if (error) throw error;

      if (!data?.content) return;

      setScriptContent(data.content);

      if (data?.shot_list && data.shot_list.length > 0) {
        // Carregar shot list existente
        const parsedShots = data.shot_list.map((item: string) => {
          try {
            const parsedShot = JSON.parse(item);
            return {
              id: parsedShot.id || crypto.randomUUID(),
              scriptSegment: parsedShot.scriptSegment || parsedShot.script || "",
              scene: parsedShot.scene || "",
              shotImageUrl: parsedShot.shotImageUrl || "",
              location: parsedShot.location || "",
              sectionName: parsedShot.sectionName || ""
            };
          } catch {
            return {
              id: crypto.randomUUID(),
              scriptSegment: "",
              scene: "",
              shotImageUrl: "",
              location: "",
              sectionName: ""
            };
          }
        });
        setShots(parsedShots);
        saveToHistory(parsedShots);
      } else {
        // Gerar automaticamente por parágrafos se não existir shot list
        const paragraphs = parseScriptIntoParagraphs(data.content);
        
        if (paragraphs.length > 0) {
          const generatedShots = paragraphs.map(p => ({
            id: crypto.randomUUID(),
            scriptSegment: p.paragraph,
            scene: "",
            shotImageUrl: "",
            location: "",
            sectionName: p.sectionName
          }));
          setShots(generatedShots);
          saveToHistory(generatedShots);
        }
      }
    } catch (error) {
      console.error('Error loading shot list:', error);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    try {
      // Salvar apenas os campos editáveis da shot list
      const shotListData = shots.map(shot => JSON.stringify({
        id: shot.id,
        scriptSegment: shot.scriptSegment,
        scene: shot.scene,
        shotImageUrl: shot.shotImageUrl,
        location: shot.location,
        sectionName: shot.sectionName
      }));

      const { error } = await supabase
        .from('scripts')
        .update({ shot_list: shotListData })
        .eq('id', scriptId);

      if (error) throw error;

      if (!isAutoSave) {
        toast({
          title: "Shot List salva",
          description: "Suas alterações foram salvas com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error saving shot list:', error);
      if (!isAutoSave) {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar o shot list.",
          variant: "destructive",
        });
      }
    }
  };

  const addShot = () => {
    const newShots = [...shots, {
      id: crypto.randomUUID(),
      scriptSegment: "",
      scene: "",
      shotImageUrl: "",
      location: "",
      sectionName: ""
    }];
    setShots(newShots);
    saveToHistory(newShots);
  };

  const splitShotAtCursor = (id: string, cursorPosition: number) => {
    const shotIndex = shots.findIndex(s => s.id === id);
    if (shotIndex === -1) return;
    
    const shot = shots[shotIndex];
    const text = shot.scriptSegment;
    
    const firstPart = text.substring(0, cursorPosition).trim();
    const secondPart = text.substring(cursorPosition).trim();
    
    if (!firstPart || !secondPart) {
      toast({
        title: "Não foi possível dividir",
        description: "O texto é muito curto para ser dividido.",
        variant: "destructive",
      });
      return;
    }
    
    const newShots = [...shots];
    newShots[shotIndex] = {
      ...shot,
      scriptSegment: firstPart
    };
    
    newShots.splice(shotIndex + 1, 0, {
      id: crypto.randomUUID(),
      scriptSegment: secondPart,
      scene: shot.scene,
      shotImageUrl: "",
      location: shot.location,
      sectionName: shot.sectionName
    });
    
    setShots(newShots);
    saveToHistory(newShots);
    
    toast({
      title: "Linha dividida",
      description: "Uma nova linha foi criada com sucesso.",
    });
  };

  const regenerateFromScript = async () => {
    if (!scriptContent) {
      toast({
        title: "Roteiro não encontrado",
        description: "Carregue um roteiro antes de regenerar.",
        variant: "destructive",
      });
      return;
    }
    
    const paragraphs = parseScriptIntoParagraphs(scriptContent);
    
    if (paragraphs.length > 0) {
      const generatedShots = paragraphs.map(p => ({
        id: crypto.randomUUID(),
        scriptSegment: p.paragraph,
        scene: "",
        shotImageUrl: "",
        location: "",
        sectionName: p.sectionName
      }));
      setShots(generatedShots);
      saveToHistory(generatedShots);
      
      toast({
        title: "Shot List regenerada",
        description: `${generatedShots.length} linhas criadas a partir do roteiro.`,
      });
    }
  };

  const removeShot = (id: string) => {
    const newShots = shots.filter(shot => shot.id !== id);
    setShots(newShots);
    saveToHistory(newShots);
  };

  const updateShot = (id: string, field: keyof ShotItem, value: string) => {
    const newShots = shots.map(shot => 
      shot.id === id ? { ...shot, [field]: value } : shot
    );
    setShots(newShots);
    saveToHistory(newShots);
  };

  const handleImageUpload = async (shotId: string, file: File) => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('shot-references')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shot-references')
        .getPublicUrl(filePath);

      updateShot(shotId, 'shotImageUrl', publicUrl);

      toast({
        title: "Imagem carregada",
        description: "Imagem de referência adicionada com sucesso.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro ao carregar imagem",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setShots((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newShots = arrayMove(items, oldIndex, newIndex);
        saveToHistory(newShots);
        return newShots;
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/session?stage=review&scriptId=${scriptId}`)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Revisão
          </Button>

          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">Auto-save a cada 30s</span>
            <Button 
              variant="outline" 
              onClick={regenerateFromScript}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Regenerar do Roteiro
            </Button>
            <Button onClick={() => handleSave(false)} className="gap-2">
              Salvar Shot List
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold">Shot List</h1>
        </div>

        {/* Table */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-12"></th>
                  <th className="text-left p-4 font-semibold text-sm">Roteiro</th>
                  <th className="text-left p-4 font-semibold text-sm w-48">Cena</th>
                  <th className="text-left p-4 font-semibold text-sm w-40">Plano (Imagem)</th>
                  <th className="text-left p-4 font-semibold text-sm w-48">Local</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                <SortableContext items={shots.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {shots.length > 0 ? (
                    shots.map((shot, index) => (
                      <SortableRow
                        key={shot.id}
                        shot={shot}
                        index={index}
                        onUpdate={updateShot}
                        onRemove={removeShot}
                        onImageUpload={handleImageUpload}
                        onSplitAtCursor={splitShotAtCursor}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhuma linha criada. Clique em "Adicionar Linha" ou "Regenerar do Roteiro".
                      </td>
                    </tr>
                  )}
                </SortableContext>
              </tbody>
            </table>
          </div>
        </DndContext>

        {/* Add Row Button */}
        <Button
          variant="outline"
          onClick={addShot}
          className="mt-4 gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Linha
        </Button>
      </div>
    </div>
  );
};

export default ShotList;
