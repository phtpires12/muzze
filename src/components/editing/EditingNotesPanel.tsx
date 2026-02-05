import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, StickyNote, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditingNotesPanelProps {
  notes: string;
  onSave: (notes: string) => void;
}

export function EditingNotesPanel({ notes, onSave }: EditingNotesPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [localNotes, setLocalNotes] = useState(notes);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Sync with props
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  // Debounced auto-save
  useEffect(() => {
    if (localNotes === notes) return;

    const timer = setTimeout(() => {
      setIsSaving(true);
      onSave(localNotes);
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    }, 1000);

    return () => clearTimeout(timer);
  }, [localNotes, notes, onSave]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalNotes(e.target.value);
  }, []);

  const wordCount = localNotes.trim() ? localNotes.trim().split(/\s+/).length : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-border bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <StickyNote className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Notas de Edição</h3>
                <p className="text-xs text-muted-foreground">
                  {wordCount > 0 ? `${wordCount} palavras` : 'Adicione suas anotações'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Salvando...
                </span>
              )}
              {!isSaving && lastSaved && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Salvo
                </span>
              )}
              <ChevronDown className={cn(
                "w-5 h-5 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4">
            <Textarea
              value={localNotes}
              onChange={handleChange}
              placeholder="Ideias de transições, efeitos especiais, cortes importantes, referências visuais..."
              className="min-h-[120px] resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Auto-salva enquanto você digita
            </p>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
