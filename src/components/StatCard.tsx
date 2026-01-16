import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  highlight?: boolean;
  description?: string;
  /** @deprecated Use highlight instead */
  gradient?: boolean;
}

export const StatCard = ({ title, value, icon: Icon, highlight, gradient, description }: StatCardProps) => {
  // Support both highlight and deprecated gradient prop
  const isHighlighted = highlight || gradient;
  
  return (
    <Card className={cn(
      "p-5 border rounded-xl transition-colors",
      isHighlighted 
        ? "bg-primary/10 border-primary/20" 
        : "bg-background border-border"
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className={cn(
            "text-2xl font-bold tracking-tight",
            isHighlighted ? "text-primary" : "text-foreground"
          )}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <div className={cn(
          "p-2.5 rounded-lg",
          isHighlighted ? "bg-primary/10" : "bg-muted"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            isHighlighted ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
      </div>
    </Card>
  );
};
