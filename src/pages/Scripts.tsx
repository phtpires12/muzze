import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2, Edit, Check, Film, Scissors, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Script {
  id: string;
  title: string;
  content: string;
  status: "ideia" | "roteiro-em-progresso" | "roteiro-pronto" | "gravado" | "edição-pendente";
  createdAt: string;
  recordingChecklist?: {
    locationConfirmed: boolean;
    equipmentReady: boolean;
    lightingChecked: boolean;
  };
  editingChecklist?: {
    footageImported: boolean;
    roughCutDone: boolean;
    finalReviewDone: boolean;
  };
}

interface ShotItem {
  id: string;
  description: string;
  completed: boolean;
}

interface ShotList {
  id: string;
  title: string;
  items: ShotItem[];
  createdAt: string;
}

const Scripts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentScript, setCurrentScript] = useState<Script | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  const [shotLists, setShotLists] = useState<ShotList[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");

  // Detail view states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailScript, setDetailScript] = useState<Script | null>(null);
  const [detailTab, setDetailTab] = useState<"record" | "edit">("record");

  // Status config
  const statusConfig: Record<Script["status"], { label: string; icon: any; color: string }> = {
    "ideia": { label: "Ideia", icon: Lightbulb, color: "text-yellow-500" },
    "roteiro-em-progresso": { label: "Roteiro em progresso", icon: Edit, color: "text-blue-500" },
    "roteiro-pronto": { label: "Roteiro pronto", icon: Check, color: "text-green-500" },
    "gravado": { label: "Gravado", icon: Film, color: "text-purple-500" },
    "edição-pendente": { label: "Edição pendente", icon: Scissors, color: "text-orange-500" },
  };

  const statusFlow: Record<Script["status"], Script["status"] | null> = {
    "ideia": "roteiro-em-progresso",
    "roteiro-em-progresso": "roteiro-pronto",
    "roteiro-pronto": "gravado",
    "gravado": "edição-pendente",
    "edição-pendente": null,
  };


  useEffect(() => {
    const saved = localStorage.getItem("scripts");
    if (saved) {
      setScripts(JSON.parse(saved));
    }
    const savedLists = localStorage.getItem("shotLists");
    if (savedLists) {
      setShotLists(JSON.parse(savedLists));
    }
  }, []);

  // Handle query params
  useEffect(() => {
    const newParam = searchParams.get("new");
    const openParam = searchParams.get("open");
    const detailParam = searchParams.get("detail");
    const tabParam = searchParams.get("tab") as "record" | "edit" | null;

    if (newParam === "1") {
      setIsEditing(true);
      setCurrentScript(null);
      setTitle("");
      setContent("");
      setTimeout(() => titleInputRef.current?.focus(), 100);
      searchParams.delete("new");
      setSearchParams(searchParams);
    } else if (openParam) {
      const script = scripts.find((s) => s.id === openParam);
      if (script) {
        handleEdit(script);
      }
      searchParams.delete("open");
      setSearchParams(searchParams);
    } else if (detailParam) {
      const script = scripts.find((s) => s.id === detailParam);
      if (script) {
        setDetailScript(script);
        setDetailTab(tabParam || "record");
        setIsDetailOpen(true);
      }
      searchParams.delete("detail");
      searchParams.delete("tab");
      setSearchParams(searchParams);
    }
  }, [searchParams, scripts]);

  const saveScripts = (newScripts: Script[]) => {
    localStorage.setItem("scripts", JSON.stringify(newScripts));
    setScripts(newScripts);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (currentScript) {
      const updated = scripts.map((s) =>
        s.id === currentScript.id ? { ...s, title, content } : s
      );
      saveScripts(updated);
      toast.success("Roteiro atualizado!");
    } else {
      const newScript: Script = {
        id: Date.now().toString(),
        title,
        content,
        status: "ideia",
        createdAt: new Date().toISOString(),
        recordingChecklist: {
          locationConfirmed: false,
          equipmentReady: false,
          lightingChecked: false,
        },
        editingChecklist: {
          footageImported: false,
          roughCutDone: false,
          finalReviewDone: false,
        },
      };
      saveScripts([...scripts, newScript]);
      toast.success("Roteiro criado!");
    }

    setIsEditing(false);
    setTitle("");
    setContent("");
    setCurrentScript(null);
  };

  const handleEdit = (script: Script) => {
    setCurrentScript(script);
    setTitle(script.title);
    setContent(script.content);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    saveScripts(scripts.filter((s) => s.id !== id));
    toast.success("Roteiro excluído!");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle("");
    setContent("");
    setCurrentScript(null);
  };

  const advanceStatus = (script: Script) => {
    const nextStatus = statusFlow[script.status];
    if (!nextStatus) {
      toast.info("Este item já está no status final");
      return;
    }

    const updated = scripts.map((s) =>
      s.id === script.id ? { ...s, status: nextStatus } : s
    );
    saveScripts(updated);
    toast.success(`Status atualizado para: ${statusConfig[nextStatus].label}`);
  };

  const canShowRecordingChecklist = (status: Script["status"]) => {
    return status === "roteiro-pronto" || status === "gravado";
  };

  const canShowEditingChecklist = (status: Script["status"]) => {
    return status === "gravado" || status === "edição-pendente";
  };

  const updateChecklist = (scriptId: string, type: "recording" | "editing", field: string, value: boolean) => {
    const updated = scripts.map((s) => {
      if (s.id === scriptId) {
        if (type === "recording") {
          return {
            ...s,
            recordingChecklist: { ...s.recordingChecklist!, [field]: value },
          };
        } else {
          return {
            ...s,
            editingChecklist: { ...s.editingChecklist!, [field]: value },
          };
        }
      }
      return s;
    });
    saveScripts(updated);
    
    // Update detail script if it's the current one
    if (detailScript?.id === scriptId) {
      const updatedScript = updated.find(s => s.id === scriptId);
      if (updatedScript) {
        setDetailScript(updatedScript);
      }
    }
  };


  const saveShotLists = (lists: ShotList[]) => {
    localStorage.setItem("shotLists", JSON.stringify(lists));
    setShotLists(lists);
  };

  const createList = () => {
    if (!newListTitle.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    const newList: ShotList = {
      id: Date.now().toString(),
      title: newListTitle,
      items: [],
      createdAt: new Date().toISOString(),
    };

    saveShotLists([...shotLists, newList]);
    setNewListTitle("");
    setIsCreating(false);
    toast.success("Shot List criada!");
  };

  const addItem = (listId: string) => {
    if (!newItemDescription.trim()) return;

    const updated = shotLists.map((list) => {
      if (list.id === listId) {
        return {
          ...list,
          items: [
            ...list.items,
            {
              id: Date.now().toString(),
              description: newItemDescription,
              completed: false,
            },
          ],
        };
      }
      return list;
    });

    saveShotLists(updated);
    setNewItemDescription("");
    toast.success("Shot adicionado!");
  };

  const toggleItem = (listId: string, itemId: string) => {
    const updated = shotLists.map((list) => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      }
      return list;
    });
    saveShotLists(updated);
  };

  const deleteList = (listId: string) => {
    saveShotLists(shotLists.filter((list) => list.id !== listId));
    toast.success("Shot List excluída!");
  };

  const deleteItem = (listId: string, itemId: string) => {
    const updated = shotLists.map((list) => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.filter((item) => item.id !== itemId),
        };
      }
      return list;
    });
    saveShotLists(updated);
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Roteiros</h1>
        <p className="text-muted-foreground">Organize suas ideias e scripts</p>
      </div>

      <Tabs defaultValue="scripts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scripts">Roteiros</TabsTrigger>
          <TabsTrigger value="shotlists">Shot Lists</TabsTrigger>
        </TabsList>

        <TabsContent value="scripts" className="space-y-6">
          <div className="flex justify-end">
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Roteiro
              </Button>
            )}
          </div>

          {isEditing ? (
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input
                  ref={titleInputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Roteiro para vídeo sobre..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Conteúdo</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva seu roteiro aqui..."
                  className="min-h-[400px]"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  {currentScript ? "Atualizar" : "Salvar"}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scripts.length === 0 ? (
                <Card className="col-span-full p-12 text-center">
                  <p className="text-muted-foreground">
                    Nenhum roteiro criado ainda. Comece criando seu primeiro!
                  </p>
                </Card>
              ) : (
                scripts.map((script) => {
                  const StatusIcon = statusConfig[script.status].icon;
                  return (
                    <Card key={script.id} className="p-6 space-y-4 hover:shadow-lg transition-all duration-300">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold flex-1">{script.title}</h3>
                          <Badge variant="outline" className={cn("gap-1", statusConfig[script.status].color)}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[script.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {script.content || "Sem conteúdo"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          {new Date(script.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <div className="flex gap-2">
                          {statusFlow[script.status] && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => advanceStatus(script)}
                              title="Avançar status"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(script)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(script.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shotlists" className="space-y-6">
          <div className="flex justify-end">
            {!isCreating && (
              <Button onClick={() => setIsCreating(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Lista
              </Button>
            )}
          </div>

          {isCreating && (
            <Card className="p-6 space-y-4">
              <Input
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Nome da Shot List..."
                onKeyPress={(e) => e.key === 'Enter' && createList()}
              />
              <div className="flex gap-2">
                <Button onClick={createList}>Criar</Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shotLists.length === 0 ? (
              <Card className="col-span-full p-12 text-center">
                <p className="text-muted-foreground">
                  Nenhuma shot list criada ainda. Comece planejando suas cenas!
                </p>
              </Card>
            ) : (
              shotLists.map((list) => {
                const completed = list.items.filter((i) => i.completed).length;
                const total = list.items.length;
                const progress = total > 0 ? (completed / total) * 100 : 0;

                return (
                  <Card key={list.id} className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{list.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {completed} de {total} completos
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteList(list.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {total > 0 && (
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      {list.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleItem(list.id, item.id)}
                          />
                          <span
                            className={`flex-1 text-sm ${
                              item.completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {item.description}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem(list.id, item.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="Adicionar shot..."
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addItem(list.id);
                          }
                        }}
                      />
                      <Button onClick={() => addItem(list.id)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog for Record/Edit */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailScript?.title}</DialogTitle>
            <DialogDescription>
              {detailTab === "record" ? "Checklist de gravação" : "Checklist de edição"}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={detailTab} onValueChange={(v) => setDetailTab(v as "record" | "edit")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="record">
                <Film className="w-4 h-4 mr-2" />
                Gravação
              </TabsTrigger>
              <TabsTrigger value="edit">
                <Scissors className="w-4 h-4 mr-2" />
                Edição
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="space-y-4 pt-4">
              {detailScript && canShowRecordingChecklist(detailScript.status) ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Checklist de gravação
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Checkbox 
                        id="record-equipment" 
                        checked={detailScript.recordingChecklist?.equipmentReady || false}
                        onCheckedChange={(checked) => 
                          updateChecklist(detailScript.id, "recording", "equipmentReady", checked as boolean)
                        }
                      />
                      <label htmlFor="record-equipment" className="text-sm cursor-pointer flex-1">
                        Equipamento verificado e testado
                      </label>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Checkbox 
                        id="record-lighting" 
                        checked={detailScript.recordingChecklist?.lightingChecked || false}
                        onCheckedChange={(checked) => 
                          updateChecklist(detailScript.id, "recording", "lightingChecked", checked as boolean)
                        }
                      />
                      <label htmlFor="record-lighting" className="text-sm cursor-pointer flex-1">
                        Iluminação configurada
                      </label>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Checkbox 
                        id="record-location" 
                        checked={detailScript.recordingChecklist?.locationConfirmed || false}
                        onCheckedChange={(checked) => 
                          updateChecklist(detailScript.id, "recording", "locationConfirmed", checked as boolean)
                        }
                      />
                      <label htmlFor="record-location" className="text-sm cursor-pointer flex-1">
                        Localização confirmada
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Checklist de gravação disponível quando o roteiro estiver pronto.
                </p>
              )}
            </TabsContent>

            <TabsContent value="edit" className="space-y-4 pt-4">
              {detailScript && canShowEditingChecklist(detailScript.status) ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Checklist de edição
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Checkbox 
                        id="edit-imported" 
                        checked={detailScript.editingChecklist?.footageImported || false}
                        onCheckedChange={(checked) => 
                          updateChecklist(detailScript.id, "editing", "footageImported", checked as boolean)
                        }
                      />
                      <label htmlFor="edit-imported" className="text-sm cursor-pointer flex-1">
                        Footage importado e organizado
                      </label>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Checkbox 
                        id="edit-rough" 
                        checked={detailScript.editingChecklist?.roughCutDone || false}
                        onCheckedChange={(checked) => 
                          updateChecklist(detailScript.id, "editing", "roughCutDone", checked as boolean)
                        }
                      />
                      <label htmlFor="edit-rough" className="text-sm cursor-pointer flex-1">
                        Cortes principais feitos
                      </label>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Checkbox 
                        id="edit-final" 
                        checked={detailScript.editingChecklist?.finalReviewDone || false}
                        onCheckedChange={(checked) => 
                          updateChecklist(detailScript.id, "editing", "finalReviewDone", checked as boolean)
                        }
                      />
                      <label htmlFor="edit-final" className="text-sm cursor-pointer flex-1">
                        Revisão final concluída
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Checklist de edição disponível após a gravação.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scripts;
