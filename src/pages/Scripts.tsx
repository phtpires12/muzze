import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2, Edit, Check, Film, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
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
  createdAt: string;
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
        createdAt: new Date().toISOString(),
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
                scripts.map((script) => (
                  <Card key={script.id} className="p-6 space-y-4 hover:shadow-lg transition-all duration-300">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{script.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {script.content || "Sem conteúdo"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {new Date(script.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex gap-2">
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
                ))
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
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Checklist de gravação
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Checkbox id="record-1" />
                    <label htmlFor="record-1" className="text-sm cursor-pointer flex-1">
                      Equipamento verificado e testado
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Checkbox id="record-2" />
                    <label htmlFor="record-2" className="text-sm cursor-pointer flex-1">
                      Iluminação configurada
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Checkbox id="record-3" />
                    <label htmlFor="record-3" className="text-sm cursor-pointer flex-1">
                      Áudio testado
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Checkbox id="record-4" />
                    <label htmlFor="record-4" className="text-sm cursor-pointer flex-1">
                      Roteiro revisado
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Checkbox id="record-5" />
                    <label htmlFor="record-5" className="text-sm cursor-pointer flex-1">
                      Gravação concluída
                    </label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4 pt-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Checklist de edição
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Checkbox id="edit-1" />
                    <label htmlFor="edit-1" className="text-sm cursor-pointer flex-1">
                      Footage importado e organizado
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Checkbox id="edit-2" />
                    <label htmlFor="edit-2" className="text-sm cursor-pointer flex-1">
                      Cortes principais feitos
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Checkbox id="edit-3" />
                    <label htmlFor="edit-3" className="text-sm cursor-pointer flex-1">
                      Transições adicionadas
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Checkbox id="edit-4" />
                    <label htmlFor="edit-4" className="text-sm cursor-pointer flex-1">
                      Correção de cor aplicada
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Checkbox id="edit-5" />
                    <label htmlFor="edit-5" className="text-sm cursor-pointer flex-1">
                      Áudio mixado e sincronizado
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Checkbox id="edit-6" />
                    <label htmlFor="edit-6" className="text-sm cursor-pointer flex-1">
                      Revisão final concluída
                    </label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scripts;
