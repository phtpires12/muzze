import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, FileText, List } from "lucide-react";

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
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [scripts, setScripts] = useState<CalendarScript[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [selectedScript, setSelectedScript] = useState<CalendarScript | null>(null);
  const [newShotItem, setNewShotItem] = useState("");

  const handleCreateScript = () => {
    if (!scriptTitle.trim() || !date) return;

    const newScript: CalendarScript = {
      id: Date.now().toString(),
      title: scriptTitle,
      content: scriptContent,
      date: date,
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

  const selectedDateScripts = date ? getScriptsForDate(date) : [];

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          Calendário Editorial
        </h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Roteiro
        </Button>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "week")}>
        <TabsList className="mb-4">
          <TabsTrigger value="month">Mensal</TabsTrigger>
          <TabsTrigger value="week">Semanal</TabsTrigger>
        </TabsList>

        <TabsContent value="month">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={ptBR}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateScripts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum roteiro agendado para esta data
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selectedDateScripts.map((script) => (
                      <Card key={script.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedScript(script)}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {script.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {script.content}
                          </p>
                          {script.shotList && script.shotList.length > 0 && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                              <List className="w-4 h-4" />
                              {script.shotList.length} shots
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardContent className="p-4">
              <p className="text-center text-muted-foreground py-8">
                Visão semanal em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Script Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Roteiro ao Calendário</DialogTitle>
            <DialogDescription>
              Crie um roteiro e agende-o para {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "uma data"}
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
