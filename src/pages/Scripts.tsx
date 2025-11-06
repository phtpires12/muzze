import { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

const Scripts = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentScript, setCurrentScript] = useState<Script | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("scripts");
    if (saved) {
      setScripts(JSON.parse(saved));
    }
  }, []);

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

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Roteiros</h1>
          <p className="text-muted-foreground">Organize suas ideias e scripts</p>
        </div>
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
    </div>
  );
};

export default Scripts;
