import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, FileText, ChevronLeft, ChevronRight } from "lucide-react";

interface ShotItem {
  id: string;
  description: string;
  completed: boolean;
}

interface CalendarScript {
  id: string;
  title: string;
  content: string;
  date: Date;
  shotList?: ShotItem[];
}

const CalendarioEditorial = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [scripts, setScripts] = useState<CalendarScript[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [selectedScript, setSelectedScript] = useState<CalendarScript | null>(null);
  const [newShotItem, setNewShotItem] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleCreateScript = () => {
    if (!scriptTitle.trim() || !selectedDate) return;

    const newScript: CalendarScript = {
      id: Date.now().toString(),
      title: scriptTitle,
      content: scriptContent,
      date: selectedDate,
      shotList: [],
    };

    setScripts([...scripts, newScript]);
    setScriptTitle("");
    setScriptContent("");
    setIsCreateOpen(false);
  };

  const handleAddShotItem = () => {
    if (!selectedScript || !newShotItem.trim()) return;

    const updatedScripts = scripts.map((script) => {
      if (script.id === selectedScript.id) {
        return {
          ...script,
          shotList: [
            ...(script.shotList || []),
            {
              id: Date.now().toString(),
              description: newShotItem,
              completed: false,
            },
          ],
        };
      }
      return script;
    });

    setScripts(updatedScripts);
    setNewShotItem("");
  };

  const toggleShotItem = (scriptId: string, itemId: string) => {
    const updatedScripts = scripts.map((script) => {
      if (script.id === scriptId) {
        return {
          ...script,
          shotList: script.shotList?.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      }
      return script;
    });

    setScripts(updatedScripts);
  };

  const getScriptsForDate = (checkDate: Date) => {
    return scripts.filter(
      (script) =>
        format(script.date, "yyyy-MM-dd") === format(checkDate, "yyyy-MM-dd")
    );
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
            <Button onClick={() => {
              setSelectedDate(new Date());
              setIsCreateOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Roteiro
            </Button>
          </div>
        </div>
      </div>

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

                  return (
                    <div
                      key={idx}
                      className={`min-h-[120px] border-r border-b border-border p-2 ${
                        !isCurrentMonth ? "bg-muted/10" : "bg-card"
                      } ${idx % 7 === 6 ? "border-r-0" : ""}`}
                      onClick={() => {
                        setSelectedDate(day);
                        setIsCreateOpen(true);
                      }}
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
                            className="text-xs p-1.5 rounded bg-primary/10 border-l-2 border-primary cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedScript(script);
                            }}
                          >
                            <div className="font-medium truncate">{script.title}</div>
                            {script.shotList && script.shotList.length > 0 && (
                              <div className="text-muted-foreground">
                                {script.shotList.length} shots
                              </div>
                            )}
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

                  return (
                    <div
                      key={day.toISOString()}
                      className="min-h-[400px] border-r border-border last:border-r-0 p-3"
                      onClick={() => {
                        setSelectedDate(day);
                        setIsCreateOpen(true);
                      }}
                    >
                      <div className="space-y-2">
                        {dayScripts.map((script) => (
                          <div
                            key={script.id}
                            className="p-3 rounded-lg bg-primary/10 border-l-4 border-primary cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedScript(script);
                            }}
                          >
                            <div className="font-semibold text-sm mb-1">{script.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {script.content}
                            </div>
                            {script.shotList && script.shotList.length > 0 && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                {script.shotList.length} shots
                              </Badge>
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

      {/* Create Script Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Roteiro ao Calendário</DialogTitle>
            <DialogDescription>
              Crie um roteiro para {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "uma data"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Título do roteiro"
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
            />
            <Textarea
              placeholder="Conteúdo do roteiro"
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
              rows={6}
            />
            <Button onClick={handleCreateScript} className="w-full">
              Criar Roteiro
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Script Detail with Shot List Dialog */}
      <Dialog open={!!selectedScript} onOpenChange={() => setSelectedScript(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedScript?.title}</DialogTitle>
            <DialogDescription>
              {selectedScript?.date && format(selectedScript.date, "dd/MM/yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Conteúdo</h3>
              <p className="text-sm text-muted-foreground">{selectedScript?.content}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Shot List</h3>
              <div className="space-y-2 mb-4">
                {selectedScript?.shotList?.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-md bg-muted">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleShotItem(selectedScript.id, item.id)}
                      className="w-4 h-4"
                    />
                    <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar item à shot list"
                  value={newShotItem}
                  onChange={(e) => setNewShotItem(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddShotItem()}
                />
                <Button onClick={handleAddShotItem} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarioEditorial;
