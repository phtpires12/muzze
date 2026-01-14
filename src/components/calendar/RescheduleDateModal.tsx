import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlanCapabilitiesOptional } from "@/contexts/PlanContext";
import { isDateInCurrentWeek } from "@/lib/timezone-utils";

interface RescheduleDateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDate: (date: Date) => void;
  title?: string;
  description?: string;
}

export const RescheduleDateModal = ({ 
  open, 
  onOpenChange, 
  onSelectDate,
  title = "Reagendar conteúdo",
  description = "Escolha uma nova data de publicação"
}: RescheduleDateModalProps) => {
  const [date, setDate] = useState<Date>();
  const planCapabilities = usePlanCapabilitiesOptional();
  
  // For Free plan, calculate which dates to disable (outside current week)
  const disableDateForFreePlan = (dateToCheck: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Always disable past dates
    if (dateToCheck < today) return true;
    // If Free plan, disable dates outside current week
    if (planCapabilities?.planType === 'free') {
      const dateKey = format(dateToCheck, 'yyyy-MM-dd');
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      return !isDateInCurrentWeek(dateKey, tz);
    }
    return false;
  };

  const handleConfirm = () => {
    if (date) {
      onSelectDate(date);
      setDate(undefined);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setDate(undefined);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={ptBR}
            initialFocus
            className="pointer-events-auto"
            disabled={disableDateForFreePlan}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!date}>
            Confirmar {date && `- ${format(date, "dd/MM/yyyy")}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
