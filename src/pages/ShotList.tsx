import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Camera, Upload, GripVertical, X } from "lucide-react";
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
  script: string;
  scene: string;
  shotImageUrl: string;
  location: string;
}

const SortableRow = ({ shot, index, onUpdate, onRemove, onImageUpload }: {
  shot: ShotItem;
  index: number;
  onUpdate: (id: string, field: keyof ShotItem, value: string) => void;
  onRemove: (id: string) => void;
  onImageUpload: (id: string, file: File) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  return (
    <tr ref={setNodeRef} style={style} className="border-t border-border hover:bg-muted/20">
      <td className="p-4 w-12">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
          {shot.script && shot.script.trim() && !shot.script.startsWith('{') 
            ? shot.script 
            : "Roteiro não carregado"}
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
  
  const [shots, setShots] = useState<ShotItem[]>([{
    id: crypto.randomUUID(),
    script: "",
    scene: "",
    shotImageUrl: "",
    location: ""
  }]);
  const [scriptContent, setScriptContent] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

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

  const loadScriptContent = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('content')
        .eq('id', scriptId)
        .single();

      if (error) throw error;

      if (data?.content) {
        // Parse JSON content if it's structured
        try {
          const parsedContent = JSON.parse(data.content);
          // Concatenate all sections into readable text
          const sections = [];
          if (parsedContent.gancho && parsedContent.gancho.trim()) sections.push(`Gancho: ${parsedContent.gancho}`);
          if (parsedContent.setup && parsedContent.setup.trim()) sections.push(`Setup: ${parsedContent.setup}`);
          if (parsedContent.desenvolvimento && parsedContent.desenvolvimento.trim()) sections.push(`Desenvolvimento: ${parsedContent.desenvolvimento}`);
          if (parsedContent.conclusao && parsedContent.conclusao.trim()) sections.push(`Conclusão: ${parsedContent.conclusao}`);
          
          setScriptContent(sections.join('\n\n'));
        } catch {
          // If not JSON, use as plain text
          setScriptContent(data.content);
        }
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

      // Parse script content - sempre buscar a versão mais recente do banco
      let formattedScript = "";
      if (data?.content) {
        try {
          const parsedContent = JSON.parse(data.content);
          const sections = [];
          if (parsedContent.gancho && parsedContent.gancho.trim()) sections.push(`Gancho: ${parsedContent.gancho}`);
          if (parsedContent.setup && parsedContent.setup.trim()) sections.push(`Setup: ${parsedContent.setup}`);
          if (parsedContent.desenvolvimento && parsedContent.desenvolvimento.trim()) sections.push(`Desenvolvimento: ${parsedContent.desenvolvimento}`);
          if (parsedContent.conclusao && parsedContent.conclusao.trim()) sections.push(`Conclusão: ${parsedContent.conclusao}`);
          formattedScript = sections.join('\n\n');
        } catch {
          formattedScript = data.content;
        }
      }

      // Atualizar o estado do scriptContent também para sincronizar
      setScriptContent(formattedScript);

      if (data?.shot_list && data.shot_list.length > 0) {
        const parsedShots = data.shot_list.map((item: string) => {
          try {
            const parsedShot = JSON.parse(item);
            // SEMPRE atualizar com o script mais recente do banco
            return {
              ...parsedShot,
              script: formattedScript
            };
          } catch {
            return {
              id: crypto.randomUUID(),
              script: formattedScript,
              scene: "",
              shotImageUrl: "",
              location: ""
            };
          }
        });
        setShots(parsedShots);
      } else {
        // Initialize with script content if no shot list exists (only if there's content)
        if (formattedScript.trim()) {
          setShots([{
            id: crypto.randomUUID(),
            script: formattedScript,
            scene: "",
            shotImageUrl: "",
            location: ""
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading shot list:', error);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    try {
      // Salvar apenas os campos editáveis, NÃO salvar o script
      const shotListData = shots.map(shot => JSON.stringify({
        id: shot.id,
        scene: shot.scene,
        shotImageUrl: shot.shotImageUrl,
        location: shot.location
        // NÃO incluir 'script' aqui - ele será sempre carregado do banco
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
    setShots([...shots, {
      id: crypto.randomUUID(),
      script: scriptContent,
      scene: "",
      shotImageUrl: "",
      location: ""
    }]);
  };

  const removeShot = (id: string) => {
    setShots(shots.filter(shot => shot.id !== id));
  };

  const updateShot = (id: string, field: keyof ShotItem, value: string) => {
    setShots(shots.map(shot => 
      shot.id === id ? { ...shot, [field]: value } : shot
    ));
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

        return arrayMove(items, oldIndex, newIndex);
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
                  {shots.map((shot, index) => (
                    <SortableRow
                      key={shot.id}
                      shot={shot}
                      index={index}
                      onUpdate={updateShot}
                      onRemove={removeShot}
                      onImageUpload={handleImageUpload}
                    />
                  ))}
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
