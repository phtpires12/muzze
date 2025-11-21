import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useDeviceType } from "@/hooks/useDeviceType";

const getScriptPreview = (content: string | null) => {
  if (!content) return null;
  const trimmed = content.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    
    // Se for objeto/array (caso do JSON com gancho/setup/etc), não mostra nada
    if (typeof parsed === "object") {
      return null;
    }
    
    // Se por acaso for um JSON de string simples, usamos essa string
    if (typeof parsed === "string") {
      return parsed;
    }
    
    return null;
  } catch {
    // Se não for JSON válido, tratamos como texto normal
    return trimmed;
  }
};

interface Script {
  id: string;
  title: string;
  content: string | null;
  content_type: string | null;
  publish_date: string | null;
  created_at: string;
  shot_list: string[];
}

interface DayContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  scripts: Script[];
  onViewScript: (scriptId: string) => void;
  onAddScript: (date: Date) => void;
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

  const content = (
    <div className="space-y-4">
      {scripts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Nenhum conteúdo agendado para este dia</p>
          <Button onClick={() => onAddScript(date)} className="mx-auto">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Roteiro
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {scripts.map((script) => {
              const preview = getScriptPreview(script.content);
              
              return (
                <div
                  key={script.id}
                  className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-foreground line-clamp-2">{script.title}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewScript(script.id)}
                      className="shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
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

                  {preview && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{preview}</p>
                  )}
                </div>
              );
            })}
          </div>

          <Button onClick={() => onAddScript(date)} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Mais Roteiros
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
            <DrawerTitle>{format(date, "d 'de' MMMM", { locale: ptBR })}</DrawerTitle>
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
          <DialogTitle>{format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
