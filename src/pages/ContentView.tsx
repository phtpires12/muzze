import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, FileText, ExternalLink, Calendar, Play, Eye, Image, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RichTextRenderer } from "@/components/ui/rich-text-renderer";

interface Script {
  id: string;
  title: string;
  content: string | null;
  content_type: string | null;
  publish_date: string | null;
  created_at: string;
  shot_list: string[] | null;
  status: string | null;
  central_idea: string | null;
  reference_url: string | null;
  thumbnail_url: string | null;
  publish_status: string | null;
  published_at: string | null;
}

interface ParsedContent {
  gancho?: string;
  setup?: string;
  desenvolvimento?: string;
  conclusao?: string;
}

const getStage = (script: Script): string => {
  if (script.status === "editing") return "edit";
  if (script.status === "review") return "review";
  if (script.status === "recording") return "record";
  if (script.status === "draft") return "script";
  if (script.shot_list && script.shot_list.length > 0) return "record";
  if (script.content && script.content.length > 100) return "script";
  return "idea";
};

const getStageLabel = (stage: string): string => {
  switch (stage) {
    case "edit": return "Edição";
    case "review": return "Revisão";
    case "record": return "Gravação";
    case "script": return "Roteiro";
    case "idea": return "Ideia";
    default: return stage;
  }
};

const getStageBadgeClass = (stage: string): string => {
  switch (stage) {
    case "edit": return "bg-blue-500/70 text-white";
    case "review": return "bg-purple-400/70 text-white";
    case "record": return "bg-orange-500/70 text-white";
    case "script": return "bg-purple-500/70 text-white";
    case "idea": return "bg-accent/70 text-accent-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const getPublishStatusLabel = (status: string | null): string | null => {
  switch (status) {
    case "postado": return "Publicado";
    case "perdido": return "Perdido";
    case "pronto_para_postar": return "Pronto para postar";
    case "planejado": return "Planejado";
    default: return null;
  }
};

const getPublishStatusClass = (status: string | null): string => {
  switch (status) {
    case "postado": return "bg-green-500/70 text-white";
    case "perdido": return "bg-red-500/70 text-white";
    case "pronto_para_postar": return "bg-emerald-500/70 text-white";
    default: return "bg-muted text-muted-foreground";
  }
};

const parseContent = (content: string | null): ParsedContent => {
  if (!content) return {};
  try {
    return JSON.parse(content);
  } catch {
    return { desenvolvimento: content };
  }
};

export default function ContentView() {
  const { scriptId } = useParams<{ scriptId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => {
    const fetchScript = async () => {
      if (!scriptId) return;
      
      try {
        const { data, error } = await supabase
          .from('scripts')
          .select('*')
          .eq('id', scriptId)
          .maybeSingle();

        if (error) throw error;
        setScript(data);
      } catch (error) {
        console.error('Error fetching script:', error);
        toast({
          title: "Erro ao carregar conteúdo",
          description: "Não foi possível carregar os detalhes do conteúdo.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScript();
  }, [scriptId, toast]);

  const handleBack = () => {
    navigate('/calendario');
  };

  const handleStartSession = () => {
    if (!script) return;
    
    const stage = getStage(script);
    
    if (stage === "record") {
      navigate(`/shot-list/record?scriptId=${script.id}`);
    } else {
      navigate(`/session?stage=${stage}&scriptId=${script.id}`);
    }
  };

  const handleEditAttempt = () => {
    setShowSessionModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-xl text-foreground">Carregando...</div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Conteúdo não encontrado</p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Calendário
        </Button>
      </div>
    );
  }

  const stage = getStage(script);
  const parsedContent = parseContent(script.content);
  const hasContent = Object.values(parsedContent).some(v => v && v.trim());
  const publishStatusLabel = getPublishStatusLabel(script.publish_status);
  const isPosted = script.publish_status === "postado";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div 
          className="container mx-auto px-4 py-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Modo Visualização</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="container mx-auto px-4 py-6 pb-32 max-w-2xl">
          {/* Thumbnail (YouTube) */}
          {script.thumbnail_url && (
            <div className="mb-6 rounded-xl overflow-hidden border border-border">
              <img 
                src={script.thumbnail_url} 
                alt={script.title} 
                className="w-full aspect-video object-cover"
              />
            </div>
          )}

          {/* Main Card */}
          <Card className="mb-6" onClick={handleEditAttempt}>
            <CardContent className="p-6 space-y-4 cursor-pointer">
              {/* Title */}
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  isPosted 
                    ? "bg-green-500/20" 
                    : "bg-gradient-to-br from-primary/20 to-accent/20"
                )}>
                  {isPosted ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h1 className={cn(
                    "text-xl font-bold",
                    script.title?.trim() ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {script.title?.trim() || "Sem título"}
                  </h1>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getStageBadgeClass(stage)}>
                  {getStageLabel(stage)}
                </Badge>
                {script.content_type && (
                  <Badge variant="secondary">
                    {script.content_type}
                  </Badge>
                )}
                {publishStatusLabel && (
                  <Badge className={getPublishStatusClass(script.publish_status)}>
                    {publishStatusLabel}
                  </Badge>
                )}
              </div>

              {/* Date */}
              {script.publish_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(script.publish_date + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}

              {/* Central Idea */}
              {script.central_idea && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ideia Central</p>
                  <p className="text-foreground">{script.central_idea}</p>
                </div>
              )}

              {/* Reference URL */}
              {script.reference_url && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Referência</p>
                  <a 
                    href={script.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span className="truncate">{script.reference_url}</span>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Script Content (Read-only) */}
          {hasContent && (
            <Card className="mb-6" onClick={handleEditAttempt}>
              <CardContent className="p-6 space-y-4 cursor-pointer">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Roteiro</p>
                
                {parsedContent.gancho && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-primary">Gancho</p>
                    <RichTextRenderer content={parsedContent.gancho} className="text-sm" />
                  </div>
                )}
                
                {parsedContent.setup && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-primary">Setup</p>
                    <RichTextRenderer content={parsedContent.setup} className="text-sm" />
                  </div>
                )}
                
                {parsedContent.desenvolvimento && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-primary">Desenvolvimento</p>
                    <RichTextRenderer content={parsedContent.desenvolvimento} className="text-sm" />
                  </div>
                )}
                
                {parsedContent.conclusao && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-primary">Conclusão</p>
                    <RichTextRenderer content={parsedContent.conclusao} className="text-sm" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Shot List Preview */}
          {script.shot_list && script.shot_list.length > 0 && (
            <Card className="mb-6" onClick={handleEditAttempt}>
              <CardContent className="p-6 space-y-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Shot List ({script.shot_list.length} cenas)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {script.shot_list.slice(0, 5).map((shot, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {shot.length > 30 ? shot.substring(0, 30) + '...' : shot}
                    </Badge>
                  ))}
                  {script.shot_list.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{script.shot_list.length - 5} mais
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Fixed CTA Button */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        <div className="container mx-auto max-w-2xl">
          <Button 
            onClick={() => setShowSessionModal(true)}
            className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Iniciar Sessão Criativa
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={showSessionModal} onOpenChange={setShowSessionModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar Sessão Criativa?</AlertDialogTitle>
            <AlertDialogDescription>
              Para editar este conteúdo, você precisa iniciar uma sessão criativa.
              <br /><br />
              O timer será ativado e o tempo será contabilizado no seu progresso diário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Visualizando</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartSession} className="bg-gradient-to-r from-primary to-accent">
              <Play className="w-4 h-4 mr-2" />
              Iniciar Sessão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
