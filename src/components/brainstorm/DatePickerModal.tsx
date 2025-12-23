import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface DatePickerModalProps {
  onDateSelect: (date: Date) => void;
  triggerClassName?: string;
}

export const DatePickerModal = ({ onDateSelect, triggerClassName }: DatePickerModalProps) => {
  const [date, setDate] = useState<Date>();
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    if (date) {
      onDateSelect(date);
      setOpen(false);
      setDate(undefined);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 gap-2", triggerClassName)}
        >
          <CalendarIcon className="w-4 h-4" />
          Agendar
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Agendar Ideia</DrawerTitle>
          <DrawerDescription>
            Selecione a data de publicação para esta ideia
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={ptBR}
            initialFocus
            className="pointer-events-auto"
            disabled={(date) => date < new Date()}
          />
        </div>
        <DrawerFooter className="pt-2">
          <Button onClick={handleConfirm} disabled={!date}>
            Confirmar {date && `- ${format(date, "dd/MM/yyyy")}`}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
