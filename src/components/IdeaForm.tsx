import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";

const CONTENT_TYPES = [
  { value: "video", label: "Vídeo" },
  { value: "reel", label: "Reel" },
  { value: "tiktok", label: "TikTok" },
  { value: "short", label: "Short" },
  { value: "podcast", label: "Podcast" },
  { value: "post", label: "Post" },
];

interface IdeaFormProps {
  scriptId?: string;
}

export const IdeaForm = ({ scriptId }: IdeaFormProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("");
  const [centralIdea, setCentralIdea] = useState("");
  const [publishDate, setPublishDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentScriptId, setCurrentScriptId] = useState<string | undefined>(scriptId);

  useEffect(() => {
    const dateParam = searchParams.get("publishDate");
    if (dateParam) {
      setPublishDate(dateParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (currentScriptId) {
      loadIdea();
    }
  }, [currentScriptId]);

  const loadIdea = async () => {
    if (!currentScriptId) return;

    try {
      const { data, error } = await supabase
        .from("scripts")
        .select("*")
        .eq("id", currentScriptId)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title || "");
        setContentType(data.content_type || "");
        setCentralIdea(data.central_idea || "");
        if (data.publish_date) {
          setPublishDate(data.publish_date);
        }
      }
    } catch (error) {
      console.error("Error loading idea:", error);
      toast({
        title: "Erro ao carregar ideia",
        description: "Não foi possível carregar os dados da ideia.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!contentType || !centralIdea.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o tipo de conteúdo e a ideia central para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const scriptData = {
        title: title.trim() || "Nova Ideia",
        content_type: contentType,
        central_idea: centralIdea.trim(),
        user_id: user.id,
        publish_date: publishDate,
      };

      let savedScriptId = currentScriptId;

      if (currentScriptId) {
        // Update existing
        const { error } = await supabase
          .from("scripts")
          .update(scriptData)
          .eq("id", currentScriptId);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("scripts")
          .insert([scriptData])
          .select()
          .single();

        if (error) throw error;
        savedScriptId = data.id;
        setCurrentScriptId(data.id);
      }

      toast({
        title: "Ideia salva!",
        description: "Sua ideia foi salva com sucesso.",
      });

      // Navigate to script stage
      navigate(`/session?stage=script&scriptId=${savedScriptId}`);
    } catch (error) {
      console.error("Error saving idea:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar sua ideia.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = contentType && centralIdea.trim();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Título (opcional)</Label>
        <Input
          id="title"
          placeholder="Digite um título para sua ideia..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content-type">
          Tipo de Conteúdo <span className="text-destructive">*</span>
        </Label>
        <Select value={contentType} onValueChange={setContentType}>
          <SelectTrigger id="content-type">
            <SelectValue placeholder="Selecione o tipo de conteúdo" />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="central-idea">
          Ideia Central <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="central-idea"
          placeholder="Descreva brevemente sua ideia central..."
          value={centralIdea}
          onChange={(e) => setCentralIdea(e.target.value)}
          rows={6}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground">
          Explique minimamente sua ideia para poder avançar para o roteiro.
        </p>
      </div>

      {publishDate && (
        <div className="text-sm text-muted-foreground">
          📅 Data de publicação: {new Date(publishDate).toLocaleDateString("pt-BR")}
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={!canAdvance || loading}
        className="w-full"
        size="lg"
      >
        {loading ? "Salvando..." : "Avançar para Roteiro"}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};
