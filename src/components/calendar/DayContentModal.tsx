import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useDeviceType } from "@/hooks/useDeviceType";

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
}

interface DayContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  scripts: Script[];
  onViewScript: (scriptId: string) => void;
  onAddScript: (date: Date) => void;
}

function IdeaCard({ 
  script, 
  onViewScript 
}: { 
  script: Script; 
  onViewScript: (scriptId: string) => void;
}) {
  const handleRoteirizar = () => {
    onViewScript(script.id);
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      {/* Header with title */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-2">
            {script.title || "Sem título"}
          </h3>
          {script.content_type && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {script.content_type}
            </Badge>
          )}
        </div>
      </div>

      {/* Central idea */}
      {script.central_idea && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Ideia Central:</p>
          <p className="text-sm text-foreground line-clamp-3">{script.central_idea}</p>
        </div>
      )}

      {/* Reference URL */}
      {script.reference_url && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Referência:</p>
          <a 
            href={script.reference_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">{script.reference_url}</span>
          </a>
        </div>
      )}

      {/* CTA Button */}
      <Button 
        onClick={handleRoteirizar}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        Roteirizar essa ideia
      </Button>
    </div>
  );
}

export function DayContentModal({
  open,
  onOpenChange,
  date,
  scripts,
  onViewScript,
  onAddScript,
}: DayContentModalProps) {
  const deviceType = useDeviceType();

  if (!date) return null;

  const formattedDate = format(date, "dd/MM/yyyy");
  const titleDate = format(date, "d 'de' MMMM", { locale: ptBR });

  const content = (
    <div className="space-y-4">
      {scripts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Nenhuma ideia agendada para este dia</p>
          <Button onClick={() => onAddScript(date)} className="mx-auto">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Ideia
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {scripts.map((script) => (
              <IdeaCard 
                key={script.id} 
                script={script} 
                onViewScript={onViewScript} 
              />
            ))}
          </div>

          <Button onClick={() => onAddScript(date)} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Mais Ideias
          </Button>
        </>
      )}
    </div>
  );

  // Mobile: Use Drawer
  if (deviceType === "mobile") {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Ideias Agendadas - {formattedDate}</DrawerTitle>
            <DrawerDescription>
              Visualize e roteirize suas ideias agendadas para este dia
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 max-h-[70vh] overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Tablet/Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ideias Agendadas - {titleDate}</DialogTitle>
          <DialogDescription>
            Visualize e roteirize suas ideias agendadas para este dia
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
