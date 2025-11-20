import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShotListTable, ShotItem } from "@/components/shotlist/ShotListTable";
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

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
        const parsedShots: ShotItem[] = data.shot_list.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          scriptSegment: item.scriptSegment || item.script_segment || '',
          scene: item.scene || '',
          shotImageUrl: item.shotImageUrl || item.shot_image_url || '',
          location: item.location || '',
          sectionName: item.sectionName || item.section_name || '',
          isCompleted: item.isCompleted || item.is_completed || false,
        }));
        setShots(parsedShots);
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
      shotImageUrl: '',
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
        shotImageUrl: '',
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
        ? { ...s, [field]: field === 'isCompleted' ? value === 'true' : value }
        : s
    ));
  };

  const handleImageUpload = async (shotId: string, file: File) => {
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

      const { data: { publicUrl } } = supabase.storage
        .from('shot-references')
        .getPublicUrl(filePath);

      updateShot(shotId, 'shotImageUrl', publicUrl);

      toast({
        title: "Imagem enviada!",
        description: "A imagem de referência foi adicionada com sucesso",
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

  const handleAdvanceToRecord = async () => {
    await handleSave();
    navigate(`/shot-list/record?scriptId=${scriptId}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/session?stage=review&scriptId=${scriptId}`)}
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

        {/* Add Shot Button */}
        <div className="mb-4">
          <Button
            onClick={addShot}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Take
          </Button>
        </div>

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
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum take adicionado ainda.</p>
            <p className="text-sm mt-2">Clique em "Adicionar Take" para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShotListReview;
