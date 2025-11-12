import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShotItem {
  id: string;
  script: string;
  scene: string;
  shot: string;
  location: string;
}

const ShotList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scriptId = searchParams.get("scriptId");
  const { toast } = useToast();
  
  const [shots, setShots] = useState<ShotItem[]>([{
    id: crypto.randomUUID(),
    script: "",
    scene: "",
    shot: "",
    location: ""
  }]);

  useEffect(() => {
    if (scriptId) {
      loadShotList();
    }
  }, [scriptId]);

  const loadShotList = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('shot_list')
        .eq('id', scriptId)
        .single();

      if (error) throw error;

      if (data?.shot_list && data.shot_list.length > 0) {
        // Parse shot list from array to structured format
        const parsedShots = data.shot_list.map((item: string, index: number) => {
          try {
            return JSON.parse(item);
          } catch {
            return {
              id: crypto.randomUUID(),
              script: item,
              scene: "",
              shot: "",
              location: ""
            };
          }
        });
        setShots(parsedShots);
      }
    } catch (error) {
      console.error('Error loading shot list:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Convert structured shots to JSON strings for storage
      const shotListData = shots
        .filter(shot => shot.script.trim() !== "")
        .map(shot => JSON.stringify(shot));

      const { error } = await supabase
        .from('scripts')
        .update({ shot_list: shotListData })
        .eq('id', scriptId);

      if (error) throw error;

      toast({
        title: "Shot List salva",
        description: "Suas alterações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving shot list:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o shot list.",
        variant: "destructive",
      });
    }
  };

  const addShot = () => {
    setShots([...shots, {
      id: crypto.randomUUID(),
      script: "",
      scene: "",
      shot: "",
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

          <Button onClick={handleSave} className="gap-2">
            Salvar Shot List
          </Button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold">Shot List</h1>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold text-sm">Roteiro</th>
                <th className="text-left p-4 font-semibold text-sm w-32">Cena</th>
                <th className="text-left p-4 font-semibold text-sm w-32">Plano</th>
                <th className="text-left p-4 font-semibold text-sm w-48">Local</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {shots.map((shot, index) => (
                <tr key={shot.id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-4">
                    <Textarea
                      value={shot.script}
                      onChange={(e) => updateShot(shot.id, 'script', e.target.value)}
                      placeholder="Descrição do que será gravado..."
                      className="min-h-[80px] resize-none border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </td>
                  <td className="p-4">
                    <Input
                      value={shot.scene}
                      onChange={(e) => updateShot(shot.id, 'scene', e.target.value)}
                      placeholder="Ex: a tarde na garagem"
                      className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                    />
                  </td>
                  <td className="p-4">
                    <Input
                      value={shot.shot}
                      onChange={(e) => updateShot(shot.id, 'shot', e.target.value)}
                      placeholder="Ex: a noite no escritório"
                      className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                    />
                  </td>
                  <td className="p-4">
                    <Input
                      value={shot.location}
                      onChange={(e) => updateShot(shot.id, 'location', e.target.value)}
                      placeholder="Ex: a tarde no quarto"
                      className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                    />
                  </td>
                  <td className="p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeShot(shot.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
