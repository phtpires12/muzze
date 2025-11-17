import { useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Idea {
  id: string;
  title?: string | null;
  content_type?: string | null;
  central_idea?: string | null;
  reference_url?: string | null;
  status?: string | null;
  publish_date?: string | null;
}

interface WeekCalendarProps {
  scheduledIdeas: Record<string, Idea[]>;
  onDayClick: (dateStr: string, ideas: Idea[]) => void;
}

export const WeekCalendar = ({ scheduledIdeas, onDayClick }: WeekCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { locale: ptBR });
  const weekEnd = endOfWeek(currentWeek, { locale: ptBR });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Calendário Editorial</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-medium min-w-[100px] text-center">
            {format(weekStart, "dd MMM", { locale: ptBR })} - {format(weekEnd, "dd MMM", { locale: ptBR })}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((day, idx) => (
          <div key={idx} className="text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const ideas = scheduledIdeas[dateStr] || [];
          const isTodayDate = isToday(day);

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr, ideas)}
              className={cn(
                "aspect-square rounded-md flex flex-col items-center justify-center gap-1 text-xs transition-all",
                "hover:bg-accent active:scale-95",
                isTodayDate && "bg-primary/10 ring-1 ring-primary/30",
                ideas.length > 0 && "font-semibold"
              )}
            >
              <span className={cn(isTodayDate && "text-primary")}>{format(day, "d")}</span>
              {ideas.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px] leading-none">
                  {ideas.length}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
};
