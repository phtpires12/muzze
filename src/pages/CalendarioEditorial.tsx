import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Lightbulb, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDeviceType } from "@/hooks/useDeviceType";
import { CalendarDay } from "@/components/calendar/CalendarDay";
import { DayContentModal } from "@/components/calendar/DayContentModal";
import { PostConfirmationPopup } from "@/components/calendar/PostConfirmationPopup";
import { useOverdueContent } from "@/hooks/useOverdueContent";
import { PublishStatus } from "@/components/calendar/PublishStatusBadge";

interface Script {
  id: string;
  title: string;
  content: string | null;
  content_type: string | null;
  publish_date: string | null;
  created_at: string;
  shot_list: string[];
  status: string | null;
  central_idea: string | null;
  reference_url: string | null;
  publish_status?: PublishStatus | null;
  published_at?: string | null;
}

const CalendarioEditorial = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const deviceType = useDeviceType();
  const isIdeationMode = searchParams.get("mode") === "ideation";
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [scripts, setScripts] = useState<Script[]>([]);
  const [draggedScript, setDraggedScript] = useState<Script | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Overdue content popup
  const {
    currentPopupScript,
    isPopupOpen,
    setIsPopupOpen,
    markAsPosted,
    reschedule,
    remindLater,
    refetch: refetchOverdue,
  } = useOverdueContent();

  const handlePopupMarkAsPosted = async (scriptId: string) => {
    await markAsPosted(scriptId);
    fetchScripts();
    toast({
      title: "✅ Marcado como postado!",
      description: "Parabéns por publicar seu conteúdo!",
    });
  };

  const handlePopupReschedule = async (scriptId: string, newDate: Date) => {
    await reschedule(scriptId, newDate);
    fetchScripts();
    toast({
      title: "Data reagendada!",
      description: `Novo agendamento: ${format(newDate, "d 'de' MMMM", { locale: ptBR })}`,
    });
  };

  const handlePopupRemindLater = (scriptId: string) => {
    remindLater(scriptId);
    toast({
      title: "⏰ Lembrete definido",
      description: "Vamos te lembrar novamente em 6 horas.",
    });
  };

  const fetchScripts = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cast publish_status to the correct type
      const typedScripts: Script[] = (data || []).map(script => ({
        ...script,
        publish_status: script.publish_status as PublishStatus | null,
      }));

      setScripts(typedScripts);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast({
        title: "Erro ao carregar roteiros",
        description: "Não foi possível carregar os roteiros.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const getScriptStage = (script: Script): string => {
    if (script.shot_list && script.shot_list.length > 0) {
      return "record";
    } else if (script.status === "review") {
      return "review";
    } else if (script.content && script.content.length > 100) {
      return "script";
    } else {
      return "idea";
    }
  };

  const getScriptsForDate = (checkDate: Date) => {
    return scripts.filter((script) => {
      const scriptDate = script.publish_date || script.created_at;
      // Compare apenas a parte da data, ignorando timezone
      const scriptDateOnly = scriptDate.split('T')[0];
      const checkDateOnly = format(checkDate, "yyyy-MM-dd");
      const dateMatches = scriptDateOnly === checkDateOnly;
      
      if (!dateMatches) return false;
      
      // Apply content type filter
      const contentTypeMatches = contentTypeFilter === "all" || script.content_type === contentTypeFilter;
      
      // Apply stage filter
      const stageMatches = stageFilter === "all" || getScriptStage(script) === stageFilter;
      
      return contentTypeMatches && stageMatches;
    });
  };

  const handleCreateNewScript = () => {
    navigate('/session?stage=idea');
  };

  const handleViewScript = (scriptId: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (!script) return;
    
    // Detectar estágio atual baseado na lógica do sistema
    if (script.shot_list && script.shot_list.length > 0) {
      navigate(`/shot-list/record?scriptId=${scriptId}`);
    } else if (script.status === "review") {
      navigate(`/session?stage=review&scriptId=${scriptId}`);
    } else if (script.content && script.content.length > 100) {
      navigate(`/session?stage=script&scriptId=${scriptId}`);
    } else {
      navigate(`/session?stage=idea&scriptId=${scriptId}`);
    }
  };

  const handleDragStart = (e: React.DragEvent, script: Script) => {
    setDraggedScript(script);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(format(targetDate, "yyyy-MM-dd"));
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);
    
    if (!draggedScript) return;

    const newPublishDate = format(targetDate, "yyyy-MM-dd");
    
    // Atualizar imediatamente a interface
    const updatedScripts = scripts.map(s => 
      s.id === draggedScript.id 
        ? { ...s, publish_date: newPublishDate }
        : s
    );
    setScripts(updatedScripts);
    setDraggedScript(null);

    // Atualizar no banco de dados
    try {
      const { error } = await supabase
        .from('scripts')
        .update({ publish_date: newPublishDate })
        .eq('id', draggedScript.id);

      if (error) throw error;

      toast({
        title: "Data atualizada",
        description: "A data de publicação foi alterada com sucesso!",
      });
    } catch (error) {
      console.error('Error updating script date:', error);
      toast({
        title: "Erro ao atualizar data",
        description: "Não foi possível alterar a data de publicação.",
        variant: "destructive",
      });
      
      // Reverter mudança em caso de erro
      fetchScripts();
    }
  };

  const handleDayClick = (date: Date, scripts: Script[]) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const handleAddScript = (date: Date) => {
    const publishDate = format(date, "yyyy-MM-dd");
    navigate(`/session?stage=idea&publishDate=${publishDate}`);
  };

  const handleDeleteScript = async (e: React.MouseEvent, scriptId: string) => {
    e.stopPropagation();
    
    // Remover imediatamente da interface
    setScripts(scripts.filter(s => s.id !== scriptId));
    
    // Excluir do banco de dados
    try {
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', scriptId);

      if (error) throw error;

      toast({
        title: "Conteúdo excluído",
        description: "O conteúdo foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting script:', error);
      // Recarregar scripts em caso de erro
      fetchScripts();
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o conteúdo.",
        variant: "destructive",
      });
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekEnd = endOfWeek(currentDate, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToPreviousWeek = () => setCurrentDate(subMonths(currentDate, 0.25));
  const goToNextWeek = () => setCurrentDate(addMonths(currentDate, 0.25));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Calendário Editorial</h1>
            <Button onClick={handleCreateNewScript}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Ideia
            </Button>
          </div>
        </div>
      </div>

      {isIdeationMode && (
        <div className="container mx-auto px-4 pt-4">
          <Alert data-testid="banner-ideation" className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent">
            <Lightbulb className="h-4 w-4 text-accent" />
            <AlertDescription className="text-foreground">
              Modo Ideação: arraste ideias para as datas e monte sua semana.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="container mx-auto px-4 py-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "week")}>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <TabsList>
                <TabsTrigger value="month">Mês</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="Reels">Reels</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="X (Twitter)">X (Twitter)</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filtrar por etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as etapas</SelectItem>
                    <SelectItem value="idea">Ideação</SelectItem>
                    <SelectItem value="script">Roteiro</SelectItem>
                    <SelectItem value="review">Revisão</SelectItem>
                    <SelectItem value="record">Gravação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={viewMode === "month" ? goToPreviousMonth : goToPreviousWeek}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-lg font-semibold min-w-[200px] text-center">
                {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={viewMode === "month" ? goToNextMonth : goToNextWeek}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <TabsContent value="month" className="mt-0">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Calendar Header */}
              <div className="grid grid-cols-7 bg-muted/30 border-b border-border">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {monthDays.map((day, idx) => {
                  const dayScripts = getScriptsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div key={idx} className={idx % 7 === 6 ? "" : ""}>
                      <CalendarDay
                        day={day}
                        scripts={dayScripts}
                        isCurrentMonth={isCurrentMonth}
                        isToday={isToday}
                        compact={deviceType === "mobile" || deviceType === "tablet"}
                        onDayClick={handleDayClick}
                        onAddScript={handleAddScript}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onViewScript={handleViewScript}
                        onDeleteScript={handleDeleteScript}
                        draggedScript={draggedScript}
                        dragOverDate={dragOverDate}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="week" className="mt-0">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Week Header */}
              <div className="grid grid-cols-7 bg-muted/30 border-b border-border">
                {weekDays.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div key={day.toISOString()} className="p-4 text-center border-r border-border last:border-r-0">
                      <div className="text-xs text-muted-foreground">
                        {format(day, "EEE", { locale: ptBR })}
                      </div>
                      <div className={`text-2xl font-semibold mt-1 ${
                        isToday ? "text-primary" : "text-foreground"
                      }`}>
                        {format(day, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Week Grid */}
              <div className="grid grid-cols-7">
                {weekDays.map((day) => {
                  const dayScripts = getScriptsForDate(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <CalendarDay
                      key={day.toISOString()}
                      day={day}
                      scripts={dayScripts}
                      isCurrentMonth={true}
                      isToday={isToday}
                      compact={deviceType === "mobile" || deviceType === "tablet"}
                      onDayClick={handleDayClick}
                      onAddScript={handleAddScript}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onViewScript={handleViewScript}
                      onDeleteScript={handleDeleteScript}
                      draggedScript={draggedScript}
                      dragOverDate={dragOverDate}
                    />
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DayContentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        date={selectedDate}
        scripts={selectedDate ? getScriptsForDate(selectedDate) : []}
        onViewScript={handleViewScript}
        onAddScript={handleAddScript}
        onRefresh={fetchScripts}
      />

      {/* Popup for overdue content */}
      <PostConfirmationPopup
        open={isPopupOpen}
        onOpenChange={setIsPopupOpen}
        script={currentPopupScript}
        onMarkAsPosted={handlePopupMarkAsPosted}
        onReschedule={handlePopupReschedule}
        onRemindLater={handlePopupRemindLater}
      />
    </div>
  );
};

export default CalendarioEditorial;
