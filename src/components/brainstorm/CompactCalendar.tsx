import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CompactCalendarProps {
  scheduledIdeas: Record<string, number>; // date -> count
  onDayClick?: (date: Date) => void;
}

export const CompactCalendar = ({ scheduledIdeas, onDayClick }: CompactCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Calendário Editorial</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const count = scheduledIdeas[dateStr] || 0;
          
          return (
            <CalendarDay
              key={dateStr}
              date={day}
              dateStr={dateStr}
              count={count}
              onClick={() => onDayClick?.(day)}
            />
          );
        })}
      </div>
    </Card>
  );
};

interface CalendarDayProps {
  date: Date;
  dateStr: string;
  count: number;
  onClick: () => void;
}

const CalendarDay = ({ date, dateStr, count, onClick }: CalendarDayProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `calendar-day-${dateStr}`,
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "aspect-square p-1 flex flex-col items-center justify-center rounded-md cursor-pointer transition-all relative",
        "hover:bg-accent",
        isToday(date) && "bg-primary/10 font-semibold",
        isOver && "bg-primary/20 ring-2 ring-primary scale-105",
        count > 0 && "border border-primary/30"
      )}
    >
      <span className={cn(
        "text-sm",
        isToday(date) && "text-primary"
      )}>
        {format(date, "d")}
      </span>
      {count > 0 && (
        <Badge 
          variant="secondary" 
          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
        >
          {count}
        </Badge>
      )}
    </div>
  );
};
