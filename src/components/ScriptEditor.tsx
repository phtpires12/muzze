import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Calendar,
  FileText,
  Link as LinkIcon,
  ListChecks,
  Tag,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScriptEditorProps {
  onClose?: () => void;
}

export const ScriptEditor = ({ onClose }: ScriptEditorProps) => {
  const [title, setTitle] = useState("Novo Roteiro");
  const [content, setContent] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [shotList, setShotList] = useState<string[]>([]);
  const [contentType, setContentType] = useState("");
  const [publishDate, setPublishDate] = useState("");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with close button */}
        {onClose && (
          <div className="flex justify-end mb-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Title */}
        <div className="mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-4xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            placeholder="Título do Roteiro"
          />
        </div>

        {/* Properties Grid */}
        <div className="mb-8 space-y-3">
          {/* Content Type */}
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-2 min-w-[180px] text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Tipo de Conteúdo</span>
            </div>
            <Input
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              placeholder="Ex: Reels, YouTube, TikTok..."
              className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Publish Date */}
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-2 min-w-[180px] text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Data de Publicação</span>
            </div>
            <Input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* References */}
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-2 min-w-[180px] text-sm text-muted-foreground pt-2">
              <LinkIcon className="w-4 h-4" />
              <span>Referências</span>
            </div>
            <div className="flex-1">
              {references.length === 0 ? (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setReferences([""])}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Adicionar referência
                </Button>
              ) : (
                <div className="space-y-2">
                  {references.map((ref, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={ref}
                        onChange={(e) => {
                          const newRefs = [...references];
                          newRefs[index] = e.target.value;
                          setReferences(newRefs);
                        }}
                        placeholder="https://..."
                        className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setReferences(references.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReferences([...references, ""])}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    + Adicionar mais
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Shot List */}
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-2 min-w-[180px] text-sm text-muted-foreground pt-2">
              <ListChecks className="w-4 h-4" />
              <span>Shot List</span>
            </div>
            <div className="flex-1">
              {shotList.length === 0 ? (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShotList([""])}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Adicionar item
                </Button>
              ) : (
                <div className="space-y-2">
                  {shotList.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newList = [...shotList];
                          newList[index] = e.target.value;
                          setShotList(newList);
                        }}
                        placeholder="Descrição do plano..."
                        className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShotList(shotList.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShotList([...shotList, ""])}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    + Adicionar mais
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="space-y-4">
          <div className="border-l-4 border-primary/30 pl-4">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              📝 ROTEIRO
            </h3>
          </div>
          
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva seu roteiro aqui... 

Você pode organizar em seções como:
- INTRO (Gancho)
- DESENVOLVIMENTO
- CONCLUSÃO"
            className="min-h-[400px] text-base leading-relaxed resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          />
        </div>
      </div>
    </div>
  );
};
