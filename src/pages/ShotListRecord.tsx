import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Play, Pause } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShotListTable, ShotItem } from "@/components/shotlist/ShotListTable";
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

const ShotListRecord = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scriptId = searchParams.get("scriptId");
  const { toast } = useToast();

  const [shots, setShots] = useState<ShotItem[]>([]);
  const [scriptTitle, setScriptTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());

  // Timer states
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Filter states
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);

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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

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
      const { error } = await supabase
        .from('scripts')
        .update({ shot_list: shots as any })
        .eq('id', scriptId);


      if (error) throw error;

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
      if (filterSection !== "all" && shot.sectionName !== filterSection) return false;
      if (showOnlyIncomplete && shot.isCompleted) return false;
      return true;
    });
  }, [shots, filterLocation, filterSection, showOnlyIncomplete]);

  // Get unique locations and sections for filters
  const uniqueLocations = useMemo(() => 
    Array.from(new Set(shots.map(s => s.location).filter(Boolean))),
    [shots]
  );

  const uniqueSections = useMemo(() => 
    Array.from(new Set(shots.map(s => s.sectionName).filter(Boolean))),
    [shots]
  );

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="hover:bg-accent/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Shot List - Gravação</h1>
              <p className="text-sm text-muted-foreground">{scriptTitle}</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar Progresso'}
          </Button>
        </div>

        {/* Timer and Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Timer de Gravação</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTimerRunning(!timerRunning)}
              >
                {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
            </div>
            <p className="text-4xl font-bold text-primary font-mono">
              {formatTime(elapsedTime)}
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-4">Progresso</h3>
            <Progress value={progressPercentage} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {shots.filter(s => s.isCompleted).length} de {shots.length} takes concluídos ({progressPercentage}%)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card p-4 rounded-lg border border-border mb-4">
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
              <label className="text-sm font-medium text-foreground">Seção:</label>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueSections.map(sec => (
                    <SelectItem key={sec} value={sec}>{sec}</SelectItem>
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
        {filteredShots.length > 0 ? (
          <ShotListTable
            shots={filteredShots}
            onUpdate={updateShot}
            onRemove={removeShot}
            onImageUpload={handleImageUpload}
            onSplitAtCursor={splitShotAtCursor}
            onDragEnd={handleDragEnd}
            showCheckbox={true}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum take para mostrar com os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShotListRecord;
