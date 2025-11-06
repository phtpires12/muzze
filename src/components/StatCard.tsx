import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient?: boolean;
  description?: string;
}

export const StatCard = ({ title, value, icon: Icon, gradient, description }: StatCardProps) => {
  return (
    <Card className={cn(
      "p-6 transition-all duration-300 hover:shadow-lg",
      gradient && "bg-gradient-to-br from-accent to-primary text-white border-0"
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            "text-sm font-medium",
            gradient ? "text-white/80" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className="text-3xl font-bold">{value}</p>
          {description && (
            <p className={cn(
              "text-xs",
              gradient ? "text-white/70" : "text-muted-foreground"
            )}>
              {description}
            </p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          gradient ? "bg-white/20" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            gradient ? "text-white" : "text-primary"
          )} />
        </div>
      </div>
    </Card>
  );
};
