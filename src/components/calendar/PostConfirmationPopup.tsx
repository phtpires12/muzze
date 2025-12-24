import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, CalendarDays, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface OverdueScript {
  id: string;
  title: string;
  publish_date: string;
  publish_status: string;
  created_at: string;
}

interface PostConfirmationPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  script: OverdueScript | null;
  onMarkAsPosted: (scriptId: string) => void;
  onReschedule: (scriptId: string, newDate: Date) => void;
  onRemindLater: (scriptId: string) => void;
  onDelete?: (scriptId: string) => void;
}

export function PostConfirmationPopup({
  open,
  onOpenChange,
  script,
  onMarkAsPosted,
  onReschedule,
  onRemindLater,
  onDelete,
}: PostConfirmationPopupProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Só abre o modal se houver um script válido
  const isOpen = open && !!script;

  // Early return se não há script - retorna Dialog fechado para evitar overlay órfão
  if (!script) {
    return <Dialog open={false} onOpenChange={onOpenChange} />;
  }

  const wasAutoScheduled =
    script.created_at &&
    script.publish_date &&
    format(new Date(script.created_at), "yyyy-MM-dd") === script.publish_date;

  const handleMarkAsPosted = () => {
    onMarkAsPosted(script.id);
    onOpenChange(false);
  };

  const handleReschedule = () => {
    if (selectedDate) {
      onReschedule(script.id, selectedDate);
      onOpenChange(false);
      setShowDatePicker(false);
      setSelectedDate(undefined);
    }
  };

  const handleRemindLater = () => {
    onRemindLater(script.id);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(script.id);
      onOpenChange(false);
    }
  };

  const content = (
    <div className="space-y-4 py-2">
      <p className="text-center text-muted-foreground">
        {wasAutoScheduled
          ? "Esse conteúdo foi salvo sem data de publicação."
          : `Agendado para ${format(new Date(script.publish_date), "d 'de' MMMM", { locale: ptBR })}`}
      </p>

      <div className="space-y-3">
        {/* Só mostra "Sim, já publiquei" se não foi auto-agendado */}
        {!wasAutoScheduled && (
          <Button
            onClick={handleMarkAsPosted}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Sim, já publiquei
          </Button>
        )}

        {!showDatePicker ? (
          <Button
            onClick={() => setShowDatePicker(true)}
            variant="outline"
            className="w-full"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Ainda não, quero remarcar
          </Button>
        ) : (
          <div className="space-y-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {selectedDate
                    ? format(selectedDate, "PPP", { locale: ptBR })
                    : "Escolha uma nova data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {selectedDate && (
              <Button onClick={handleReschedule} className="w-full">
                Reagendar para {format(selectedDate, "d/MM", { locale: ptBR })}
              </Button>
            )}
          </div>
        )}

        <Button
          onClick={handleRemindLater}
          variant="ghost"
          className="w-full text-muted-foreground"
        >
          <Clock className="w-4 h-4 mr-2" />
          Lembrar mais tarde
        </Button>
      </div>
    </div>
  );

  const title = wasAutoScheduled
    ? `Você esqueceu de agendar "${script.title}"`
    : `Você conseguiu postar "${script.title}"?`;
  const description = wasAutoScheduled
    ? "Agende uma data para este conteúdo ou exclua-o"
    : "Atualize o status do seu conteúdo";

  const deleteButton = onDelete && (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="absolute top-4 left-4 p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10 z-10">
          <Trash2 className="w-5 h-5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir conteúdo?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir "{script.title}"? Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="relative w-[calc(100%-2rem)] max-w-md max-h-[80vh] overflow-auto">
        {deleteButton}
        <DialogHeader>
          <DialogTitle className="text-center px-8">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

