import { ChevronRight, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Recap, PERIOD_LABELS, PERIOD_DAYS } from "@/types/recap";
import { cn } from "@/lib/utils";

interface RecapNotificationCardProps {
  recap: Recap;
  onClick: () => void;
}

export const RecapNotificationCard = ({ recap, onClick }: RecapNotificationCardProps) => {
  const isNew = !recap.viewed_at;
  const periodLabel = PERIOD_LABELS[recap.period_type] || recap.period_type;
  const periodDays = PERIOD_DAYS[recap.period_type] || 30;

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer transition-all duration-300 hover:scale-[1.01]",
        isNew 
          ? "bg-gradient-to-r from-primary/15 to-primary/5 border-primary/30 hover:border-primary/50" 
          : "bg-card hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
          isNew ? "bg-primary/20" : "bg-muted"
        )}>
          <Gift className={cn(
            "w-6 h-6",
            isNew ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">
              Seu recap {periodLabel} chegou!
            </h3>
            {isNew && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                Novo
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Veja sua evolução dos últimos {periodDays} dias
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </div>
    </Card>
  );
};
