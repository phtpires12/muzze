import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  Video, 
  Plus, 
  ExternalLink, 
  Copy, 
  Trash2,
  CloudIcon,
  Youtube,
  HardDrive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface VideoReference {
  id: string;
  name: string;
  url: string;
  type: 'google_drive' | 'dropbox' | 'youtube' | 'other';
  addedAt: string;
}

interface VideoReferencesPanelProps {
  references: VideoReference[];
  onAdd: (reference: Omit<VideoReference, 'id' | 'addedAt'>) => void;
  onRemove: (id: string) => void;
}

function detectUrlType(url: string): VideoReference['type'] {
  if (url.includes('drive.google.com')) return 'google_drive';
  if (url.includes('dropbox.com')) return 'dropbox';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'other';
}

function getTypeIcon(type: VideoReference['type']) {
  switch (type) {
    case 'google_drive':
      return <HardDrive className="w-4 h-4 text-green-500" />;
    case 'dropbox':
      return <CloudIcon className="w-4 h-4 text-blue-500" />;
    case 'youtube':
      return <Youtube className="w-4 h-4 text-red-500" />;
    default:
      return <Video className="w-4 h-4 text-muted-foreground" />;
  }
}

function getTypeName(type: VideoReference['type']) {
  switch (type) {
    case 'google_drive': return 'Google Drive';
    case 'dropbox': return 'Dropbox';
    case 'youtube': return 'YouTube';
    default: return 'Link';
  }
}

export function VideoReferencesPanel({ references, onAdd, onRemove }: VideoReferencesPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const { toast } = useToast();

  const handleAdd = () => {
    if (!newUrl.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Cole o link do arquivo de vídeo",
        variant: "destructive",
      });
      return;
    }

    const type = detectUrlType(newUrl);
    onAdd({
      name: newName.trim() || `Take ${references.length + 1}`,
      url: newUrl.trim(),
      type,
    });

    setNewUrl('');
    setNewName('');

    toast({
      title: "Arquivo adicionado",
      description: `${getTypeName(type)} salvo como referência`,
    });
  };

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado",
      description: "URL copiada para a área de transferência",
    });
  };

  const handleOpen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-border bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Video className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Arquivos de Vídeo</h3>
                <p className="text-xs text-muted-foreground">
                  {references.length} {references.length === 1 ? 'arquivo' : 'arquivos'}
                </p>
              </div>
            </div>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Add new reference */}
            <div className="space-y-2">
              <Input
                placeholder="Nome do arquivo (opcional)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Cole o link do Google Drive, Dropbox, etc..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="flex-1 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button onClick={handleAdd} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* References list */}
            {references.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum arquivo adicionado</p>
                <p className="text-xs">Cole links do Drive, Dropbox ou YouTube</p>
              </div>
            ) : (
              <div className="space-y-2">
                {references.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
                  >
                    {getTypeIcon(ref.type)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {ref.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTypeName(ref.type)}
                      </p>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(ref.url)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpen(ref.url)}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(ref.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
