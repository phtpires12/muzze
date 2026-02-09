import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, ExternalLink, Loader2, Check, Trash2, Video, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThumbnailUploader } from "@/components/ThumbnailUploader";
import { WorkflowSelector } from "@/components/workflows/WorkflowSelector";
import { WorkflowTemplateId, getStageLabel, getWorkflowTemplate } from "@/lib/workflow-templates";
import { useWorkflowTemplate, CREATIVE_TO_SESSION } from "@/hooks/useWorkflowTemplate";
import { MusicInput, buildMusicReference } from "@/components/brainstorm/MusicInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Idea {
  id: string;
  title: string;
  content_type: string | null;
  central_idea: string | null;
  reference_url: string | null;
  status: string | null;
  publish_date: string | null;
  thumbnail_url: string | null;
  workflow_template: string | null;
  music_reference: any;
}

interface IdeaDetailProps {
  scriptId: string;
}

const CONTENT_TYPES = ["Reels", "YouTube", "TikTok", "X (Twitter)"];

export const IdeaDetail = ({ scriptId }: IdeaDetailProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<string>("");
  const [centralIdea, setCentralIdea] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [workflowTemplate, setWorkflowTemplate] = useState<WorkflowTemplateId | null>(null);

  // Auto-save state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // Workflow hook para navegação dinâmica
  const { nextStage, getNextUrl } = useWorkflowTemplate({ scriptWorkflow: workflowTemplate });

  useEffect(() => {
    loadIdea();
  }, [scriptId]);

  const loadIdea = async () => {
    try {
      const { data, error } = await supabase
        .from("scripts")
        .select("id, title, content_type, central_idea, reference_url, status, publish_date, thumbnail_url, workflow_template")
        .eq("id", scriptId)
        .single();

      if (error) throw error;

      if (data) {
        setIdea(data);
        setTitle(data.title || "");
        setContentType(data.content_type || "");
        setCentralIdea(data.central_idea || "");
        setReferenceUrl(data.reference_url || "");
        setThumbnailUrl(data.thumbnail_url);
        setWorkflowTemplate(data.workflow_template as WorkflowTemplateId | null);
        isInitialLoad.current = false;
      }
    } catch (error) {
      console.error("Error loading idea:", error);
      toast({
        title: "Erro ao carregar ideia",
        description: "Não foi possível carregar os dados da ideia.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-save function
  const autoSave = useCallback(async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("scripts")
        .update({
          title,
          content_type: contentType || null,
          central_idea: centralIdea || null,
          reference_url: referenceUrl || null,
          thumbnail_url: thumbnailUrl,
          workflow_template: workflowTemplate,
        })
        .eq("id", scriptId);

      if (error) throw error;

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Auto-save error:", error);
    } finally {
      setSaving(false);
    }
  }, [title, contentType, centralIdea, referenceUrl, thumbnailUrl, workflowTemplate, scriptId]);

  // Debounced auto-save effect
  useEffect(() => {
    // Skip on initial load
    if (isInitialLoad.current || loading || !idea) return;

    setHasUnsavedChanges(true);

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule new save after 2 seconds
    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, contentType, centralIdea, referenceUrl, thumbnailUrl, workflowTemplate, loading, idea, autoSave]);

  const handleAdvanceToNextStage = async () => {
    // Save any pending changes first
    if (hasUnsavedChanges) {
      await autoSave();
    }
    
    // Determinar próximo estágio baseado no workflow
    const next = nextStage('ideation');
    if (!next) {
      toast({
        title: "Erro",
        description: "Não foi possível determinar o próximo estágio do workflow.",
        variant: "destructive",
      });
      return;
    }
    
    // Update status to the next stage
    await supabase
      .from("scripts")
      .update({ status: next })
      .eq("id", scriptId);
    
    // Navigate to the next stage using dynamic URL
    const url = getNextUrl('ideation', scriptId);
    if (url) {
      navigate(url);
    } else {
      // Fallback para script se algo der errado
      navigate(`/session?stage=script&scriptId=${scriptId}`);
    }
  };

  // Helper para obter ícone e label do botão
  const getNextStageButton = () => {
    const next = nextStage('ideation');
    if (!next) return { label: "Roteirizar essa ideia", icon: FileText };
    
    switch (next) {
      case 'script':
        return { label: "Roteirizar essa ideia", icon: FileText };
      case 'recording':
        return { label: "Ir para Gravação", icon: Video };
      case 'editing':
        return { label: "Ir para Edição", icon: Scissors };
      default:
        return { label: `Avançar para ${getStageLabel(next)}`, icon: FileText };
    }
  };

  const nextStageButton = getNextStageButton();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("scripts")
        .delete()
        .eq("id", scriptId);

      if (error) throw error;

      toast({
        title: "Ideia excluída",
        description: "A ideia foi excluída com sucesso.",
      });
      navigate("/calendario");
    } catch (error) {
      console.error("Error deleting idea:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a ideia.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Save status indicator component
  const SaveStatus = () => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {saving && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Salvando...</span>
        </>
      )}
      {!saving && lastSaved && !hasUnsavedChanges && (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span>Salvo</span>
        </>
      )}
      {!saving && hasUnsavedChanges && (
        <span className="text-amber-500">Alterações não salvas</span>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ideia não encontrada.</p>
        <Button 
          variant="outline" 
          onClick={() => navigate("/calendario")}
          className="mt-4"
        >
          Voltar ao Calendário
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl font-semibold">
                Desenvolver Ideia
              </CardTitle>
              <SaveStatus />
            </div>
            {contentType && (
              <Badge variant="secondary" className="text-xs">
                {contentType}
              </Badge>
            )}
          </div>
          {idea.publish_date && (
            <p className="text-sm text-muted-foreground">
              Agendada para {new Date(idea.publish_date).toLocaleDateString("pt-BR")}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Thumbnail - Only for YouTube */}
          {contentType === "YouTube" && (
            <ThumbnailUploader
              thumbnailUrl={thumbnailUrl}
              onThumbnailChange={(url) => {
                setThumbnailUrl(url);
                setHasUnsavedChanges(true);
              }}
              scriptId={scriptId}
            />
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da sua ideia"
              className="bg-background/50"
            />
          </div>

          {/* Content Type e Workflow em grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Content Type */}
            <div className="space-y-2">
              <Label htmlFor="content-type">Tipo de Conteúdo</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Workflow */}
            <div className="space-y-2">
              <Label>Workflow</Label>
              <WorkflowSelector
                value={workflowTemplate}
                onChange={(value) => {
                  setWorkflowTemplate(value);
                  setHasUnsavedChanges(true);
                }}
                showInheritOption={true}
                className="bg-background/50"
              />
            </div>
          </div>

          {/* Central Idea */}
          <div className="space-y-2">
            <Label htmlFor="central-idea">Ideia Central</Label>
            <Textarea
              id="central-idea"
              value={centralIdea}
              onChange={(e) => setCentralIdea(e.target.value)}
              placeholder="Descreva a ideia central do seu conteúdo..."
              rows={4}
              className="bg-background/50 resize-none"
            />
          </div>

          {/* Reference URL */}
          <div className="space-y-2">
            <Label htmlFor="reference-url">URL de Referência</Label>
            <div className="flex gap-2">
              <Input
                id="reference-url"
                type="url"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://..."
                className="bg-background/50 flex-1"
              />
              {referenceUrl && (
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                >
                  <a href={referenceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleAdvanceToNextStage}
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <nextStageButton.icon className="h-4 w-4 mr-2" />
              )}
              {nextStageButton.label}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/calendario")}
              className="w-full"
            >
              Voltar ao Calendário
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir ideia
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir ideia?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A ideia "{title || "Sem título"}" será permanentemente excluída.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
