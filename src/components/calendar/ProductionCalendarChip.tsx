import { Check } from "lucide-react";
import { cn } from "@/core/utils";
import { ProductionSchedule } from "@/core/hooks/useProductionSchedules";

const stageStyles: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  ideation: { bg: "bg-zinc-400/30 border-zinc-400", text: "text-zinc-700 dark:text-zinc-300", label: "Ideação", icon: "💡" },
  script:   { bg: "bg-purple-500/20 border-purple-500", text: "text-purple-700 dark:text-purple-300", label: "Roteiro", icon: "✍️" },
  review:   { bg: "bg-blue-400/20 border-blue-400", text: "text-blue-700 dark:text-blue-300", label: "Revisão", icon: "🔍" },
  recording:{ bg: "bg-orange-500/20 border-orange-500", text: "text-orange-700 dark:text-orange-300", label: "Gravação", icon: "🎙️" },
  editing:  { bg: "bg-cyan-500/20 border-cyan-500", text: "text-cyan-700 dark:text-cyan-300", label: "Edição", icon: "✂️" },
  design:   { bg: "bg-emerald-500/20 border-emerald-500", text: "text-emerald-700 dark:text-emerald-300", label: "Design", icon: "🎨" },
};

interface ProductionCalendarChipProps {
  schedule: ProductionSchedule;
  scriptTitle: string;
  onToggle: (scheduleId: string, completed: boolean) => void;
}

export function ProductionCalendarChip({ schedule, scriptTitle, onToggle }: ProductionCalendarChipProps) {
  const style = stageStyles[schedule.stage] || stageStyles.ideation;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-1.5 py-0.5 rounded border text-[10px] font-medium",
        "cursor-default select-none group/chip transition-all",
        style.bg,
        style.text,
        schedule.completed && "opacity-50 line-through"
      )}
      title={scriptTitle}
    >
      {/* Checkbox de conclusão */}
      <button
        className={cn(
          "flex-shrink-0 w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors",
          "border-current hover:bg-current/20",
          schedule.completed && "bg-current/30"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(schedule.id, !schedule.completed);
        }}
        title={schedule.completed ? "Marcar como pendente" : "Marcar como concluído"}
      >
        {schedule.completed && <Check className="w-2 h-2" />}
      </button>

      <span className="mr-0.5">{style.icon}</span>

      <span className="truncate max-w-[60px]">
        {style.label}
      </span>
    </div>
  );
}
