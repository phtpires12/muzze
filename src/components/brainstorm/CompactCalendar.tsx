import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface CompactCalendarProps {
  scheduledIdeas: Record<string, Idea[]>;
}

export const CompactCalendar = ({ scheduledIdeas }: CompactCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedIdeas, setSelectedIdeas] = useState<Idea[]>([]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (dateStr: string, ideas: Idea[]) => {
    if (ideas.length > 0) {
      setSelectedDate(dateStr);
      setSelectedIdeas(ideas);
    }
  };

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
          const ideas = scheduledIdeas[dateStr] || [];
          
          return (
            <CalendarDay
              key={dateStr}
              date={day}
              dateStr={dateStr}
              count={ideas.length}
              onClick={() => handleDayClick(dateStr, ideas)}
            />
          );
        })}
      </div>

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Ideias Agendadas - {selectedDate && format(new Date(selectedDate), "dd/MM/yyyy")}
            </DialogTitle>
            <DialogDescription>
              Visualize e roteirize suas ideias agendadas para este dia
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedIdeas.map((idea) => (
              <IdeaPreview key={idea.id} idea={idea} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const IdeaPreview = ({ idea }: { idea: Idea }) => {
  const navigate = useNavigate();

  const handleRoteirizar = () => {
    navigate(`/session?stage=script&scriptId=${idea.id}`);
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-lg">{idea.title || "Sem título"}</h4>
          {idea.content_type && (
            <Badge variant="secondary" className="mt-1">
              {idea.content_type}
            </Badge>
          )}
        </div>
        
        {idea.central_idea && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Ideia Central:</p>
            <p className="text-sm">{idea.central_idea}</p>
          </div>
        )}
        
        {idea.reference_url && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Referência:</p>
            <a 
              href={idea.reference_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {idea.reference_url}
            </a>
          </div>
        )}

        <Button onClick={handleRoteirizar} className="w-full mt-2">
          Roteirizar essa ideia
        </Button>
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
