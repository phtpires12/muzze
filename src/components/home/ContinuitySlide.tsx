import { Badge } from "@/components/ui/badge";
import { ContinuityOption } from "@/hooks/useContinuityOptions";
import { cn } from "@/lib/utils";

interface ContinuitySlideProps {
  option: ContinuityOption;
}

const getTypeBadge = (type: ContinuityOption["type"]) => {
  switch (type) {
    case "recent":
      return {
        label: "Última atividade",
        className: "bg-primary/10 text-primary border-primary/20",
      };
    case "expiring":
      return {
        label: "Próximo de publicar",
        className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      };
    case "stalled":
      return {
        label: "Precisa de atenção",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
  }
};

const getUrgencyBadgeClass = (variant: "warning" | "urgent" | "info") => {
  switch (variant) {
    case "urgent":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "warning":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
    default:
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  }
};

export function ContinuitySlide({ option }: ContinuitySlideProps) {
  const typeBadge = getTypeBadge(option.type);

  return (
    <div className="space-y-3">
      {/* Type Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant="outline"
          className={cn("text-xs font-medium border", typeBadge.className)}
        >
          {typeBadge.label}
        </Badge>
        
        {option.urgencyBadge && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium border",
              getUrgencyBadgeClass(option.urgencyBadge.variant)
            )}
          >
            {option.urgencyBadge.label}
          </Badge>
        )}
      </div>

      {/* Content Info */}
      <div className="p-4 bg-secondary/50 rounded-2xl">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
          📝 {option.title}
        </h3>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{option.subtitle}</p>
          <p className="text-xs text-muted-foreground">{option.metadata}</p>
        </div>
      </div>
    </div>
  );
}
