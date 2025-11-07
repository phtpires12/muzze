import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Lightbulb } from "lucide-react";

interface Idea {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

const Ideias = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("ideas");
    if (saved) {
      setIdeas(JSON.parse(saved));
    }
  }, []);

  const saveIdeas = (newIdeas: Idea[]) => {
    localStorage.setItem("ideas", JSON.stringify(newIdeas));
    setIdeas(newIdeas);
  };

  const handleCreate = () => {
    if (!title.trim()) return;

    const newIdea: Idea = {
      id: Date.now().toString(),
      title,
      description,
      createdAt: new Date().toISOString(),
    };

    saveIdeas([...ideas, newIdea]);
    setTitle("");
    setDescription("");
  };

  const handleDelete = (id: string) => {
    saveIdeas(ideas.filter((idea) => idea.id !== id));
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
        Ideias
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Nova Ideia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Título da ideia"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <Button onClick={handleCreate} className="w-full">
            Salvar Ideia
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {ideas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ideia salva ainda</p>
            </CardContent>
          </Card>
        ) : (
          ideas.map((idea) => (
            <Card key={idea.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{idea.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(idea.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              {idea.description && (
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {idea.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Ideias;
