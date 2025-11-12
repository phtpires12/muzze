import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Script {
  id: string;
  title: string;
  content: string | null;
  content_type: string | null;
  publish_date: string | null;
  created_at: string;
  shot_list: string[];
}

const CalendarioEditorial = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isIdeationMode = searchParams.get("mode") === "ideation";
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [scripts, setScripts] = useState<Script[]>([]);
  const [draggedScript, setDraggedScript] = useState<Script | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setScripts(data || []);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast({
        title: "Erro ao carregar roteiros",
        description: "Não foi possível carregar os roteiros.",
        variant: "destructive",
      });
    }
  };

  const getScriptsForDate = (checkDate: Date) => {
    return scripts.filter((script) => {
      const scriptDate = script.publish_date || script.created_at;
      // Compare apenas a parte da data, ignorando timezone
      const scriptDateOnly = scriptDate.split('T')[0];
      const checkDateOnly = format(checkDate, "yyyy-MM-dd");
      return scriptDateOnly === checkDateOnly;
    });
  };

  const handleCreateNewScript = () => {
    navigate('/session?stage=script');
  };

  const handleViewScript = (scriptId: string) => {
    navigate(`/session?stage=script&scriptId=${scriptId}`);
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
              Novo Roteiro
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
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
            </TabsList>
            
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

                  const isDragOver = dragOverDate === format(day, "yyyy-MM-dd");
                  
                  return (
                    <div
                      key={idx}
                      className={`min-h-[120px] border-r border-b border-border p-2 transition-all ${
                        !isCurrentMonth ? "bg-muted/10" : "bg-card"
                      } ${idx % 7 === 6 ? "border-r-0" : ""} ${
                        isDragOver ? "bg-primary/20 ring-2 ring-primary ring-inset shadow-lg" : ""
                      }`}
                      onDragOver={(e) => handleDragOver(e, day)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day)}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        !isCurrentMonth ? "text-muted-foreground" : isToday ? "text-primary" : "text-foreground"
                      }`}>
                        {format(day, "d")}
                      </div>
                      
                      <div className="space-y-1">
                        {dayScripts.slice(0, 3).map((script) => (
                          <div
                            key={script.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, script)}
                            className={`text-xs p-2 rounded-lg bg-card/80 border border-border/50 cursor-move hover:bg-card hover:border-border hover:shadow-md transition-all ${
                              draggedScript?.id === script.id ? "opacity-50" : ""
                            }`}
                            onClick={() => handleViewScript(script.id)}
                          >
                            <div className="font-semibold truncate mb-1.5 text-foreground">
                              {script.title}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {script.content_type && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {script.content_type}
                                </Badge>
                              )}
                              {script.shot_list && script.shot_list.length > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {script.shot_list.length} shots
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        {dayScripts.length > 3 && (
                          <div className="text-xs text-muted-foreground pl-1">
                            +{dayScripts.length - 3} mais
                          </div>
                        )}
                      </div>
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

                  const isDragOver = dragOverDate === format(day, "yyyy-MM-dd");
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[400px] border-r border-border last:border-r-0 p-3 transition-all ${
                        isDragOver ? "bg-primary/20 ring-2 ring-primary ring-inset shadow-lg" : ""
                      }`}
                      onDragOver={(e) => handleDragOver(e, day)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day)}
                    >
                      <div className="space-y-2">
                        {dayScripts.map((script) => (
                          <div
                            key={script.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, script)}
                            className={`p-3 rounded-lg bg-card border border-border cursor-move hover:border-primary/50 hover:shadow-md transition-all ${
                              draggedScript?.id === script.id ? "opacity-50" : ""
                            }`}
                            onClick={() => handleViewScript(script.id)}
                          >
                            <div className="font-semibold text-sm mb-2">{script.title}</div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {script.content_type && (
                                <Badge variant="secondary" className="text-xs">
                                  {script.content_type}
                                </Badge>
                              )}
                              {script.shot_list && script.shot_list.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {script.shot_list.length} shots
                                </Badge>
                              )}
                            </div>
                            {script.content && (
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {script.content}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CalendarioEditorial;
