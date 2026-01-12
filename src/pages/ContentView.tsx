import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, FileText, ExternalLink, Calendar, Play, Eye, Image, Check, ImageOff } from "lucide-react";
import { ShotItem } from "@/lib/shotlist-generator";
import { generateSignedUrlsBatch } from "@/lib/storage-helpers";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RichTextRenderer } from "@/components/ui/rich-text-renderer";
import { PRODUCTION_COLUMNS } from "@/lib/kanban-columns";

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const handleStageChange = async (newStatus: string) => {
    if (!script || isUpdating) return;
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('scripts')
        .update({ status: newStatus })
        .eq('id', script.id);

      if (error) throw error;
      
      setScript(prev => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: "Etapa atualizada",
        description: `Conteúdo movido para ${PRODUCTION_COLUMNS.find(c => c.status === newStatus)?.label}`,
      });
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível alterar a etapa.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDateChange = async (newDate: Date | undefined) => {
    if (!script || !newDate || isUpdating) return;
    setIsUpdating(true);
    setShowDatePicker(false);
    
    try {
      const formattedDate = format(newDate, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('scripts')
        .update({ publish_date: formattedDate })
        .eq('id', script.id);

      if (error) throw error;
      
      setScript(prev => prev ? { ...prev, publish_date: formattedDate } : null);
      toast({
        title: "Data atualizada",
        description: `Nova data: ${format(newDate, "d 'de' MMMM", { locale: ptBR })}`,
      });
    } catch (error) {
      console.error('Error updating date:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível alterar a data.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
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

  // Parse shot list items from JSON strings
  const parsedShots = useMemo<ShotItem[]>(() => {
    if (!script?.shot_list) return [];
    return script.shot_list
      .map(item => {
        try { return JSON.parse(item) as ShotItem; }
        catch { return null; }
      })
      .filter((item): item is ShotItem => item !== null);
  }, [script?.shot_list]);

  // Extract all image paths from shots
  const allImagePaths = useMemo(() => {
    return parsedShots
      .flatMap(shot => shot.shotImagePaths || [])
      .filter(Boolean);
  }, [parsedShots]);

  // State for resolved signed URLs
  const [resolvedUrls, setResolvedUrls] = useState<Map<string, string>>(new Map());

  // Generate signed URLs for preview images
  useEffect(() => {
    if (allImagePaths.length > 0) {
      generateSignedUrlsBatch(allImagePaths.slice(0, 6)).then(setResolvedUrls);
    } else {
      setResolvedUrls(new Map());
    }
  }, [allImagePaths.join(',')]);

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
        <div className="container mx-auto px-4 py-6 pb-32 max-w-2xl overflow-x-hidden">
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
            <CardContent className="p-6 space-y-4 cursor-pointer break-words overflow-hidden">
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
                <div className="flex-1 min-w-0">
                  <h1 className={cn(
                    "text-xl font-bold break-words",
                    script.title?.trim() ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {script.title?.trim() || "Sem título"}
                  </h1>
                </div>
              </div>

              {/* Stage Selector + Badges */}
              <div className="flex flex-wrap gap-2 items-center">
                <Select 
                  value={script.status || 'draft_idea'} 
                  onValueChange={handleStageChange}
                  disabled={isUpdating}
                >
                  <SelectTrigger 
                    className={cn(
                      "w-auto h-7 text-xs font-medium border-none gap-1 px-2",
                      getStageBadgeClass(stage)
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTION_COLUMNS.map((col) => (
                      <SelectItem key={col.id} value={col.status}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", col.color)} />
                          {col.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
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

              {/* Date Picker */}
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <button 
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 px-2 -ml-2 rounded-md hover:bg-accent"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>
                      {script.publish_date 
                        ? format(new Date(script.publish_date + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : "Adicionar data"
                      }
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
                  <CalendarPicker
                    mode="single"
                    selected={script.publish_date ? new Date(script.publish_date + 'T12:00:00') : undefined}
                    onSelect={handleDateChange}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Central Idea */}
              {script.central_idea && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ideia Central</p>
                  <p className="text-foreground">{script.central_idea}</p>
                </div>
              )}

              {/* Reference URL */}
              {script.reference_url && (
                <div className="space-y-2 pt-2 border-t border-border overflow-hidden">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Referência</p>
                  <a 
                    href={script.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2 max-w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span className="truncate block max-w-[calc(100%-2rem)]">{script.reference_url}</span>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Script Content (Read-only) */}
          {hasContent && (
            <Card className="mb-6" onClick={handleEditAttempt}>
              <CardContent className="p-6 space-y-4 cursor-pointer break-words overflow-hidden">
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
          <Card className="mb-6" onClick={handleEditAttempt}>
            <CardContent className="p-6 space-y-3 cursor-pointer">
              {parsedShots.length > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Shot List ({parsedShots.length} cenas)
                    </p>
                  </div>
                  
                  {allImagePaths.length > 0 ? (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {allImagePaths.slice(0, 6).map((path, index) => (
                          <div key={path} className="aspect-video bg-muted rounded-md overflow-hidden">
                            {resolvedUrls.get(path) ? (
                              <img 
                                src={resolvedUrls.get(path)} 
                                alt={`Referência ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-6 h-6 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {allImagePaths.length > 6 && (
                        <Badge variant="secondary" className="text-xs">
                          +{allImagePaths.length - 6} imagens
                        </Badge>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma imagem de referência adicionada
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ImageOff className="w-4 h-4" />
                  <span className="text-sm">Sem shotlist</span>
                </div>
              )}
            </CardContent>
          </Card>
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
